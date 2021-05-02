import { _7cthTotalChapter, _7cthLinkPrefix, _7cthReg, _7cthDefaultPlan } from '../constants';
import { getWeekDelta, getTodayNumber, getWeekDay } from '../util';
import { isEqual } from 'lodash';
import { CxPlanDTO } from '../interface';
import { fillWithZero } from '../util';

var nzhcn = require("nzh/cn"); //直接使用简体中文

const assert = require('assert');


function get7cthDailyLink(params: CxPlanDTO = _7cthDefaultPlan, targetDay?: number) {
  if (!targetDay) {
    targetDay = getTodayNumber();
  }
  const dayInWeek = getWeekDay(targetDay) + 1;
  if (dayInWeek === 7) {
    return get7cthSummaryPageLink(params, targetDay); // 主日返回纲目页
  } else
    return get7cthDailyPageLink(params, targetDay); // 其他日返回晨兴页
}



function get7cthLink(year, book, pageIndex) {
  const bookName = `${year}-${book}`;
  const page = fillWithZero(pageIndex, 4);
  return `${_7cthLinkPrefix}${bookName}/${bookName}_${page}.html`
}

// 获取本周的章节数
export function getThisWeekChapter(params: { startDay: number, startBookChapter: string } = _7cthDefaultPlan, targetDay?: number) {
  const { startDay, startBookChapter } = params;

  const match = _7cthReg.exec(startBookChapter);
  const startYear = +match[1];
  const startBook = +match[2];
  const startChapter = +match[3];

  let year = startYear;
  let book = startBook;
  let chapter = startChapter;

  let delta = getWeekDelta(startDay, targetDay)
  while (delta > 0) {
    if (_7cthTotalChapter[`${year}-${book}`] === undefined) {
      throw Error(`未定义 ${year}-${book} 该次特会的章节总数`)
    }
    const remain = _7cthTotalChapter[`${year}-${book}`] - chapter;
    if (remain >= delta) {
      chapter += delta;
      delta = 0;
    } else {
      if (book === 7) {
        year = year + 1;
        book = 1;
        chapter = 0;
      } else {
        book += 1;
        chapter = 0;
      }
      delta -= remain;
    }
  }
  return {
    year,
    book,
    chapter
  }
}

export function get7cthSummaryPageLink(params: CxPlanDTO = _7cthDefaultPlan, targetDay?: number) {
  const { year, book, chapter } = getThisWeekChapter(params, targetDay);
  // 纲目页的初始序号为 2, 每章 12 页
  const pageIndex = 2 + (chapter - 1) * 12;
  return {
    url: get7cthLink(year, book, pageIndex),
    description: `${year}-${book} | 第${nzhcn.encodeS(chapter)}周 纲目`
  }
}

export function get7cthDailyPageLink(params: CxPlanDTO = _7cthDefaultPlan, targetDay?: number) {
  const { year, book, chapter } = getThisWeekChapter(params, targetDay);
  // 周几
  const weekDay = getWeekDay(targetDay) + 1;
  //  晨兴页初始序号为 7, 每章 12 页
  const pageIndex = 7 + (weekDay - 1) + (chapter - 1) * 12;
  return {
    url: get7cthLink(year, book, pageIndex),
    description: `${year}-${book} | 第${nzhcn.encodeS(chapter)}周 周${nzhcn.encodeS(weekDay)}`
  }
}

function test() {
  assert(isEqual(getThisWeekChapter(_7cthDefaultPlan, 20210301), { year: 2020, book: 6, chapter: 4 }));
  assert(isEqual(getThisWeekChapter(_7cthDefaultPlan, 20210307), { year: 2020, book: 6, chapter: 4 }));
  assert(isEqual(getThisWeekChapter(_7cthDefaultPlan, 20210308), { year: 2020, book: 6, chapter: 5 }));
  assert(isEqual(getThisWeekChapter(_7cthDefaultPlan, 20210315), { year: 2020, book: 6, chapter: 6 }));
  assert(isEqual(getThisWeekChapter(_7cthDefaultPlan, 20210322), { year: 2020, book: 7, chapter: 1 }));
  assert(isEqual(getThisWeekChapter(_7cthDefaultPlan, 20210329), { year: 2020, book: 7, chapter: 2 }));
}

function test2() {
  console.log(get7cthDailyLink(_7cthDefaultPlan, 20210301))
  console.log(get7cthDailyLink(_7cthDefaultPlan, 20210307))
  console.log(get7cthDailyLink(_7cthDefaultPlan, 20210308))
  console.log(get7cthDailyLink(_7cthDefaultPlan, 20210315))
  console.log(get7cthDailyLink(_7cthDefaultPlan, 20210322))
  console.log(get7cthDailyLink(_7cthDefaultPlan, 20210329))
}

// test();
// test2();