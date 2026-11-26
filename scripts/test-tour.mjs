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
const inbox={alta:[{id:'1',done:false},{id:'2',done:true}]};
const original=JSON.stringify({rows,inbox});
const daily=dailyOperations(rows,inbox,now);
assert.deepEqual(daily.todayEvents.map(e=>e.id),['overnight','today','conflict']);
assert.deepEqual(daily.conflicts.map(e=>e.id),['today','conflict']);
assert.deepEqual(daily.negotiations.map(e=>e.id),['conflict']);
assert.deepEqual(daily.missing.map(e=>e.id),['missing']);
assert.deepEqual(daily.payments.map(e=>e.id),['past']);
assert.equal(daily.overdueBalance,7000);
assert.equal(daily.urgent.length,1);
assert.equal(JSON.stringify({rows,inbox}),original);
assert.equal(dailyOperations([],{},now).todayEvents.length,0);
assert.equal(dailyOperations([event('tomorrow','2026-11-27T02:00:00Z','2026-11-27T02:30:00Z')],{},now).todayEvents.length,1);
console.log('Daily operations assertions passed');
