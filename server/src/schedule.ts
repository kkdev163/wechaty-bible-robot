import { Room, Wechaty, Contact } from 'wechaty';
import { getBiblePlans, getChengXingModels, syncRoomInfo, getLinkPushModels } from './ddb';
import { saySchedule, isValidDay } from './actions/bibleSchedule';
import { ChengXing, LinkType, LinkPush, DailyType } from './interface'
import { get7cthDaily, getLeeArticle } from './bible/shareRes';
import { getWeekDay, getTodayNumber } from './util';
import { sayLeeStatic, sayChengXingStatic, saySmdjStatic, remindEveryPerson } from './actions';
import { saySmdjToday } from './actions/smdjSchedule';

const moment = require('moment');

export function initSchedule() {
  function shouldTrigger() {
    if (process.env.MUTE) { return }

    if (moment().get('m') === 0) {
      bibleSchedule();
      linkPushSchedule();
      if (getWeekDay() !== 6) { // weekDay = 6 为主日
        chengxingSchedule();
      }
    }

    if (isTimeEqual('23:55')) {
      syncRoomInfo();
    }
  }
  shouldTrigger()
  setInterval(shouldTrigger, 60 * 1000);
}

function isTimeEqual(time: string) {
  const [hour, minute] = time.split(':').map(s => +s);
  const current = moment();
  return current.get('m') === minute && current.get('h') === hour;
}

async function bibleSchedule() {
  const rooms = await Wechaty.instance().Room.findAll({});
  const biblePlans = await getBiblePlans();

  await Promise.all(rooms.map(async room => {
    const biblePlan = biblePlans.find(sR => sR.roomId === room.id);
    if (!biblePlan) {
      return;
    }
    // 读经已经结束
    if (!isValidDay(biblePlan.schedule, getTodayNumber())) {
      return;
    }
    // 当前小时需要出发提醒
    let index = biblePlan.remindHour.indexOf(moment().get('h'));
    if (index !== -1) {
      const hiddenGuide = index !== 0;
      const showStatic = index !== 0 && !biblePlan.disableStats;
      await saySchedule(room, biblePlan.schedule, hiddenGuide, showStatic)
    }
  }))
}

async function chengxingSchedule() {
  const cxModels = await getChengXingModels();
  const wechaty = Wechaty.instance();
  const contacts = await wechaty.Contact.findAll();
  const rooms = await wechaty.Room.findAll();
  await Promise.all(cxModels.map((cx: ChengXing) => {
    const index = cx.remindHour.indexOf(moment().get('h'));
    if (index === -1) { return }

    const contact = contacts.find(c => c.id === cx.id);
    if (contact) {
      return contact.say(get7cthDaily(cx.schedule));
    }
    const room = rooms.find(r => r.id === cx.id);
    if (!room) { return };

    if (index === 0) {
      return room.say(get7cthDaily(cx.schedule))
    } else {
      sayChengXingStatic(room);
    }

  }))
}

async function linkPushSchedule() {
  const linkPushModel = await getLinkPushModels()
  const wechaty = Wechaty.instance();
  const contacts = await wechaty.Contact.findAll();
  const rooms = await wechaty.Room.findAll();

  await Promise.all(linkPushModel.map(async (linkPush: LinkPush) => {
    let index = linkPush.remindHour.indexOf(moment().get('h'));
    if (index === -1) { return }
    let isFirst = index === 0;
    let isLast = index === linkPush.remindHour.length - 1;

    const contact = contacts.find(c => c.id === linkPush.receiverId);
    const room = rooms.find(r => r.id === linkPush.receiverId);
    let receiver = contact || room;
    if (!receiver) { return }

    if (linkPush.LinkType === LinkType.LeeArticle) {
      if (index === 0) {
        const pushArticle = await getLeeArticle();
        if (pushArticle) {
          return receiver.say(pushArticle);
        }
        return receiver.say('未找到今日推送文章')
      } else {
        return sayLeeStatic(receiver)
      }
    }

    if (linkPush.LinkType === LinkType.Smdj) {

      await saySmdjToday(receiver, isFirst)

      if (receiver instanceof Contact) { return }
      
      if (!isFirst && !linkPush.disableStats) {
        await saySmdjStatic(receiver);
      }
      
      if (isLast) {
        await remindEveryPerson(receiver, DailyType.Smdj)
      }
    }
  }))
}