export function res(ctx, result, errCode?, errMsg?) {
  if (errCode) {
    ctx.body = JSON.stringify({ code: errCode, message: errMsg })
  } else {
    ctx.body = JSON.stringify({ code: 200, data: result })
  }
}

export function valid(ctx, body, keys = []) {
  const inValid = keys.some(key => !(key in body))
  if (inValid) {
    ctx.body = JSON.stringify({ code: 400, message: '参数错误' })
  }
  return true;
}