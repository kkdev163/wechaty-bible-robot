import { Room, Contact, Wechaty } from 'wechaty';
import { addDailyComplete, getBiblePlanById, syncRoomMember, getLinkPushModelById, getChengXingModelById, getRoomConfigById, getDailyModels, getMemberModels, AddDailyParams, batchAddDailyComplete } from '../ddb';
import { RoomContact, DailyType, LinkType, C2DailyTypeMap, SmdjPlanDTO, Table, DailyTypeCNMap } from '../interface';
import { MISS_PLAN_HINT, ReadBibleReg, BOOK_CATALOG, ScheduleCompeleteTag, ScheduleCatchupTag, Action_Receiver, ManuallyCommitFORMAT } from '../constants';
import { getPlanChapter, getTomorrowChapter, getYesterDayChapter, getFixNumberPlanChapter } from '../bible/plan';
import { FORMAT, getSearchRoomModel, searchSmdjDaily, addDay, getAdminModel, getTodayNumber, wxId2RoomAlias, todayAddDay, wxMemberWithAlias } from '../util';
import { isValidDay } from './bibleSchedule';
import { pick } from 'lodash';

const moment = require('moment');

// 根据群成员聊天打卡
export async function handleUserCommit(room: Room, contact: Contact, text: string) {
    const biblePlan = await getBiblePlanById(room.id);
    const chengXingPush = await getChengXingModelById(room.id);
    const leeArticlePush = await getLinkPushModelById(room.id, { LinkType: LinkType.LeeArticle });
    const smdjPlan = await getLinkPushModelById(room.id, { LinkType: LinkType.Smdj });
    const roomConfig = await getRoomConfigById(room.id)

    const openBiblePlan = !!biblePlan && isValidDay(biblePlan.schedule);
    const openChengXingPush = chengXingPush && chengXingPush.remindHour.length > 0;
    const openLeePush = leeArticlePush && leeArticlePush.remindHour.length > 0;

    const flags = {
        [DailyType.Smdj]: smdjPlan,
        [DailyType.Bible]: openBiblePlan,
        [DailyType.ChengXing]: openChengXingPush,
        [DailyType.LeeArticle]: openLeePush
    }

    function onlyOpen(type) {
        return Object.keys(flags)
            .filter(key => key !== type)
            .every(key => !flags[key])
    }

    function isPriority(type) {
        if (!flags[type]) {  // 未开启
            return false;
        }
        if (onlyOpen(type)) {  // 只开启这项
            return true;
        }
        return roomConfig && roomConfig.defaultDailyType === type
    }

    await syncRoomMember(room, contact);

    if (openChengXingPush && (/晨兴/.test(text) || isPriority(DailyType.ChengXing))) {
        await handlePushCommit(room, contact, DailyType.ChengXing, text);
    }

    if (openLeePush && (/文集/.test(text) || isPriority(DailyType.LeeArticle))) {
        await handlePushCommit(room, contact, DailyType.LeeArticle, text);
    }

    if (smdjPlan && (/生命读经|第\s*([^篇\d\s]+|\d+)\s*篇/.test(text) || isPriority(DailyType.Smdj))) {
        await handleSmdjCommit(room, contact, text);
    }
    
    // 圣经的打卡条件最宽，只要开启圣经，就默认打上。
    if (openBiblePlan) {
        await handleBibleCommit(room, contact, text);
    }
}

// 打卡推送类型
async function handlePushCommit(room: Room, contact: Contact, type: DailyType, text: string) {
    if (ScheduleCatchupTag.test(text)) { // 如果匹配到 补读标记
        await checkBeforeAddComplete(room, contact, text, type, todayAddDay(-1))
        // 删除补读标记后，继续匹配
        text = text.replace(ScheduleCatchupTag, '');
        // 如果没有匹配中，就不再为今日打卡
        if (!ScheduleCompeleteTag.test(text)) {
            return;
        }
    }
    await checkBeforeAddComplete(room, contact, text, type)
}

