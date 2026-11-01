const SERVICE='https://galia-espanol-studio.micsonwilktaywilsamu.chatgpt.site';
const ADMIN_HTML='__ADMIN_HTML__';
const STATUSES=['new','contacted','scheduled','enrolled','archived'];
const GOALS=['start','travel','speak','sound'];
const LEVELS=['zero','beginner','continue','unsure'];
export function allowedOrigin(origin){return origin==='https://shanation6.github.io'||origin===SERVICE||/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin||'');}
export function validStatus(value){return STATUSES.includes(value);}
export function isOwner(request,env){return Boolean(env.ADMIN_EMAIL&&request.headers.get('oai-authenticated-user-id')&&request.headers.get('oai-authenticated-user-email')?.toLowerCase()===env.ADMIN_EMAIL.toLowerCase());}
function textField(value,max,required=false){if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw new Error('Проверьте заполненные поля.');return value.trim();}
export function validateLead(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Некорректная заявка.');
 const name=textField(value.name,80,true),contact=textField(value.contact,160,true);
 if(name.length<2)throw new Error('Укажите имя: минимум 2 символа.');
 if(!(/^@[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(contact)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)||/^\+?[\d\s()\-]{10,22}$/.test(contact)&&contact.replace(/\D/g,'').length>=10))throw new Error('Укажите Telegram @username, email или телефон.');
 if(value.consent!==true)throw new Error('Нужно согласие на обработку данных для ответа на заявку.');
 if(!GOALS.includes(value.goal)||!LEVELS.includes(value.level))throw new Error('Выберите цель и уровень.');
 if(!/^[a-f0-9-]{36}$/i.test(value.requestId||''))throw new Error('Обновите страницу и повторите отправку.');
 return {name,contact,goal:value.goal,level:value.level,note:textField(value.note??'',600),source:textField(value.source??'',300),requestId:value.requestId};
}
function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});}
function cors(request){const o=request.headers.get('Origin');return allowedOrigin(o)?{'Access-Control-Allow-Origin':o,'Vary':'Origin'}:{};}
const safeHeaders={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"};
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname,headers=cors(request);
 try{
  if(request.method==='OPTIONS')return new Response(null,{status:allowedOrigin(request.headers.get('Origin'))?204:403,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
  if(path==='/api/health')return json({ok:true});
  if(path==='/api/leads'&&request.method==='POST'){
   if(!allowedOrigin(request.headers.get('Origin')))return json({error:'Источник запроса не разрешён.'},403);
   if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Нужен JSON.'},415,headers);
   if(Number(request.headers.get('Content-Length')||0)>6000)return json({error:'Слишком большая заявка.'},413,headers);
   const raw=await request.text();if(raw.length>6000)return json({error:'Слишком большая заявка.'},413,headers);
   let input;try{input=JSON.parse(raw);}catch{return json({error:'Некорректные данные.'},400,headers);}
   if(input?.website)return json({error:'Не удалось отправить заявку.'},400,headers);
   let lead;try{lead=validateLead(input);}catch(e){return json({error:e.message},400,headers);}
   const existing=await env.DB.prepare('SELECT id,name,contact,goal,level,note,source FROM leads WHERE request_id = ?').bind(lead.requestId).first();
   if(existing){if(['name','contact','goal','level','note','source'].some(key=>existing[key]!==lead[key]))return json({error:'Данные заявки изменились. Повторите отправку с новым номером запроса.'},409,headers);return json({id:existing.id,accepted:true},200,headers);}
   const ip=request.headers.get('CF-Connecting-IP')||'unknown';
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
   const key=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')+':'+Math.floor(Date.now()/3600000);
   const now=Date.now();
   const rate=await env.DB.prepare('INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+7200000).first();
   if(rate.count>8)return json({error:'Слишком много попыток. Попробуйте позже или напишите в Telegram.'},429,{...headers,'Retry-After':'3600'});
   const id=crypto.randomUUID(),time=new Date().toISOString();
   await env.DB.prepare('INSERT INTO leads(id,request_id,name,contact,goal,level,note,source,consent_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(request_id) DO NOTHING').bind(id,lead.requestId,lead.name,lead.contact,lead.goal,lead.level,lead.note,lead.source,time,time,time).run();
   const saved=await env.DB.prepare('SELECT id FROM leads WHERE request_id = ?').bind(lead.requestId).first();
   await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();
   return json({id:saved.id,accepted:true},201,headers);
  }
  if(path.startsWith('/api/leads')){
   if(!isOwner(request,env))return json({error:'Войдите в аккаунт владельца.'},request.headers.get('oai-authenticated-user-id')?403:401);
   if(path==='/api/leads'&&request.method==='GET'){
    const {results}=await env.DB.prepare('SELECT id,name,contact,goal,level,note,source,status,admin_note,created_at,updated_at FROM leads ORDER BY created_at DESC LIMIT 1000').all();return json({leads:results});
   }
   if(/^\/api\/leads\/[a-f0-9-]{36}$/i.test(path)&&request.method==='DELETE'){
    if(request.headers.get('Origin')!==url.origin)return json({error:'Недопустимый источник.'},403);
    const result=await env.DB.prepare('DELETE FROM leads WHERE id=?').bind(path.split('/').pop()).run();
    return result.meta.changes?json({ok:true}):json({error:'Заявка не найдена.'},404);
   }
   if(/^\/api\/leads\/[a-f0-9-]{36}$/i.test(path)&&request.method==='PATCH'){
    if(request.headers.get('Origin')!==url.origin)return json({error:'Недопустимый источник.'},403);
    const data=await request.json();if(!validStatus(data.status)||typeof data.adminNote!=='string'||data.adminNote.length>2000)return json({error:'Проверьте статус и заметку.'},400);
    const result=await env.DB.prepare('UPDATE leads SET status=?,admin_note=?,updated_at=? WHERE id=?').bind(data.status,data.adminNote,new Date().toISOString(),path.split('/').pop()).run();
    return result.meta.changes?json({ok:true}):json({error:'Заявка не найдена.'},404);
   }
   return json({error:'Не найдено.'},404);
  }
  if(path==='/admin'||path==='/admin/'){
   if(!request.headers.get('oai-authenticated-user-id'))return Response.redirect(url.origin+'/signin-with-chatgpt?return_to=%2Fadmin%2F',302);
   if(!isOwner(request,env))return new Response('<html lang="ru"><meta charset="utf-8"><h1>Нет доступа</h1><p>Кабинет доступен только владельцу сайта.</p><a href="/signout-with-chatgpt?return_to=%2Fadmin%2F">Сменить аккаунт</a></html>',{status:403,headers:safeHeaders});
   return new Response(ADMIN_HTML,{headers:safeHeaders});
  }
  return Response.redirect('https://shanation6.github.io/galia-espanol/',302);
 }catch(error){console.error('Request failed',error?.name);return json({error:'Сервис временно недоступен. Попробуйте ещё раз или напишите в Telegram.'},503,headers);}
}};
