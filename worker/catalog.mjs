const catalogHeaders={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff'};
function catalogJson(data,status=200){return new Response(JSON.stringify(data),{status,headers:catalogHeaders});}
const catalogFold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const catalogId=s=>typeof s==='string'&&(s==='root'||/^[a-f0-9]{24}$/.test(s));
export function validCatalogNode(n){return !!n&&catalogId(n.id)&&((n.id==='root'&&n.parent==='')||catalogId(n.parent))&&typeof n.name==='string'&&n.name.length>0&&n.name.length<=6000&&['folder','file','shortcut'].includes(n.kind)&&/^(?:\d{2}|other)$/.test(n.module)&&Number.isSafeInteger(n.size)&&n.size>=0&&typeof n.modifiedAt==='string'&&n.modifiedAt.length<=40;}
export function validCatalogLink(l){return !!l&&/^[a-f0-9]{24}$/.test(l.id)&&typeof l.url==='string'&&l.url.length>0&&l.url.length<=16384&&typeof l.title==='string'&&l.title.length<=6000&&Array.isArray(l.folders)&&l.folders.length<=100&&l.folders.every(x=>typeof x==='string'&&x.length<=6000)&&Array.isArray(l.folderIds)&&l.folderIds.length<=100&&l.folderIds.every(catalogId)&&Array.isArray(l.modules)&&l.modules.every(x=>/^(?:\d{2}|other)$/.test(x))&&typeof l.module==='string'&&Array.isArray(l.aliases)&&l.aliases.every(x=>typeof x==='string'&&x.length<=6000);}
function catalogRows(result){return result.results||[];}
async function catalogPath(db,snapshot,id){return catalogRows(await db.prepare(`WITH RECURSIVE ancestors AS (SELECT id,parent,name,kind,0 AS depth FROM panel_catalog_nodes WHERE snapshot=? AND id=? UNION ALL SELECT n.id,n.parent,n.name,n.kind,a.depth+1 FROM panel_catalog_nodes n JOIN ancestors a ON n.id=a.parent WHERE n.snapshot=? AND a.depth<100) SELECT id,parent,name,kind FROM ancestors ORDER BY depth DESC`).bind(snapshot,id,snapshot).all());}
export async function catalogRequest(req,env,context){
if(!context.authenticated)return catalogJson({error:'Entre no painel para acessar o índice.'},401);
const db=env.DB,url=new URL(req.url);
if(req.method==='POST'){
 if(!context.sameOrigin(req))return catalogJson({error:'Origem inválida'},403);
 const raw=await req.text();if(raw.length>1500000)return catalogJson({error:'Lote grande demais'},413);let data;try{data=JSON.parse(raw)}catch{return catalogJson({error:'JSON inválido'},400);}
 if(!/^[a-f0-9-]{36}$/.test(data.snapshot||''))return catalogJson({error:'Identificador inválido'},400);
 if(data.action==='begin'){
  const s=data.summary;if(!s||!Number.isSafeInteger(s.nodes)||s.nodes<1||s.nodes>500000||!Number.isSafeInteger(s.links)||s.links<0||s.links>10000||typeof s.root!=='string'||s.root.length>6000||JSON.stringify(s).length>100000)return catalogJson({error:'Resumo inválido'},400);
  await db.prepare('INSERT INTO panel_catalog_snapshots (id,summary,created_at,status) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(data.snapshot,JSON.stringify(s),new Date().toISOString(),'staging').run();return catalogJson({ok:true});
 }
 const snapshot=await db.prepare('SELECT summary,status FROM panel_catalog_snapshots WHERE id=?').bind(data.snapshot).first();if(!snapshot)return catalogJson({error:'Importação não iniciada'},404);
 if(data.action==='commit'){
  if(snapshot.status==='active')return catalogJson({ok:true,alreadyCommitted:true});
  const nodes=await db.prepare('SELECT COUNT(*) AS count FROM panel_catalog_nodes WHERE snapshot=?').bind(data.snapshot).first(),links=await db.prepare('SELECT COUNT(*) AS count FROM panel_catalog_links WHERE snapshot=?').bind(data.snapshot).first(),summary=JSON.parse(snapshot.summary);
  if(nodes.count!==summary.nodes||links.count!==summary.links)return catalogJson({error:'Importação incompleta. O índice anterior foi preservado.',nodes:nodes.count,links:links.count},409);
  const root=await db.prepare('SELECT id FROM panel_catalog_nodes WHERE snapshot=? AND id=? AND parent=?').bind(data.snapshot,'root','').first();
  const missing=await db.prepare('SELECT COUNT(*) AS count FROM panel_catalog_nodes n WHERE n.snapshot=? AND n.id<>? AND NOT EXISTS (SELECT 1 FROM panel_catalog_nodes p WHERE p.snapshot=n.snapshot AND p.id=n.parent)').bind(data.snapshot,'root').first();
  if(!root||missing.count)return catalogJson({error:'A árvore contém referências incompletas.'},400);
  const active=await db.prepare('SELECT snapshot FROM panel_catalog_active WHERE id=?').bind('main').first();if((active?.snapshot||'')!==(data.previousSnapshot||''))return catalogJson({error:'Outro índice foi publicado. Releia o estado antes de continuar.'},409);
  const pointer=active?db.prepare('UPDATE panel_catalog_active SET snapshot=? WHERE id=? AND snapshot=?').bind(data.snapshot,'main',data.previousSnapshot):db.prepare('INSERT INTO panel_catalog_active (id,snapshot) VALUES (?,?) ON CONFLICT(id) DO NOTHING').bind('main',data.snapshot);
  const result=await pointer.run();if(!result.meta?.changes)return catalogJson({error:'Outro índice foi publicado. O anterior foi preservado.'},409);
  await db.prepare('UPDATE panel_catalog_snapshots SET status=? WHERE id=?').bind('active',data.snapshot).run();return catalogJson({ok:true,nodes:nodes.count,links:links.count});
 }
 if(snapshot.status!=='staging')return catalogJson({error:'Este índice já foi publicado; inicie uma nova importação.'},409);
 if(data.action!=='rows'||!Array.isArray(data.nodes)||!Array.isArray(data.links)||data.nodes.length+data.links.length>200||!data.nodes.every(validCatalogNode)||!data.links.every(validCatalogLink))return catalogJson({error:'Itens inválidos'},400);
 const statements=[];
 for(let i=0;i<data.nodes.length;i+=8){const group=data.nodes.slice(i,i+8);statements.push(db.prepare('INSERT INTO panel_catalog_nodes (snapshot,id,parent,name,module,kind,size,modified_at,search) VALUES '+group.map(()=>'(?,?,?,?,?,?,?,?,?)').join(',')+' ON CONFLICT(snapshot,id) DO NOTHING').bind(...group.flatMap(n=>[data.snapshot,n.id,n.parent,n.name,n.module,n.kind,n.size,n.modifiedAt,catalogFold(n.name)])));}
 for(let i=0;i<data.links.length;i+=8){const group=data.links.slice(i,i+8);statements.push(db.prepare('INSERT INTO panel_catalog_links (snapshot,id,title,url,module,modules,folders,folder_ids,aliases,search) VALUES '+group.map(()=>'(?,?,?,?,?,?,?,?,?,?)').join(',')+' ON CONFLICT(snapshot,id) DO NOTHING').bind(...group.flatMap(l=>[data.snapshot,l.id,l.title,l.url,l.module,JSON.stringify(l.modules),JSON.stringify(l.folders),JSON.stringify(l.folderIds),JSON.stringify(l.aliases),catalogFold(l.title+' '+l.url+' '+l.folders.join(' ')+' '+l.aliases.join(' '))])));}
 if(statements.length)await db.batch(statements);return catalogJson({ok:true,nodes:data.nodes.length,links:data.links.length});
}
if(req.method!=='GET')return catalogJson({error:'Método inválido'},405);
const active=await db.prepare('SELECT a.snapshot,s.summary,s.created_at FROM panel_catalog_active a JOIN panel_catalog_snapshots s ON a.snapshot=s.id WHERE a.id=?').bind('main').first();
if(!active)return catalogJson({snapshot:null,summary:null,items:[],total:0});
const action=url.searchParams.get('action')||'meta';
if(action==='meta')return catalogJson({snapshot:active.snapshot,summary:JSON.parse(active.summary),publishedAt:active.created_at});
if(action==='path'){const id=url.searchParams.get('id');if(!catalogId(id))return catalogJson({error:'Pasta inválida'},400);const chain=await catalogPath(db,active.snapshot,id);if(!chain.length)return catalogJson({error:'Item não encontrado'},404);return catalogJson({breadcrumbs:chain,path:chain.map(n=>n.name).join('\\')});}
const offset=Math.max(0,Math.min(500000,Number(url.searchParams.get('offset'))||0)),limit=100,q=catalogFold((url.searchParams.get('q')||'').slice(0,300)),module=url.searchParams.get('module')||'',parent=url.searchParams.get('parent')||'root';
let clauses=['snapshot=?'],values=[active.snapshot],table='panel_catalog_nodes';
if(action==='links'){
 table='panel_catalog_links';if(module){clauses.push('EXISTS (SELECT 1 FROM json_each(modules) WHERE value=?)');values.push(module);}if(url.searchParams.has('folder')){clauses.push('EXISTS (SELECT 1 FROM json_each(folder_ids) WHERE value=?)');values.push(url.searchParams.get('folder'));}
}else if(action==='nodes'){
 if(!q&&!url.searchParams.has('flat')){clauses.push('parent=?');values.push(parent);}else{clauses.push('id<>?');values.push('root');}if(module){clauses.push('module=?');values.push(module);}const kind=url.searchParams.get('kind');if(['folder','file','shortcut'].includes(kind)){clauses.push('kind=?');values.push(kind);}
}else return catalogJson({error:'Consulta inválida'},400);
if(q){clauses.push("search LIKE ? ESCAPE '\\'");values.push('%'+q.replace(/[\\%_]/g,'\\$&')+'%');}
const where=clauses.join(' AND '),count=await db.prepare('SELECT COUNT(*) AS count FROM '+table+' WHERE '+where).bind(...values).first();
let items=catalogRows(await db.prepare('SELECT * FROM '+table+' WHERE '+where+' ORDER BY '+(action==='nodes'?"CASE kind WHEN 'folder' THEN 0 ELSE 1 END,name COLLATE NOCASE":'title COLLATE NOCASE')+' LIMIT ? OFFSET ?').bind(...values,limit,offset).all());
items=items.map(({snapshot,search,...item})=>action==='links'?{...item,folders:JSON.parse(item.folders),folderIds:JSON.parse(item.folder_ids),modules:JSON.parse(item.modules),aliases:JSON.parse(item.aliases),folder_ids:undefined}:item);
return catalogJson({snapshot:active.snapshot,items,total:count.count,nextOffset:offset+items.length<count.count?offset+items.length:null,...(action==='nodes'&&!q?{breadcrumbs:await catalogPath(db,active.snapshot,parent)}:{})});
}
