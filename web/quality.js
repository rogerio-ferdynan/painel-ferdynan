function initQuality(){
const main=document.querySelector('main');main.id='main-content';main.tabIndex=-1;
const skip=document.createElement('a');skip.href='#main-content';skip.className='skip-content';skip.textContent='Pular para o conteúdo';skip.onclick=e=>{e.preventDefault();main.focus();main.scrollIntoView({block:'start'});};document.body.prepend(skip);
const tabs=document.querySelector('.workspace-tabs'),buttons=[...tabs.querySelectorAll('button')];tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Seções do painel');
const content=document.querySelector('.content'),monthly=document.querySelector('[aria-label="Controle de Shows, Metas e Saúde Vocal"]');content.id='workspace-tasks';monthly.id='workspace-shows';
const panels={all:document.getElementById('tour-overview'),tasks:content,shows:monthly,calendar:document.getElementById('calendar-panel'),marketing:document.getElementById('marketing-panel'),structure:document.getElementById('catalog-panel')};
const valid=value=>Object.hasOwn(panels,value);let current='all',ready=false;
buttons.forEach((button,index)=>{const key=button.dataset.view;button.id='tab-'+key;button.type='button';button.setAttribute('role','tab');button.removeAttribute('aria-pressed');button.setAttribute('aria-controls',panels[key].id);panels[key].setAttribute('role','tabpanel');panels[key].setAttribute('aria-labelledby',button.id);panels[key].tabIndex=0;button.addEventListener('keydown',event=>{if(event.ctrlKey||event.altKey||event.metaKey)return;const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(!delta&&!['Home','End'].includes(event.key))return;event.preventDefault();const target=buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+delta+buttons.length)%buttons.length];target.focus();window.FerdynanSetView(target.dataset.view);});});
const connection=document.createElement('p');connection.className='connection-message';connection.id='connection-message';connection.setAttribute('role','status');document.querySelector('.cloud-bar').after(connection);
function connectivity(){connection.hidden=navigator.onLine;connection.textContent=navigator.onLine?'':'Você está sem conexão. Confira o status de salvamento antes de sair. Alterações ainda não confirmadas precisam ser enviadas à nuvem.';}connectivity();window.addEventListener('online',connectivity);window.addEventListener('offline',connectivity);
function sync(key){if(!valid(key))return;current=key;buttons.forEach(button=>{const active=button.dataset.view===key;button.removeAttribute('aria-pressed');button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;});Object.entries(panels).forEach(([name,panel])=>{panel.hidden=name!==key;});
document.title=(buttons.find(b=>b.dataset.view===key)?.textContent||'Painel')+' · Painel Ferdynan';
if(key==='shows')document.querySelectorAll('iframe[data-src]').forEach(frame=>{frame.src=frame.dataset.src;delete frame.dataset.src;});
if(ready&&location.hash!=='#'+key)history.pushState(null,'','#'+key);
}
document.addEventListener('ferdynan:view',event=>sync(event.detail));
window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(valid(key)&&key!==current)window.FerdynanSetView(key);});
window.addEventListener('popstate',()=>{const key=location.hash.slice(1)||'all';if(valid(key)&&key!==current)window.FerdynanSetView(key);});
const initial=location.hash.slice(1);window.FerdynanSetView(valid(initial)?initial:'all');if(!valid(initial))history.replaceState(null,'','#all');ready=true;
document.addEventListener('invalid',event=>{if(event.target.matches('input,select,textarea'))event.target.setAttribute('aria-invalid','true');},true);
document.addEventListener('input',event=>{if(event.target.matches('input,select,textarea')&&event.target.validity.valid)event.target.removeAttribute('aria-invalid');});
document.querySelectorAll('.notification').forEach(n=>n.setAttribute('aria-atomic','true'));
}
if(document.readyState==='complete')initQuality();else document.addEventListener('DOMContentLoaded',initQuality);
