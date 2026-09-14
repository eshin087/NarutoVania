// Public fight selection + ordinary actions; regression for Arcade drag cancelling air drift.
const {chromium}=require(process.env.NARUTO_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[],results=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.gameTools={};document.modelContext={registerTool:t=>window.gameTools[t.name]=t,unregisterTool:n=>delete window.gameTools[n]};});
 await p.goto('http://127.0.0.1:3000/');await p.waitForTimeout(2000);await p.getByRole('button',{name:'Chapter 01: Land of Waves'}).click();
 await p.waitForFunction(()=>window.gameTools.read_game_status?.execute({}).screen==='title',null,{timeout:90000});
 const read=()=>p.evaluate(()=>window.gameTools.read_game_status.execute({}));
 const sequence=steps=>p.evaluate(steps=>window.gameTools.play_input_sequence.execute({steps}),steps);
 for(const label of ['Kakashi · Assassin of the Mist','Naruto + Sasuke · Rescue Kakashi','Sasuke · Crystal Ice Mirrors']){
  for(const dir of ['left','right']){
   await p.getByRole('button',{name:'DEBUG / SCENE SELECT',exact:false}).first().click();await p.getByRole('button',{name:label,exact:false}).click();await p.waitForTimeout(250);
   const before=(await read()).details.player;
   const result=await sequence([{actions:['jump'],ms:90},{actions:[],ms:30},{actions:[dir,'melee'],ms:190}]);
   const after=result.details.player,sign=dir==='left'?-1:1;
   assert.ok((after.x-before.x)*sign>15,`${label} ${dir}: air displacement ${after.x-before.x}`);
   assert.ok(after.velocity.x*sign>180,`${label} ${dir}: vx ${after.velocity.x}`);
   assert.ok(after.y<before.y-50);results.push({label,dir,before,after});
  }
 }
 await p.addStyleTag({content:'.br-menu {visibility:hidden !important;}'}); // Hide paused HTML only for sprite inspection.
 for(const [label,id] of [['Kakashi · Assassin of the Mist','kakashi'],['Naruto + Sasuke · Rescue Kakashi','naruto'],['Sasuke · Crystal Ice Mirrors','sasuke']]){
  await p.getByRole('button',{name:'DEBUG / SCENE SELECT',exact:false}).first().click();await p.getByRole('button',{name:label,exact:false}).click();await p.waitForTimeout(200);
  const result=await sequence([{actions:['left'],ms:40},{actions:['jump'],ms:180},{actions:[],ms:30},{actions:['down','melee'],ms:175}]);
  assert.equal(result.details.player.facing,-1);assert.equal(result.details.player.texture,`platform-${id}`);assert.equal(result.details.player.frame,'20');
  await p.screenshot({path:`outputs/land-platform-${id}-left-down.png`});results.push({label,leftDown:result.details.player});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('outputs/land-platform-focused.json',JSON.stringify({passed:true,results,errors},null,2));
 console.log(JSON.stringify({passed:true,results,errors}));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
