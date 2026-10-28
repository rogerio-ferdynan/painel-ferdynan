// Isolated local preview. No production database, OAuth credentials or calendar calls.
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {pbkdf2Sync} from 'node:crypto';
import {createServer} from 'node:http';
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(readFileSync('dist/server/index.js','utf8')).toString('base64'));
const sqlite=new DatabaseSync(':memory:');for(const file of ['drizzle/0000_panel_cloud.sql','drizzle/0001_google_calendar.sql'])sqlite.exec(readFileSync(file,'utf8'));
const DB={prepare(sql){let args=[];return {bind(...values){args=values;return this},async first(){return sqlite.prepare(sql).get(...args)||null},async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}}}},async batch(items){sqlite.exec('BEGIN');try{const out=[];for(const stmt of items)out.push(await stmt.run());sqlite.exec('COMMIT');return out}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const env={DB,PANEL_PASSWORD_SALT:'preview-only',PANEL_PASSWORD_HASH:pbkdf2Sync('preview-only','preview-only',100000,32,'sha256').toString('hex')};
const server=createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);const response=await worker.fetch(new Request('http://localhost:4317'+req.url,{method:req.method,headers:req.headers,...(body.length?{body}: {})}),env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){res.writeHead(500);res.end('Preview error');console.error(e.message);}});
server.listen(4317,'127.0.0.1',()=>console.log('Local: http://localhost:4317 · senha de teste: preview-only · banco isolado em memória'));
