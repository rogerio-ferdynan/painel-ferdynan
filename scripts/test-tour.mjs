import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BAND_PROFILE,validSmartLink,validMarketing,shareLink,tourBrief} from '../web/tour-model.mjs';
assert.ok(validSmartLink('https://bnds.us/test-link'));assert.ok(validSmartLink(BAND_PROFILE));assert.ok(validMarketing({smartLink:''}));
for(const bad of ['javascript:alert(1)','http://bnds.us/abc','https://bnds.us.evil.test/x','https://user:pass@bnds.us/x','https://bnds.us:8080/x','https://bnds.us/',undefined])assert.ok(!validSmartLink(bad));
assert.equal(shareLink(null),BAND_PROFILE);assert.equal(shareLink({smartLink:'https://evil.test'}),BAND_PROFILE);assert.equal(shareLink({smartLink:'https://bnds.us/test-link'}),'https://bnds.us/test-link');
const brief=tourBrief({title:'Teste',status:'confirmed',start:'2026-12-10T19:00:00-03:00',end:'2026-12-10T21:00:00-03:00',client:'Cliente',location:'Local',notes:'Passagem às 17h',fee:350000,cost:190000,received:100000});
assert.match(brief,/Saldo a receber: R\$\s2\.500,00/);assert.match(brief,/Passagem às 17h/);assert.match(brief,/19:00/);
const widget=readFileSync('web/bandsintown.html','utf8');assert.match(widget,/data-artist-name="id_15376245"/);assert.match(widget,/https:\/\/widgetv3.bandsintown.com\/main.min.js/);assert.ok(!widget.includes('localStorage'));
const tour=readFileSync('web/tour.js','utf8');assert.match(tour,/sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox'/);assert.ok(!tour.includes('allow-same-origin'));
console.log('Divulgação verificada: links permitidos, perfil de fallback, ficha de produção e isolamento do widget.');

const {dailyOperations}=await import('../web/tour-model.mjs');
const now=Date.parse('2026-11-26T10:00:00-03:00');
const base={status:'confirmed',client:'Teste',location:'Local',fee:10000,received:0};
const event=(id,start,end,extra={})=>({...base,id,title:id,start,end,...extra});
const rows=[
 event('today','2026-11-26T11:00:00-03:00','2026-11-26T13:00:00-03:00'),
 event('conflict','2026-11-26T12:00:00-03:00','2026-11-26T14:00:00-03:00',{status:'planned'}),
 event('past','2026-11-25T12:00:00-03:00','2026-11-25T14:00:00-03:00',{received:3000}),
 event('paid','2026-11-25T12:00:00-03:00','2026-11-25T14:00:00-03:00',{received:10000}),
 event('missing','2026-11-27T12:00:00-03:00','2026-11-27T14:00:00-03:00',{client:''}),
 event('cancelled','2026-11-26T12:00:00-03:00','2026-11-26T14:00:00-03:00',{status:'cancelled'}),
 event('overnight','2026-11-25T23:00:00-03:00','2026-11-26T10:30:00-03:00')
];
const inbox={alta:[{id:'1',text:'Pendente',done:false},{id:'2',text:'Concluída',done:true}]};
const original=JSON.stringify({rows,inbox});
const daily=dailyOperations(rows,inbox,now);
assert.deepEqual(daily.todayEvents.map(e=>e.id),['overnight','today','conflict']);
assert.deepEqual(daily.conflicts.map(e=>e.id),['today','conflict']);
assert.deepEqual(daily.negotiations.map(e=>e.id),['conflict']);
assert.deepEqual(daily.missing.map(e=>e.id),['missing']);
assert.deepEqual(daily.payments.map(e=>e.id),['past']);
assert.equal(daily.pendingBalance,7000);
assert.equal(daily.urgent.length,1);
assert.equal(JSON.stringify({rows,inbox}),original);
assert.equal(dailyOperations([],{},now).todayEvents.length,0);
assert.equal(dailyOperations([event('tomorrow','2026-11-27T02:00:00Z','2026-11-27T02:30:00Z')],{},now).todayEvents.length,1);
console.log('Daily operations assertions passed');

const pastPlanned=event('past-planned','2026-11-25T12:00:00-03:00','2026-11-25T14:00:00-03:00',{status:'planned'});
const missingPlace=event('missing-place','2026-11-27T12:00:00-03:00','2026-11-27T14:00:00-03:00',{location:' '});
const free=event('free','2026-11-25T12:00:00-03:00','2026-11-25T14:00:00-03:00',{fee:0});
assert.deepEqual(dailyOperations([pastPlanned],{},now).negotiations,[pastPlanned]);
assert.deepEqual(dailyOperations([missingPlace],{},now).missing,[missingPlace]);
assert.equal(dailyOperations([free],{},now).payments.length,0);
assert.equal(dailyOperations([null,{...free,received:1},{...free,start:'invalid'},{...free,client:null},free,free],{alta:[null,{text:'?',done:'false'}]},now).invalid,7);
assert.equal(dailyOperations(null,null,now).invalid,2);
assert.equal(dailyOperations([], {media:[{text:'Sem prioridade alta',done:false}]},now).urgent.length,0);
const large=Array.from({length:1000},(_,i)=>event('load-'+i,new Date(now+3600000+i*60000).toISOString(),new Date(now+3660000+i*60000).toISOString()));
assert.equal(dailyOperations(large,{},now).conflicts.length,0);
const dense=large.map(e=>({...e,start:large[0].start,end:large[0].end}));
assert.equal(dailyOperations(dense,{},now).conflicts.length,1000);
const nested=[event('outer',new Date(now+1000).toISOString(),new Date(now+9000).toISOString()),event('inner',new Date(now+2000).toISOString(),new Date(now+3000).toISOString()),event('later',new Date(now+4000).toISOString(),new Date(now+5000).toISOString())];
assert.equal(dailyOperations(nested,{},now).conflicts.length,3);
assert.equal(dailyOperations(rows,{},Date.parse('2026-11-27T03:00:00Z')).todayEvents.length,1);
console.log('Adversarial daily operations assertions passed');
