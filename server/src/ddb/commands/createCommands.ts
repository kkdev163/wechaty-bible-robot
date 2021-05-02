import { getMongoInstance } from '../mongoDb';
import { Member, BiblePlan, Daily, ChengXing, LinkPush } from '../../interface';
import { Table, RoomConfig } from '../schema';
let mongoInstance;

async function putP(params: { TableName: string, Item }) {
    if (!mongoInstance) { mongoInstance = await getMongoInstance() };
    return mongoInstance[`_${params.TableName}`].insertOne(params.Item);
}

export async function createBiblePlanModel(item: BiblePlan) {
    return putP({
        TableName: Table.BiblePlan,
        Item: item
    })
}

export async function createDaily(item: Daily) {
    return putP({
        TableName: Table.Daily,
        Item: item
    })
}

export async function createRoomMember(item: Member) {
    await putP({
        TableName: Table.Member,
        Item: item
    })
}

export async function createRoomConfig(item: RoomConfig) {
    await putP({
        TableName: Table.RoomConfig,
        Item: item
    })
}

export async function createChengXingModel(params: ChengXing) {
    return putP({
        TableName: Table.ChengXing,
        Item: params
    })
}

export async function createLinkPushModel(params: LinkPush) {
    return putP({
        TableName: Table.LinkPush,
        Item: params
    })
}
