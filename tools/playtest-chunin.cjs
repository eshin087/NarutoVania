// Development-only ordinary-input playthrough. No resource, position, clock, or outcome overrides.
require('fs').mkdirSync('outputs',{recursive:true});
const {chromium}=require(process.env.NARUTO_PLAYWRIGHT_MODULE || 'playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.NARUTO_BROWSER || (process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined),headless:true});const p=await b.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.NARUTO_TEST_URL || 'http://127.0.0.1:3000/');await p.waitForTimeout(2000);await p.getByRole('button',{name:'Chapter 02: The Power of Youth'}).click();await p.getByRole('button',{name:'Enter the arena'}).waitFor({timeout:45000});await p.getByRole('button',{name:'Enter the arena'}).click();await p.waitForTimeout(15000);
await p.evaluate(()=>{let lastAttack=0,lastSkill=0,lastDash=-1000,guardUntil=0,lastParry=-1000;window.pilotTimer=setInterval(()=>{const {scene,inputs}=window.chuninDev,d=scene.duel,l=d.lee,g=d.gaara,n=d.now;const a=[];if(scene.story||scene.ultimateAt>=0||l.health<=0){inputs.inject([]);return;}const dir=g.x>l.x?'right':'left';let dodge=0;
 for(const z of d.zones)if(z.hitAt-n<650&&z.hitAt-n>0&&Math.abs(l.x-z.x)<z.width/2+70)dodge=l.x<z.x?-1:1;
 if(d.move?.id==='storm'&&d.shots.some(q=>q.y>230&&q.y<530&&Math.abs(q.x-l.x)<75))dodge=l.x<d.move.gap?1:-1;
 const incoming=d.shots.filter(q=>!q.returned&&Math.sign(q.vx)*(l.x-q.x)>0&&Math.abs(q.y-(l.y-60))<85).map(q=>({q,t:(l.x-q.x)/q.vx*1000})).filter(v=>v.t>=0&&v.t<120).sort((a,b)=>a.t-b.t)[0];
 let meleeTell=false;
 if(d.move&&['hand','fan'].includes(d.move.id)){const age=n-d.move.start,next=d.move.windup+d.move.emitted*(d.move.id==='fan'?500:0);const eta=next-age+Math.max(0,Math.abs(g.x-l.x)-48)/.6;meleeTell=eta>0&&eta<110&&Math.abs(g.x-l.x)<230;}
 if(dodge){a.push(dodge>0?'right':'left');if(l.stamina>30&&l.canAct(n,true)&&n-lastDash>350){a.push('dash');lastDash=n;}}
 else if((incoming||meleeTell)&&l.canAct(n,true)&&n-lastParry>310){a.push(incoming?incoming.q.x>l.x?'right':'left':dir);a.push('parry');lastParry=n;guardUntil=n+180;}
 else if(n<guardUntil){a.push('parry');}
 else{
  if(Math.abs(g.x-l.x)>88)a.push(dir);
  const age=d.move?n-d.move.start:0,safeAttack=d.exposed||!d.move||age<d.move.windup-380;
  if(l.ultimate>=100&&l.canAct(n))a.push('ultimate');
  else if(safeAttack&&l.stamina>36&&Math.abs(g.x-l.x)<160){if(n-lastSkill>1000&&l.cooldown('rising-wind',n)===0){a.push('skill2');lastSkill=n;}else if(n-lastSkill>900&&l.cooldown('hurricane',n)===0){a.push('skill1');lastSkill=n;}else if(n-lastAttack>240){a.push('melee');lastAttack=n;}}
 }
 inputs.inject(a);
},20);});
let deaths=0,lastPhase='';const reports=[];for(let i=0;i<36;i++){await p.waitForTimeout(20000);const s=await p.evaluate(()=>{const x=window.chuninDev.scene,d=x.duel;return {phase:d.phase,health:d.lee.health,boss:d.gaara.health,time:d.elapsed,phaseTime:d.phaseTime,parries:d.parries,ult:d.ultimates,story:x.story,completed:document.body.innerText.includes('A splendid ninja.'),fps:x.game.loop.actualFps,fx:x.fx.items.length,shots:d.shots.length,audio:x.sounds.status()};});reports.push(s);console.log(JSON.stringify(s));if(s.phase!==lastPhase){lastPhase=s.phase;await p.screenshot({path:'outputs/ch2-final-phase-'+s.phase+'.jpg',type:'jpeg'});}if(s.completed)break;if(s.health<=0){deaths++;console.log('RETRY',deaths);if(deaths>2)break;await p.getByRole('button',{name:'Retry phase'}).click();}}
await p.evaluate(()=>{clearInterval(window.pilotTimer);window.chuninDev.inputs.inject([]);window.chuninDev.scene.command('pause');});await p.screenshot({path:'outputs/ch2-final-complete.jpg',type:'jpeg'});require('fs').writeFileSync('outputs/ch2-final-playthrough.json',JSON.stringify({reports,deaths,errors},null,2));console.log(JSON.stringify({errors,deaths}));await b.close();if(errors.length||!reports.at(-1)?.completed)process.exitCode=1;})();
