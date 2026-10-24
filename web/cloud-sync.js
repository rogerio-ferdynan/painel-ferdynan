(()=>{
'use strict';
const keys={state:'painelFerdynan_v4',fields:'ferdynan_fields_v1',pricing2026:'ferdynan_pricing_2026'};
const cloud=window.__FERDYNAN_CLOUD__;let revision=cloud.revision,dirty=false,busy=false,conflict=false,blocked=false,timer,version=0;
const nativeSet=Storage.prototype.setItem,nativeRemove=Storage.prototype.removeItem;
const read=key=>{try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
function apply(payload){for(const [name,key]of Object.entries(keys)){if(payload[name]!==undefined)nativeSet.call(localStorage,key,JSON.stringify(payload[name]));else nativeRemove.call(localStorage,key);}}
if(cloud.payload)apply(cloud.payload);
function snapshot(){return {state:read(keys.state)||(typeof state!=='undefined'?state:null),fields:read(keys.fields)||{},pricing2026:read(keys.pricing2026)||{}};}
function status(text,kind=''){const e=document.getElementById('cloud-status');if(e){e.textContent=text;e.dataset.kind=kind;}const note=document.querySelector('.save-note');if(note)note.textContent=text;}
function editing(){return /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');}
function queue(){dirty=true;version++;if(conflict||blocked)return;status('Alterações aguardando envio…','pending');clearTimeout(timer);timer=setTimeout(()=>flush(!revision).catch(()=>{}),650);}
Storage.prototype.setItem=function(key,value){nativeSet.call(this,key,value);if(this===localStorage&&Object.values(keys).includes(key))queue();};
async function flush(initial=false){
clearTimeout(timer);if(busy){await new Promise(resolve=>{const interval=setInterval(()=>{if(!busy){clearInterval(interval);resolve()}},100)});if(!dirty)return;}
if(conflict||blocked)throw Error('Sincronização interrompida');if(!dirty&&!initial)return;if(!revision&&!initial)throw Error('Importe os dados primeiro');
busy=true;const sentVersion=version;status('Salvando na nuvem…','pending');
try{const payload=snapshot();if(!payload.state)throw Error('Os dados locais ainda não estão prontos');
const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,payload}),signal:AbortSignal.timeout(15000)});
if(r.status===409){conflict=true;document.getElementById('cloud-reload').hidden=false;throw Error('Conflito: outro dispositivo salvou alterações. Exporte seu backup antes de recarregar.');}
if(r.status===401){blocked=true;document.getElementById('cloud-reload').hidden=false;throw Error('Sessão expirada. Exporte um backup e entre novamente.');}
if(!r.ok){let msg;try{msg=(await r.json()).error}catch{}throw Error(msg||'Não foi possível salvar na nuvem');}
const data=await r.json();revision=data.revision;dirty=version!==sentVersion;document.getElementById('cloud-import').hidden=true;
status(dirty?'Há alterações aguardando envio…':'✓ Salvo na nuvem · '+new Intl.DateTimeFormat('pt-BR',{timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date()),dirty?'pending':'ok');
}catch(e){status(e.message==='Failed to fetch'?'Sem conexão — alterações mantidas neste navegador':e.message,'error');throw e;}
finally{busy=false;if(dirty&&!conflict&&!blocked&&revision)timer=setTimeout(()=>flush().catch(()=>{}),5000);}
}
async function poll(){if(!revision||busy||dirty||conflict||blocked||editing()||document.hidden)return;try{const r=await fetch('/api/state',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)return;const data=await r.json();if(data.revision>revision){apply(data.payload);location.reload();}}catch{}}
window.FerdynanCloud={flush:()=>flush(!revision),isDirty:()=>dirty};
document.addEventListener('DOMContentLoaded',()=>{
const bar=document.createElement('section');bar.className='cloud-bar';bar.setAttribute('aria-label','Salvamento e acesso');bar.innerHTML='<span id="cloud-status" role="status"></span><button class="tool-btn" id="cloud-save" type="button">Salvar agora</button><button class="tool-btn" id="cloud-import" type="button">Importar dados deste navegador</button><button class="tool-btn" id="cloud-reload" type="button" hidden>Recarregar / entrar novamente</button><form action="/api/logout" method="post"><button class="tool-btn" type="submit">Sair</button></form>';
document.querySelector('.main-header').after(bar);
document.getElementById('cloud-import').hidden=!!revision;
status(revision?'✓ Dados carregados da nuvem':'Banco ainda vazio — importe os dados deste navegador',revision?'ok':'pending');
document.getElementById('cloud-save').onclick=()=>{if(!revision){document.getElementById('cloud-import').click();return;}dirty=true;flush().catch(()=>{});};
document.getElementById('cloud-import').onclick=()=>flush(true).catch(()=>{});
document.getElementById('cloud-reload').onclick=()=>{if(confirm('Exporte um backup das alterações pendentes antes de continuar. Recarregar agora?')){dirty=false;location.reload();}};
bar.querySelector('form').addEventListener('submit',async e=>{if(!dirty)return;e.preventDefault();try{await flush();e.target.submit()}catch{alert('Há alterações sem salvar. Exporte um backup antes de sair.')}});
setInterval(poll,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});window.addEventListener('online',()=>{if(dirty&&revision)flush().catch(()=>{});else poll()});
setTimeout(()=>{const note=document.querySelector('.local-notice');if(note)note.textContent='Banco central: alterações são salvas na nuvem e compartilhadas entre seus dispositivos após entrar. Um backup local fica neste navegador até você sair.';const footer=document.querySelector('.sidebar-footer .muted');if(footer)footer.textContent='Painel protegido por senha. Seus dados ficam no banco central.';status(document.getElementById('cloud-status').textContent,revision?'ok':'pending')},0);
});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
})();
