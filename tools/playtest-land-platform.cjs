// Ordinary input-only chapter run. No position, health, timer or story overrides.
const {chromium}=require(process.env.NARUTO_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[],missing=[],trace=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 await p.addInitScript(()=>{window.gameTools={};document.modelContext={registerTool:t=>window.gameTools[t.name]=t,unregisterTool:n=>delete window.gameTools[n]};});
 await p.goto('http://127.0.0.1:3000/');await p.waitForTimeout(2000);
 await p.getByRole('button',{name:'Chapter 01: Land of Waves'}).click();
 await p.waitForFunction(()=>!!window.gameTools.run_combat_playtest&&window.gameTools.read_game_status.execute({}).screen==='title',null,{timeout:90000});
 await p.evaluate(()=>window.gameTools.start_chapter.execute({}));
 await p.waitForFunction(()=>['intro','playing'].includes(window.gameTools.read_game_status.execute({}).screen));
 let retries=0;
 for(let i=0;i<35;i++){
  const result=await p.evaluate(()=>window.gameTools.run_combat_playtest.execute({milliseconds:30000}));
  const s=await p.evaluate(()=>window.gameTools.read_game_status.execute({}));
  trace.push({screen:s.screen,phase:s.phase,health:s.health,ultimate:s.ultimate,elapsed:s.elapsedSeconds,details:s.details});
  console.log(JSON.stringify({batch:i,screen:s.screen,phase:s.phase,health:s.health,boss:s.details?.boss?.health,cinema:s.details?.cinema?.id}));
  fs.writeFileSync('outputs/land-platform-playthrough.json',JSON.stringify({trace,retries,errors,missing},null,2));
  if(s.screen==='victory')break;
  if(s.screen==='dead'){retries++;await p.evaluate(()=>window.gameTools.retry_checkpoint.execute({}));}
  if(result.error)throw Error(result.error);
 }
 const final=trace.at(-1);await p.screenshot({path:'outputs/land-platform-ending.png'});
 assert.equal(final.screen,'victory');assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log(JSON.stringify({passed:true,retries,elapsed:final.elapsed,errors,missing}));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
