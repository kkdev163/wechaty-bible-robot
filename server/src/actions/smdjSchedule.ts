import { getSmdj } from '../bible/shareRes';
import { getLinkPushModelById, createLinkPushModel, updateLinkPushModel, dropSmdjPlan, getDaily } from '../ddb';
import { LinkType, ReceiverType, LinkPush, LinkSchedule, SmdjPlanDTO, BookNameChapter, SmdjDaily, DailyType } from '../interface'
import { Room, Contact } from 'wechaty';
import { Actions, Action_Receiver, SmdjPlanReg, SMDJ_PLAN_FORMAT, BOOK_CATALOG, SMDJ_CATALOG, MISS_Smdj_PUSH_HINT, SmdjPlanAndReg } from '../constants';
import { getTodayNumber, getSmdjDaily, isSmdjChapterValid, getDayDelta, getWeekDay, formatSmdjTitle, addDay, FORMAT, getSearchRoomModel, getSmdjSingleBookDaily} from '../util';
import { getXlsxFile } from './static';
const moment = require('moment');


export async function saySmdjToday(room: Room | Contact, isFirst?: boolean) {
    const push = await getLinkPushModelById(room.id, { LinkType: LinkType.Smdj });
    if(!push) {
        return room.say('未创建生命读经计划')
    }
    const schedule: SmdjPlanDTO  = push.schedule;
    const {startDay, daily} = schedule;

    const toDayDaily = daily[getDayDelta(startDay)];

    if (!toDayDaily) {
        return room.say('生命读经计划已读完，如需继续推送，请关闭后重新创建生命读经计划')
    }
    const showWelcome = isFirst && !push.disableStats;
    if (showWelcome) {
        const daily = await getDaily({ day: getTodayNumber(), type: DailyType.Smdj, roomId: room.id});
        const stats = daily ? `，已读人数: ${daily.completeMember.length}`: ''
        await room.say('弟兄姊妹好，今日的生命读经进度是: ' + formatSmdjTitle(toDayDaily) + stats)
    }
    return room.say(getSmdj(toDayDaily)) 
}

export async function createSmdj(room: Room | Contact, text) {
    let receiverType = room instanceof Room ? ReceiverType.Room : ReceiverType.Contact

    const push = await getLinkPushModelById(room.id, { LinkType: LinkType.Smdj });
    if (push) {
        return room.say(`请勿重复创建，如需关闭请使用 「@${Action_Receiver} ${Actions.CancelSmdjPlan}」指令`);
    } 

    const [schedule, err] = await parseSchedule(text);
    if (err) {
        return room.say(err);
    }

    const newModel: LinkPush = {
        receiverId: room.id,
        receiverType,
        LinkType: LinkType.Smdj,
        remindHour: [6, 22],
        schedule: schedule
    }

    await createLinkPushModel(newModel)
    await room.say(`${Actions.CreateSmdjPlan}成功, ${Action_Receiver} 将在每天${newModel.remindHour[0]}点整推送当日生命读经。今日生命读经为:`)
    await saySmdjToday(room);
    await displaySmdjScheduleTable(room);
}

export async function cancleSmdj(room: Room | Contact) {
    const push = await getLinkPushModelById(room.id, { LinkType: LinkType.Smdj });
    if (!push) {
        return room.say(MISS_Smdj_PUSH_HINT)
    } else {
        await dropSmdjPlan(room.id);
    }
    await room.say(`${Actions.CancelPlan}成功, 如需恢复请输入 ${push.schedule.createText ? push.schedule.createText: Actions.CreateSmdjPlan}`)
}

export async function configSmdjPush(room: Room | Contact, text) {
    const push = await getLinkPushModelById(room.id, { LinkType: LinkType.Smdj });
    if (!push) {
        return room.say(MISS_Smdj_PUSH_HINT)
    }
    const words = text.split(/\s+/)
    const num = words
        .filter(w => /^\d+$/.test(w))
        .map(n => +n)
        .filter(n => n >= 0 && n < 24)
    
    await updateLinkPushModel({
        ...push,
        remindHour: num
    })
    return room.say(`设置成功, ${Action_Receiver} 将在每天 ${num.map(n => n + '点').join('、')} 整推送每日生命读经。`)
}

