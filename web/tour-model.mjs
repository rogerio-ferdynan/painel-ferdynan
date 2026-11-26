export const BAND_PROFILE='https://www.bandsintown.com/a/15376245-rogerio-ferdynan';
export function validSmartLink(value){
  if(value==='')return true;
  if(typeof value!=='string'||value.length>1000)return false;
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['bnds.us','bandsintown.com','www.bandsintown.com'].includes(u.hostname)&&u.pathname!=='/';}catch{return false;}
}
export function validMarketing(value){return !!value&&typeof value==='object'&&!Array.isArray(value)&&validSmartLink(value.smartLink);}
export function shareLink(marketing){return validMarketing(marketing)&&marketing.smartLink?marketing.smartLink:BAND_PROFILE;}
export function tourBrief(event){
  const money=n=>(n/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const date=s=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'full',timeStyle:'short'}).format(new Date(s));
  return ['FERDYNAN PRODUÇÕES — FICHA DE PRODUÇÃO','Documento interno · horário de Brasília','',event.title,'Situação: '+({planned:'Em negociação',confirmed:'Confirmado',cancelled:'Cancelado'}[event.status]),'Início: '+date(event.start),'Término: '+date(event.end),'Cliente: '+(event.client||'Não informado'),'Local: '+(event.location||'Não informado'),'','FINANCEIRO','Cachê: '+money(event.fee),'Custos previstos: '+money(event.cost),'Lucro previsto: '+money(event.fee-event.cost),'Recebido: '+money(event.received),'Saldo a receber: '+money(event.fee-event.received),'','OBSERVAÇÕES',event.notes||'Nenhuma observação cadastrada.','','CONFERIR ANTES DE SAIR','[ ] Horários de chegada e passagem de som','[ ] Contato do responsável no local','[ ] Transporte, equipe e equipamentos','[ ] Repertório e duração combinada','[ ] Condições de pagamento','', 'Gerado pelo Painel Ferdynan. A ficha reflete os dados no momento da exportação.'].join('\n');
}

/** Read-only daily decision queue; never mutates saved records. */
export function dailyOperations(agenda=[],inbox={},now=Date.now()){
  const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
  const day=ms=>dayFormat.format(new Date(ms));
  const today=day(now);
  let invalid=0;
  const seen=new Set();
  const active=[];
  if(!Array.isArray(agenda)){invalid++;agenda=[];}
  for(const e of agenda){
    if(!e||typeof e.id!=='string'||seen.has(e.id)||typeof e.title!=='string'||!e.title.trim()||!['planned','confirmed','cancelled'].includes(e.status)||typeof e.start!=='string'||typeof e.end!=='string'||!Number.isFinite(Date.parse(e.start))||!Number.isFinite(Date.parse(e.end))||Date.parse(e.end)<=Date.parse(e.start)||typeof e.client!=='string'||typeof e.location!=='string'||!Number.isSafeInteger(e.fee)||!Number.isSafeInteger(e.received)||e.fee<0||e.fee>1000000000||e.received<0||e.received>e.fee){invalid++;continue;}
    seen.add(e.id);if(e.status!=='cancelled')active.push({e,start:Date.parse(e.start),end:Date.parse(e.end)});
  }
  active.sort((a,b)=>a.start-b.start);
  const current=active.filter(x=>x.end>now);
  const todayEvents=current.filter(x=>day(x.start)===today||x.start<=now).map(x=>x.e);
  // Sorted sweep: a prior interval or the next interval overlaps this one.
  let maxEnd=-Infinity;
  const conflicts=current.filter((x,i)=>{const hit=maxEnd>x.start||(i+1<current.length&&current[i+1].start<x.end);maxEnd=Math.max(maxEnd,x.end);return hit;}).map(x=>x.e);
  const negotiations=active.filter(x=>x.e.status==='planned').map(x=>x.e);
  const missing=current.filter(x=>x.e.status==='confirmed'&&(!x.e.location.trim()||!x.e.client.trim())).map(x=>x.e);
  const payments=active.filter(x=>x.e.status==='confirmed'&&x.end<=now&&x.e.fee>x.e.received).sort((a,b)=>a.end-b.end).map(x=>x.e);
  const urgent=[];
  if(!inbox||typeof inbox!=='object'||Array.isArray(inbox)){invalid++;}
  else if(inbox.alta!==undefined&&!Array.isArray(inbox.alta)){invalid++;}
  else for(const t of inbox.alta||[]){if(!t||typeof t.text!=='string'||typeof t.done!=='boolean'){invalid++;continue;}if(!t.done)urgent.push(t);}
  return {todayEvents,conflicts,negotiations,missing,payments,urgent,invalid,pendingBalance:payments.reduce((sum,e)=>sum+e.fee-e.received,0)};
}
