import { Member, BiblePlan, Daily, ChengXing, LinkPush, RoomConfig } from '../../interface';
import { getMongoInstance } from '../mongoDb';
import { Table, DailyType } from '../schema';

let mongoInstance;

export async function getBiblePlanById(id): Promise<BiblePlan> {
    return getModelById<BiblePlan>(Table.BiblePlan, id, 'roomId')
}

export async function getChengXingModelById(id): Promise<ChengXing> {
    return getModelById<ChengXing>(Table.ChengXing, id)
}

export async function getLinkPushModelById(id, opt={}): Promise<LinkPush> {
    return getModelById<LinkPush>(Table.LinkPush, id, 'receiverId', opt)
}

export async function getRoomConfigById(id): Promise<RoomConfig> {
    return getModelById<RoomConfig>(Table.RoomConfig, id, 'roomId')
}

export async function getRoomConfigModels(opt = {}): Promise<RoomConfig[]> {
    return getModels<RoomConfig[]>(Table.RoomConfig, opt)
}

export async function getLinkPushModels(opt={}): Promise<LinkPush[]> {
    return getModels<LinkPush[]>(Table.LinkPush, opt)
}

export async function getMemberModels(options?): Promise<Member[]> {
    return getModels<Member[]>(Table.Member, options)
}

export async function getBiblePlans(): Promise<BiblePlan[]> {
    return getModels<BiblePlan[]>(Table.BiblePlan)
}

export async function getDailyModels(options={}): Promise<Daily[]> {
    return getModels<Daily[]>(Table.Daily, options)
}

export async function getChengXingModels(): Promise<ChengXing[]> {
    return getModels<ChengXing[]>(Table.ChengXing)
}

// 查询相关操作
export async function getDaily(params: { day: number, roomId: string, type: DailyType}): Promise<Daily> {
    if (!mongoInstance) { mongoInstance = await getMongoInstance() };
    return mongoInstance._Daily.findOne(params);
}


export async function getRoomMember(roomId: string, wxUserId: string) {
    if (!mongoInstance) { mongoInstance = await getMongoInstance() };
    return mongoInstance._Member.findOne({ roomId, wxId: wxUserId });
}

export async function getModels<T>(modelName, options = {}): Promise<T> {
    if (!mongoInstance) { mongoInstance = await getMongoInstance() };
    return mongoInstance[`_${modelName}`].find(options).toArray();
}

export async function getModelById<T>(modelName: string, id: any, modelKeyName: string = 'id', opt={}): Promise<T> {
    if (!mongoInstance) { mongoInstance = await getMongoInstance() };
    return mongoInstance[`_${modelName}`].findOne({ [modelKeyName]: id, ...opt})
}