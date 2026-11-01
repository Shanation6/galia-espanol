import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
let worker=await readFile('worker/index.js','utf8');
const admin=await readFile('worker/admin.html','utf8');
worker=worker.replace("'__ADMIN_HTML__'",JSON.stringify(admin));
await writeFile('dist/server/index.js',worker);
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Worker and protected admin built');
