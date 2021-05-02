import { Room, Contact } from 'wechaty';
import { getPlanChapter, getTomorrowChapter, formatChapter, getFixNumberPlanChapter } from '../bible/plan';
import { getBiblePlanById, createBiblePlanModel, dropBiblePlan, updateBiblePlan } from '../ddb';
import { FixNumberPlanDTO, FixTimePlanDTO} from '../interface';
import { Actions, FixNumPlanReg, FixTimePlanReg, FIX_NUM_PLAN_FORMAT, FIX_TIME_PLAN_FORMAT, Action_Receiver, MISS_PLAN_HINT } from '../constants';
import { getBiblePlanLink } from '../bible/shareRes';
import { getBiblePlanStatic, getXlsxFile } from './static';
import { getTodayNumber, FORMAT, isBookChapterValid, getDayDelta, getDailyChapter, getWeekDay, addDay, getBookIndexChapterCount } from '../util';

const moment = require('moment');

// 测试的读经计划
const DefaultPlan = {
    startBook: ['加拉太书', 1] as [string, number],
    startDay: 20210301,
    chapterOneDay: 3
};

export async function saySchedule(room: Room, plan: FixNumberPlanDTO | FixTimePlanDTO = DefaultPlan, hiddenGuide = false, showStatic = false) {
    const result = getPlanChapter(plan);
    if (!hiddenGuide) {
        await room.say(`弟兄姊妹好，今日的读经章节是: ${formatChapter(result)}`);
    }
    if (showStatic) {
        const { completeNumber, totalNumber } = await getBiblePlanStatic(room);
        await room.say(`今日的读经章节是: ${formatChapter(result)}，群打卡进度: ${completeNumber}/${totalNumber}`);
    }
    await room.say(getBiblePlanLink(result))
}

export async function sayTomorrowSchedule(room, plan: FixNumberPlanDTO | FixTimePlanDTO = DefaultPlan) {
    const result = getTomorrowChapter(plan);
    await room.say(getBiblePlanLink(result, moment().add(1, 'day')))
}

export async function createSchedule(room, text) {
    if (!(room instanceof Room)) {
        return room.say('仅群聊可创建读经计划')
    }

    const biblePlan = await getBiblePlanById(room.id);
    if (biblePlan) {
        return room.say('当前群聊已存在读经计划，请勿重复创建');
    }

    const [schedule, err] = parseSchedule(text);
    if (err) {
        return room.say(err);
    }

    const topic = await room.topic();

    await createBiblePlanModel({
        roomId: room.id,
        roomName: topic,
        schedule: schedule,
        remindHour: [7, 12, 22]
    })

    await room.say('创建读经计划成功，今日的读经进度是:');
    await saySchedule(room, schedule, true);
    await displayScheduleTable(room);
}

export async function configSchedule(room, text) {
    if (!(room instanceof Room)) {
        return room.say('仅群聊可设置读经计划')
    }

    const biblePlan = await getBiblePlanById(room.id);
    if (!biblePlan) {
        return room.say('当前群聊未创建读经计划，请使用「创建读经计划」命令');
    }
    const words = text.split(/\s+/)
    const num = words
        .filter(w => /^\d+$/.test(w))
        .map(n => +n)
        .filter(n => n >= 0 && n < 24)

    await updateBiblePlan({
        ...biblePlan,
        remindHour: num
    })
    return room.say(`设置成功, ${Action_Receiver} 将在每天 ${num.map(n => n + '点').join('、')} 整推送每日读经。`)
}

export async function displaySchedule(room) {
    if (!(room instanceof Room)) {
        return room.say('仅群聊具有读经计划')
    }
    const biblePlan = await getBiblePlanById(room.id);
    if (!biblePlan) {
        return room.say('当前群聊未创建读经计划，请使用「创建读经计划」命令');
    }

    const schedule = biblePlan.schedule;

    const formatBook = (book) => `${book[0]}${book[1]}章`

    if ('chapterOneDay' in schedule) {
        const { startBook, startDay, chapterOneDay } = schedule;
        await room.say(`本群于 ${startDay}日，从 ${formatBook(startBook)}开始，每日读经 ${chapterOneDay} 章，今日的读经进度为:`)
    } else {
        const { startBook, startDay, endBook, endDay } = schedule;
        await room.say(`本群计划于 ${startDay} ~ ${endDay}，读完 ${formatBook(startBook)} - ${formatBook(endBook)}，今日的读经进度为:`)
    }
    await saySchedule(room, biblePlan.schedule, true);
    await displayScheduleTable(room);
}

