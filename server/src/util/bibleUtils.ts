import { BOOK_CATALOG, Action_Receiver, Actions, ReadBibleFORMAT,} from '../constants';
import { getDayDelta, addDay} from './timeUtils';
import { FixTimePlanDTO, BookNameChapter, BookIndexChapter} from '../interface';
import  { isEqual } from 'lodash';
import { BiblePickDto } from '../service/search';

var assert = require('assert');
var nzhcn = require("nzh/cn"); //直接使用简体中文

function matchBibleBook(book, text) {
    return text===book[0] || text===book[1]
}

const BibleSearchReg = /([^\d\s]+)\s*(\d*)/;
export function containBibleBook(text) {
    const match = BibleSearchReg.exec(text);
    if (!match){ return false;}
    return BOOK_CATALOG.some(book => matchBibleBook(book, match[1]))
}

export function isBookChapterValid(startBookName, startChapterNum): [boolean, string | null] {
    const targetBook = BOOK_CATALOG.find(book => {
        return book[0] === startBookName;
    })
    if (!targetBook) {
        return [false, '未找到该卷书名, 请确认书名是否有误']
    }
    if (+startChapterNum > targetBook[2]) {
        return [false, `${targetBook[0]} 共 ${targetBook[2]} 章，请重新输入`]
    }
    return [true, null]
}

export function parseBibleBook(text) {
    const match = BibleSearchReg.exec(text);
    const bookIndex = BOOK_CATALOG.findIndex(book => matchBibleBook(book, match[1]))
    const startChapter = match[2] && (+match[2] <= BOOK_CATALOG[bookIndex][2]) ? +match[2] : 1;
    return [bookIndex, startChapter]
}


// 按卷分组
export function getDailyChapter({ startBook, endBook, startDay, endDay }: FixTimePlanDTO) {
    const totalChapters = getBookNameChapterCount({ startBook, endBook });
    const days = getDayDelta(startDay, endDay);

    let chapterOneDay = Math.ceil(totalChapters / days);
    // console.log('从' + startBook[0] + startBook[1] + '章')
    // console.log('到' + endBook[0] + endBook[1] + '章')
    // console.log('一共' + totalChapters + '章');
    // console.log(startDay + '~' + endDay)
    // console.log('计划 ' + days + ' 天读完');
    // console.log('每天需要读 ' + chapterOneDay + ' 章左右');

    const results = new Array(days).fill(0).map((a, i) => ({ day: 'No.' + (i + 1), read: [], dayNum: addDay(startDay, i)}));
    let dayIndex = 0;

    let mergedCount = 0;

    let startBookIndex = getBookIndex(startBook);
    let endBookIndex = getBookIndex(endBook);

    let readChapter = 0;

    for (let i = startBookIndex; i <= endBookIndex; i++) {
        const book = BOOK_CATALOG[i];
        const volumeName = book[0];
        const left = i === startBookIndex ? startBook[1] : 1;
        const right = i === endBookIndex ? endBook[1] : book[2];
        const chapters = right - left + 1;

        const remainC = totalChapters - readChapter;
        const remainD = days - dayIndex >= 1 ? days - dayIndex : 1;
        chapterOneDay = Math.ceil(remainC / remainD);

        const daysComplete = (chapters + mergedCount) / chapterOneDay;

        if (daysComplete <= 0.8) {
            // 这卷书太少了，就并入下一卷书一起读吧
            results[dayIndex].read.push({
                bookIndex: i,
                from: left,
                to: right
            })
            mergedCount += chapters;
        } else if (daysComplete <= 1.2) {
            // 这卷书只多了一点，凑活一天读完吧
            results[dayIndex].read.push({
                bookIndex: i,
                from: left,
                to: right
            })
            // 加上昨日阅读量
            readChapter += results[dayIndex].read.reduce((acc, { from, to }) => acc + to - from + 1, 0);
            mergedCount = 0;
            if (dayIndex < days - 1) { dayIndex++; }
        } else { // 平均分成多天读吧
            // 几天读完
            let volumeDays = Math.min(Math.ceil(daysComplete), days - dayIndex);
            let totalRead = chapters + mergedCount;
            // 每天读几章
            const basicInDay = Math.floor(totalRead / volumeDays);
            // 有多少天需要多读一章
            let remains = totalRead - volumeDays * basicInDay;

            let volumneIndex = left;
            while (volumneIndex <= right) {
                const from = volumneIndex;
                const readCount = basicInDay + (remains > 0 ? 1 : 0);
                const to = from + readCount - 1 - mergedCount;
                mergedCount = 0;

                results[dayIndex].read.push({
                    bookIndex: i,
                    from: volumneIndex,
                    to
                })
                readChapter += readCount
                if (dayIndex < days - 1) { dayIndex++; }
                remains--
                volumneIndex = to + 1
            }
        }
    }

    const filtered = results
        .map(d => {
            return {
                ...d,
                total: d.read.reduce((acc, it) => acc + it.to - it.from + 1, 0)
            }
        }).filter(d => d.total > 0);
    return filtered;
}

