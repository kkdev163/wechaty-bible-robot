import { res } from './utils';
import { getAdminModel } from '../util';

export async function proxy1631SendMsg(ctx) {
  const { phone, msgCode } = ctx.request.body;
  const admin = await getAdminModel();
  if (admin) {
    await admin.say(`phone: ${phone}, msg: ${msgCode}`)
  }
  res(ctx, 'ok');
}