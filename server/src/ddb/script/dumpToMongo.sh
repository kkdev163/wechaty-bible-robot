#!/bin/bash
npx ts-node ./dumpToMongo.ts
mkdir mongoDump
mongodump -d bible-robot -o mongoDump
ssh root@$server_ip "rm -rf /var/mongodb/mongoDump"
scp -r ./mongoDump root@$server_ip:/var/mongodb/
rm -rf mongoDump
