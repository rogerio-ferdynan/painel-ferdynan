import {mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
import {loginPage} from '../worker/index.mjs';
mkdirSync('netlify-public',{recursive:true});
writeFileSync('netlify-public/index.html',loginPage());
mkdirSync('netlify-public/aline',{recursive:true});
copyFileSync('Aline/index.html','netlify-public/aline/index.html');
copyFileSync('Aline/preview.svg','netlify-public/aline/preview.svg');
console.log('ALINE static published at /aline, panel preserved.');
