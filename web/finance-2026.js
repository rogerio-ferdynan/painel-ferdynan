const PRICES_2026=[
{name:'Básico',gross:500,cost:300,id:'shows-pequenos'},
{name:'Essencial',gross:1200,cost:550,id:'shows-essencial'},
{name:'Padrão',gross:1800,cost:900,id:'shows-padrao'},
{name:'Premium',gross:3500,cost:1900,id:'shows-grandes'},
{name:'Evento Público',gross:8000,cost:4200,id:'shows-publico'},
{name:'Réveillon',gross:12000,cost:6000,id:'shows-reveillon'}];
const formatMoney2026=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
window.finance2026Update=function(){
let gross=0,cost=0,count=0;
PRICES_2026.forEach(p=>{const el=document.getElementById(p.id);if(!el)return;const q=Math.min(9999,Math.max(0,Math.trunc(Number(el.value)||0)));if(String(q)!==el.value)el.value=q;gross+=q*p.gross;cost+=q*p.cost;count+=q});
const net=gross-cost,remaining=Math.max(0,10000-net),pct=Math.min(100,net/100);
document.getElementById('finance-bruto').textContent=formatMoney2026(gross);
document.getElementById('finance-custos').textContent=formatMoney2026(cost);
document.getElementById('finance-liquido').textContent=formatMoney2026(net);
document.getElementById('finance-faltam-shows').textContent=formatMoney2026(remaining);
document.getElementById('finance-bar-fill').style.width=pct+'%';
document.getElementById('finance-bar-label').textContent=Math.round(pct)+'% da meta alcançada';
const status=document.getElementById('finance-status');status.className='finance-status '+(net>=10000?'finance-status--ok':count?'finance-status--pending':'finance-status--zero');
status.textContent=count===0?'Informe as quantidades para simular sua meta com a tabela 2026.':net>=10000?'Meta alcançada: '+formatMoney2026(net)+' de lucro estimado em '+count+' show(s).':'Faltam '+formatMoney2026(remaining)+' de lucro estimado para alcançar a meta.';
};
document.addEventListener('DOMContentLoaded',()=>{
const key='ferdynan_pricing_2026';let qty={};try{qty=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
PRICES_2026.forEach(p=>{const el=document.getElementById(p.id);if(qty[p.id]!==undefined)el.value=qty[p.id];el.addEventListener('input',()=>{window.finance2026Update();PRICES_2026.forEach(item=>qty[item.id]=document.getElementById(item.id).value);try{localStorage.setItem(key,JSON.stringify(qty))}catch{showNotification('Não foi possível salvar a simulação. Exporte um backup.')}})});
window.finance2026Update();
const block=document.querySelectorAll('.monthly-block')[1];const showTable=block?.querySelector('table');
if(showTable){
const list=document.createElement('datalist');list.id='formats-2026';PRICES_2026.forEach(p=>{const option=document.createElement('option');option.value=p.name;list.append(option)});document.body.append(list);
const rows=[...showTable.querySelectorAll('tbody tr')];const totals=[...block.querySelectorAll('table')][1];
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
window.updateActualShows2026=function(){let n=0,premium=0,gross=0,cost=0;rows.forEach(row=>{const input=[...row.querySelectorAll('input')];if(input.length!==7)return;const g=Number(input[3].value)||0,c=Number(input[4].value)||0;const filled=input.slice(0,5).some(el=>el.value.trim()!=='');if(!filled){input[5].value='';return;}input[5].value=(g-c).toFixed(2);input[5].readOnly=true;input[5].removeAttribute('min');n++;if(norm(input[2].value)==='premium')premium++;gross+=g;cost+=c;});if(totals){const vals=[n,premium,gross,cost,gross-cost];totals.querySelectorAll('input').forEach((el,i)=>{el.value=vals[i];el.readOnly=true;el.removeAttribute('min')})}};
rows.forEach((row,index)=>{const inputs=[...row.querySelectorAll('input')];inputs[2].setAttribute('list','formats-2026');inputs[2].placeholder='Selecione o formato 2026';inputs.forEach((el,i)=>{const names=['Data','Cliente / Evento','Formato 2026','Cachê (R$)','Custo (R$)','Lucro calculado (R$)','Premium? S/N'];el.setAttribute('aria-label','Show '+(index+1)+' · '+names[i]);});inputs[2].addEventListener('change',()=>{const p=PRICES_2026.find(p=>norm(p.name)===norm(inputs[2].value));if(p){inputs[3].value=p.gross;inputs[4].value=p.cost;inputs[6].value=p.name==='Premium'?'S':'N';[inputs[3],inputs[4],inputs[6]].forEach(el=>el.dispatchEvent(new Event('input',{bubbles:true})));}window.updateActualShows2026()});row.addEventListener('input',()=>window.updateActualShows2026());});
}
});
