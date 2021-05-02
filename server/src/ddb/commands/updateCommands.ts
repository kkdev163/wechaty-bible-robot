import { Member, ChengXing, BiblePlan, LinkPush, DailyType, RoomConfig} from '../../interface';
import { getTodayNumber } from '../../util';
import { getDaily, getRoomMember, getDailyModels } from './queryCommands'
import { createDaily, createRoomMember } from './createCommands';
import { getMongoInstance } from '../mongoDb';
import { uniq } from 'lodash';

let mongoInstance;

export interface AddDailyParams { 
    day: number, 
    roomId: string, 
    wxId: string, 
    totalMemberCount: number, 
    type: DailyType 
}

export interface batchAddDailyParams {
    day: number,
    roomId: string,
    wxIds: string[],
    totalMemberCount: number,
    type: DailyType
}
 
export async function addDailyComplete({ day, roomId, wxId, totalMemberCount, type }: AddDailyParams) {
    if (!mongoInstance) { mongoInstance = await getMongoInstance(); }
    
    const daily = await getDaily({ day, roomId, type });
    if (!daily) {
        await createDaily({ day, roomId, completeMember: [wxId], totalMemberCount, type })
    } else if (!daily.completeMember.includes(wxId)) {
        let completeMember = uniq(daily.completeMember) || [];
        const updateStr = { $set: { completeMember: completeMember.concat(wxId), totalMemberCount } };
        await mongoInstance._Daily.updateOne({ roomId, day, type }, updateStr);
    }
}

export async function batchAddDailyComplete({ day, roomId, wxIds, totalMemberCount, type }: batchAddDailyParams) {
    if (!mongoInstance) { mongoInstance = await getMongoInstance(); }

    const daily = await getDaily({ day, roomId, type });
    if (!daily) {
        await createDaily({ day, roomId, completeMember: wxIds, totalMemberCount, type })
    } else {
        let completeMember = uniq((daily.completeMember || []).concat(wxIds));
        const updateStr = { $set: { completeMember, totalMemberCount } };
        await mongoInstance._Daily.updateOne({ roomId, day, type }, updateStr);
    }
}

export async function updateChengXingModel(item: ChengXing) {
    if (!mongoInstance) { mongoInstance = await getMongoInstance(); }
    const updateStr = { $set: { schedule: item.schedule, remindHour: item.remindHour } };
    return mongoInstance._ChengXing.updateOne({ id: item.id }, updateStr);
}

export async function updateLinkPushModel(item: LinkPush) {
    if (!mongoInstance) { mongoInstance = await getMongoInstance(); }
    const updateStr = { $set: { remindHour: item.remindHour } };
    return mongoInstance._LinkPush.updateOne({ receiverId: item.receiverId, LinkType: item.LinkType }, updateStr);
}

export async function syncDailyMemberCount(roomId: string, totalMemberCount: number) {
    const queryParams = { roomId, day: getTodayNumber() };
    let daily = await getDailyModels(queryParams)
    if (!daily || daily.length) { return; }

    if (!mongoInstance) { mongoInstance = await getMongoInstance(); }

    return Promise.all(daily.map(d => {
        const updateStr = { $set: { totalMemberCount } };
        return mongoInstance._Daily.updateOne({
            ...queryParams,
            type: d.type
        }, updateStr);
    }))
}

export async function syncDbRoomMember(item: Member) {
    const roomMember = await getRoomMember(item.roomId, item.wxId);
    if (!roomMember) {
        await createRoomMember(item)
    } else if (roomMember.alias !== item.alias || roomMember.wxName !== item.wxName) {
        await updateRoomMember(item)
    }
}

export async function updateRoomMember(item: Member) {
    if (!mongoInstance) { mongoInstance = await getMongoInstance(); }
    const updateStr = { $set: { alias: item.alias, wxName: item.wxName } };
    return mongoInstance._Member.updateOne({ roomId: item.roomId, wxId: item.wxId }, updateStr)
}

export async function updateBiblePlan(item: BiblePlan) {
    if (!mongoInstance) { mongoInstance = await getMongoInstance(); }
    const updateStr = { $set: { remindHour: item.remindHour } };
    return mongoInstance._BiblePlan.updateOne({ roomId: item.roomId, roomName: item.roomName }, updateStr)
}

interface RoomConfigUpdateItem {
    topic?: string
    uncommitRemindWhiteList?: string[]
}
export async function updateRoomConfig(item: RoomConfigUpdateItem, roomId) {
    if (!mongoInstance) { mongoInstance = await getMongoInstance(); }
    const updateStr = { $set: item };
    return mongoInstance._RoomConfig.updateOne({ roomId: roomId }, updateStr)
}
