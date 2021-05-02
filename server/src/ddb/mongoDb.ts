var MongoClient = require('mongodb').MongoClient;
var url = process.env.MongoUrl || "mongodb://localhost:27017";
var dbName = process.env.MongoDbName || 'bible-robot'
import { Table } from './schema';

let dbInstance;

export async function getMongoInstance() {
  if (dbInstance) {
    return dbInstance;
  }
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, async function (err, client) {
      if (err) throw reject(err);
      dbInstance = client.db(dbName);
      // 增加 collection 引用
      await Promise.all(Object.values(Table).map(async t => {
        let collection = dbInstance.collection(t);
        if (!collection) {
          await dbInstance.createCollectionP(t);
          collection = dbInstance.collection(t);
        }
        dbInstance[`_${t}`] = collection;
      }));
      resolve(dbInstance)
    })
  })
}

