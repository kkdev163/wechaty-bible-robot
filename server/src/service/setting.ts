import { Wechaty } from 'wechaty';
import { getBiblePlanById, getChengXingModelById, dropBiblePlan, updateBiblePlan, createChengXingModel, updateChengXingModel, createBiblePlanModel} from '../ddb'
import { getThisWeekChapter } from '../bible/_7cth';
import { BiblePlan, ChengXing } from '../interface';
import { _7cthDefaultPlan } from '../constants'

async function getWxRoom(roomId) {
    const startTime = Date.now();
    const bot = Wechaty.instance();
    const wxRooms = await bot.Room.findAll();
    console.log('getWxRoom cost', Date.now() - startTime);
    const target = wxRooms.find(r => r.id === roomId);
    return target;
}

export async function getRoomSettings(roomId) {
    const target = await getWxRoom(roomId)
    if (!target) {
       throw Error('未找到相关群聊设置')
    }

    const topic = await target.topic();
    const biblePlan = await getBiblePlanById(roomId);
    const chengXingPlan = await getChengXingModelById(roomId);

    const cxOpen = chengXingPlan && chengXingPlan.remindHour.length > 0;
    const { year, book, chapter } = await getThisWeekChapter(chengXingPlan && chengXingPlan.schedule || _7cthDefaultPlan);
    const remindHour = cxOpen ? chengXingPlan.remindHour[0] : 6;
    const cxDto = {
        open: cxOpen,
        remindHour: remindHour,
        bookChapter: `${year}-${book}-${chapter}`
    }

    return {
        roomId,
        topic,
        chengXingPlan: cxDto,
        biblePlan
    }
}

export async function cancelBiblePlan(roomId) {
    const target = await getWxRoom(roomId)
    if (!target) {
        throw Error('未找到相关群聊设置')
    }

    const biblePlan = await getBiblePlanById(roomId);
    await dropBiblePlan({roomId: biblePlan.roomId, roomName: biblePlan.roomName});
    return true;
}

export async function createBiblePlan(params: BiblePlan) {
    console.log('in service', params);
    const target = await getWxRoom(params.roomId)
    if (!target) {
        throw Error('未找到相关群聊设置')
    }

    let biblePlan = await getBiblePlanById(params.roomId);
    if (biblePlan) {
        throw Error('已存在，请勿重复创建')
    }
    await createBiblePlanModel(params);
    console.log('in service created ', params);
    biblePlan = await getBiblePlanById(params.roomId);
    console.log('in service created after', biblePlan);
    return biblePlan;
}

export async function updateBiblePlanRemind({roomId, remindHour}) {
    const target = await getWxRoom(roomId)
    if (!target) {
        throw Error('未找到相关群聊设置')
    }

    let biblePlan = await getBiblePlanById(roomId);
    if (!biblePlan) {
        throw Error('尚未创建读经计划');
    }

    if (remindHour.length < 1) {
        throw Error('至少需要一个提醒时间');
    }

    await updateBiblePlan({
        ...biblePlan,
        remindHour
    })
    return true;
}

export async function updateChengXing(params: ChengXing) {
    const target = await getWxRoom(params.id);
    if (!target) {
        throw Error('未找到相关群聊设置')
    }

    let cxModel = await getChengXingModelById(params.id);
    if (!cxModel) {
        await createChengXingModel(params);
    } else {
        await updateChengXingModel(params);
    }
    return true;
}