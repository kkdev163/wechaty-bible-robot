import { Wechaty, Room, Contact } from 'wechaty';
import { syncDbRoomMember, syncDailyMemberCount, createRoomConfig, updateRoomConfig } from '.';
import {  getStartPlanRoom } from '../util';
import { getRoomConfigById, getRoomConfigModels } from './commands/queryCommands';
import { difference } from 'lodash';

// 全量更新成员信息
export async function syncRoomInfo() {
    // 仅开启了读经计划的群，进行群成员同步，以控制 Member 表大小
    let needSyncRoom = await getStartPlanRoom()

    await Promise.all(needSyncRoom.map(async ({room}) => {
        const contacts = await room.memberAll();
        await syncDailyMemberCount(room.id, contacts.length);
        await Promise.all(contacts.map(c => syncRoomMember(room, c)));
    }));

    const bot = Wechaty.instance();
    const wxRooms = await bot.Room.findAll();
    const roomConfigs = await getRoomConfigModels();
    const needCreate = difference(wxRooms.map(({id}) => id), roomConfigs.map(({roomId})=>roomId));

    
    await Promise.all(needCreate.map(async id => {
        const wxRoom = wxRooms.find(wx => wx.id === id);
        const topic = await wxRoom.topic()
        return createRoomConfig({
            roomId: wxRoom.id,
            topic: topic
        })
    }));

    await Promise.all(roomConfigs.map(async ({roomId}) => {
        const wxRoom = wxRooms.find(wx => wx.id === roomId);
        if (!wxRoom) { return }
        const topic = await wxRoom.topic()
        return updateRoomConfig({
            topic,
        }, roomId)
    }))
}

// 更新某个成员信息
export async function syncRoomMember(room: Room, contact: Contact) {
    const alias = await room.alias(contact);

    const commonParams = {
        roomId: room.id,
        wxId: contact.id
    }
    await syncDbRoomMember({ ...commonParams, alias, wxName: contact.name() });
}

