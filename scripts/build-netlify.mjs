import {mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
import {loginPage} from '../worker/index.mjs';
const page=loginPage();
mkdirSync('netlify-public',{recursive:true});
writeFileSync('netlify-public/index.html',page);
mkdirSync('netlify-public/Aline',{recursive:true});
copyFileSync('Aline/index.html','netlify-public/Aline/index.html');
console.log('Netlify pronto: painel preservado e memorial ALINE em /Aline/.');
