import { Room, Contact } from "wechaty";
import { DailyType, Member, DailyTypeCNMap } from "../interface";
import { getDailyModels, getRoomConfigById, updateRoomConfig } from "../ddb";
import { getSearchRoomModel, getTodayNumber, wxId2RoomAlias, wxMemberWithAlias } from "../util";
import { difference } from 'lodash';


export async function remindSmdjUnCommit(receiver, text) {
    return remindEveryPerson(receiver, DailyType.Smdj, text);
}

export async function remindEveryPerson(receiver: Room| Contact, type: DailyType,  text?: string) {
    const roomModel = await getSearchRoomModel(receiver, text)
    if (!roomModel) {
        return receiver.say('仅群聊支持未打卡提醒')
    }

    const roomConfig = await getRoomConfigById(roomModel.id);
    const uncommitRemindTypes = roomConfig && roomConfig.uncommitRemindTypes;
    const uncommitRemindWhiteList = roomConfig && roomConfig.uncommitRemindWhiteList || [];

    if (!uncommitRemindTypes || !uncommitRemindTypes.includes(type)) {
        if (receiver instanceof Contact){
            await receiver.say('该群聊未开启打卡提醒功能')
        }
        return;
    }

    // 可以通过修改此处的条件，来缩减 被提醒的用户范围。
    const dailys = await getDailyModels({ roomId: roomModel.id, type });
    // 从第一天引入机器人开始，有群打卡的人，都有可能被提醒
    const commitUserIds = dailys.reduce((acc, daily)=>{
        return acc.concat(difference(daily.completeMember, acc))
    }, [])

    // 现存的群用户
    const contacts = await roomModel.memberAll();

    const todayDaily = dailys.find(daily=> daily.day === getTodayNumber() && daily.type === type);
    const completeMember = (todayDaily && todayDaily.completeMember) || [];

    const todayUnCommitIds = difference(commitUserIds, completeMember);
    const validUnCommitIds = todayUnCommitIds
        .filter(id => contacts.findIndex(c => c.id ===id) !== -1) // 已退群的就不再 @了
        .filter(id => !uncommitRemindWhiteList.includes(id)) // 已经加入白名单的就不再 @了
    
    const todayUnCommitNames = await wxId2RoomAlias(roomModel.id, validUnCommitIds);
    
    if (todayUnCommitNames.length) {
        await receiver.say(`弟兄姊妹们 不要忘记每日 ${DailyTypeCNMap[type]} 追求哦! \n\n ${todayUnCommitNames.map(name => `@${name}`).join(' ')}`)
    } else if (receiver instanceof Contact) {
        await receiver.say(`今日 ${completeMember.length} / ${contacts.length} 已全部打卡`)
    }
}

export async function addWhiteList(receiver: Room | Contact, text: string, talker: Contact) {
    const roomModel = await getSearchRoomModel(receiver, text)

    if (!roomModel) {
        return receiver.say('仅群聊支持打卡白名单')
    }
    const roomConfig = await getRoomConfigById(roomModel.id);
    const uncommitRemindWhiteList = roomConfig && roomConfig.uncommitRemindWhiteList || [];

    const matchUser = /成员=([^\s]+)/.exec(text);
    if (!matchUser && receiver instanceof Contact) {
        return receiver.say('打卡需要指定用户名, 请输入 成员=xxx');
    }
    const targetUser = matchUser && matchUser[1].trim() || talker.name().trim();
    const memberWithRoomAlias = await wxMemberWithAlias(roomModel);

    const user = memberWithRoomAlias.find(m => (m.aliasInRoom && m.aliasInRoom.trim()) === targetUser || m.name().trim() === targetUser);
    if (!user) {
        return receiver.say('请确认该用户是否在聊天室内')
    }

    uncommitRemindWhiteList.push(user.id);
    await updateRoomConfig({ uncommitRemindWhiteList}, roomModel.id);
    const users = await wxId2RoomAlias(roomModel.id, uncommitRemindWhiteList);
    receiver.say(`设置成功，当前群白名单为: ${users.join('、')}`)
}
