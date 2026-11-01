import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {pbkdf2Sync} from 'node:crypto';
export const SERVICE='https://galia-espanol-studio.micsonwilktaywilsamu.chatgpt.site';
export const TEST_PASSWORD='fixture-only-strong-password-28';
export function database(){const db=new DatabaseSync(':memory:');const dir=new URL('../service/drizzle/',import.meta.url);for(const name of readdirSync(dir).filter(n=>n.endsWith('.sql')).sort())db.exec(readFileSync(new URL(name,dir),'utf8'));return {prepare(sql){const statement=db.prepare(sql);let args=[];const prepared={bind(...values){args=values;return prepared;},first:async()=>statement.get(...args),run:async()=>({meta:{changes:statement.run(...args).changes}}),all:async()=>({results:statement.all(...args)})};return prepared;}};}
export function authEnv(){const salt='a'.repeat(32),hash=pbkdf2Sync(TEST_PASSWORD,Buffer.from(salt,'hex'),100000,32,'sha256').toString('hex');return {DB:database(),ADMIN_LOGIN:'owner@example.com',ADMIN_PASSWORD_HASH:`pbkdf2-sha256$100000$${salt}$${hash}`};}
export function loginRequest(username='owner@example.com',password=TEST_PASSWORD,origin=SERVICE){return new Request(SERVICE+'/admin/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded','CF-Connecting-IP':'192.0.2.1'},body:new URLSearchParams({username,password})});}
export async function signIn(worker,env){const r=await worker.fetch(loginRequest(),env);if(r.status!==303)throw Error('Fixture login failed: '+r.status);return r.headers.get('Set-Cookie').split(';')[0];}
export function authenticated(path,cookie,method='GET',body){return new Request(SERVICE+path,{method,headers:{Origin:SERVICE,Cookie:cookie,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});}
