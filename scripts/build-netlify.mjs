import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {loginPage} from '../worker/index.mjs';
mkdirSync('netlify-public',{recursive:true});
writeFileSync('netlify-public/index.html',loginPage());
mkdirSync('netlify/functions',{recursive:true});
const html=readFileSync('Aline/index.html','utf8');
const encoded=Buffer.from(html).toString('base64');
const fn=`import {createHmac,timingSafeEqual} from 'node:crypto';
const page=Buffer.from('${encoded}','base64').toString('utf8');
const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow','X-Content-Type-Options':'nosniff'};
const login=(error='')=>`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ALINE · Acesso reservado</title><style>body{background:#050b14;color:#f4f4f4;min-height:100vh;display:grid;place-items:center;font:16px system-ui;margin:0}main{width:min(380px,85vw);padding:35px;border:1px solid #d4af3755;background:#0d1520}h1{font:55px Georgia;color:#d4af37;margin:12px 0}p{line-height:1.6;color:#c6c9d0}input,button{box-sizing:border-box;width:100%;padding:15px;margin-top:15px;font:inherit}input{background:#050b14;border:1px solid #a68b4b;color:white}button{background:#d4af37;border:0;color:#050b14;font-weight:bold;cursor:pointer}small{color:#e8b5b5}</style><main><div>PROJETO PRIVADO · 2026</div><h1>ALINE</h1><p>Um refúgio de memórias. Acesso reservado por senha.</p><form method="POST" action="/aline"><input name="password" type="password" autocomplete="current-password" placeholder="Senha de acesso" required><button>Entrar no refúgio ↗</button></form><small>${error}</small></main></html>`;
const hash=(secret)=>createHmac('sha256',secret).update('aline-session-v1').digest('hex');
const equal=(a,b)=>{const x=Buffer.from(a||'');const y=Buffer.from(b||'');return x.length===y.length&&timingSafeEqual(x,y)};
export async function handler(event){
const secret=process.env.ALINE_ACCESS_PASSWORD;
if(!secret||secret.length<12)return {statusCode:503,headers,body:login('Acesso temporariamente indisponível: configuração pendente.')};
const cookie=(event.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('aline_session='))?.slice(14);
if(event.httpMethod==='POST'){
const form=new URLSearchParams(event.isBase64Encoded?Buffer.from(event.body||'','base64').toString():event.body||'');
if(equal(form.get('password'),secret))return {statusCode:303,headers:{...headers,'Location':'/aline','Set-Cookie':'aline_session='+hash(secret)+'; Path=/aline; HttpOnly; Secure; SameSite=Strict; Max-Age=86400'},body:''};
return {statusCode:401,headers,body:login('Senha incorreta.')};
}
if(equal(cookie,hash(secret)))return {statusCode:200,headers,body:page};
return {statusCode:200,headers,body:login()};
}
`;
writeFileSync('netlify/functions/aline.mjs',fn);
console.log('Netlify: ALINE protegido por senha via função server-side; painel preservado.');