// 生命读经打卡
async function handleSmdjCommit(room: Room, talker: Contact, text: string ) {
    const push = await getLinkPushModelById(room.id, { LinkType: LinkType.Smdj });
    const schedule: SmdjPlanDTO = push.schedule;
    const { startDay, daily } = schedule;

    // 如果匹配到 补读标记
    if (ScheduleCatchupTag.test(text)) {
        // 进行搜索，匹配不到，则默认为昨天补打卡
        await commitSmdjBySearch(text, +moment().subtract(1, 'day').format('YYYYMMDD'))
        // 删除补读标记后，继续匹配
        text = text.replace(ScheduleCatchupTag, '');

        // 如果没有 已读 标记 就不再继续匹配
        if (!ScheduleCompeleteTag.test(text)) {
            return;
        }
    }
    await commitSmdjBySearch(text)

    // 基于用户指定的篇幅进行打卡，如果未携带 -上 下 标记，可连续打卡两天
    async function commitSmdjBySearch(text, defaultDay = +moment().format('YYYYMMDD')) {
        
        const smdjDaily = searchSmdjDaily(text);
        if (smdjDaily) {
            const matchDailys = daily.filter(d => {
                if (d.bookName !== smdjDaily.bookName) {
                    return false;
                }
                if (d.chapterNum !== smdjDaily.chapterNum) {
                    return false;
                }
                // 如果用户打卡时，没有携带 上、下标记，则不做 part 判断
                if (smdjDaily.part === 0) {
                    return true;
                }
                return smdjDaily.part === d.part;
            })

            if (matchDailys.length > 0) {
                return Promise.all(matchDailys.map(d => {
                    let index = daily.indexOf(d);
                    return addSmdjDaily(addDay(startDay, index))
                }))
            }
        }
        await addSmdjDaily(defaultDay)
    }

    async function addSmdjDaily(day) {
        console.log('call add Smdj Daily', day);
        return checkBeforeAddComplete(room, talker, text, DailyType.Smdj, day);
    }
}

async function checkBeforeAddComplete(room: Room, talker: Contact, text: string, type: DailyType, day?: number) {
    const roomMembers = await room.memberAll();
    const commonParams = {
        roomId: room.id,
        wxId: talker.id,
        totalMemberCount: roomMembers.length,
        type,
        day: day || getTodayNumber()
    }

    const roomConfig = await getRoomConfigById(room.id);
    const openCheck = roomConfig &&
        roomConfig.commitCheckTypes &&
        roomConfig.commitCheckTypes.includes(type);

    await addDailyComplete(commonParams);

    if (!openCheck) { return }
    
    const daily = await getDailyModels(pick(commonParams, ['roomId', 'type', 'day']));

    const completeMember = daily[0] && daily[0].completeMember || [];

    const userInputCompleteNo = /[已|己]读\s*(\d+)/.exec(text);
    const userNo = userInputCompleteNo && +userInputCompleteNo[1];

    if (userNo===null || userNo === completeMember.length) { return; }

    const admin = await getAdminModel();
    const topic = await room.topic();
    const memberNames = await wxId2RoomAlias(room.id, completeMember);

    // 造成序号不对的人，正是当前打卡的人
    await admin.say(`${topic} ${day} ${DailyTypeCNMap[type]} 打卡人数异常，当前群打卡序号 ${userNo}，实际已读 ${completeMember.length} 已读人员为: ${memberNames.join('、')}`)
}

