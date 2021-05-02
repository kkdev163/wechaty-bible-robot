const Router = require('koa-router'); // 引入koa-router
const router = new Router(); // 创建路由，支持传递参数
import { postRoomSettings, postCancelBiblePlan, postCreateBiblePlan, postUpdateBiblePlanRemind, postUpdateChengXing } from './setting';
import { proxy1631SendMsg } from './proxy';
import { searchBible, searchSmdj} from './search';


const hello = (ctx) => {
    ctx.body = JSON.stringify({ a: 3 })
    return;
}

const helloPost = (ctx) => {
    console.log(ctx.request.body);
    ctx.body = JSON.stringify({ code: 200, body: ctx.request.body })
    return;
}



const getConfig = [
    ['/api/hello', hello],
    ['/api/search/bible', searchBible],
    ['/api/search/smdj', searchSmdj],
]

const postConfig = [
    ['/api/hello', helloPost],
    ['/api/roomSettings', postRoomSettings],
    ['/api/bible-plan/create', postCreateBiblePlan],
    ['/api/bible-plan/cancel', postCancelBiblePlan],
    ['/api/bible-plan/updateRemind', postUpdateBiblePlanRemind],
    ['/api/chengxing/update', postUpdateChengXing],
    ['/api/proxy/1631love/sendmsg', proxy1631SendMsg],
]

function processRoute(httpMethod = 'get', config) {
    config.forEach(([route, handler]) => {
        router[httpMethod](route, handler);
    })
}

processRoute('get', getConfig);
processRoute('post', postConfig);


export function initRouter(app) {
    app.use(router.routes());
}