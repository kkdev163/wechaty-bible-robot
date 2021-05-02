import { Contact, Room } from 'wechaty';
import { getChengXingModelById, createChengXingModel, updateChengXingModel } from '../ddb';
import { Actions, _7cthReg, _7cthFormat, _7cthDefaultPlan, _7cthDefaultRemindHour, Action_Receiver } from '../constants';
import { getWeekStartDay } from '../util';
import { get7cthSummary } from '../bible/shareRes';

export async function config7cthSchedule(room: Room | Contact, text: string) {

  const match = _7cthReg.exec(text);
  if (!match) {
    return room.say('格式有误，' + _7cthFormat)
  }

  const cxModel = await getChengXingModelById(room.id);
  const commonParams = {
    id: room.id,
    schedule: {
      startDay: getWeekStartDay(),
      startBookChapter: match[0],
    },
  }

  if (!cxModel) {
    await createChengXingModel({
      ...commonParams,
      remindHour: []
    })
  } else {
    await updateChengXingModel({
      ...commonParams,
      remindHour: cxModel.remindHour
    })
  }

  await room.say(Actions._7CTH_CONFIG + '成功, 本周晨兴纲目为');
  await room.say(get7cthSummary(commonParams.schedule))
}

export async function open7cthRemain(room: Room | Contact, text: string) {

  let remindHour = [];
  const match = /(\d+)\s*(\d*)/.exec(text);
  if (!match) {
    remindHour.push(_7cthDefaultRemindHour)
  } else {
    remindHour.push(+match[1])
    if (match[2] && +match[2]) {
      remindHour.push(+match[2])
    }
  }

  const commonParams = {
    id: room.id,
    remindHour
  }

  const cxModel = await getChengXingModelById(room.id);
  if (!cxModel) {
    await createChengXingModel({
      ...commonParams,
      schedule: _7cthDefaultPlan
    })
  } else {
    await updateChengXingModel({
      ...commonParams,
      schedule: cxModel.schedule
    })
  }

  await room.say(`${Actions._7CTH_PUSH} 成功， ${Action_Receiver} 会在每日${remindHour[0]}点整，推送当日的晨兴`)
}

export async function close7cthRemain(room: Room | Contact) {
  const cxModel = await getChengXingModelById(room.id);
  if (!cxModel) {
    const type = room instanceof Room ? '当前群聊' : '您'
    return room.say(type + '还未' + Actions._7CTH_PUSH + '无需' + Actions._7CTH_PUSH_CLOSE);
  } else {
    await updateChengXingModel({
      ...cxModel,
      remindHour: []
    })
    await room.say(Actions._7CTH_PUSH_CLOSE + '成功');
  }
}

