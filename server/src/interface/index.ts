import { Contact } from "wechaty";
export * from '../ddb/schema';

export interface BookNameChapter {
    0: String,
    1: number
}

export interface BookIndexChapter {
    0: number,
    1: number
}
export interface RoomContact extends Contact {
   aliasInRoom: string
}