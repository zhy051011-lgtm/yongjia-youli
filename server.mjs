import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resources} from './lib/catalog.mjs';
import {buildPlan,diffPlans,normalizeProfile,InputError} from './lib/planner.mjs';
import {runAgent} from './lib/agent.mjs';
import {getWeather} from './lib/weather.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
try {for(const line of fs.readFileSync(path.join(root,'.env'),'utf8').split(/\r?\n/)){const m=line.match(/^([A-Z_]+)\s*=\s*(.*)$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2].replace(/^(['"])(.*)\1$/,'$2');}}catch(e){if(e.code!=='ENOENT')console.error('配置文件读取失败。');}
const port=Number(process.env.PORT)||3188;
const hostname=process.argv.includes('--lan')||process.env.PORT?'0.0.0.0':'127.0.0.1';
const publicRoot=path.join(root,'public');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const rates=new Map();let activeAI=0,dailyAI=0,aiDay='';
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
function rate(ip,limit=80){const now=Date.now();if(rates.size>5000)rates.clear();let r=rates.get(ip);if(!r||now-r.start>60000){r={start:now,count:0};rates.set(ip,r);}return ++r.count<=limit;}
async function readBody(req){let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>65536)throw new InputError('请求内容过大。');}try{return JSON.parse(data||'{}');}catch{throw new InputError('请求格式错误。');}}
export const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  const origin=req.headers.origin, allowed=process.env.ALLOWED_ORIGIN;
  const proto=req.headers['x-forwarded-proto']||'http';
  const expected=proto+'://'+req.headers.host;
  if(origin&&origin!==expected&&origin!==allowed){json(res,403,{error:'不允许的网页来源。'});return;}
  if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, POST');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.writeHead(204);res.end();return;}
  if(!rate(req.socket.remoteAddress||'unknown')){json(res,429,{error:'请求较频繁，请一分钟后重试。'});return;}
  try {
    const url=new URL(req.url,'http://localhost');
    if(req.method==='GET'&&url.pathname==='/api/health'){json(res,200,{ok:true,name:'永嘉有礼',version:'2.0.0',aiConfigured:!!process.env.DEEPSEEK_API_KEY,resources:resources.length});return;}
    if(req.method==='GET'&&url.pathname==='/api/resources'){json(res,200,{resources});return;}
    if(req.method==='POST'&&url.pathname==='/api/plan'){const b=await readBody(req),plan=buildPlan(b.profile);json(res,200,{plan,changes:diffPlans(b.previous,plan)});return;}
    if(req.method==='GET'&&url.pathname==='/api/weather'){const date=normalizeProfile({date:url.searchParams.get('date')||undefined}).date;try{json(res,200,await getWeather(date));}catch{json(res,502,{error:'暂未取得天气预报。未使用模拟或推测天气。'});}return;}
    if(req.method==='POST'&&url.pathname==='/api/agent'){
      const body=await readBody(req);
      if(!process.env.DEEPSEEK_API_KEY){json(res,503,{error:'DeepSeek 尚未配置。请运行配置密钥脚本后重启。规则规划仍可使用。',configured:false});return;}
      const today=new Date().toISOString().slice(0,10);if(today!==aiDay){aiDay=today;dailyAI=0;}
      if(activeAI>=2||dailyAI>=100||!rate('ai:'+req.socket.remoteAddress,6)){json(res,429,{error:'AI 请求达到保护限额，请稍后再试。'});return;}
      activeAI++;dailyAI++;
      try{json(res,200,await runAgent(body));}catch(e){json(res,e instanceof InputError?400:502,{error:e.message});}finally{activeAI--;}
      return;
    }
    if(req.method!=='GET'){json(res,405,{error:'不支持的请求方式。'});return;}
    const decoded=decodeURIComponent(url.pathname),file=path.resolve(publicRoot,'.'+(decoded==='/'?'/index.html':decoded));
    if(!file.startsWith(publicRoot+path.sep)||!mime[path.extname(file)]){json(res,404,{error:'未找到页面。'});return;}
    let body;try{body=await fs.promises.readFile(file);}catch{json(res,404,{error:'未找到页面。'});return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-cache'});res.end(body);
  }catch(e){json(res,e instanceof InputError?400:500,{error:e instanceof InputError?e.message:'请求未完成，请稍后重试。'});}
});
server.requestTimeout=120000;
server.listen(port,hostname,()=>console.log(`永嘉有礼 v2 · http://localhost:${port} · ${process.env.DEEPSEEK_API_KEY?'AI 已配置（调用待验证）':'规则规划可用，AI 未配置'}${hostname==='0.0.0.0'?' · 局域网模式':''}`));
