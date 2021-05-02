import * as dotenv from "dotenv";
import { Wechaty } from 'wechaty'
import { handleMessage, setActionReceiver, bindEvents } from './src/handleMessage';
import { initSchedule } from './src/schedule';
import { startServer } from './src/http';
import { syncRoomInfo } from "./src/ddb";


dotenv.config();

function onLogin(user) {
  setActionReceiver(user);
  initSchedule();
  syncRoomInfo();
  bindEvents();
  startServer();
}
Wechaty.instance() // Global Instance
  .on('scan', (qrcode, status) => console.log(`Scan QR Code to login: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`))
  .on('login', onLogin)
  .on('message', handleMessage)
  .start()