function getBookIndex(book) {
    const [startBookName, startChapterNum] = book;
    const startIndex = BOOK_CATALOG.findIndex((row) => row[0] === startBookName);
    if (startIndex === -1) {
        throw new Error(`未找到该卷 ${startBookName}`)
    }

    let targetBook = BOOK_CATALOG[startIndex];
    if (targetBook[2] < startChapterNum) {
        throw new Error(`${startBookName} 的最大章节数为 ${targetBook[2]}`)
    }

    if (startChapterNum < 1) {
        throw new Error('章节数最小需从 1 开始')
    }
    return startIndex;
}

// 根据书名查询
export function getBookNameChapterCount({ startBook, endBook }: { startBook: BookNameChapter, endBook: BookNameChapter}): number {
    let startBookIndex = getBookIndex(startBook);
    let endBookIndex = getBookIndex(endBook);
    return getBookIndexChapterCount({
        startBook: [startBookIndex, startBook[1]],
        endBook: [endBookIndex, endBook[1]]
    })
}


export function getBookIndexChapterCount({ startBook, endBook }: { startBook: BookIndexChapter, endBook: BookIndexChapter}) {
    const startBookIndex = startBook[0];
    const endBookIndex = endBook[0];
    if (startBookIndex === endBookIndex && startBook[1] > endBook[1]) {
        throw new Error(`起始章节不可大于结束章节`)
    }

    if (startBookIndex > endBookIndex) {
        throw new Error(`起始章节不可大于结束章节`)
    }

    let total = 0;
    for (let i = startBookIndex; i <= endBookIndex; i++) {
        let left = i === startBookIndex ? startBook[1] : 1;
        let right = i === endBookIndex ? endBook[1] : BOOK_CATALOG[i][2]
        total += right - left + 1;
    }
    return total;
}

export function getReadGroups(text): [string, BiblePickDto[]] {
    const content = text
        .replace(`@${Action_Receiver}`, '')
        .replace(Actions.ReadBible, '')
        .trim()

    // 分割出章节
    const groups = content.split(/，|,/)

    let results: BiblePickDto[] = [];
    let lastBook
    let bookNameAbbrs = BOOK_CATALOG.map(b => b[1])
    // 两字缩写优先匹配，约壹 > 约
    let bookNameAbbrRegs = [...bookNameAbbrs].sort((a, b)=> b.length - a.length); 
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i].trim();
        const reg = new RegExp(`(${bookNameAbbrRegs.join('|')})?\\s*([^\\d]+)\\s*(\\d.*)`);
        const match = reg.exec(group);
        if (!match) { continue }

        lastBook = match[1] || lastBook;
        const chapterS = match[2];
        const sectionsString = match[3];
        
        let sections = sectionsString
            .split(/、/)
            .reduce((arr, s) => {
                const match = s
                    .split(/～|~|–|-|-|——|_/i)
                    .filter(d => /^\d+/.test(d))
                if (match.length === 1) {
                    arr.push(s)
                } else {
                    const sectionA = /(\d+)(上|下|a|b)?/.exec(match[0]);
                    const sectionB = /(\d+)(上|下|a|b)?/.exec(match[1]);
                    if (sectionA && sectionB) {
                        for (let i = +sectionA[1]; i <= +sectionB[1]; i++) {
                            arr.push(i + '');
                        }
                    }
                }
                return arr;
            }, [])
        
        
        const bookIndex = bookNameAbbrs.indexOf(lastBook);
        const bookInfo = BOOK_CATALOG[bookIndex];
        if (bookInfo && sections.length>0) {
            results.push({
                bookName: bookInfo[0],
                bookNameAbbr: bookInfo[1],
                chapterN: nzhcn.decodeS(chapterS),
                chapterS,
                sections,
            })
        }
    }
    return [content, results];
}


