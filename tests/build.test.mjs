import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('packaged Worker is valid JavaScript and serves the actual login form',async()=>{const cwd=fileURLToPath(new URL('../service/',import.meta.url));execFileSync(process.execPath,['build.mjs'],{cwd});execFileSync(process.execPath,['--check','dist/server/index.js'],{cwd,stdio:'pipe'});const {default:worker}=await import('../service/dist/server/index.js');const response=await worker.fetch(new Request('https://example.test/admin/'),{});assert.equal(response.status,200);assert.match(await response.text(),/type="password"/);});
