import { BookNameChapter, SmdjDaily } from "../interface";
import { SMDJ_CATALOG, BOOK_CATALOG } from "../constants";
import { fillWithZero } from ".";

const fs = require('fs');
const path = require('path');
var nzhcn = require("nzh/cn"); //直接使用简体中文

// 完整的某卷书
export async function getSmdjSingleBookDaily(bookName: string, dayLimit?: number | string) {
    const targetBook = SMDJ_CATALOG.find(book => {
        return book[0] === bookName;
    })
    return getSmdjDaily([bookName, 1], [bookName, targetBook[1]], dayLimit)
}

// 起始-结束
export async function getSmdjDaily(startBook: BookNameChapter, endBook: BookNameChapter, dayLimit?: number | string): Promise<SmdjDaily[]> {
    const limit = dayLimit ? +dayLimit : null;

    const shouldPart = (audioLength) => {
        if (!limit) {
            return false;
        }
        return audioLength >= limit * 60;
    }

    const statics = await getSmdjStats(startBook, endBook);
    const total = [];

    statics.forEach(({ id, bookName, chapter, chapterNum, chapterTitle,  audioLength, wordsLength, audioLengthFormat }) => {
        const common = {
            chpaterId: id,
            bookName,
            chapter,
            chapterNum,
            chapterTitle,
            audioLength,
            wordsLength,
        }
        if (shouldPart(audioLength)) {
            total.push({ ...common, part: 1})
            total.push({...common, part: 2})
        } else {
            total.push({ ...common, part: 0})
        }
    })

    return total;
}

async function getSmdjStats(startBook: BookNameChapter, endBook: BookNameChapter) {
    const smdjDir = path.join(__dirname, 'smdjStats');
    const targets = [];

    const from = findChapterNumber(startBook);
    const to = findChapterNumber(endBook);
    console.log(from ,to)
    for (let i = from; i <= to; i++) {
        const file = fs.readFileSync(path.join(smdjDir, fillWithZero(i, 4) +'.json'), 'utf-8');
        const content = JSON.parse(file);
        targets.push(content);
    }
    return targets;
}

export function findChapterNumber(startBook: BookNameChapter) {
    let No = 0;
    SMDJ_CATALOG.some((book)=> {
        if (book[0] !== startBook[0]) {
            No += book[1]
            return false;
        }else {
            No += startBook[1];
            return true;
        }
    })
    return No;
}

export function isSmdjChapterValid(startBookName, startChapterNum): [boolean, string | null] {
    console.log(startBookName, startChapterNum)
    const targetBook = SMDJ_CATALOG.find(book => {
        return book[0] === startBookName;
    })
    if (!targetBook) {
        return [false, '未找到该卷书名, 请确认书名是否有误']
    }
    if (+startChapterNum > targetBook[1]) {
        return [false, `${startBookName} 共 ${targetBook[1]} 篇，请重新输入`]
    }
    return [true, null]
}

export function formatSmdjTitle(detail: SmdjDaily) {
    const { bookName, chapterNum, part } = detail

    return `${bookName}-第${chapterNum}篇` + (part ? (part ===1 ?'-上': '-下') :'')
}

export function searchSmdjDaily(searchText): SmdjDaily|null {
    const bookNames = BOOK_CATALOG.map(b => b[0]);
    // 双字缩写靠前 如 约壹 > 约
    const bookNameAbbrs = BOOK_CATALOG.map(b => b[1]).sort((a,b) => b.length - a.length);
    const reg = new RegExp(`(${[...bookNames, ...bookNameAbbrs].join('|')})(?:-|—|–|\\s)*第?\\s*([^篇\\d\\s]+|\\d+)\\s*篇?(?:-|—|–|\\s)*(上|下)?半?`)
    const match = reg.exec(searchText);
    console.log(reg, match);
    if (!match) {
        return null;
    }
    let bookName = match[1];
    let bookIndex = BOOK_CATALOG.findIndex(a => bookName === a[0] || bookName === a[1])
    let chapter = match[2];
    let chapterN = /\d+/.test(chapter) ? +chapter : nzhcn.decodeS(chapter);
    let part = match[3] ? (match[3] === '上' ? 1 : 2) : 0

    const bookInfo = BOOK_CATALOG[bookIndex];
    const smdjInfo = SMDJ_CATALOG.find(c => c[0] === bookInfo[0]);

    if (chapterN > smdjInfo[1] || chapterN < 1) {
        return null;
    }
    const chpaterId = fillWithZero(findChapterNumber([smdjInfo[0], chapterN]), 4)
    const smdjStats = require(`./smdjStats/${chpaterId}.json`);
    return {
        chpaterId, // 4位数字 字符串
        bookName: smdjInfo[0], // 完整的全名
        chapter: nzhcn.encodeS(chapterN), // 中文数字
        chapterNum: chapterN, // 阿拉伯数字
        chapterTitle: smdjStats.chapterTitle, // 篇题
        part // 分篇标志
    } as SmdjDaily
}
