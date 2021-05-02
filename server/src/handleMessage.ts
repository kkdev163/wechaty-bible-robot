import { Contact, Message, Room, Wechaty } from 'wechaty';
import { createSchedule, displaySchedule, configSchedule, saySchedule, handleUserCommit, sayTomorrowSchedule, cancelSchedule, handleManuallyCommit, sayChengXingStatsWeek, sayChengXingStatic, sayLeeStatic, sayLeeStatsWeek, saySmdjStatic, saySmdjStatsWeek, isValidDay, remindSmdjUnCommit, addWhiteList } from './actions';
import { config7cthSchedule, open7cthRemain, close7cthRemain } from './actions';
import { sayBibleStatsWeek, sayBiblePlanStatic } from './actions';
import { sayLeeArticle, configLeePush } from './actions'
import { getBiblePlanById, getChengXingModelById } from './ddb';
import { getSongShareLink, getHomeLink, getBibleLink, get7cthSummary, get7cthDaily, getConfigLink, getSmdjLink } from './bible/shareRes';
import { Actions, ActionHelper, ActionHelperDetail, MISS_PLAN_HINT, Action_Receiver, _7cthDefaultPlan, ScheduleCompeleteTag, ScheduleCatchupTag } from './constants';
import { parseBibleBook, containBibleBook, containSongText, addDay, getStartPlanRoom, todayAddDay } from './util';
import { createSmdj, saySmdjToday, displaySmdjScheduleTable, cancleSmdj, configSmdjPush } from './actions/smdjSchedule';
import { saySearchBible, saySearchSmdj, sayReadBible } from './actions/search';
import { getHelperImg } from './util/drawUtils';
import { DailyTypeCNMap, DailyType } from './interface';

let actionReceiver;


export function setActionReceiver(user) {
  actionReceiver = new RegExp(`@${Action_Receiver}|@${user.payload.name}`)
  console.log('登录成功，设置命令接收者为', actionReceiver)
}

export async function handleMessage(message) {
  // 过滤掉非文本消息
  if (message.type() !== Message.Type.Text) { return }
  const contact = message.talker()
  const room = message.room()

  if (process.env.MUTE && contact.name() !== process.env.ADMIN_NAME) { return }

  const text = message.text()
  if (room) {
    const topic = await room.topic();
    const alias = await room.alias(contact);
    console.log(`Topic: ${topic} Id: ${room.id} Contact: ${contact.name()} alias: ${alias}  Text: ${text}`)
    if (actionReceiver.test(text)) {
      await handleAction(room, text, contact);
    } else if (ScheduleCompeleteTag.test(text) || ScheduleCatchupTag.test(text)) {
      await handleUserCommit(room, contact, text)
    }
  } else {
    await handleAction(contact, text, contact);
    console.log(`Contact: ${contact.name()} Text: ${text}`)
  }
}


async function handleAction(room, text, talker) {
  const action = text.replace(actionReceiver, '');

  if (action.includes(Actions.ForceExit)) {
    const hostname = require("os").hostname();
    if (action.includes(hostname) || action.includes('all')) {
      await room.say(hostname + '已收工');
      console.log('收到强制下线指令')
      return process.exit(0);
    }
  }

  const actionProcessQueque = [
    [Actions.ManuallyCommit, handleManuallyCommit], // 手动补打卡
    [Actions.FeedBack, proxyToAdmin], //反馈
    [Actions.SearchBible, saySearchBible], // 查经
    [Actions.SearchSmdj, saySearchSmdj], // 查生命读经
    [Actions.CreateSmdjPlan, createSmdj], // 创建生命读经
    [Actions.DisplaySmdjPlan, displaySmdjScheduleTable], // 生命读经计划表
    [Actions.CancelSmdjPlan, cancleSmdj], // 关闭生命读经计划
    [Actions.ConfigSmdjPlan, configSmdjPush], // 设置生命读经推送
    [Actions.SmdjStatsWeek, saySmdjStatsWeek], // 本周生命读经统计
    [Actions.SmdjStats, saySmdjStatic], // 生命读经统计
    [Actions.SmdjToday, saySmdjToday], // 今日生命读经
    [Actions.SmdjUnCommitRemind, remindSmdjUnCommit], //生命读经未读提醒
    [Actions.Smdj, saySmdj], // 生命读经
    [Actions.CreatePlan, createSchedule], // 创建读经计划
    [Actions.CancelPlan, cancelSchedule], // 关闭读经计划
    [Actions.ConfigPlan, configSchedule], // 设置读经推送
    [Actions.DisplayPlan, displaySchedule], // 读经计划
    [Actions.GetTomorrowPlan, sayTomorrowPlanAction], //明日读经
    [Actions.GetPlan, sayPlanAction], //今日读经
    [Actions.StatsWeek, sayBibleStatsWeek], //本周读经统计
    [Actions.Static, sayBiblePlanStatic], //读经统计
    [Actions.HomeLink, sayHomeLink], //书报
    [Actions._7CTH_CONFIG, config7cthSchedule], //设置晨兴
    [Actions._7CTH_PUSH, open7cthRemain], //开启晨兴推送
    [Actions._7CTH_PUSH_CLOSE, close7cthRemain], //关闭晨兴推送
    [Actions._7CTH_SUMMARY, sayCxSummary], //晨兴纲目
    [Actions._7CTH_StatsWeek, sayChengXingStatsWeek], // 本周晨兴统计
    [Actions._7CTH_Stats, sayChengXingStatic], // 晨兴统计
    [Actions._7CTH, sayCx], // 晨兴
    [Actions.LeeArticle_PUSH, configLeePush], // 设置文集推送
    [Actions.LeeArticleStatsWeek, sayLeeStatsWeek], // 本周文集统计
    [Actions.LeeArticleStats, sayLeeStatic], // 文集统计
    [Actions.LeeArticle, sayLeeArticle], // 文集
    [Actions.ReadBible, sayReadBible], // 读经
    [Actions.Help, sayHelper], // 更多功能
    [Actions.addWhiteList, addWhiteList], // 增加提醒白名单
    [Actions.Introduce, sayIntroduce], // 介绍
    [Actions.ConfigPage, sayConfigWeb], // 设置页面
  ] as [Actions, any][];

  const tuple = actionProcessQueque.find(([action]) => text.replace(Action_Receiver, '').includes(action));
  if (tuple) {
    const handler = tuple[1];
    return handler(room, text, talker);
  }

  if (containSongText(action)) { // 诗歌
    return saySongLing(room, action);
  }

  if (containBibleBook(action)) { // 圣经
    const [bookIndex, startChapter] = parseBibleBook(action);
    await room.say(getBibleLink(bookIndex, startChapter))
  } else {
    await room.say(['我还没学会你说的，你可以试试让我:'].concat(ActionHelper).join('\n\t'))
  }
}

