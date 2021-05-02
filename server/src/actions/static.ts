import { difference, uniq } from 'lodash';
import { getMemberModels, getDailyModels, getBiblePlanById, getDaily, getChengXingModelById, getLinkPushModelById, getRoomConfigById } from '../ddb';
import { getWeekStartDay, getWeekDay, FORMAT, getWeekDelta, getWeekEndDay, getDayDelta, formatSmdjTitle, getSearchRoomModel, getTodayNumber, getCnWeekDay } from '../util';
import { getFormatChapter } from '../bible/plan';
import xlsx from 'node-xlsx';
import { FileBox } from 'file-box';
import { Wechaty, Room, Contact } from 'wechaty';
import { MISS_PLAN_HINT, Actions, MISS_LeeArticle_PUSH_HINT, MISS_CX_PUSH_HINT, MISS_Smdj_PUSH_HINT } from '../constants';
import { DailyType, DailyTypeCNMap, LinkType, LinkPush, SmdjPlanDTO, SmdjDaily } from '../interface';

const moment = require('moment');

// 当统计时，检查对应模型是否存在
const checkModelConfig = {
    [DailyType.Bible]: {
        getModelFn: getBiblePlanById,
        hint: MISS_PLAN_HINT
    },
    [DailyType.ChengXing]: {
        getModelFn: getChengXingModelById,
        hint: MISS_CX_PUSH_HINT
    },
    [DailyType.LeeArticle]: {
        getModelFn: (roomId) => getLinkPushModelById(roomId, { LinkType: LinkType.LeeArticle }),
        hint: MISS_LeeArticle_PUSH_HINT
    },
    [DailyType.Smdj]: {
        getModelFn: (roomId) => getLinkPushModelById(roomId, { LinkType: LinkType.Smdj}),
        hint: MISS_Smdj_PUSH_HINT
    }
}

export async function sayBibleStatsWeek(room: Room | Contact, text) {
    return sayStatsWeek(room, text, DailyType.Bible);
}

export async function sayLeeStatsWeek(room: Room | Contact, text) {
    return sayStatsWeek(room, text, DailyType.LeeArticle);
}

export async function sayChengXingStatsWeek(room: Room | Contact, text) {
    return sayStatsWeek(room, text, DailyType.ChengXing);
}

export async function saySmdjStatsWeek(room: Room|Contact, text) {
    return sayStatsWeek(room, text, DailyType.Smdj);
}

export async function sayStatsWeek(context: Room | Contact, text, type: DailyType) {
    let roomModel = await getSearchRoomModel(context, text);
    if (!roomModel) {
        return context.say('仅群聊可' + Actions.Static)
    }

    let roomId = roomModel.id;

    const bot = Wechaty.instance();
    const rooms = await bot.Room.findAll();
    const room = await rooms.find(r => r.id === roomId);

    let startDay = getWeekStartDay();
    const dayMatch = /day=(\d+)/.exec(text);
    if (dayMatch) {
        startDay = getWeekStartDay(+dayMatch[1]);
    }

    const { getModelFn, hint } = checkModelConfig[type];
    const model = await getModelFn(roomId);
    if (!model) {
        return context.say(hint)
    }
    await context.say('正在生成数据，请稍候...');

    const getTotal = /汇总往周/.test(text)

    const [err, filebox] = await getWeekStatic(room, type, startDay, model, getTotal);
    if (err) { return context.say(err); }
    return context.say(filebox);
}



