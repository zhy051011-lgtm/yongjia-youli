import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPlan,normalizeProfile,InputError} from '../lib/planner.mjs';
import {resources} from '../lib/catalog.mjs';
test('各种时间/片区/交通条件下不超预算、不重复、不跨片区',()=>{
  for(const duration of [120,240,480])for(const zone of ['自动','岩头','三江','茗岙','岩坦'])for(const transport of ['自驾','公共交通'])for(const slow of [true,false])for(const rain of [true,false]){
    const p=buildPlan({duration,zone,transport,slow,rain});
    assert.ok(p.used<=duration);assert.equal(p.used+p.remaining,duration);assert.equal(new Set(p.stops.map(r=>r.id)).size,p.stops.length);assert.ok(new Set(p.stops.map(r=>r.zone)).size<=1);
    let prior=0;for(const stop of p.stops){const [h,m]=stop.start.split(':').map(Number),start=h*60+m;assert.ok(start>=prior);prior=start+stop.stay;assert.ok(stop.sources.length>0);}
  }
});
test('排除指定地点后不会再次出现；排除全部时诚实返回空行程',()=>{const a=buildPlan();const b=buildPlan({...a.profile,excludes:a.stops.map(s=>s.id)});assert.ok(b.stops.every(s=>!a.stops.some(t=>t.id===s.id)));assert.equal(buildPlan({excludes:resources.map(r=>r.id)}).stops.length,0);});
test('少走路排除山地资源；雨天只给场馆候选且提示核验',()=>{assert.ok(buildPlan({slow:true,interests:['自然']}).stops.every(s=>!s.mountain));const p=buildPlan({rain:true});assert.ok(p.stops.every(s=>!s.outdoor));assert.ok(p.notices.some(n=>n.includes('不代表真实天气')));});
test('减少时间后重新计算，不能把原来的多站行程压成同一时刻',()=>{const p=buildPlan({duration:480});const s=buildPlan({...p.profile,duration:120});assert.ok(s.stops.length<p.stops.length);assert.ok(s.used<=120);});
test('拒绝无效日期、跨夜时间、非法时长及字段类型',()=>{for(const p of [{date:'2026-02-30'},{start:'23:00',duration:240},{duration:-1},{duration:'hello'},{transfer:-2},{zone:'不存在'},{interests:'古村'}])assert.throws(()=>normalizeProfile(p),InputError);});
test('每条资源有可追溯 HTTPS 来源，不声称实时可预订',()=>{for(const r of resources){assert.equal(r.availability,'待确认');assert.ok(r.sources.length);assert.ok(r.confirm.length);for(const s of r.sources)assert.equal(new URL(s.url).protocol,'https:');}});
