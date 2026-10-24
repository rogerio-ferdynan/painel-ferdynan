import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const out=path.resolve(root,'dist');
if(path.dirname(out)!==root||path.basename(out)!=='dist')throw Error('Invalid build path');
// dist is generated output; editable sources are retained in web/ and worker/.
rmSync(out,{recursive:true,force:true});mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
const assets={};for(const file of ['index.html','upgrade.css','upgrade.js','finance-2026.js','cloud-sync.js'])assets['/'+file]=readFileSync('web/'+file,'utf8');
const source=readFileSync('worker/index.mjs','utf8');
writeFileSync('dist/server/index.js','const ASSETS='+JSON.stringify(assets)+';\n'+source);
writeFileSync('dist/.openai/hosting.json',readFileSync('.openai/hosting.json'));
console.log('Worker construído com páginas protegidas e banco D1.');