export async function displaySmdjScheduleTable(room: Room | Contact, text?: string) {
    let roomModel = await getSearchRoomModel(room, text);
    let targetId, targetName;
    if (roomModel) {
        targetId = roomModel.id;
        targetName = await roomModel.topic();
    } else {
        targetId = room.id;
        targetName = (room as Contact).name
    }

    const push = await getLinkPushModelById(targetId, { LinkType: LinkType.Smdj });
    if (!push) {
        return room.say(MISS_Smdj_PUSH_HINT);
    }

    const schedule = push.schedule;

    const sheetRows = [];
    sheetRows.push([].concat('周一', '周二', '周三', '周四', '周五', '周六', '周日'));
    // 数据需要空几列
    let offset = getWeekDay(schedule.startDay);
    const dailyChapters = [...schedule.daily];
    
    while (dailyChapters.length > 0) {
        const emptyCol = new Array(offset).fill(null);
        const data = dailyChapters.splice(0, 7 - offset)
        sheetRows.push([], [].concat(emptyCol, data.map(r => moment(addDay(schedule.startDay, schedule.daily.indexOf(r)), FORMAT).format('MM月DD日'))))
        sheetRows.push([].concat(emptyCol, data.map(formatSmdjTitle)))
        offset = 0;
    }
    return room.say(getXlsxFile(`${targetName}-生命计划表`, sheetRows, '生命读经计划表', { width: 200 }))
}

async function parseSchedule(text) : Promise<[SmdjPlanDTO|null, string|null]>{
    // 创建生命读经计划 约伯记1-箴言书9  每日不超过10分钟
    let match = SmdjPlanReg.exec(text)
    if (match) {
        return getFromToSchedule(text);
    }
    match = SmdjPlanAndReg.exec(text);
    if (match){
        return getAndSchedule(text);
    } 
    return [null, '请使用如下格式: ' + SMDJ_PLAN_FORMAT]
}

// 起始-结束 计划
async function getFromToSchedule(text): Promise < [SmdjPlanDTO | null, string | null] > {
    let match = SmdjPlanReg.exec(text)
    if (!match){
        return [null, '请使用如下格式: ' +SMDJ_PLAN_FORMAT]
    }
    const startBookName = match[1];
    const startChapterNum = +match[2];
    const endBookName = match[3];
    const endChapterNum = +match[4];
    const dailyLimit = match[5];
    const startDay = match[6];
    let valid, error;
    [valid, error] = isSmdjChapterValid(startBookName, startChapterNum);
    if (!valid) { return [null, error]; }

    [valid, error] = isSmdjChapterValid(endBookName, endChapterNum);
    if (!valid) { return [null, error]; }

    const daily = await  getSmdjDaily([startBookName, startChapterNum], [endBookName, endChapterNum], dailyLimit);

    return [{
        startDay: startDay.length === 8 ? +startDay : getTodayNumber(),
        daily,
        createText: startDay.length === 8 ? text : text + ` ${getTodayNumber()}`
    }, null]
}

// xxx + xxx 计划

async function getAndSchedule(text): Promise<[SmdjPlanDTO | null, string | null]> {
    let match = SmdjPlanAndReg.exec(text)
    if (!match) {
        return [null, '请使用如下格式: ' +SMDJ_PLAN_FORMAT]
    }

    const booksString = match[1];
    const dailyLimit = match[2];
    const startDay = match[3];

    const books = booksString.split('+');
    let valid, error;
    const invalid = books.some(book=>{
        [valid, error] = isSmdjChapterValid(book, 1);
        if (!valid) {
            error = `未找到该卷书:${book}, 请确认书名是否有误`
            return true;
        }
    })
    if (invalid) {return [null, error]}

    const dailyResults = await Promise.all(books.map(async book =>{
        return getSmdjSingleBookDaily(book, dailyLimit)
    }))

    return [{
        startDay: startDay.length === 8 ? +startDay : getTodayNumber(),
        daily: dailyResults.reduce((acc, d)=> acc.concat(d), []),
        createText: startDay.length === 8 ? text : text + ` ${getTodayNumber()}`
    }, null]

}




