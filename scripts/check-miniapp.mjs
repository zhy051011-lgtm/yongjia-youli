import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root=new URL('../miniprogram/',import.meta.url),app=JSON.parse(fs.readFileSync(new URL('app.json',root)));
const checked=[];
for(const page of app.pages){for(const ext of ['.js','.json','.wxml']){const file=new URL(page+ext,root);if(!fs.existsSync(file))throw Error('缺少文件：'+page+ext);const text=fs.readFileSync(file,'utf8');if(ext==='.json')JSON.parse(text);if(ext==='.js')new vm.Script(text);if(ext==='.wxml'){const js=fs.readFileSync(new URL(page+'.js',root),'utf8');for(const match of text.matchAll(/bind\w+="([a-zA-Z_]\w*)"/g)){if(!new RegExp('\\b'+match[1]+'\\s*\\(').test(js))throw Error('未找到事件处理：'+page+' '+match[1]);}}checked.push(page+ext);}}
JSON.parse(fs.readFileSync(new URL('project.config.json',root)));new vm.Script(fs.readFileSync(new URL('app.js',root),'utf8'));new vm.Script(fs.readFileSync(new URL('utils/api.js',root),'utf8'));
if(!fs.existsSync(new URL('assets/landscape.png',root)))throw Error('缺少小程序插画');
const report={status:'passed',checked,scope:'页面文件、JSON、JavaScript语法、事件绑定与静态素材；不是微信开发者工具编译或真机验证'};
fs.mkdirSync(new URL('../artifacts/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../artifacts/miniapp-static-check.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
