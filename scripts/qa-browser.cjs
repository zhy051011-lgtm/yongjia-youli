const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts');
fs.mkdirSync(out,{recursive:true});const cache=path.join(root,'.cache');fs.mkdirSync(cache,{recursive:true});process.env.TEMP=cache;process.env.TMP=cache;
const {chromium}=require(process.argv[2]||'playwright');
(async()=>{
 const context=await chromium.launchPersistentContext(path.join(cache,'browser-profile'),{headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',viewport:{width:1365,height:900},deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:3188');await page.getByText('规则规划可用',{exact:true}).waitFor();await page.screenshot({path:path.join(out,'desktop-home.png'),fullPage:true});
 await page.getByRole('button',{name:'规划我的一天'}).click();await page.getByRole('button',{name:'生成我的行程'}).click();await page.locator('.stop-card').first().waitFor();assert.ok(await page.locator('.stop-card').count()>=2);await page.screenshot({path:path.join(out,'desktop-plan.png'),fullPage:true});
 await page.getByRole('button',{name:'压缩到 2 小时',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.stop-card').length===1);await page.screenshot({path:path.join(out,'desktop-adjusted.png'),fullPage:true});
 await page.getByRole('button',{name:'找雨天备选',exact:true}).click();await page.getByRole('heading',{name:'瓯窑小镇',exact:true}).waitFor();assert.ok(await page.getByText(/不代表真实天气/).count());
 await page.getByRole('button',{name:'文化手册',exact:true}).click();await page.locator('.resource-card').first().waitFor();assert.equal(await page.locator('.resource-card').count(),6);await page.getByPlaceholder('找一个古村、一门工艺，或一个片区…').fill('芙蓉');assert.equal(await page.locator('.resource-card').count(),1);await page.screenshot({path:path.join(out,'desktop-sources.png'),fullPage:true});
 await page.getByRole('button',{name:'和文化管家聊聊'}).click();await page.getByPlaceholder('例如：把行程压缩到两小时，保留古村…').fill('介绍一下芙蓉古村');await page.getByRole('button',{name:'发送 ↑'}).click();await page.locator('.chat-bubble.bot').last().filter({hasText:'尚未配置'}).waitFor();await page.getByRole('button',{name:'关闭文化管家'}).click();
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'发现永嘉'}).click();await page.screenshot({path:path.join(out,'mobile-home.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await page.getByRole('button',{name:'我的行程',exact:true}).click();await page.screenshot({path:path.join(out,'mobile-plan.png'),fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await page.setViewportSize({width:920,height:650});await page.goto('http://127.0.0.1:3188/assets/landscape.svg');await page.locator('svg').screenshot({path:path.join(root,'public/assets/landscape.png')});fs.mkdirSync(path.join(root,'miniprogram/assets'),{recursive:true});fs.copyFileSync(path.join(root,'public/assets/landscape.png'),path.join(root,'miniprogram/assets/landscape.png'));
 fs.writeFileSync(path.join(out,'browser-qa.json'),JSON.stringify({desktop:[1365,900],mobile:[390,844],checks:['首页渲染','生成多站行程','两小时重规划','雨天备选与标注','资源搜索','未配置AI明确提示','手机页面无横向溢出'],pageErrors:errors},null,2));assert.equal(errors.length,0);await context.close();console.log('Browser QA passed; screenshots and native-miniapp artwork saved.');
})().catch(e=>{console.error(e);process.exit(1);});
