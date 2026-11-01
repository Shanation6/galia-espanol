const SESSION_NAME='__Host-galia_session';
const SESSION_SECONDS=12*60*60;
const LOGIN_HTML=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Вход в кабинет · Galia</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4eee2;color:#30382d;font:14px/1.7 Arial,sans-serif;min-height:100svh;display:grid;place-items:center;padding:35px 20px}main{width:100%;max-width:420px}.brand{font:italic 62px/1 Georgia,serif;color:#a83f2b;text-decoration:none}.caption{font-size:10px;color:#696c60;margin:9px 0 38px;letter-spacing:1px}h1{font-size:30px;font-weight:400;line-height:1.2;letter-spacing:-1px;margin-bottom:12px}.intro{font-size:12px;color:#696c60;margin-bottom:30px}form{padding:28px;background:#fbf8f0;border:1px solid #d9d1c0;border-radius:4px;box-shadow:7px 8px 0 #ded6c24d}label{display:block;font-size:11px;margin-bottom:7px}input{font:14px Arial,sans-serif;width:100%;padding:14px 12px;background:#fbf8f0;border:1px solid #d9d1c0;border-radius:3px;margin-bottom:22px;color:#30382d}input:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid #777750;outline-offset:3px}button{width:100%;padding:14px 18px;min-height:49px;font:600 12px Arial,sans-serif;cursor:pointer;background:#a83f2b;border:0;border-radius:3px;color:#fbf8f0;display:flex;justify-content:space-between;align-items:center}button:hover{background:#873521}.error{font-size:12px;color:#873521;line-height:1.7;margin:0 0 20px}.back{display:block;color:#696c60;font-size:11px;margin-top:26px;text-decoration:none}.note{font-size:10px;color:#77796c;margin:20px 0 0;text-align:center}.ornament{font:italic 31px Georgia,serif;color:#a9a78c;margin:34px 0 0;text-align:right}@media(max-width:420px){form{padding:24px}.brand{font-size:54px}h1{font-size:28px}}</style></head><body><main><a class="brand" href="https://shanation6.github.io/galia-espanol/">galia.</a><p class="caption">КАБИНЕТ ПРЕПОДАВАТЕЛЯ</p><h1>С возвращением.</h1><p class="intro">Войдите, чтобы посмотреть заявки на занятия.</p><form action="/admin/login" method="post"><!--LOGIN_ERROR--><label for="username">Логин</label><input type="text" id="username" name="username" inputmode="email" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="200" required placeholder="Ваш логин"><label for="password">Пароль</label><input type="password" id="password" name="password" autocomplete="current-password" maxlength="256" required placeholder="Ваш пароль"><button type="submit">Войти в кабинет <span>↗</span></button></form><p class="note">Сессия действует 12 часов. На общем устройстве нажмите «Выйти».</p><a class="back" href="https://shanation6.github.io/galia-espanol/">← Вернуться на сайт</a><p class="ornament" lang="es">un nuevo comienzo ✳</p></main></body></html>`;
const AUTH_HEADERS={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"};
function hex(bytes){return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');}
function unhex(value){return new Uint8Array(value.match(/../g).map(v=>parseInt(v,16)));}
async function digest(value){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));}
function credentialConfig(env){const parts=String(env.ADMIN_PASSWORD_HASH||'').split('$');if(!env.ADMIN_LOGIN||parts[0]!=='pbkdf2-sha256'||parts[1]!=='100000'||!/^[a-f0-9]{32,128}$/.test(parts[2]||'')||parts[2].length%2||!/^[a-f0-9]{64}$/.test(parts[3]||''))return null;return {salt:unhex(parts[2]),hash:unhex(parts[3]),login:env.ADMIN_LOGIN.trim().toLowerCase()};}
export function loginPage(message='',status=200,extra={}){const error=message?'<p class="error" role="alert">'+message+'</p>':'';return new Response(LOGIN_HTML.replace('<!--LOGIN_ERROR-->',error),{status,headers:{...AUTH_HEADERS,...extra}});}
function cookieValue(request){return request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(SESSION_NAME+'='))?.slice(SESSION_NAME.length+1);}
function sessionCookie(token,maxAge=SESSION_SECONDS){return `${SESSION_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;}
export async function isOwner(request,env){
 const token=cookieValue(request);if(!/^[a-f0-9]{64}$/.test(token||'')||!credentialConfig(env))return false;
 const session=await env.DB.prepare('SELECT expires_at,credential_version FROM admin_sessions WHERE token_hash=?').bind(await digest(token)).first();
 return Boolean(session&&session.expires_at>Date.now()&&session.credential_version===await digest(env.ADMIN_LOGIN+'\n'+env.ADMIN_PASSWORD_HASH));
}
export async function authRoute(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path!=='/admin/login'&&path!=='/admin/logout')return null;
 if(path==='/admin/login'&&request.method==='GET'){if(await isOwner(request,env))return new Response(null,{status:303,headers:{Location:'/admin/','Cache-Control':'no-store'}});return loginPage();}
 if(request.method!=='POST')return loginPage('Используйте форму входа или кнопку выхода.',405,{'Allow':path==='/admin/login'?'GET, POST':'POST'});
 if(request.headers.get('Origin')!==url.origin)return loginPage('Запрос отклонён. Откройте кабинет и повторите действие.',403);
 if(path==='/admin/logout'){
  const token=cookieValue(request);if(/^[a-f0-9]{64}$/.test(token||''))await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await digest(token)).run();
  return new Response(null,{status:303,headers:{Location:'/admin/','Set-Cookie':sessionCookie('',0),'Cache-Control':'no-store'}});
 }
 const config=credentialConfig(env);if(!config)return loginPage('Вход временно недоступен. Обратитесь к администратору сайта.',503);
 if(!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded'))return loginPage('Используйте форму входа.',415);
 if(Number(request.headers.get('Content-Length')||0)>2048)return loginPage('Слишком большой запрос.',413);
 const raw=await request.text();if(raw.length>2048)return loginPage('Слишком большой запрос.',413);
 const ip=request.headers.get('CF-Connecting-IP')||'unknown',now=Date.now(),key='login:'+await digest(ip)+':'+Math.floor(now/900000);
 const rate=await env.DB.prepare('INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+1800000).first();
 if(rate.count>8)return loginPage('Слишком много попыток. Попробуйте через 15 минут.',429,{'Retry-After':'900'});
 const data=new URLSearchParams(raw),username=data.get('username')||'',password=data.get('password')||'';
 if(!username||username.length>200||!password||password.length>256)return loginPage('Неверный логин или пароль.',401);
 const keyMaterial=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:config.salt,iterations:100000},keyMaterial,256));
 let difference=0;for(let i=0;i<actual.length;i++)difference|=actual[i]^config.hash[i];
 if(difference!==0||username.trim().toLowerCase()!==config.login)return loginPage('Неверный логин или пароль.',401);
 const token=hex(crypto.getRandomValues(new Uint8Array(32))),old=cookieValue(request);
 if(/^[a-f0-9]{64}$/.test(old||''))await env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(await digest(old)).run();
 await env.DB.prepare('INSERT INTO admin_sessions(token_hash,credential_version,created_at,expires_at) VALUES (?,?,?,?)').bind(await digest(token),await digest(env.ADMIN_LOGIN+'\n'+env.ADMIN_PASSWORD_HASH),now,now+SESSION_SECONDS*1000).run();
 await env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now).run();
 await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();
 return new Response(null,{status:303,headers:{Location:'/admin/','Set-Cookie':sessionCookie(token),'Cache-Control':'no-store'}});
}
