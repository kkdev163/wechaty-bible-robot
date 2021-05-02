import { Wechaty, Room, Contact } from "wechaty";
import { getBiblePlans, getLinkPushModels, getMemberModels, getRoomConfigModels } from "../ddb";
import { DailyType, LinkType2DailyType, RoomContact } from "../interface";
import { getTodayNumber } from ".";
import { isValidDay } from "../actions";

export async function getSearchRoomModel(room: Room | Contact, text): Promise<Room|null>{
    const matchId = /roomId=([^\s]+)/.exec(text);
    const matchName = /roomName=\[([^\]]+)]/.exec(text);

    let roomModel;
    if (room instanceof Room) {
        roomModel = room;
    } else if (matchId && matchId[1]) {
        roomModel = getWxRoomById(matchId[1])
    } else if (matchName && matchName[1]) {
        roomModel = getWxRoomByName(matchName[1]);
    }
    return roomModel
}

// 仅开启了推送的群
export async function getStartPlanRoom(): Promise<{ room: Room, pushTypes: DailyType[] }[]> {
    const bot = Wechaty.instance();
    const rooms = await bot.Room.findAll();

    const roomPlans = await getBiblePlans();
    const linkPushModels = await getLinkPushModels()

    return rooms
        .map(r => {
            const pushTypes = [];
            const roomPlan = roomPlans.find(rP => rP.roomId === r.id)
            if (roomPlan && isValidDay(roomPlan.schedule, getTodayNumber())) {
                pushTypes.push(DailyType.Bible);
            }
            const linkPush = linkPushModels.filter(({ receiverId }) => receiverId === r.id);
            pushTypes.push(...linkPush.map(l => LinkType2DailyType[l.LinkType]));

            return {
                room: r,
                pushTypes
            }
        })
        .filter(({ pushTypes }) => pushTypes.length > 0)
}

export async function getAdminModel() {
    const contacts = await Wechaty.instance().Contact.findAll();
    const admin = contacts.find(c => c.name() === process.env.ADMIN_NAME);
    return admin;
}

export async function wxId2RoomAlias(roomId, completeMember: string[]) {
    const roomMember = await getMemberModels({ roomId });
    return completeMember.map(id => {
        return roomMember.find(m => m.wxId === id) || { alias: id, wxName: id }
    }).map(m => m.alias || m.wxName)
}

export async function wxMemberWithAlias(roomModel: Room): Promise<RoomContact[]>{
    const members = await roomModel.memberAll();
    return  Promise.all(members.map(async m => {
        const aliasInRoom = await roomModel.alias(m);

        (m as RoomContact).aliasInRoom = aliasInRoom;
        return m as RoomContact;
    }))
}

export async function getWxRoomById(roomId: string): Promise<Room|null> {
    const rooms = await Wechaty.instance().Room.findAll();
    return rooms.find(r => r.id === roomId);
}

export async function getWxRoomByName(roomName: string): Promise<Room | null> {
    const roomConfigs = await getRoomConfigModels({ topic: roomName })
    if (roomConfigs.length === 1) {
        return getWxRoomById(roomConfigs[0].roomId);
    }
    return null;
}