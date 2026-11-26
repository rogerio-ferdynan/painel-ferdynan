import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=mkdtempSync(join(tmpdir(),'omni-d1-'));
const config=join(root,'wrangler.json');
const cli=process.env.OMNI_WRANGLER;
assert.ok(cli,'Set OMNI_WRANGLER to the installed Wrangler executable');
const id='00000000-0000-4000-8000-000000000001';
writeFileSync(config,JSON.stringify({name:'omni-recovery-test',compatibility_date:'2026-01-01',d1_databases:[{binding:'DB',database_name:'omni-isolated',database_id:id}]}));
const call=(action,store,args)=>execFileSync(cli,['d1',action,'omni-isolated','--config',config,'--local','--persist-to',join(root,store),...args],{encoding:'utf8',env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false'},maxBuffer:8*1024*1024});
const sql=(store,command)=>call('execute',store,['--command',command,'--json']);
const rows=(store,command)=>JSON.parse(sql(store,command)).flatMap(x=>x.results||[]);
try{
 for(const f of readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())call('execute','source',['--file',resolve('drizzle',f)]);
 // All fixtures are synthetic, including opaque credential placeholders.
 const seed=join(root,'seed.sql');
 writeFileSync(seed,`INSERT INTO panel_state VALUES ('main','{"state":{"agenda":[{"id":"fixture-1"}]}}',17,'2026-01-01');
 INSERT INTO panel_sessions VALUES ('test-hash',123);
 INSERT INTO panel_login_attempts VALUES ('test-attempt',2,123);
 INSERT INTO panel_google_config VALUES ('main','fixture-ciphertext','2026-01-01');
 INSERT INTO panel_google_tokens VALUES ('main','fixture-ciphertext','2026-01-01');
 INSERT INTO panel_google_oauth VALUES ('state','test-hash','fixture-ciphertext',123);
 INSERT INTO panel_catalog_snapshots VALUES ('snap','{}','2026-01-01','active');
 INSERT INTO panel_catalog_active VALUES ('main','snap');
 INSERT INTO panel_catalog_nodes VALUES ('snap','node','','Fixture','test','folder',0,'2026-01-01','fixture');
 INSERT INTO panel_catalog_links VALUES ('snap','link','Fixture','https://example.invalid','test','[]','[]','["node"]','[]','fixture');`);
 call('execute','source',['--file',seed]);
 const tables=rows('source',"SELECT name FROM sqlite_schema WHERE type='table' AND name LIKE 'panel_%' ORDER BY name").map(x=>x.name);
 assert.equal(tables.length,10);
 const dump=join(root,'backup.sql');
 call('export','source',['--output',dump]);
 assert.ok(readFileSync(dump,'utf8').includes('panel_state'));
 call('execute','restored',['--file',dump]);
 for(const table of tables){
  const before=rows('source','SELECT * FROM '+table+' ORDER BY rowid');
  const after=rows('restored','SELECT * FROM '+table+' ORDER BY rowid');
  assert.ok(before.length>0,table);
  assert.deepEqual(after,before,table);
 }
 assert.deepEqual(rows('restored',"SELECT revision FROM panel_state WHERE id='main'"),[{revision:17}]);
 assert.equal(rows('restored',"SELECT n.id FROM panel_catalog_nodes n JOIN panel_catalog_active a ON n.snapshot=a.snapshot").length,1);
 assert.equal(rows('restored',"SELECT l.id FROM panel_catalog_links l JOIN panel_catalog_snapshots s ON l.snapshot=s.id").length,1);
 console.log('Wrangler local D1 SQL recovery verified: '+tables.length+' tables, content, IDs, revision and catalog relationships.');
}finally{rmSync(root,{recursive:true,force:true});}
