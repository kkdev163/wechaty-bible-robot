const fs = require('fs');
const path = require('path');
import { getClientInstance } from '../instance';

async function readFile(fileName, rowKey: string[]) {
    const content = fs.readFileSync(path.join(__dirname, `./source/${fileName}`), 'utf-8');
    const lines = content.split('\n');
    return lines
        .map(line => {
        const data = line.split(',');
        return rowKey.reduce((acc ,key, i)=>{
            return { ...acc, [key]: data[i].replace(/"|\r/g, '')}
        }, {})
    })
}

const days = ['20210301', '20210302'];

(async ()=> {
    const members = await readFile('members.csv', ["wxId", "roomId", "alias", "wxName"]);
    const readContent = await readFile('29青职读经.csv', ["alias", ...days]);

    const userReads = readContent
        .slice(1)
        .map(row => {
            const alias = row.alias;
            const member = members.find(m => m.alias === alias || m.wxName === alias || m.wxId === alias);
            if (!member) {
                throw new Error(`${alias} not find`);
            }
            return days.reduce((acc, key)=>{
                return {...acc , [key]: row[key]==='已读'}
            }, {wxId: member.wxId})
        });
    
    const roomId = members[0].roomId;
    const dailys =  days.map(d => {
        const completeMember = userReads.filter(ur => ur[d]).map(ur => ur.wxId);
        return {
            roomId,
            day: +d,
            completeMember
        }
    })
    console.log(dailys);
    const instance = getClientInstance();
    await Promise.all(dailys.map(d => instance.putP({
        TableName: 'Daily',
        Item: d
    })))
    console.log('done');
})()

