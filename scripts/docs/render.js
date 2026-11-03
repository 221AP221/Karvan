const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
  const files=process.argv.slice(2);
  const b=await chromium.launch();
  for(const f of files){
    const svg=fs.readFileSync(f,'utf8');
    const m=/width="(\d+)" height="(\d+)"/.exec(svg);
    fs.writeFileSync('_w.html','<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff}</style>'+svg);
    const p=await b.newPage({viewport:{width:+m[1],height:+m[2]},deviceScaleFactor:2});
    await p.goto('file://'+process.cwd()+'/_w.html');
    const el=await p.$('svg');
    await el.screenshot({path:f.replace(/\.svg$/,'.png')});
    await p.close();
    console.log(f.replace(/\.svg$/,'.png'));
  }
  await b.close();
})();
