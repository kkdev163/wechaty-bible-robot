export enum Table {
    Daily = 'Daily',
    BiblePlan = 'BiblePlan',
    Member = 'Member',
    ChengXing = 'ChengXing',
    LinkPush = 'LinkPush',
    RoomConfig = 'RoomConfig',
}

export enum DailyType {
    Bible = 'Bible',
    LeeArticle = 'LeeArticle',
    ChengXing = 'ChengXing',
    Smdj = 'Smdj'
}

export const DailyTypeCNMap = {
    [DailyType.Bible]: '读经',
    [DailyType.LeeArticle]: '文集',
    [DailyType.ChengXing]: '晨兴',
    [DailyType.Smdj]: '生命读经'
}
export const C2DailyTypeMap = {
    '读经': DailyType.Bible,
    '文集': DailyType.LeeArticle,
    '晨兴': DailyType.ChengXing,
    '生命读经': DailyType.Smdj
}

export interface RoomConfig {
    roomId: string,
    topic: string,
    defaultDailyType?: DailyType, // 默认的打卡类型 
    uncommitRemindTypes?: DailyType[], // 开启未读提醒的推送类型
    uncommitRemindWhiteList?: string[], // 提醒白名单
    commitCheckTypes?: DailyType[], // 开启打卡去重的类型
}

export interface Daily {
    roomId: string,
    day: number,
    completeMember: string[],
    totalMemberCount?: number,
    type: DailyType
}

export interface BiblePlan {
    roomId: string,
    roomName: string,
    schedule: FixNumberPlanDTO | FixTimePlanDTO,
    remindHour: number[],
    disableStats?: boolean // 仅推送，不打卡
}

export interface Member {
    roomId: string,
    wxId: string,
    wxName: string,
    alias: string
}

export interface ChengXing {
    id: string,
    schedule: CxPlanDTO,
    remindHour: number[]
}

export interface LinkPush {
    receiverId: string,
    receiverType: ReceiverType,
    LinkType: LinkType,
    remindHour: number[],
    schedule?: LinkSchedule,
    disableStats?: boolean // 仅推送，不打卡
}

export type LinkSchedule = SmdjPlanDTO

export enum LinkType {
    LeeArticle = 'LeeArticle',
    Smdj = 'Smdj'
}

export const LinkType2DailyType = {
    [LinkType.LeeArticle]: DailyType.LeeArticle,
    [LinkType.Smdj]: DailyType.Smdj
}

export enum ReceiverType {
    Room = 'room',
    Contact = 'contact'
}

export interface CxPlanDTO {
    startDay: number,
    startBookChapter: string
}

export interface SmdjDaily {
    chpaterId: string,
    bookName: string,
    chapter: string,
    chapterNum: number,
    chapterTitle: string,
    part: number
}

export interface SmdjPlanDTO {
    startDay: number,
    daily: SmdjDaily[],
    createText: string
}

export interface FixNumberPlanDTO {
    startBook: [string, number],
    startDay: number,
    chapterOneDay: number
}

export interface FixTimePlanDTO {
    startBook: [string, number],
    endBook: [string, number],
    startDay: number,
    endDay: number
}