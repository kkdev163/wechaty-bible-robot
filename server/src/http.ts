import Koa from 'koa';
import { initRouter } from './controller/index';
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');
var cors = require('koa2-cors');
const path = require('path');


export function startServer() {
  const app = new Koa();
  app.use(serve(path.join(__dirname, '../public')))
  app.use(cors())
  app.use(bodyParser())
  // x-response-time

  app.use(async (ctx, next) => {
    console.log(ctx.request.path, ' request in');
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(ctx.request.path, ` cost ${ms}ms`);
  });
  initRouter(app)

  const port = process.env.SERVER_PORT || 3000;

  function listen(port) {
    app.listen(port, (err) => {
      if (err && err.message.includes('address already in use')) {
        return listen(port + 1);
      }
      console.log(`server start at ${port}`)
    })
  }
  listen(port);

}