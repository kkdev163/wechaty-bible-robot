
const moment = require('moment');
export const FORMAT = 'YYYYMMDD';
var nzhcn = require("nzh/cn"); //直接使用简体中文

moment.locale('zh-cn', {
  week: {
    dow: 1,  // 指定一周的开始为 周一
    doy: 4
  }
})


// 计算时间差 format: 20210201
export function getDayDelta(startDay: number, targetDay?: number) {
  if (!targetDay) {
    targetDay = moment().format(FORMAT)
  }
  const startMoment = moment(startDay, FORMAT).startOf('day');
  const targetMoment = moment(targetDay, FORMAT).startOf('day');
  return (+targetMoment - +startMoment) / (24 * 3600 * 1000);
}

// 获取 周 时间差
export function getWeekDelta(startDay: number, targetDay?: number) {
  startDay = getWeekStartDay(startDay);
  if (!targetDay) {
    targetDay = moment().format(FORMAT)
  }
  targetDay = getWeekStartDay(targetDay);
  const dayDelta = getDayDelta(startDay, targetDay)
  return dayDelta / 7
}

export function getWeekStartDay(origin?: number) {
  if (!origin) {
    return +moment().startOf('week').format(FORMAT);
  }
  return +moment(origin, FORMAT).startOf('week').format(FORMAT);
}

export function getWeekEndDay(origin?: number) {
  if (!origin) {
    return +moment().endOf('week').format(FORMAT);
  }
  return +moment(origin, FORMAT).endOf('week').format(FORMAT);
}

export function getTodayNumber() {
  return +moment().format(FORMAT)
}

export function getYesterdayNumber() {
  return +moment().subtract(1, 'day').format(FORMAT);
}

export function addDay(day: number, num = 1) {
  return +moment(day, FORMAT).add(num, 'd').format(FORMAT);
}

export function todayAddDay(num = 1) {
  return +moment().add(num, 'd').format(FORMAT);
}

export function getWeekDay(day?: number) {
  if (!day) {
    return moment().weekday();
  }
  return moment(day, FORMAT).weekday();
}

export function getCnWeekDay(day?: number) {
  const weekday = getWeekDay(day);
  if (weekday === 6) {
    return `周日`
  }
  return `周${nzhcn.encodeS(weekday+1)}`
}