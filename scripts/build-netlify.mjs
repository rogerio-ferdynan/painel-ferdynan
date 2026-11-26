import {mkdirSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {loginPage} from '../worker/index.mjs';
const context=process.env.CONTEXT;
const production=context==='production';
mkdirSync('netlify-public',{recursive:true});
rmSync('netlify-public/_redirects',{force:true});
if(production){
 writeFileSync('netlify-public/index.html',loginPage());
 writeFileSync('netlify-public/_redirects','/aline /aline/index.html 200!\n/aline/ /aline/index.html 200!\n/Aline /aline 301!\n/Aline/ /aline 301!\n/* https://painel-ferdynan-omni-231026.goldenwhale131.chatgpt.site/:splat 200!\n');
 mkdirSync('netlify-public/aline',{recursive:true});
 for(const file of ['index.html','preview.svg','aline-compartilhar.jpg'])copyFileSync('Aline/'+file,'netlify-public/aline/'+file);
}else{
 // No production proxy, credentials, application assets or login in non-production builds.
 const blocked='<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Homologação bloqueada</title><h1>Homologação indisponível</h1><p>O servidor independente ainda não foi autorizado e verificado. Nenhum dado de produção pode ser acessado por esta prévia.</p></html>';
 rmSync('netlify-public/aline',{recursive:true,force:true});
 writeFileSync('netlify-public/index.html',blocked);
 writeFileSync('netlify-public/_redirects','/* /index.html 503!\n');
 writeFileSync('netlify-public/_headers','/*\n  Cache-Control: no-store\n  X-Robots-Tag: noindex, nofollow\n  Content-Security-Policy: default-src \'none\'; frame-ancestors \'none\'; form-action \'none\'\n');
}
if(production)rmSync('netlify-public/_headers',{force:true});
console.log(production?'Production routing generated.':'Non-production build blocked: no upstream.');
