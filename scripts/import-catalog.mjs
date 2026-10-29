import readline from 'node:readline';
import {readFileSync} from 'node:fs';
import {validCatalogNode,validCatalogLink} from '../worker/catalog.mjs';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
const rl=readline.createInterface({input:process.stdin,terminal:false});
console.log('Ready for private catalog import JSON on stdin (input hidden).');
for await(const line of rl){try{
const {origin,password,file}=JSON.parse(line),url=new URL(origin);if(!['https:','http:'].includes(url.protocol)||url.pathname!=='/')throw Error('Invalid origin');
const input=JSON.parse(readFileSync(file,'utf8'));if(input.version!==1||!input.nodes.every(validCatalogNode)||!input.links.every(validCatalogLink))throw Error('Invalid catalog');
const login=await fetch(origin+'/api/login',{method:'POST',redirect:'manual',headers:{Origin:origin},body:new URLSearchParams({password})});if(login.status!==303)throw Error('Login failed ('+login.status+')');const cookie=login.headers.get('set-cookie').split(';')[0];
async function request(body){for(let attempt=0;attempt<3;attempt++){try{const r=await fetch(origin+'/api/catalog',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({...body,snapshot:input.snapshot}),signal:AbortSignal.timeout(60000)});const data=await r.json();if(!r.ok){if(r.status>=500&&attempt<2)continue;throw Error('Import failed: '+(data.error||r.status));}return data;}catch(e){if(attempt===2)throw e;}}}
const currentResponse=await fetch(origin+'/api/catalog?action=meta',{headers:{Cookie:cookie}});if(!currentResponse.ok)throw Error('Catalog endpoint not ready ('+currentResponse.status+')');const current=await currentResponse.json();
if(current.snapshot===input.snapshot){console.log(JSON.stringify({alreadyImported:true,summary:{nodes:current.summary.nodes,links:current.summary.links}}));break;}
await request({action:'begin',summary:input.summary});
let completed=0;const batches=[];for(let i=0;i<input.nodes.length;i+=200)batches.push({nodes:input.nodes.slice(i,i+200),links:[]});for(let i=0;i<input.links.length;i+=50)batches.push({nodes:[],links:input.links.slice(i,i+50)});
let index=0;await Promise.all(Array.from({length:3},async()=>{while(index<batches.length){const batch=batches[index++];await request({action:'rows',...batch});completed++;if(completed%15===0||completed===batches.length)console.log(JSON.stringify({batches:completed,total:batches.length}));}}));
const result=await request({action:'commit',previousSnapshot:current.snapshot||''});
const verify=await(await fetch(origin+'/api/catalog?action=meta',{headers:{Cookie:cookie}})).json();if(verify.snapshot!==input.snapshot)throw Error('Activation not confirmed');
console.log(JSON.stringify({imported:true,snapshot:verify.snapshot,nodes:verify.summary.nodes,folders:verify.summary.folders,files:verify.summary.files,links:verify.summary.links,verified:result.ok}));
}catch(e){console.error(e.message);process.exitCode=1;}break;}rl.close();