function test() {
    // 测试的读经计划
    const DefaultPlan = {
        startBook: ['诗篇', 71] as [string, number],
        endBook: ['玛拉基书', 4] as [string, number],
        startDay: 20210305,
        endDay: 20210412,
    };
    const SecondPlan = {
        startBook: ['创世记', 1] as [string, number],
        endBook: ['玛拉基书', 4] as [string, number],
        startDay: 20210401,
        endDay: 20210630,
    };

    const printf = (d, i) => {
        console.log(d.day, d.read.map(b => BOOK_CATALOG[b.bookIndex][0] + b.from + '-' + b.to).join('、'), `共${d.total}章`)
    }

    //getDailyChapter(DefaultPlan).map(printf);
    getDailyChapter(SecondPlan).map(printf);
}

// test()

function testReadGroup() {
    const [range, groups] = getReadGroups(ReadBibleFORMAT)
    assert(isEqual(groups, [
        {
            bookName: '约伯记',
            bookNameAbbr: '伯',
            chapterN: 1,
            chapterS: '一',
            sections: [
                '6', '7', '8',
                '9', '10', '11',
                '12'
            ]
        },
        {
            bookName: '约伯记',
            bookNameAbbr: '伯',
            chapterN: 2,
            chapterS: '二',
            sections: [ '1']
        },
        {
            bookName: '启示录',
            bookNameAbbr: '启',
            chapterN: 12,
            chapterS: '十二',
            sections: ['5', '7', '8', '9', '10', '11']
        }
    ]), 'group1 fail' + JSON.stringify(groups, null, 2))

    const [range2, groups2] = getReadGroups('@读经助手 读经 伯一6~12，  太二1')
    assert(isEqual(groups2, [
        {
            bookName: '约伯记',
            bookNameAbbr: '伯',
            chapterN: 1,
            chapterS: '一',
            sections: [
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12"]
        },
        {
            bookName: '马太福音',
            bookNameAbbr: '太',
            chapterN: 2,
            chapterS: '二',
            sections: ['1']
        }
    ]), 'group2 fail' + JSON.stringify(groups2, null, 2))

    const [range3, groups3] = getReadGroups('@读经助手 读经 伯一6~12，伯二6-12，   太一1')
    assert(isEqual(groups3, [
        {
            "bookName": "约伯记",
            "bookNameAbbr": "伯",
            "chapterN": 1,
            "chapterS": "一",
            "sections": [
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12"
            ]
        },
        {
            "bookName": "约伯记",
            "bookNameAbbr": "伯",
            "chapterN": 2,
            "chapterS": "二",
            "sections": [
                "6",
                "7",
                "8",
                "9",
                "10",
                "11",
                "12"
            ]
        },
        {
            "bookName": "马太福音",
            "bookNameAbbr": "太",
            "chapterN": 1,
            "chapterS": "一",
            "sections": [
                "1"
            ]
        }
    ]), 'group3 fail' + JSON.stringify(groups3, null, 2));
}

//testReadGroup();