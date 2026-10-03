// Renders the home screen icons and the link preview card from public/assets/app-icon.svg.
// Needs Playwright with Chromium (see the README browser test setup): node scripts/make-app-images.cjs
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const assets=path.join(__dirname,'..','public','assets');
const icon=fs.readFileSync(path.join(assets,'app-icon.svg'),'utf8');
const font=fs.readFileSync(path.join(__dirname,'..','public','vendor','fonts','hanken-grotesk-latin-wght-normal.woff2')).toString('base64');
const charger=x=>'<g transform="translate('+x+' 52)"><rect width="26" height="36" rx="5" fill="#122b3e" stroke="#d4e99b" stroke-width="3"/><circle cx="13" cy="13" r="4" fill="#d4e99b"/></g>';
const strip='<svg class="strip" viewBox="0 0 1200 130" fill="none"><path d="M0 116H250V96H560V116H1200" stroke="#d4e99b" stroke-width="3"/><path d="M640 116V40H760V116M760 40H880V116M880 40H1000V116" stroke="#d4e99b" stroke-opacity=".45" stroke-width="2"/>'+[220,520,688,808,928].map(charger).join('')+'</svg>';
const card='<!doctype html><meta charset="utf-8"><style>@font-face{font-family:H;src:url(data:font/woff2;base64,'+font+') format("woff2");font-weight:100 900}'+
 'html,body{margin:0}body{width:1200px;height:630px;font-family:H,sans-serif}.card{position:relative;width:1200px;height:630px;overflow:hidden;color:#fff;background:radial-gradient(700px 420px at 88% 18%,#24546f 0%,transparent 70%),linear-gradient(135deg,#183a52,#0e2232)}'+
 '.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px);background-size:40px 40px}'+
 '.icon{position:absolute;left:96px;top:84px;width:124px;height:124px;border-radius:28px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,.35)}.icon svg{width:100%;height:100%;display:block}'+
 '.eyebrow{position:absolute;left:98px;top:250px;font-size:22px;letter-spacing:4px;font-weight:700;color:#d4e99b}h1{position:absolute;left:92px;top:284px;margin:0;font-size:96px;line-height:1;letter-spacing:-3.5px;font-weight:750}'+
 'p{position:absolute;left:98px;top:404px;width:820px;margin:0;font-size:31px;line-height:1.42;color:#c3d3df}.strip{position:absolute;left:0;bottom:0;width:1200px;height:130px}</style>'+
 '<div class="card"><div class="grid"></div><div class="icon">'+icon+'</div><div class="eyebrow">SURVEYS · PLANS · REPORTS</div><h1>EV Site Planner</h1><p>Mark up site plans, place chargers and cable routes, and prepare plans and reports for EV charging installations.</p>'+strip+'</div>';
(async()=>{
 const browser=await chromium.launch({...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});
 const page=await browser.newPage();
 for(const size of [180,192,512]){
  await page.setViewportSize({width:size,height:size});
  await page.setContent('<!doctype html><style>html,body{margin:0}svg{display:block;width:'+size+'px;height:'+size+'px}</style>'+icon);
  await page.screenshot({path:path.join(assets,'app-icon-'+size+'.png')});
 }
 await page.setViewportSize({width:1200,height:630});await page.setContent(card);await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:path.join(assets,'social-card.png')});
 await browser.close();console.log('Wrote app-icon-180/192/512.png and social-card.png');
})();