export async function bindEvents() {
  const rooms = await getStartPlanRoom();

  rooms.forEach(({ room, pushTypes }) => {
    room.on('join', async (inviteeList) => {
      if (process.env.MUTE) { return }
      // 如果是邀请其他 读经助手 小号进群
      const validList = inviteeList.filter(c => c.name() !== Action_Receiver)
      if (!validList.length) {
        return;
      }

      const nameList = validList.map(c => `@${c.name()}`).join(' ');
      const pushTypeString = pushTypes.map(type => DailyTypeCNMap[type]).join('、');
      await room.say(`欢迎 ${nameList} 进群，本群正在实行 ${pushTypeString} 计划，为了方便统计，请修改群昵称为 名字 + 弟兄/姊妹，今日的进度为:`)
      await pushTypes.reduce((promise, type) => {
        return promise.then(() => {
          if (type === DailyType.Bible) {
            return sayPlanAction(room);
          } else if (type === DailyType.Smdj) {
            return saySmdjToday(room)
          } else if (type === DailyType.LeeArticle) {
            return sayLeeArticle(room);
          } else if (type === DailyType.ChengXing) {
            return sayCx(room)
          }
        })
      }, Promise.resolve())
    })
  })
}

async function sayConfigWeb(room, text, talker) {
  await room.say(getConfigLink(room, talker))
}

async function sayIntroduce(room) {
  await room.say([`你好，我是${Action_Receiver}，我可以:`].concat(ActionHelper).join('\n\t'))
}

async function sayHelper(room) {
  await room.say('你好，正在为你展示我的全部技能，请稍候:');
  const file = await getHelperImg();
  return room.say(file);
}

async function sayCx(room) {
  const model = await getChengXingModelById(room.id);
  const link = get7cthDaily(model && model.schedule || _7cthDefaultPlan);
  await room.say(link);
}

async function sayCxSummary(room) {
  const model = await getChengXingModelById(room.id);
  const link = get7cthSummary(model && model.schedule || _7cthDefaultPlan);
  await room.say(link);
}

async function sayHomeLink(room) {
  const link = await getHomeLink();
  await room.say(link);
}

async function saySongLing(room, text) {
  const link = await getSongShareLink(text);
  await room.say(link);
}

async function saySmdj(room, text) {
  const link = await getSmdjLink(text);
  await room.say(link);
}

async function proxyToAdmin(room: Room | Contact, text: string, talker: Contact,) {
  let target;
  let bot = Wechaty.instance();
  if (!process.env.ADMIN_NAME) {
    target = bot.userSelf()
  } else {
    target = await bot.Contact.find(process.env.ADMIN_NAME);
    if (!target) {
      target = bot.userSelf();
    }
  }
  await target.say('转发 @' + talker.name() + ' 的消息:' + text);
  await room.say('已转达您的反馈，非常感谢!');
}

async function sayPlanAction(room) {
  if (room instanceof Room) {
    const scheduleRoom = await getBiblePlanById(room.id);
    if (!scheduleRoom) {
      return room.say(MISS_PLAN_HINT)
    }
    if (!isValidDay(scheduleRoom.schedule)) {
      return room.say('读经计划已完成，如需继续读经，请关闭后重新创建')
    }

    return saySchedule(room, scheduleRoom.schedule, true);
  }
  return saySchedule(room, undefined, true)
}

async function sayTomorrowPlanAction(room) {
  if (room instanceof Room) {
    const scheduleRoom = await getBiblePlanById(room.id);
    if (!scheduleRoom) {
      return room.say(MISS_PLAN_HINT)
    }
    if (!isValidDay(scheduleRoom.schedule, todayAddDay(1))) {
      return room.say('读经计划已完成，如需继续读经，请关闭后重新创建')
    }
    return sayTomorrowSchedule(room, scheduleRoom.schedule);
  }
  return sayTomorrowSchedule(room)
}