function validTime(s){
  if(typeof s!=='string')return false;
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d{3})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/);
  if(!m||!Number.isFinite(Date.parse(s)))return false;
  const d=new Date(m[1]+'-'+m[2]+'-'+m[3]+'T12:00:00Z');
  return d.toISOString().slice(0,10)===m[1]+'-'+m[2]+'-'+m[3];
}
export function validAgendaEvent(e){
  return !!e && typeof e==='object' && typeof e.id==='string' && /^[a-zA-Z0-9-]{1,80}$/.test(e.id)
    && typeof e.title==='string' && e.title.trim().length>0 && e.title.length<=200
    && ['planned','confirmed','cancelled'].includes(e.status)
    && ['start','end'].every(k=>validTime(e[k]))
    && Date.parse(e.end)>Date.parse(e.start)
    && ['location','notes','client'].every(k=>typeof e[k]==='string' && e[k].length<=(k==='notes'?4000:300))
    && ['fee','cost','received'].every(k=>Number.isSafeInteger(e[k]) && e[k]>=0 && e[k]<=1000000000)
    && e.received<=e.fee;
}
export function validAgenda(events){return Array.isArray(events) && events.length<=1000 && events.every(validAgendaEvent) && new Set(events.map(e=>e.id)).size===events.length;}
export function agendaTotals(events,now=Date.now()){
  const active=events.filter(e=>e.status!=='cancelled');
  const upcoming=active.filter(e=>Date.parse(e.end)>=now).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
  const confirmed=active.filter(e=>e.status==='confirmed');
  return {upcoming,next:upcoming[0]||null,receivable:confirmed.reduce((n,e)=>n+e.fee-e.received,0),profit:confirmed.reduce((n,e)=>n+e.fee-e.cost,0)};
}
export function overlaps(a,b){return a.status!=='cancelled' && b.status!=='cancelled' && a.id!==b.id && Date.parse(a.start)<Date.parse(b.end) && Date.parse(a.end)>Date.parse(b.start);}
export function calendarFile(events){
  const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const stamp=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Ferdynan//Agenda//PT-BR','CALSCALE:GREGORIAN'];
  for(const e of events.filter(e=>e.status!=='cancelled'))lines.push('BEGIN:VEVENT','UID:'+e.id+'@painel.rogerioferdynan.com','DTSTAMP:'+stamp(new Date()),'DTSTART:'+stamp(e.start),'DTEND:'+stamp(e.end),'SUMMARY:'+esc(e.title),'LOCATION:'+esc(e.location),'DESCRIPTION:'+esc([e.client&&'Cliente: '+e.client,e.notes].filter(Boolean).join('\n')),'STATUS:'+(e.status==='confirmed'?'CONFIRMED':'TENTATIVE'),'END:VEVENT');
  lines.push('END:VCALENDAR');
  // Fold physical lines at 75 octets without splitting UTF-8 characters (RFC 5545).
  return lines.map(line=>{let out='',width=0;for(const char of line){const size=new TextEncoder().encode(char).length;if(width+size>75){out+='\r\n ';width=1;}out+=char;width+=size;}return out;}).join('\r\n')+'\r\n';
}
