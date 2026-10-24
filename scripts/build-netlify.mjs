import {mkdirSync,writeFileSync} from 'node:fs';
import {loginPage} from '../worker/index.mjs';
const page=loginPage();
mkdirSync('netlify-public',{recursive:true});
writeFileSync('netlify-public/index.html',page);
console.log('Netlify pronto: domínio próprio e autenticação no mesmo endereço.');
