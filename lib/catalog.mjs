const checked = '2026-09-24';
const source = (title, url, published) => ({ title, url, published, checked });
export const resources = [
  {
    id:'furong', name:'芙蓉古村', subtitle:'在古村里，读一页耕读人家', zone:'岩头', category:'古村', tags:['古村','亲子','手作'], art:'village', outdoor:true, mountain:false,
    summary:'岩头镇的传统村落，保存古民居与耕读文化。2026 年官方报道记录了宋礼、投壶、拓印、扎染等研学活动；这些是历史活动记录，不代表当前可预约。',
    task:'找一处门窗或屋檐细节，和同行的人讨论它的用途。手作课程另行确认。', minutes:90,
    sources:[source('芙蓉村：激活千年流量 打造宋韵文化研学品牌','https://wm.yj.gov.cn/col/col1352398/art/2026/art_68a6bd9e00f44fb385acfd2f750d8e65.html','2026-04-03'),source('岩头镇芙蓉村：塑美丽乡村之形 铸乡村振兴之魂','https://wm.yj.gov.cn/art/2024/3/20/art_1352397_58715513.html','2024-03-20')],
    confirm:['当天开放及门票','研学或手作课程是否面向散客','步行路况与停车位置']
  },
  {
    id:'cangpo', name:'苍坡古村', subtitle:'沿着笔街，遇见村落日常', zone:'岩头', category:'古村', tags:['古村','亲子','摄影'], art:'village', outdoor:true, mountain:false,
    summary:'岩头镇古村。县文明办的秋收文化节报道记录了笔街、文化礼堂和李氏大宗等村落空间。秋收文化节为 2023 年历史活动，本产品不将其作为当前演出安排。',
    task:'观察街巷与水面的关系，给今天最喜欢的一处村落细节起个名字。', minutes:90,
    sources:[source('岩头镇苍坡村秋收文化节举行','https://wm.yj.gov.cn/art/2023/11/27/art_1352398_58715373.html','2023-11-27')],
    confirm:['当天开放及门票','当期民俗活动安排','古村内可通行区域']
  },
  {
    id:'lishui', name:'丽水街', subtitle:'慢一点，听水与廊下的风', zone:'岩头', category:'街区', tags:['古村','摄影','慢游'], art:'street', outdoor:true, mountain:false,
    summary:'位于岩头镇的历史文化街区，水利空间与古村生活相互交织。官方介绍记录了长廊、文化业态及夜游活动的发展，当前店铺营业与活动须另行确认。',
    task:'沿长廊观察水岸与街巷，用三张照片记录同一段路的不同细节。', minutes:60,
    sources:[source('我县岩头镇丽水街社区入选2023年金3A级景区村庄名单','https://wm.yj.gov.cn/art/2024/3/5/art_1352398_58715482.html','2024-03-05')],
    confirm:['当天开放及门票','店铺和夜间活动安排','雨天廊外路段情况']
  },
  {
    id:'ouyao', name:'瓯窑小镇', subtitle:'从一抹青色，认识一方水土', zone:'三江', category:'工艺', tags:['手作','亲子','慢游'], art:'ceramic', outdoor:false, mountain:false,
    summary:'永嘉三江街道的瓯窑文化空间。官方介绍包含展览馆、工作室与瓯窑技艺传承基地等业态。可作为工艺文化探索方向，具体场馆和课程开放须先核实。',
    task:'观察器物的形状与釉色，记录你最想了解的一道制瓷工序。', minutes:120,
    sources:[source('这个五一，瓯窑小镇这些打卡点不容错过','https://www.yj.gov.cn/art/2024/4/30/art_1229760757_59103795.html','2024-04-30')],
    confirm:['展馆与工作室当天是否开放','手作课程预约、费用及年龄要求','是否具备可用的室内活动空间']
  },
  {
    id:'mingao', name:'茗岙梯田', subtitle:'在田野里，看见生长的节奏', zone:'茗岙', category:'田野', tags:['自然','摄影','亲子'], art:'terrace', outdoor:true, mountain:true,
    summary:'茗岙乡的梯田与稻鱼共生农业见于县文明办报道。这里适合了解山地农耕文化；农事参与、田鱼捕捞和进入农田都需取得当地许可。',
    task:'在允许停留的位置观察梯田层次与水流，不进入未开放农田。', minutes:120,
    sources:[source('稻香鱼肥 茗岙乡田鱼迎丰收','https://wm.yj.gov.cn/art/2023/10/24/art_1352398_58715320.html','2023-10-24')],
    confirm:['当前农时与观景条件','道路、停车及天气','农事体验是否开放']
  },
  {
    id:'linkeng', name:'黄南林坑古村', subtitle:'山间木屋，溪边人家', zone:'岩坦', category:'山村', tags:['古村','自然','摄影'], art:'village', outdoor:true, mountain:true,
    summary:'永嘉旅游发展规划提到岩坦镇黄南林坑古村，岩坦溪流域规划介绍了林坑的山地民居与溪流景观。规划资料提供文化背景，不能证明当天开放或交通状况。',
    task:'从公共道路观察民居如何顺应山势，尊重居民生活和私人空间。', minutes:120,
    sources:[source('永嘉县旅游业发展“十四五”规划','https://www.yj.gov.cn/module/download/downfile.jsp?classid=0&filename=5eedb8e860c24a0c964c41b82a33af3f.pdf',null),source('永嘉县岩坦溪流域综合治理规划','https://zjjcmspublic.oss-cn-hangzhou-zwynet-d01-a.internet.cloud.zj.gov.cn/jcms_files/jcms1/web1829/site/attach/0/542add8d19d54c0f998c7bd0b62b7b67.pdf',null)],
    confirm:['目的地为黄南林坑，避免与同名地点混淆','山路与步行条件','当天开放及门票']
  }
].map(r => ({...r, availability:'待确认', durationBasis:'产品建议预留，非官方游览时长', navigation:'https://uri.amap.com/search?keyword='+encodeURIComponent('永嘉 '+r.name)+'&city='+encodeURIComponent('温州')+'&view=map&src=yongjiayouli'}));

export function searchResources(query='') {
  const words = String(query).trim().split(/\s+/).filter(Boolean);
  return resources.filter(r => words.every(w => [r.name,r.zone,r.summary,...r.tags].join(' ').includes(w)));
}
