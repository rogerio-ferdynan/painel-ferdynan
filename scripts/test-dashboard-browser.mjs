import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
const {chromium}=await import(pathToFileURL(join(process.env.OMNI_TOOLS,'node_modules/playwright/index.mjs')).href);
const server=spawn(process.execPath,['scripts/preview.mjs'],{stdio:'inherit'});
const url='http://localhost:4317';
let browser;
try{
 for(let i=0;i<60;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport});
  try{
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   // Keep isolated tests independent of third-party widgets.
   await page.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());
   await page.goto(url);
   await page.locator('#password').fill('preview-only');
   await page.locator('button[type=submit]').click();
   await page.locator('#tour-daily-title').waitFor();
   const now=Date.now();
   const event={id:'browser-fixture',title:'Evento fictício de teste',status:'confirmed',start:new Date(now+3600000).toISOString(),end:new Date(now+7200000).toISOString(),client:'',location:'',notes:'',fee:10000,cost:0,received:0};
   const state={stats:{shows:0,faturamento:'R$ 0',propostas:0},inbox:{aProcessar:[],alta:[{id:'fixture-task',text:'Tarefa fictícia urgente',done:false}],media:[],delegar:[]},agenda:[event]};
   const response=await page.evaluate(async payload=>{const before=await (await fetch('/api/state')).json();return (await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:before.revision,payload})})).status;},{state,fields:{},pricing2026:{}});
   assert.equal(response,200);
   await page.reload();
   const daily=page.locator('#tour-daily-list');
   await daily.getByText('Tarefa fictícia urgente',{exact:true}).waitFor();
   await daily.getByRole('heading',{name:/Confirmados sem cliente ou local/}).waitFor();
   const group=daily.locator('.tour-daily-group').filter({has:page.getByRole('heading',{name:/Confirmados sem cliente ou local/})});
   await group.getByRole('button',{name:/Abrir agenda/}).click();
   await page.locator('#agenda-events').getByText(event.title,{exact:true}).waitFor();
   await page.locator('#agenda-events').getByRole('button',{name:'Editar / pagamentos'}).click();
   await page.locator('#agenda-client').fill('Cliente fictício');
   await page.locator('#agenda-location').fill('Local fictício');
   await page.locator('#agenda-submit').click();
   await page.waitForFunction(()=>document.querySelector('#agenda-message')?.textContent.includes('salvo na nuvem'));
   await page.locator('#tab-all').click();
   await page.locator('#tour-daily-title').waitFor();
   assert.equal(await daily.getByRole('heading',{name:/Confirmados sem cliente ou local/}).count(),0);
   assert.ok(await page.locator('#tour-daily-title').isVisible());
   assert.deepEqual(errors,[]);
   console.log('Chromium dashboard flow passed at '+viewport.width+'x'+viewport.height);
  }finally{await context.close();}
 }
}finally{if(browser)await browser.close();server.kill();}
