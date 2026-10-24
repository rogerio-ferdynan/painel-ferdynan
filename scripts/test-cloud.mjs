import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {pbkdf2Sync} from 'node:crypto';
import assert from 'node:assert/strict';
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync('dist/server/index.js','utf8')).toString('base64'));
const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('drizzle/0000_panel_cloud.sql','utf8'));
const DB={prepare(sql){let args=[];return {bind(...values){args=values;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}}}},async batch(items){sqlite.exec('BEGIN');try{const out=[];for(const stmt of items)out.push(await stmt.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const salt='test-only-salt';const env={DB,PANEL_PASSWORD_SALT:salt,PANEL_PASSWORD_HASH:pbkdf2Sync('test-pass',salt,100000,32,'sha256').toString('hex')};
const origin='https://panel.test';
async function request(path,options={}){return worker.fetch(new Request(origin+path,options),env,{})}
assert.match(await (await request('/')).text(),/Senha de acesso/);
assert.equal((await request('/api/state')).status,401);
assert.equal((await request('/api/login',{method:'POST',headers:{Origin:'https://attacker.test'},body:new URLSearchParams({password:'test-pass'})})).status,403);
const login=await request('/api/login',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'test-ip'},body:new URLSearchParams({password:'test-pass'})});assert.equal(login.status,303);const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);
const initial=await (await request('/api/state',{headers:{Cookie:cookie}})).json();assert.equal(initial.revision,0);
const payload={state:{stats:{shows:1,faturamento:'R$ 500',propostas:0},inbox:{aProcessar:[{id:'t1',text:'</script><img src=x>',done:false}],alta:[],media:[],delegar:[]}},fields:{0:'42'},pricing2026:{'shows-pequenos':'1'}};
async function save(revision,body=payload){return request('/api/state',{method:'PUT',headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({revision,payload:body})})}
assert.equal((await save(0)).status,200);assert.equal((await save(0)).status,409);assert.equal((await save(1,{})).status,400);
const login2=await request('/api/login',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'other-device'},body:new URLSearchParams({password:'test-pass'})});const cookie2=login2.headers.get('set-cookie').split(';')[0];
assert.deepEqual((await (await request('/api/state',{headers:{Cookie:cookie2}})).json()).payload,payload);
const page=await (await request('/',{headers:{Cookie:cookie}})).text();assert.ok(!page.includes('"text":"</script>'));assert.ok(page.includes('\\u003c/script>'));
assert.equal((await request('/api/state',{method:'PUT',headers:{Cookie:cookie,Origin:'https://attacker.test'},body:'{}'})).status,403);
for(let i=0;i<5;i++)assert.equal((await request('/api/login',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'bad-ip'},body:new URLSearchParams({password:'wrong'})})).status,401);
assert.equal((await request('/api/login',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'bad-ip'},body:new URLSearchParams({password:'test-pass'})})).status,429);
assert.equal((await request('/api/logout',{method:'POST',headers:{Cookie:cookie,Origin:origin}})).status,303);assert.equal((await request('/api/state',{headers:{Cookie:cookie}})).status,401);
console.log('Verificado: senha, limite de tentativas, sessão, proteção de escrita, banco compartilhado em duas sessões, conflito de edição e logout.');