// 打卡圣经
async function handleBibleCommit(room: Room, contact: Contact, text: string) {
    const biblePlan = await getBiblePlanById(room.id);
    if (!biblePlan) {
        return;
    }

    const addByDay = async function (day = getTodayNumber()) {
        if (!isValidDay(biblePlan.schedule, day)) { return }
        return checkBeforeAddComplete(room, contact, text, DailyType.Bible, day);
    }

    // 如果是补读
    if (ScheduleCatchupTag.test(text)) {
        await addByDay(todayAddDay(-1));
        // 补读后，删除补读标记，继续匹配。因为有用户这样使用： 昨日已补，xxxx-xxxx 已读
        text = text.replace(ScheduleCatchupTag, '');

        // 补读后，如果没有 打卡 标记则不再继续匹配
        if (!ScheduleCompeleteTag.test(text)) {
            return;
        }
    }

    const match = ReadBibleReg.exec(text);
    // 指定了 某卷书已读，如 以弗所4-6 已读
    if (match) {
        // 用户指定的书名
        const bookName = match[1];
        // 用户指定的起始章节
        const start = +match[2];
        // 查找用户指定的书序
        const bookIndex = BOOK_CATALOG.findIndex((b) => b[0].includes(bookName))

        // 是否相等
        const isEqual = function (getChapterFn) {
            const { todayStart } = getChapterFn(biblePlan.schedule);
            return todayStart[0] === bookIndex && todayStart[1] === start;
        }
        // 未找到用户指定的书 或者 找到后与今天的相等
        if (bookIndex === -1 || isEqual(getPlanChapter)) {
            return addByDay();
        }

        // 与明天的书相等
        if (isEqual(getTomorrowChapter)) {
            return addByDay(todayAddDay(1))
        }

        // 与昨天的书相等
        if (isEqual(getYesterDayChapter)) {
            return addByDay(todayAddDay(-1))
        }
    }
    // 已经尽力帮你匹配啦，实在找不到了，就为今天打卡吧。
    return addByDay();
}


// 手动打卡，指定 群 群成员 日期进行打卡  本格格式为: (roomId=xxxxx or roomName=xxxx) 类型=圣经|文集|生命读经 成员=xxxx 日期=xxxx
export async function handleManuallyCommit(room: Room | Contact, text: string, talker: Contact) {

    const roomModel = await getSearchRoomModel(room, text);
    if (!roomModel) {
        return room.say('请在群聊中进行补打卡，或指定 roomId');
    }

    const roomConfig = await getRoomConfigById(roomModel.id)

    const matchType = /类型=([^\s]+)/.exec(text);
    let type;
    if (matchType && Object.keys(C2DailyTypeMap).includes(matchType[1])) {
        type = C2DailyTypeMap[matchType[1]];
    } else {
        type = roomConfig && roomConfig.defaultDailyType || DailyType.Bible;
    }

    if (type === DailyType.Bible) {
        const biblePlan = await getBiblePlanById(roomModel.id);
        if (!biblePlan) {
            return room.say(MISS_PLAN_HINT);
        }
    }

    const matchUser = /成员=\[([^\]]+)]/.exec(text);
    if (!matchUser && room instanceof Contact) {
        return room.say('打卡需要指定用户名, 请输入 成员=[xxx, xxx]');
    }
    let targetUsers = [];

    if (matchUser) {
        targetUsers = matchUser[1].trim().split(/,|，|、/).map(n => n.trim());
    } else {
        targetUsers = [talker.name().trim()]
    }

    const memberWithRoomAlias = await wxMemberWithAlias(roomModel);
    const users = memberWithRoomAlias.filter(m => targetUsers.includes(m.aliasInRoom && m.aliasInRoom.trim()) || targetUsers.includes(m.name().trim()));
    if (!users) {
        return room.say('请确认该成员是否在聊天室内')
    }

    const matchDay = /日期\s*(?:：|:|=)([\d,，、\s]+)/.exec(text);
    let days = [];
    if (!matchDay) {
        days.push(moment())
    } else {
        let dates = matchDay[1].split(/,|，|、|(\s+)/)
        dates.forEach(d => {
            if (d.length === 4) {
                days.push(moment(d, 'MMDD'))
            } else if (d.length === 6) {
                days.push(moment(d, 'YYMMDD'))
            } else if (d.length === 8) {
                days.push(moment(d, 'YYYYMMDD'))
            }
        })
    }
    days = days
        .map(m => m.format(FORMAT))
        .filter(s => s.length === 8)
        .map(s => +s)

    if (days.length < 1) {
        return room.say(`格式有误,${ManuallyCommitFORMAT}`)
    }

    const commonParams = {
        roomId: roomModel.id,
        wxIds: users.map(u => u.id),
        totalMemberCount: memberWithRoomAlias.length,
        type
    }

    const displayName = users.map(u => u.aliasInRoom || u.name()).join('、')

    await Promise.all(days.map(day => {
        batchAddDailyComplete({ ...commonParams, day })
    }))

    return room.say(`${displayName} 打卡成功 日期: ${days.sort().map(d => moment(d, FORMAT).format('YY年M月D日')).join('、')}`)
}