import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const out=path.resolve(root,'dist');
if(path.dirname(out)!==root||path.basename(out)!=='dist')throw Error('Invalid build path');
// dist is generated output; editable sources are retained in web/ and worker/.
rmSync(out,{recursive:true,force:true});mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
const assets={};for(const file of ['index.html','upgrade.css','upgrade.js','finance-2026.js','cloud-sync.js','calendar.js','calendar.css','agenda.js','agenda-model.mjs','tour.js','tour.css','tour-model.mjs','bandsintown.html','catalog.js','catalog.css'])assets['/'+file]=readFileSync('web/'+file,'utf8');
const agenda=readFileSync('web/agenda-model.mjs','utf8').replaceAll('export function ','function ');
const tour=readFileSync('web/tour-model.mjs','utf8').replaceAll('export function ','function ').replaceAll('export const ','const ');
const calendar=readFileSync('worker/calendar.mjs','utf8').replaceAll('export function ','function ').replaceAll('export async function ','async function ');
const catalog=readFileSync('worker/catalog.mjs','utf8').replaceAll('export function ','function ').replaceAll('export async function ','async function ');
const source=readFileSync('worker/index.mjs','utf8').replace("import {calendarRequest} from './calendar.mjs';",'').replace("import {catalogRequest} from './catalog.mjs';",'').replace("import {validAgenda} from '../web/agenda-model.mjs';",'').replace("import {validMarketing} from '../web/tour-model.mjs';",'');
writeFileSync('dist/server/index.js','const ASSETS='+JSON.stringify(assets)+';\n'+agenda+'\n'+tour+'\n'+calendar+'\n'+catalog+'\n'+source);
writeFileSync('dist/.openai/hosting.json',readFileSync('.openai/hosting.json'));
console.log('Worker construído com páginas protegidas e banco D1.');
