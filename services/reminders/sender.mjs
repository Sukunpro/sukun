// Node 24+, behind HTTPS. Keep the SQLite file outside all public paths.
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import webpush from 'web-push';

const { APP_ORIGIN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CONTACT, DATABASE_PATH } = process.env;
if (!APP_ORIGIN || !DATABASE_PATH) throw Error('APP_ORIGIN and DATABASE_PATH are required');
webpush.setVapidDetails(VAPID_CONTACT,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY);
const db = new DatabaseSync(DATABASE_PATH);
db.exec('CREATE TABLE IF NOT EXISTS reminders (endpoint TEXT PRIMARY KEY, owner TEXT NOT NULL, zone TEXT NOT NULL, lastDay TEXT)');
const allowedHosts = new Set(['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com']);
function validEndpoint(value) {
  const u = new URL(value);
  return u.protocol==='https:' && !u.port && !u.username && !u.password && !u.hash && allowedHosts.has(u.hostname);
}
const server = http.createServer(async (req,res) => {
  const end = code => {res.writeHead(code);res.end()};
  if (req.headers.origin !== APP_ORIGIN || req.url !== '/subscriptions') return end(403);
  res.setHeader('Access-Control-Allow-Origin',APP_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods','PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  if (req.method==='OPTIONS') return end(204);
  if (!['PUT','DELETE'].includes(req.method)) return end(405);
  const bearer = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
  if (!bearer) return end(401);
  const owner = createHash('sha256').update(bearer[1]).digest('hex');
  try {
    let body='';
    for await (const chunk of req) {body+=chunk;if(body.length>4096)return end(413)}
    const { endpoint,zone } = JSON.parse(body);
    if (!validEndpoint(endpoint)) return end(400);
    if (req.method==='DELETE') db.prepare('DELETE FROM reminders WHERE endpoint=? AND owner=?').run(endpoint,owner);
    else {
      new Intl.DateTimeFormat('en',{timeZone:zone}).format();
      const result=db.prepare('INSERT INTO reminders(endpoint,owner,zone) VALUES(?,?,?) ON CONFLICT(endpoint) DO UPDATE SET zone=excluded.zone WHERE owner=excluded.owner').run(endpoint,owner,zone);
      if (!result.changes) return end(409);
    }
    end(204);
  } catch {end(400)}
});
let busy=false;
async function tick() {
  if (busy) return;
  busy=true;
  try {
    for (const row of db.prepare('SELECT * FROM reminders').all()) {
      const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:row.zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts().map(p=>[p.type,p.value]));
      const day=[parts.year,parts.month,parts.day].join('-');
      if(parts.hour!=='09' || row.lastDay===day)continue;
      if(!db.prepare('UPDATE reminders SET lastDay=? WHERE endpoint=? AND lastDay IS NOT ?').run(day,row.endpoint,day).changes)continue;
      try {await webpush.sendNotification({endpoint:row.endpoint},null,{TTL:1800,topic:'sukun-daily',timeout:10000})}
      catch (error) {if ([404,410].includes(error.statusCode)) db.prepare('DELETE FROM reminders WHERE endpoint=?').run(row.endpoint)}
    }
  } finally {busy=false}
}
server.listen(Number(process.env.PORT || 8080),'127.0.0.1');
setInterval(()=>tick().catch(()=>console.error('Reminder scheduler failed')),60000);