export async function displayScheduleTable(room: Room | Contact) {
    if (!(room instanceof Room)) {
        return room.say('仅群聊具有读经计划')
    }
    const biblePlan = await getBiblePlanById(room.id);
    if (!biblePlan) {
        return room.say(MISS_PLAN_HINT);
    }

    const roomName = await room.topic();
    const schedule = biblePlan.schedule;

    const sheetRows = [];
    sheetRows.push([].concat('周一', '周二', '周三', '周四', '周五', '周六', '周日'));
    // 数据需要空几列
    let offset = getWeekDay(schedule.startDay);

    if ('chapterOneDay' in schedule) {
        const emptyCol = new Array(offset).fill(null);
        let days = 0;
        let dateRow = [].concat(emptyCol);
        let chapterRow = [].concat(emptyCol)
        let shouldEnd = false;
        do {
            let targetDay = addDay(schedule.startDay, days++);
            dateRow.push(moment(targetDay, FORMAT).format('YY-MM-DD'));
            const { todayStart, todayEnd, done } = getFixNumberPlanChapter(schedule, targetDay);
            const chapter = formatChapter({ todayStart, todayEnd });
            const count = done ? getBookIndexChapterCount({ startBook: todayStart, endBook: todayEnd }) : schedule.chapterOneDay;
            chapterRow.push(`${chapter}(共${count}章)`)
            if (done || dateRow.length === sheetRows[0].length) {
                sheetRows.push([], dateRow.slice());
                sheetRows.push(chapterRow.slice());
                dateRow = [];
                chapterRow = [];
            }
            shouldEnd = done;
        } while (!shouldEnd);
    } else {
        const dailyChapters = getDailyChapter(schedule);
        while (dailyChapters.length > 0) {
            const emptyCol = new Array(offset).fill(null);
            const data = dailyChapters.splice(0, 7 - offset)
            sheetRows.push([], [].concat(emptyCol, data.map(r => moment(r.dayNum, FORMAT).format('MM月DD日'))))
            sheetRows.push([].concat(emptyCol, data.map(r => {
                let { bookIndex: fromBook, from } = r.read[0];
                let { bookIndex: toBook, to } = r.read[r.read.length - 1];
                const chapter = formatChapter({ todayStart: [fromBook, from], todayEnd: [toBook, to] })
                const total = r.read.reduce((acc, book) => acc + book.to - book.from + 1, 0);
                return `${chapter}(共${total}章)`
            })))
            offset = 0;
        }
    }
    return room.say(getXlsxFile(`${roomName}-读经计划表`, sheetRows, '读经计划表', { width: 200 }))
}

export async function cancelSchedule(room: Room | Contact) {
    if (!(room instanceof Room)) {
        return room.say('仅群聊具有读经计划')
    }
    const biblePlan = await getBiblePlanById(room.id);
    if (!biblePlan) {
        return room.say('当前群聊未创建读经计划，请使用「创建读经计划」命令');
    }

    const schedule = biblePlan.schedule;
    await dropBiblePlan({
        roomId: biblePlan.roomId,
        roomName: biblePlan.roomName
    })
    let recoverCommand;

    if ('chapterOneDay' in schedule) {
        const { startBook, startDay, chapterOneDay } = schedule;
        recoverCommand = `${Actions.CreatePlan} ${startBook[0]}${startBook[1]} ${chapterOneDay}章 ${startDay}`;
    } else {
        const { startBook, startDay, endBook, endDay } = schedule;
        const days = getDayDelta(startDay, endDay) + 1;
        recoverCommand = `${Actions.CreatePlan} ${startBook[0]}${startBook[1]}-${endBook[0]}${endBook[1]} ${days}天 ${startDay}`
    }

    await room.say(`${Actions.CancelPlan} 成功，如需恢复请使用如下命令: ${recoverCommand}`)
}

function parseSchedule(text): [FixNumberPlanDTO | FixTimePlanDTO | null, string | null] {
    let match = FixNumPlanReg.exec(text);
    if (match) { return parseFixNumberSchedule(text); }

    match = FixTimePlanReg.exec(text);
    if (match) { return parseTimeScheduel(text); }

    return [null, `输入格式错误，您可以按以下两种格式创建读经计划:
       固定章数格式: ${FIX_NUM_PLAN_FORMAT}
       固定日期格式: ${FIX_TIME_PLAN_FORMAT}
    `]
}

function parseTimeScheduel(text): [FixTimePlanDTO | null, string | null] {
    let match = FixTimePlanReg.exec(text);
    if (!match) {
        return [null, '请使用如下格式: ' + FIX_TIME_PLAN_FORMAT]
    }
    const startBookName = match[1];
    const startChapterNum = +match[2];
    const endBookName = match[3];
    const endChapterNum = +match[4];
    const plan = +match[5];
    

    let valid, error;
    [valid, error] = isBookChapterValid(startBookName, startChapterNum);
    if (!valid) { return [null, error]; }

    [valid, error] = isBookChapterValid(endBookName, endChapterNum);
    if (!valid) { return [null, error]; }
    
    const start = match[6];
    const startDay = start.length === 8 ? +start : getTodayNumber();
    const endDay = +moment(startDay, FORMAT).add(plan - 1, 'day').format(FORMAT)
    
    return [{
        startBook: [startBookName, startChapterNum],
        endBook: [endBookName, endChapterNum],
        startDay: startDay,
        endDay: endDay
    }, null]
}

// 固定章节数计划
function parseFixNumberSchedule(text): [FixNumberPlanDTO | null, string | null] {
    const match = FixNumPlanReg.exec(text);
    if (!match) {
        return [null, '请使用如下格式: ' + FIX_NUM_PLAN_FORMAT]
    }

    const startBookName = match[1];
    const startChapterNum = match[2];
    const chapterOneDay = match[3];
    const startDay = match[4];

    const [valid, error] = isBookChapterValid(startBookName, startChapterNum);

    if (!valid) { return [null, error] }

    if (+chapterOneDay < 0) {
        return [null, `每天章节数需大于 0`]
    }

    return [{
        startBook: [startBookName, +startChapterNum],
        startDay: startDay.length === 8 ? +startDay : getTodayNumber(),
        chapterOneDay: +chapterOneDay
    }, null]
}

export function isValidDay(schedule: FixNumberPlanDTO| FixTimePlanDTO, day?:number) {
    if (!day) { day = getTodayNumber()}
    
    if ('endDay' in schedule) {
        return day >= schedule.startDay && day <= schedule.endDay
    } else {
        const { done } = getFixNumberPlanChapter(schedule, day);
        return day >= schedule.startDay && !done
    }
}