import { getLeeArticle } from '../bible/shareRes';
import { getLinkPushModelById, createLinkPushModel, updateLinkPushModel } from '../ddb';
import { LinkType, ReceiverType } from '../interface'
import { Room, Contact } from 'wechaty';
import { Actions, Action_Receiver } from '../constants';

export async function sayLeeArticle(room) {
    const link = await getLeeArticle();
    return room.say(link)
}

export async function configLeePush(room: Room | Contact, text) {
    let receiverType = room instanceof Room ? ReceiverType.Room : ReceiverType.Contact

    const match = /(-?)(\d+)\s*(\d*)/.exec(text);
    let remindHour = [6];
    if (match) {
        const close = match[1] === '-';
        const userInput = +match[2];
        
        if (close) {
            remindHour = [];
        } else if (userInput < 24) {
            remindHour = [userInput]
            const secondInput = match[3];
            if (secondInput && +secondInput < 24) {
                remindHour.push(+secondInput)
            }
        }
    }
    const newModel = {
        receiverId: room.id,
        receiverType,
        LinkType: LinkType.LeeArticle,
        remindHour
    }
    const push = await getLinkPushModelById(room.id, { LinkType: LinkType.LeeArticle });
    if (!push) {
        await createLinkPushModel(newModel)
    } else {
        await updateLinkPushModel(newModel)
    }
    if (remindHour.length > 0) {
        await room.say(`${Actions.LeeArticle_PUSH}成功, ${Action_Receiver} 将在每天${remindHour[0]}点整推送当日追求文集。今日文集为:`)
        return sayLeeArticle(room);
    } else {
        return room.say(`关闭文集推送成功, 如需开启请使用 「${Actions.LeeArticle_PUSH} 6」指令`)
    }
}