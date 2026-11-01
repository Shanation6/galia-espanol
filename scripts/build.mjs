import {cp,mkdir,rm} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true});
await rm('dist/admin/panel.html',{force:true});
await cp('public','docs',{recursive:true});
console.log('Static website built in dist/ and docs/ for GitHub Pages');
