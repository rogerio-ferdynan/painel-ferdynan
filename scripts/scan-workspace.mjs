import {readdirSync,readFileSync,writeFileSync,mkdirSync,statSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
const args=Object.fromEntries(process.argv.slice(2).reduce((a,v,i,all)=>{if(v.startsWith('--'))a.push([v.slice(2),all[i+1]]);return a;},[]));
if(!args.root||!args.bookmarks||!args.output)throw Error('Use --root <pasta> --bookmarks <HTML> --output <pasta privada>');
const root=path.resolve(args.root),output=path.resolve(args.output),snapshot=randomUUID();
const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,24);
const decode=s=>s.replace(/&#x([a-f0-9]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&(amp|quot|apos|lt|gt|nbsp);/g,(_,n)=>({amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' '}[n]));
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const nodes=[],errors=[];
nodes.push({id:'root',parent:'',name:root,kind:'folder',module:'other',size:0,modifiedAt:''});
function visit(dir,parent,module){let entries;try{entries=readdirSync(dir,{withFileTypes:true})}catch(e){errors.push({parent,error:e.code||'read_error'});return;}
 for(const entry of entries){const full=path.join(dir,entry.name),rel=path.relative(root,full),id=hash(rel.normalize('NFC')),code=parent==='root'?(entry.name.match(/^(\d{2})_/)?.[1]||'other'):module;const kind=entry.isSymbolicLink()?'shortcut':entry.isDirectory()?'folder':'file';let size=0,modifiedAt='';if(kind==='file')try{const s=statSync(full);size=s.size;modifiedAt=s.mtime.toISOString();}catch(e){errors.push({parent:id,error:e.code||'stat_error'});}
 nodes.push({id,parent,name:entry.name,kind,module:code,size,modifiedAt});if(kind==='folder')visit(full,id,code);
 }}
// Directory entries only: file contents, private keys and certificates are never opened.
visit(root,'root','other');
const original=readFileSync(args.bookmarks,'utf8');
function parseBookmarks(html){const stack=[],out=[];let pending='';for(const token of html.matchAll(/<H3\b[^>]*>[\s\S]*?<\/H3>|<DL\b[^>]*>|<\/DL\s*>|<A\b[^>]*>[\s\S]*?<\/A>/gi)){const t=token[0];if(/^<H3/i.test(t))pending=decode(t.replace(/<[^>]+>/g,''));else if(/^<\/DL/i.test(t))stack.pop();else if(/^<DL/i.test(t)){stack.push(pending);pending='';}else{const raw=t.match(/\bHREF\s*=\s*(["'])([\s\S]*?)\1/i)?.[2];if(!raw)continue;out.push({url:decode(raw),title:decode(t.replace(/<[^>]+>/g,'')).trim(),folders:stack.filter(Boolean)});}}return out;}
function canonical(url){try{const u=new URL(url);if(['http:','https:'].includes(u.protocol)){for(const key of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid)$/i.test(key))u.searchParams.delete(key);u.searchParams.sort();return u.href.replace(/\/$/,'');}return url.trim();}catch{return url.trim();}}
const imported=parseBookmarks(original),existing=[];
// Preserve the current panel's links too; no network requests are made to private URLs.
for(const file of ['web/index.html','web/tour-model.mjs','web/calendar.js','web/upgrade.js']){
 const source=readFileSync(file,'utf8');for(const match of source.matchAll(/href=["'](https?:\/\/[^"'<>\s]+)["'][^>]*>([^<]*)/gi)){existing.push({url:decode(match[1]),title:decode(match[2].replace(/\s*'\s*\+.*$/,'')).trim()||new URL(match[1]).hostname,folders:['Links existentes do painel']});}
}
existing.push({url:'https://painel.rogerioferdynan.com/',title:'Painel Ferdynan · Central de operações',folders:['08 · Centro de Controle']},{url:'https://www.bandsintown.com/a/15376245-rogerio-ferdynan',title:'Bandsintown · Perfil público',folders:['01 · Artista']});
const modules=new Map(nodes.filter(n=>n.parent==='root'&&/^\d{2}$/.test(n.module)).map(n=>[n.module,n]));
function category(folders,title,url){for(const s of [...folders].reverse()){const m=s.match(/(?:^|\s)(\d{2})\s*[·_—–-]/);if(m&&modules.has(m[1]))return m[1];}const text=fold(title+' '+url);if(/receita|compras|sicaf|pncp|esocial|books\.zoho|contabil/.test(text))return '02';if(/bandsintown|spotify|youtube|tuner|moises|fadr|metronom/.test(text))return '01';if(/calendar|clima|weather|maps|waze/.test(text))return '05';if(/canva|capcut|adobe|design/.test(text))return '04';return '08';}
const folderRules=[[/stream|musica|music|afinador|metron|repertorio/,'01',/repertorio/],[/agenda publica|bandsintown/,'01',/midia|portfolio/],[/finance|nota fiscal|receita|esocial|pagamento/,'02',/notas_fiscais/],[/proposta|contrato/,'02',/propostas_contratos/],[/logistica|clima|transporte|rota|weather/,'05',/deslocamento|agenda_mensal/],[/edicao|design|criativ|backstage/,'04',/pesquisa|modelos_reels/],[/backup/,'06',/pastas_antigas/],[/editai|licitacao|pncp|sicaf|compras/,'02',/editais/]];
const unique=new Map();let duplicates=0;
for(const item of [...imported,...existing]){const key=canonical(item.url);if(!key)continue;const code=category(item.folders,item.title,item.url),where=modules.get(code)?.id||'root',text=fold(item.folders.join(' ')+' '+item.title+' '+item.url);let folderId=where;for(const [test,m,match]of folderRules)if(m===code&&test.test(text)){folderId=nodes.find(n=>n.kind==='folder'&&n.module===code&&match.test(fold(n.name)))?.id||where;break;}
 const found=unique.get(key);const placement=item.folders.join(' / ');if(found){duplicates++;if(!found.folders.includes(placement))found.folders.push(placement);if(!found.folderIds.includes(folderId))found.folderIds.push(folderId);if(!found.modules.includes(code))found.modules.push(code);if(!found.aliases.includes(item.title)&&found.title!==item.title)found.aliases.push(item.title);continue;}
 unique.set(key,{id:hash(key),url:item.url,title:item.title||item.url,module:code,modules:[code],folders:[placement],folderIds:[folderId],aliases:[]});
}
const links=[...unique.values()],bookmarkKeys=new Set(imported.map(x=>canonical(x.url))),additions=[];
for(const item of existing){const key=canonical(item.url);if(!bookmarkKeys.has(key)){additions.push(item);bookmarkKeys.add(key);}}
const now=new Date().toISOString();const summary={root,scannedAt:now,folders:nodes.filter(n=>n.kind==='folder').length-1,files:nodes.filter(n=>n.kind==='file').length,shortcuts:nodes.filter(n=>n.kind==='shortcut').length,nodes:nodes.length,links:links.length,originalBookmarks:imported.length,duplicateReferences:duplicates,addedBookmarks:additions.length,errors,modules:[...modules].map(([code,n])=>({code,id:n.id,name:n.name,folders:nodes.filter(x=>x.module===code&&x.kind==='folder').length,files:nodes.filter(x=>x.module===code&&x.kind==='file').length,links:links.filter(x=>x.modules.includes(code)).length})),rules:['Inbox: revisar e encaminhar em até 48 horas.','Produção: preservar RAW, trabalhar em EDIT/WIP e guardar FINAL.','Vendas: Base geral → Qualificados → Fechados → Pagamentos.','Backup: manter cópia local e cópia na nuvem.','Segurança: manter certificados e acessos em local protegido.','Delegação: documentar tarefas repetitivas em checklists.','Centro de controle: manter o mapa de pastas atualizado.','Resultados: registrar conquistas e metas atingidas.']};
mkdirSync(output,{recursive:true});
summary.modules.sort((a,b)=>a.code.localeCompare(b.code));
writeFileSync(path.join(output,'catalogo-privado.json'),JSON.stringify({version:1,snapshot,summary,nodes,links}));
const groups=new Map();for(const item of additions){const code=category(item.folders,item.title,item.url);if(!groups.has(code))groups.set(code,[]);groups.get(code).push(item);}
const block='\n<DT><H3>FERDYNAN · Complementos do painel · '+now.slice(0,10)+'</H3>\n<DL><p>\n'+[...groups].sort().map(([code,items])=>'<DT><H3>'+escape(modules.get(code)?.name||'Outros links')+'</H3>\n<DL><p>\n'+items.map(x=>'    <DT><A HREF="'+escape(x.url)+'">'+escape(x.title)+'</A>').join('\n')+'\n</DL><p>').join('\n')+'\n</DL><p>\n';
const last=original.toLowerCase().lastIndexOf('</dl>');const updated=additions.length?(last<0?original+block:original.slice(0,last)+block+original.slice(last)):original;
const updatedPath=path.join(output,'Favoritos_Ferdynan_ATUALIZADOS_'+now.slice(0,10)+'.html');if(!existsSync(updatedPath))writeFileSync(updatedPath,updated);else throw Error('Arquivo de favoritos de saída já existe. Escolha outra pasta de saída.');
const incrementalPath=path.join(output,'Favoritos_SOMENTE_NOVOS_'+now.slice(0,10)+'.html');
writeFileSync(incrementalPath,'<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Complementos Ferdynan</TITLE>\n<H1>Complementos Ferdynan</H1>\n<DL><p>\n'+block+'\n</DL><p>');
writeFileSync(path.join(output,'relatorio-importacao.json'),JSON.stringify({snapshot,summary,updatedBookmarks:updatedPath},null,2));
console.log(JSON.stringify({snapshot,folders:summary.folders,files:summary.files,links:summary.links,originalBookmarks:summary.originalBookmarks,addedBookmarks:summary.addedBookmarks,duplicateReferences:duplicates,errors:errors.length,privateCatalog:path.join(output,'catalogo-privado.json'),updatedBookmarks:updatedPath,incrementalBookmarks:incrementalPath}));
