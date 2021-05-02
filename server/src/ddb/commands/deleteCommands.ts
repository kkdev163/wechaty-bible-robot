import { StringSensitive } from 'aws-sdk/clients/rds';
import { getMongoInstance } from '../mongoDb';
import { Table, LinkType} from '../schema';
let mongoInstance;

export async function dropBiblePlan(params: { roomId: string, roomName: StringSensitive }) {
  return dropModel(Table.BiblePlan, params);
}

export async function dropSmdjPlan(id: string) {
  return dropModel(Table.LinkPush, {
    receiverId: id,
    LinkType: LinkType.Smdj
  })
}

export async function dropModel(tableName, params) {
  return deleteP({
    TableName: tableName,
    Key: params
  })
}

async function deleteP(params: { TableName: string, Key }) {
  if (!mongoInstance) { mongoInstance = await getMongoInstance() };
  return mongoInstance[`_${params.TableName}`].deleteOne(params.Key);
}