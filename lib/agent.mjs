import {resources,searchResources} from './catalog.mjs';
import {buildPlan,normalizeProfile} from './planner.mjs';
import {getWeather} from './weather.mjs';

const profileSchema={type:'object',properties:{date:{type:'string'},start:{type:'string'},duration:{type:'integer',enum:[120,240,480]},transfer:{type:'integer',enum:[15,30,45,60]},zone:{type:'string',enum:['自动','岩头','三江','茗岙','岩坦']},group:{type:'string',enum:['亲子','朋友','情侣','独行']},transport:{type:'string',enum:['自驾','公共交通']},interests:{type:'array',items:{type:'string',enum:['古村','亲子','手作','摄影','慢游','自然']}},slow:{type:'boolean'},rain:{type:'boolean'},excludes:{type:'array',items:{type:'string'}}},additionalProperties:false};
const tools=[
  {type:'function',function:{name:'find_resources',description:'检索有出处的永嘉文化资料，空查询返回全部。不证明当天开放。',parameters:{type:'object',properties:{query:{type:'string'}},required:['query'],additionalProperties:false}}},
  {type:'function',function:{name:'build_itinerary',description:'使用规则计算行程并更新页面。传入需修改的需求字段，未传字段继承当前行程。必须调用此工具才能声称已调整行程。',parameters:profileSchema}},
  {type:'function',function:{name:'get_weather',description:'查询指定日期的县域参考点真实天气预报。失败或超范围不能推测。',parameters:{type:'object',properties:{date:{type:'string',description:'YYYY-MM-DD'}},required:['date'],additionalProperties:false}}}
];

function extractText(answer) {
  const content=(answer.content||'').trim();
  if(content) return content;
  const reasoning=(answer.reasoning_content||'').trim();
  if(reasoning) return reasoning;
  return '';
}

export async function runAgent({message,history=[],profile={}}) {
  if(typeof message!=='string'||!message.trim()||message.length>1600) throw new Error('请输入 1–1600 字的问题。');
  if(!process.env.DEEPSEEK_API_KEY) return {configured:false,text:'DeepSeek 尚未配置。请在本机运行配置密钥脚本并重启后端。当前仍可使用表单与快捷按钮完成规则规划。',steps:[],plan:null};
  const current=normalizeProfile(profile);
  const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
  const system=`你是“永嘉有礼”的永嘉文化旅行管家，像一位熟悉楠溪江、有分寸的本地朋友。你的核心能力不是堆砌资料，而是“听懂 + 融汇 + 回应”：先理解用户这句话的真实意图，再把工具返回的零散信息整合成一段有用、有温度、有行动建议的回答。

【听懂意图】
- 用户说“你好”“在吗”“今天心情不错”时，先自然回应，不要查资料或推销行程。
- 用户提到具体地点（芙蓉古村、苍坡、丽水街、瓯窑小镇、茗岙、林坑等）或具体需求（推荐、规划、天气、特色、带孩子、拍照、慢慢逛）时，再调用工具。
- 用户问题模糊（如“有什么好玩的”），先追问一个维度：时间、同行人、兴趣，再决定怎么查。
- 每次回应只针对用户当前这句话；不要替用户预判三步以后。

【融汇资料】
- 调用 find_resources 拿到资料后，不要逐条罗列。把关键信息捏成一段有主线的回答：这个地方是什么气质、适合谁、怎么逛更有趣。
- 调用 get_weather 后，把天气结论融入建议，而不是单独报一组数字。
- 调用 build_itinerary 后，用通俗语言复述安排逻辑（为什么选这几个点、时间怎么分配、雨天/带孩子怎么调整），再给出下一步选择。
- 如果同时查资料和查天气，把两者整合成一个完整建议，不要分成两段。

【工具使用纪律】
- 需要文化背景/资源信息 → find_resources
- 需要调整/生成行程 → build_itinerary
- 需要天气 → get_weather
- 不要为调用而调用；没有明确需要时，宁可闲聊。

【语气与节奏】
- 像朋友聊天，有温度、有停顿、有互动，不要列条款、不要AI腔。
- 多用“你可以……”“我觉得……”“要我先帮你看看……”这类商量语气。
- 不确定就坦诚说“这个我先帮你确认一下”，绝不硬编。
- 一般回答控制在250字以内；需要解释行程逻辑时可以稍长，但不要超过400字。

【底线】
- 禁止编造地址、电话、门票、交通时间、开放状态、预约成功或实时活动。
- 资料里的历史活动（如往年研学、节庆）不代表当天可参加，必须说明。
- 时间计算只是预算分配，不等于真实路线可行；转场时间由用户设置，未接入实时路况。
- 不声称具备未接入的地图路程、订单、支付能力。
- 所有待核验信息要明确标注。

今天是 ${today}。当前已保存的行程需求（仅作参考，用户没提就不要主动使用）：${JSON.stringify(current)}`;
  const safeHistory=Array.isArray(history)?history.filter(h=>h&&['user','assistant'].includes(h.role)&&typeof h.content==='string').slice(-8).map(h=>({role:h.role,content:h.content.slice(0,1600)})):[];
  const messages=[{role:'system',content:system},...safeHistory,{role:'user',content:message}];
  let plan=null; const steps=[];
  for(let turn=0;turn<4;turn++) {
    const response=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${process.env.DEEPSEEK_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||'deepseek-flash',thinking:{type:'enabled'},messages,tools,tool_choice:turn===3?'none':'auto',temperature:0.3,max_tokens:1300}),signal:AbortSignal.timeout(25000)});
    if(!response.ok) throw new Error(response.status===401?'模型密钥无效，请在本机检查配置。':response.status===402?'模型账户余额不足，请检查账户。':'模型服务暂不可用，请稍后重试。');
    const data=await response.json(), answer=data.choices?.[0]?.message;
    if(!answer) throw new Error('模型没有返回有效内容。');
    if(!answer.tool_calls?.length) return {configured:true,text:extractText(answer)||'已完成查询，请查看行程与信息来源。',plan,steps,model:data.model};
    messages.push(answer);
    for(const call of answer.tool_calls.slice(0,5)) {
      let result;
      try {
        const args=JSON.parse(call.function.arguments||'{}');
        if(call.function.name==='find_resources') {result=searchResources(String(args.query||'').slice(0,100)); steps.push({name:'查询文化资料',detail:`找到 ${result.length} 条有出处的资料`});}
        else if(call.function.name==='build_itinerary') {plan=buildPlan({...current,...(plan?.profile||{}),...args}); result=plan; steps.push({name:'重新计算行程',detail:`安排 ${plan.stops.length} 站，分配 ${plan.used} 分钟；交通与开放仍待核验`});}
        else if(call.function.name==='get_weather') {const d=normalizeProfile({date:args.date}).date;result=await getWeather(d);steps.push({name:'查询天气预报',detail:result.available?`${d} · 县域参考点`:result.message});}
        else result={error:'不支持的工具'};
      } catch {result={error:'工具未完成，请调整参数或提示用户稍后再试；不要补造结果。'};steps.push({name:'查询未完成',detail:'没有使用推测数据替代工具结果'});}
      messages.push({role:'tool',tool_call_id:call.id,content:JSON.stringify(result)});
    }
    if(answer.tool_calls.length>5) throw new Error('本次查询过于复杂，请分步提出需求。');
  }
  return {configured:true,text:'已执行查询，请查看当前行程；本次未获得完整文字回复。',plan,steps};
}
