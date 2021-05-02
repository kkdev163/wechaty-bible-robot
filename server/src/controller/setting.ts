import { getRoomSettings, cancelBiblePlan, createBiblePlan, updateBiblePlanRemind, updateChengXing } from '../service/setting';
import { res, valid } from './utils';

export async function postRoomSettings(ctx) {
    const roomId = ctx.request.body.roomId;
    if (!roomId) {
        return res(ctx, null, 400, '参数错误')
    }
    const result = await getRoomSettings(roomId);
    res(ctx, result);
}

export async function postCreateBiblePlan(ctx) {
    const params = ctx.request.body;
    // todo add JSON Schema
    valid(ctx, params, ['roomId', 'roomName', 'schedule', 'remindHour'])
    const result = await createBiblePlan(params);
    res(ctx, result);
}

export async function postCancelBiblePlan(ctx) {
    const roomId = ctx.request.body.roomId;
    if (!roomId) {
        return res(ctx, null, 400, '参数错误')
    }
    const result = await cancelBiblePlan(roomId);
    res(ctx, result);
}

export async function postUpdateBiblePlanRemind(ctx) {
    const params = ctx.request.body;
    // todo add JSON Schema
    valid(ctx, params, ['roomId', 'remindHour'])
    const result = await updateBiblePlanRemind(params);
    res(ctx, result);
}

export async function postUpdateChengXing(ctx) {
    const params = ctx.request.body;
    // todo add JSON Schema
    valid(ctx, params, ['id', 'schedule', 'remindHour'])
    const result = await updateChengXing(params);
    res(ctx, result);
}