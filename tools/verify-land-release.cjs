const {chromium}=require(process.env.NARUTO_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=(b,json=false)=>crypto.createHash('sha256').update(json?JSON.stringify(JSON.parse(b.toString('utf8'))):b).digest('hex');
(async()=>{
 const url=process.env.NARUTO_TEST_URL||'http://127.0.0.1:3002/';
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[],assets={};p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.gameTools={};document.modelContext={registerTool:t=>window.gameTools[t.name]=t,unregisterTool:n=>delete window.gameTools[n]};});
 await p.goto(url);await p.waitForTimeout(2000);await p.getByRole('button',{name:'Chapter 01: Land of Waves'}).click();
 await p.waitForFunction(()=>window.gameTools.read_game_status?.execute({}).screen==='title',null,{timeout:90000});
 await p.getByRole('button',{name:/^Controls/}).first().click();const text=await p.getByRole('dialog').innerText();
 assert.ok(text.includes('Charged smash'));assert.ok(text.includes('Left-stick click'));assert.ok(text.includes('W A S D'));
 assert.equal(await p.evaluate(()=>!!window.gameTools.run_combat_playtest),false);
 for(const file of ['manifest.json','kakashi.webp','naruto.webp','sasuke.webp']){
  const expected=hash(fs.readFileSync(`public/art-platform/${file}`),file.endsWith('.json'));const response=await p.request.get(new URL(`art-platform/${file}`,url).href);
  assert.equal(response.status(),200);const actual=hash(await response.body(),file.endsWith('.json'));assert.equal(actual,expected);assets[file]=actual;
 }
 assert.deepEqual(errors,[]);const receipt={passed:true,url,assets,errors};fs.writeFileSync('outputs/land-platform-release.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
