const moment = require('moment');

import { BOOK_CATALOG } from '../constants';
import { getDayDelta, getDailyChapter, getBookNameChapterCount } from '../util';
import { FixNumberPlanDTO, FixTimePlanDTO, BookIndexChapter } from '../interface';


export function getPlanChapter(params: FixNumberPlanDTO | FixTimePlanDTO, targetDay?: number) {
    if ('chapterOneDay' in params) {
        return getFixNumberPlanChapter(params, targetDay);
    }
    return getFixTimePlanChapter(params, targetDay);
}

/**
 * 获取固定章节数-计划的读经章节
 * @param {[string , number]} startBook [0] 书名  [1] 起始章
 * @param {string} startDay 起始读经的日期
 * @param {number} chapterOneDay 每天读的章节数
 * @param {string?} targetDay 查询指定日期，默认为当天
 */
export function getFixNumberPlanChapter({ startBook, startDay, chapterOneDay }: FixNumberPlanDTO, targetDay?: number) {
    const [startBookName, startChapterNum] = startBook;

    const startIndex = BOOK_CATALOG.findIndex((row) => row[0] === startBookName);
    if (startIndex === -1) {
        throw new Error('输入的书名有误')
    }

    let targetBook = BOOK_CATALOG[startIndex];
    if (targetBook[2] < startChapterNum) {
        throw new Error("输入的起始章节数有误");
    }

    let delta = getDayDelta(startDay, targetDay);
    if (delta < 0) {
        throw new Error("输入的起始时间需小于结束日期");
    }
    // 整本圣经结束
    const endBook = BOOK_CATALOG[BOOK_CATALOG.length - 1]
    // 整本圣经，从开始日到读完，共多少章
    const maxDetal = getBookNameChapterCount({ startBook, endBook: [endBook[0], endBook[2]] }) - 1;
    let skipChapter = chapterOneDay * delta;

    let todayStart = findChapter(startIndex, startChapterNum, Math.min(skipChapter, maxDetal));
    let todayEnd = findChapter(startIndex, startChapterNum, Math.min(skipChapter + chapterOneDay - 1, maxDetal));
    return {
        todayStart,
        todayEnd,
        done: skipChapter + chapterOneDay - 1 >= maxDetal
    }
}

export function findChapter(currentIndex, currentChapter, delta): BookIndexChapter {
    // 查找起始章节
    while (delta > 0) {
        // 本卷书总章节数
        let chapterTotal = BOOK_CATALOG[currentIndex][2] as number;
        // 本卷书剩余待阅读章节数
        let chapterRemain = chapterTotal - currentChapter + 1;

        // 剩余的卷数 > 需要跳过的章数
        if (chapterRemain > delta) {
            currentChapter = currentChapter + delta;
            delta = 0;
        } else {
            delta -= chapterRemain;
            currentIndex += 1;
            currentChapter = 1;
        }
    }
    if (currentIndex >= BOOK_CATALOG.length) {
        const endBookIndex = BOOK_CATALOG.length - 1;
        return [endBookIndex, BOOK_CATALOG[endBookIndex][2]]
    }
    // [ 书序、章节数]
    return [currentIndex, currentChapter]
}

export function getFixTimePlanChapter(params: FixTimePlanDTO, targetDay?: number) {
    const dailys = getDailyChapter(params);
    let dayDelta = getDayDelta(params.startDay, targetDay);
    const totalDay = getDayDelta(params.startDay, params.endDay);

    if (dayDelta > totalDay) {
        throw new Error('已读完');
    }
    if (dayDelta < 0) {
        throw new Error('目标日期小于计划开启日期')
    }
    const toDayRead = dailys[dayDelta].read;
    const startBook = toDayRead[0];
    const endBook = toDayRead[toDayRead.length - 1];
    return {
        // [ 书序、章节数]
        todayStart: [startBook.bookIndex, startBook.from],
        // [ 书序、章节数]
        todayEnd: [endBook.bookIndex, endBook.to]
    }
}

// 获取明日的读经进度
export function getTomorrowChapter(params: FixNumberPlanDTO | FixTimePlanDTO) {
    return getPlanChapter(params, +moment().add(1, 'day').format('YYYYMMDD'))
}

// 获取昨日的读经进度
export function getYesterDayChapter(params: FixNumberPlanDTO | FixTimePlanDTO) {
    return getPlanChapter(params, +moment().subtract(1, 'day').format('YYYYMMDD'))
}

export function getFormatChapter(config: FixNumberPlanDTO | FixTimePlanDTO, targetDay?: number, abbr = false) {
    return formatChapter(getPlanChapter(config, targetDay), abbr)
}

export function formatChapter({ todayStart, todayEnd }, abbr = false) {
    const [startBookIndex, startChapterNum] = todayStart;
    const [endBookIndex, endChapterNum] = todayEnd;

    const bookNameIndex = abbr ? 1 : 0;

    const startBook = BOOK_CATALOG[startBookIndex][bookNameIndex];
    const endBook = BOOK_CATALOG[endBookIndex][bookNameIndex];

    if (startBook === endBook) {
        if (startChapterNum === endChapterNum) {
            return `${startBook}${startChapterNum}章`
        }
        return `${startBook}${startChapterNum}-${endChapterNum}章`
    }
    return `${startBook}${startChapterNum}章-${endBook}${endChapterNum}章`
}


