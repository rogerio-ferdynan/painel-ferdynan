const COOKIE='__Host-ferdynan_session';
const KEY='main';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'SAMEORIGIN'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
const hex=buffer=>[...new Uint8Array(buffer)].map(v=>v.toString(16).padStart(2,'0')).join('');
const sha=async s=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
const redirect=(url,cookie)=>new Response(null,{status:303,headers:{...headers,Location:url,...(cookie?{'Set-Cookie':cookie}:{})}});
function cookieValue(req){return (req.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
async function authenticated(req,db){const token=cookieValue(req);if(!/^[a-f0-9]{64}$/.test(token))return false;const row=await db.prepare('SELECT expires_at FROM panel_sessions WHERE token_hash = ?').bind(await sha(token)).first();return !!row&&row.expires_at>Date.now();}
function plain(o){return !!o&&typeof o==='object'&&!Array.isArray(o);}
export function validPayload(p){return plain(p)&&plain(p.state)&&plain(p.state.stats)&&plain(p.state.inbox)&&['aProcessar','alta','media','delegar'].every(k=>Array.isArray(p.state.inbox[k])&&p.state.inbox[k].length<=2000&&p.state.inbox[k].every(t=>plain(t)&&typeof t.id==='string'&&typeof t.text==='string'&&t.text.length<=10000&&typeof t.done==='boolean'&&(!t.tag||typeof t.tag==='string')))&&plain(p.fields)&&Object.values(p.fields).every(v=>['string','number','boolean'].includes(typeof v))&&plain(p.pricing2026)&&Object.values(p.pricing2026).every(v=>['string','number'].includes(typeof v));}
async function readState(db){const row=await db.prepare('SELECT payload, revision, updated_at FROM panel_state WHERE id = ?').bind(KEY).first();return row?{payload:JSON.parse(row.payload),revision:row.revision,updatedAt:row.updated_at}:{payload:null,revision:0,updatedAt:null};}
function loginPage(error=''){return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Entrar · Painel Ferdynan</title><style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#0d1015;color:#edf0f3;font:16px system-ui}main{width:min(360px,calc(100% - 64px));padding:32px;background:#151b23;border:1px solid #303844;border-radius:16px}small{color:#d8b477;letter-spacing:.14em}h1{font-size:25px;margin:20px 0 8px}p{color:#a2adbd;font-size:14px;line-height:1.6}label{display:block;margin-top:24px;font-size:13px}input,button{box-sizing:border-box;width:100%;padding:14px;margin:9px 0;border:1px solid #485260;border-radius:8px;font:inherit}input{background:#0d1015;color:white}button{background:#d8b477;color:#15110b;font-weight:650;cursor:pointer}.error{color:#ffb9b9}input:focus{outline:2px solid #d8b477}</style><main><small>OMNI / LEGACY</small><h1>Seu painel, protegido.</h1><p>Entre para acessar tarefas, valores e seus dados salvos na nuvem.</p>${error?'<p role="alert" class="error">'+error+'</p>':''}<form action="/api/login" method="post"><label for="password">Senha de acesso</label><input type="password" inputmode="numeric" id="password" name="password" autocomplete="current-password" required autofocus maxlength="128"><button type="submit">Entrar no painel</button></form></main></html>`;}
function html(content,status=200){return new Response(content,{status,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});}
function sameOrigin(req){return req.headers.get('Origin')===new URL(req.url).origin;}
export default {async fetch(req,env){try{
const url=new URL(req.url),db=env.DB;
if(!db||!env.PANEL_PASSWORD_HASH||!env.PANEL_PASSWORD_SALT)return html('<h1>Painel em configuração</h1><p>Tente novamente em instantes.</p>',503);
if(req.method==='POST'&&url.pathname==='/api/login'){
if(!sameOrigin(req))return json({error:'Origem inválida'},403);
if(Number(req.headers.get('Content-Length')||0)>2048)return json({error:'Solicitação grande demais'},413);
const attemptKey=await sha(req.headers.get('CF-Connecting-IP')||'unknown');const now=Date.now();
const attempt=await db.prepare('SELECT failures, reset_at FROM panel_login_attempts WHERE attempt_key = ?').bind(attemptKey).first();
if(attempt&&attempt.reset_at>now&&attempt.failures>=5)return html(loginPage('Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.'),429);
const form=await req.formData();const password=form.get('password');
let match=false;if(typeof password==='string'&&password.length<=128){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const derived=hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(env.PANEL_PASSWORD_SALT),iterations:100000,hash:'SHA-256'},key,256));let delta=derived.length^env.PANEL_PASSWORD_HASH.length;for(let i=0;i<derived.length;i++)delta|=derived.charCodeAt(i)^(env.PANEL_PASSWORD_HASH.charCodeAt(i)||0);match=delta===0;}
if(!match){await db.prepare('INSERT INTO panel_login_attempts (attempt_key,failures,reset_at) VALUES (?,1,?) ON CONFLICT(attempt_key) DO UPDATE SET failures = CASE WHEN reset_at <= ? THEN 1 ELSE failures+1 END, reset_at = CASE WHEN reset_at <= ? THEN ? ELSE reset_at END').bind(attemptKey,now+900000,now,now,now+900000).run();return html(loginPage('Senha incorreta. Confira e tente novamente.'),401);}
const token=hex(crypto.getRandomValues(new Uint8Array(32)));await db.batch([db.prepare('INSERT INTO panel_sessions (token_hash,expires_at) VALUES (?,?)').bind(await sha(token),now+43200000),db.prepare('DELETE FROM panel_login_attempts WHERE attempt_key = ?').bind(attemptKey),db.prepare('DELETE FROM panel_sessions WHERE expires_at <= ?').bind(now)]);
return redirect('/',COOKIE+'='+token+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200');
}
const auth=await authenticated(req,db);
if(!auth){if(url.pathname.startsWith('/api/'))return json({error:'Entre novamente para continuar.'},401);return html(loginPage());}
if(url.pathname==='/api/logout'&&req.method==='POST'){if(!sameOrigin(req))return json({error:'Origem inválida'},403);await db.prepare('DELETE FROM panel_sessions WHERE token_hash = ?').bind(await sha(cookieValue(req))).run();return redirect('/',COOKIE+'=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');}
if(url.pathname==='/api/state'){
if(req.method==='GET')return json(await readState(db));
if(req.method!=='PUT')return json({error:'Método inválido'},405);
if(!sameOrigin(req))return json({error:'Origem inválida'},403);
const body=await req.text();if(body.length>524288)return json({error:'Backup excede 512 KB'},413);let data;try{data=JSON.parse(body)}catch{return json({error:'JSON inválido'},400)};
if(!Number.isSafeInteger(data.revision)||data.revision<0||!validPayload(data.payload))return json({error:'Dados inválidos'},400);
const time=new Date().toISOString(),payload=JSON.stringify(data.payload);let result;
if(data.revision===0)result=await db.prepare('INSERT INTO panel_state (id,payload,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(id) DO NOTHING').bind(KEY,payload,time).run();
else result=await db.prepare('UPDATE panel_state SET payload = ?, revision = revision+1, updated_at = ? WHERE id = ? AND revision = ?').bind(payload,time,KEY,data.revision).run();
if(!result.meta?.changes)return json({error:'Os dados foram atualizados em outro dispositivo. Exporte suas alterações antes de recarregar.',conflict:true},409);
return json({revision:data.revision+1,updatedAt:time});
}
if(req.method!=='GET')return json({error:'Método inválido'},405);
if(url.pathname==='/'||url.pathname==='/index.html'){
const cloud=await readState(db);const seed=JSON.stringify(cloud).replace(/</g,'\\u003c');
const page=ASSETS['/index.html'].replace('</head>',`<script>window.__FERDYNAN_CLOUD__=${seed};</script><script src="/cloud-sync.js"></script></head>`);
return html(page);
}
const asset=ASSETS[url.pathname];if(asset&&url.pathname!=='/index.html')return new Response(asset,{headers:{...headers,'Content-Type':url.pathname.endsWith('.css')?'text/css; charset=utf-8':'application/javascript; charset=utf-8'}});
return json({error:'Não encontrado'},404);
}catch(error){console.error('Panel request failed',error?.name||'Error');return json({error:'Não foi possível acessar o banco agora. Seus dados não foram descartados.'},503);}}};
