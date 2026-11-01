import http from 'node:http';
import worker from '../service/dist/server/index.js';
import {authEnv} from '../tests/fixtures.mjs';
const env=authEnv();
http.createServer(async(req,res)=>{try{const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);const response=await worker.fetch(new Request('http://127.0.0.1:4184'+req.url,{method:req.method,headers:req.headers,...(body.length?{body}:{})}),env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500).end('Preview error');}}).listen(4184,'127.0.0.1',()=>console.log('Auth preview http://127.0.0.1:4184 (test credentials only)'));
