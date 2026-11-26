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

/** Read-only daily decision queue; never duplicates or mutates saved records. */
export function dailyOperations(agenda=[],inbox={},now=Date.now()){
  const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
  const day=ms=>dayFormat.format(new Date(ms));
  const today=day(now);
  const active=agenda.filter(e=>e.status!=='cancelled');
  const current=active.filter(e=>Date.parse(e.end)>now).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
  const todayEvents=current.filter(e=>day(Date.parse(e.start))===today||Date.parse(e.start)<=now);
  const conflicts=current.filter((e,i)=>current.some((other,j)=>i!==j&&Date.parse(e.start)<Date.parse(other.end)&&Date.parse(e.end)>Date.parse(other.start)));
  const negotiations=current.filter(e=>e.status==='planned');
  const missing=current.filter(e=>e.status==='confirmed'&&(!e.location.trim()||!e.client.trim()));
  const payments=active.filter(e=>e.status==='confirmed'&&Date.parse(e.end)<=now&&e.fee>e.received).sort((a,b)=>Date.parse(a.end)-Date.parse(b.end));
  const urgent=(inbox.alta||[]).filter(t=>!t.done);
  return {todayEvents,conflicts,negotiations,missing,payments,urgent,overdueBalance:payments.reduce((sum,e)=>sum+e.fee-e.received,0)};
}
