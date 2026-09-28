import {resources} from './catalog.mjs';
import {randomUUID} from 'node:crypto';
export class InputError extends Error {}
const allowedTags = ['古村','亲子','手作','摄影','慢游','自然'];
export function normalizeProfile(p={}) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new InputError('请提供有效的旅行需求。');
  const duration=Number(p.duration ?? 240), transfer=Number(p.transfer ?? 30);
  if (![120,240,480].includes(duration)) throw new InputError('可用时间请选择 2 小时、半天或一天。');
  if (![15,30,45,60].includes(transfer)) throw new InputError('转场预留请选择 15、30、45 或 60 分钟。');
  const date=p.date || new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date) throw new InputError('出行日期无效。');
  const start=p.start || '09:00';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) throw new InputError('开始时间无效。');
  const startMinutes=Number(start.slice(0,2))*60+Number(start.slice(3));
  if (startMinutes+duration>1440) throw new InputError('行程跨越午夜，请提前开始或缩短时长。');
  const zone=p.zone || '自动';
  if (!['自动','岩头','三江','茗岙','岩坦'].includes(zone)) throw new InputError('请选择支持的片区。');
  const group=['亲子','朋友','情侣','独行'].includes(p.group)?p.group:'亲子';
  const transport=['自驾','公共交通'].includes(p.transport)?p.transport:'自驾';
  if (p.interests!==undefined && !Array.isArray(p.interests)) throw new InputError('兴趣必须为列表。');
  const interests=[...new Set((p.interests || ['古村','亲子']).filter(t=>allowedTags.includes(t)))];
  const excludes=[...new Set((Array.isArray(p.excludes)?p.excludes:[]).filter(id=>resources.some(r=>r.id===id)))];
  return {date,start,duration,transfer,zone,group,transport,interests,excludes,slow:p.slow===true,rain:p.rain===true};
}
const clock=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
export function buildPlan(raw={}) {
  const p=normalizeProfile(raw), steps=[];
  let candidates=resources.filter(r=>!p.excludes.includes(r.id));
  if (p.zone!=='自动') candidates=candidates.filter(r=>r.zone===p.zone);
  if (p.slow) candidates=candidates.filter(r=>!r.mountain);
  if (p.rain) candidates=candidates.filter(r=>!r.outdoor);
  const score=r=>p.interests.filter(t=>r.tags.includes(t)).length*10 + (p.group==='亲子'&&r.tags.includes('亲子')?3:0) + (p.slow&&r.tags.includes('慢游')?2:0);
  candidates.sort((a,b)=>score(b)-score(a)||resources.indexOf(a)-resources.indexOf(b));
  steps.push({name:'读取旅行需求',detail:`${p.group} · ${p.duration/60} 小时 · ${p.transport}`});
  steps.push({name:'筛选资源',detail:`从 ${resources.length} 条有来源资料中筛选，得到 ${candidates.length} 个候选`});
  const zone = p.zone==='自动' ? (candidates[0]?.zone || '') : p.zone;
  candidates=candidates.filter(r=>r.zone===zone);
  const limit = p.transport==='公共交通' || p.slow ? 2 : 3;
  const initial=Number(p.start.slice(0,2))*60+Number(p.start.slice(3));
  let used=0; const stops=[], breaks=[];
  for (const r of candidates) {
    if (stops.length>=limit) break;
    const transfer=stops.length?p.transfer:0;
    const stay=r.minutes+(p.slow?30:0);
    const lunch=(p.duration===480 && stops.length===1)?60:0;
    if (used+transfer+stay+lunch>p.duration) continue;
    if (lunch) {breaks.push({after:stops.length,minutes:60,label:'用餐与休息',start:clock(initial+used),end:clock(initial+used+60)}); used+=60;}
    used+=transfer;
    const matches=p.interests.filter(t=>r.tags.includes(t));
    stops.push({...r,start:clock(initial+used),end:clock(initial+used+stay),stay,transfer,reason:matches.length?`与你选择的“${matches.join('、')}”相关；安排在${zone}片区内。`:`位于${zone}片区，作为当前条件下的文化探索候选。`});
    used+=stay;
  }
  const notices=['开放、门票和课程尚未核实；请逐项查看待确认清单。','停留时长是规划建议，转场时间是你设置的预留，未接入实时路程计算。','时间范围从第一站开始，到最后一站结束；往返住宿地或车站的时间需另留。'];
  if (p.transport==='公共交通') notices.push('尚未查询公交班次；不能据此保证公共交通衔接。');
  if (p.rain) notices.push('当前为你手动选择的雨天备选条件，不代表真实天气；室内场馆是否开放仍需确认。');
  if (p.slow) notices.push('少走路模式减少点位并排除山地候选，但未核验无障碍条件或实际步数。');
  if (!stops.length) notices.unshift('当前条件下没有可安排的点位。请增加时间、切换片区或放宽条件，不会强行生成路线。');
  steps.push({name:'控制转场',detail:zone?`仅安排${zone}片区；不跨片区拼接行程`:'没有匹配片区'});
  steps.push({name:'校验时间预算',detail:`已分配 ${used} 分钟 / 可用 ${p.duration} 分钟`});
  return {id:randomUUID(),profile:p,title:stops.length?`${zone} · ${p.slow?'慢慢走的':'你的'}文化时光`:'暂未找到合适行程',zone,stops,breaks,used,remaining:p.duration-used,end:clock(initial+used),steps,notices,createdAt:new Date().toISOString(),mode:'rules',feasibility:'待核验交通与开放情况'};
}
export function diffPlans(before,after) {
  if (!before?.stops) return [];
  const old=before.stops.map(s=>s.id), now=after.stops.map(s=>s.id);
  return [...before.stops.filter(s=>!now.includes(s.id)).map(s=>`移除：${s.name}`),...after.stops.filter(s=>!old.includes(s.id)).map(s=>`加入：${s.name}`),...(before.used!==after.used?[`时间分配：${before.used} → ${after.used} 分钟`]:[])];
}