export async function getWeekStatic(room: Room, type: DailyType, targetWeekDay: number, planModel: any, getTotal?: boolean): Promise<[string?, FileBox?]> {
    const roomId = room.id;
    let schedule, startDay = targetWeekDay;

    if (type === DailyType.Bible) {
        schedule = planModel.schedule;
        startDay = schedule.startDay;
    }

    if (type === DailyType.Smdj) {
        schedule = (planModel.schedule) as SmdjPlanDTO;
        startDay = schedule.startDay
    }

    const start = getTotal ? startDay: Math.max(targetWeekDay, startDay);
    const end = getTotal ? getTodayNumber(): getWeekEndDay(start);

    const members = await getMemberModels();
    const dailys = await getDailyModels({ type, roomId: room.id, $and: [{ day: { $gte: start } }, { day: { $lte: end } }] });
    const roomConfig = await getRoomConfigById(room.id);
    const uncommitRemindWhiteList = roomConfig && roomConfig.uncommitRemindWhiteList || [];

    let memberIdCols = [];
    let targetDaily = dailys
        .sort((a, b) => a.day - b.day)

    if (targetDaily.length < 1) {
        return ['本周尚无打卡记录', null];
    }

    targetDaily.forEach((daily) => {
        const { completeMember } = daily;
        memberIdCols.push(...difference(completeMember, memberIdCols))
    })
    memberIdCols = memberIdCols.filter(id => !uncommitRemindWhiteList.includes(id)) // 已经加入白名单的就不再展示

    const content = memberIdCols.map(wxId => {
        const roomMember = members.find(m => m.wxId === wxId && m.roomId === roomId);
        return targetDaily.reduce((acc, it) => {
            return {
                ...acc,
                [it.day]: it.completeMember.includes(wxId)
            }
        }, roomMember || { wxId, wxName: wxId, alias: wxId })
    })
    const sheetRows = [];

    // 数据需要空几列
    const offset = getWeekDay(targetDaily[0].day);
    const dateNums = targetDaily.map(({ day }) => day);


    if (type === DailyType.Bible && schedule) {
        // 读经进度行
        const chapters = dateNums.map(day => getFormatChapter(schedule, day, true))
        sheetRows.push([null].concat(chapters, '汇总'))
    }

    if (type === DailyType.Smdj && schedule) {
        // 生命读经进度行
        const chapters = dateNums.map(day => {
            const detail = (schedule as SmdjPlanDTO).daily[getDayDelta(startDay, day)]
            return formatSmdjTitle(detail);
        })
        sheetRows.push([null].concat(chapters, '汇总'))
    }

    // 日期行
    const dates = dateNums.map(day => moment(day, FORMAT).format('MM月DD日'));
    sheetRows.push([null].concat(dates))
    // 星期行
    const weekDays = dateNums.map(day => getCnWeekDay(day))
    sheetRows.push([null].concat(weekDays))
    sheetRows.push([]);

    content.forEach(d => {
        const row = [d.alias || d.wxName || d.wxId]
        const total = dateNums.filter(dateN => d[dateN]).length;
        sheetRows.push(row.concat(dateNums.map(dateN => d[dateN] ? '已读' : ''), `${total}/${dateNums.length}`));
    })

    sheetRows.push([]);
    sheetRows.push(['总计'].concat(
        targetDaily.map(d => `${uniq(d.completeMember).length}/${d.totalMemberCount - 1}`))) // 减去机器人

    const roomName = await room.topic();
    const file = getXlsxFile(`${roomName}-${getTotal? '全部打卡':'本周打卡'}${DailyTypeCNMap[type]}统计`, sheetRows, `${getWeekStartDay()}`);
    return [null, file];
}

export function getXlsxFile(fileName: string, data: string[][], sheetName: string = '表1', opt: { width?: number } = {}) {
    const wpx = opt.width || 100;
    const options = { '!cols': [{ wpx }, { wpx }, { wpx }, { wpx }, { wpx }, { wpx }, { wpx }, { wpx }] };
    var buffer = xlsx.build([{ name: sheetName, data }], options);
    return FileBox.fromBuffer(buffer, `${fileName}.xlsx`)
}


export async function sayBiblePlanStatic(room: Room | Contact, text) {
    return sayStatic(room, text, DailyType.Bible)
}

export async function sayLeeStatic(room: Room | Contact, text = '') {
    return sayStatic(room, text, DailyType.LeeArticle)
}

export async function sayChengXingStatic(room: Room | Contact, text = '') {
    return sayStatic(room, text, DailyType.ChengXing)
}

export async function saySmdjStatic(room: Room|Contact, text = '') {
    return sayStatic(room, text, DailyType.Smdj);
}

export async function getBiblePlanStatic(room: Room) {
    return getStatic(room, DailyType.Bible);
}



export async function sayStatic(room: Room | Contact, text, type = DailyType.Bible) {
    let roomModel = await getSearchRoomModel(room, text);
    if (!roomModel) {
        return room.say('仅群聊可' + Actions.Static)
    }

    let roomId = roomModel.id;

    const { getModelFn, hint } = checkModelConfig[type];
    const model = await getModelFn(roomId);
    if (!model) {
        return room.say(hint)
    }

    const statName = DailyTypeCNMap[type];
    const { completeNumber, totalNumber } = await getStatic(roomModel, type);
    return room.say(`今日${statName}打卡人数: ` + completeNumber + '/' + totalNumber)
}

export async function getStatic(room: Room, type: DailyType) {
    const daily = await getDaily({ roomId: room.id, day: +moment().format('YYYYMMDD'), type })

    const completeNumber = daily ? uniq(daily.completeMember).length : 0;
    const members = await room.memberAll();

    return {
        completeNumber,
        totalNumber: members.length - 1 // 减去机器人
    }
}