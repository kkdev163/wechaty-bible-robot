import { getMongoInstance } from '../mongoDb';
import { getModels } from '../commands/queryCommands';
import { BiblePlan, ChengXing, Member, Daily } from '../../interface';

async function dumpToMongo() {
  console.log('start sync');
  const instance = await getMongoInstance();

  const roomModels = await getModels<BiblePlan>('Room');
  const cxModels = await getModels<ChengXing>('ChengXing');
  const memberModels = await getModels<Member>('Member');
  const dailyModels = await getModels<Daily>('Daily');

  try {
    await instance._BiblePlan.insertMany(roomModels);
    await instance._ChengXing.insertMany(cxModels);
    await instance._Member.insertMany(memberModels);
    await instance._Daily.insertMany(dailyModels);

    await instance._BiblePlan.createIndex({ "roomId": 1 })
    await instance._ChengXing.createIndex({ "id": 1 })
    await instance._Member.createIndex({ "roomId": 1, "wxId": 1 })
    await instance._Daily.createIndex({ "roomId": 1, "day": 1 })

    console.log('sync done');
    process.exit(0);
  } catch (error) {
    console.log('sync error', error);
  }
}

dumpToMongo()