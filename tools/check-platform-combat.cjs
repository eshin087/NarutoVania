// Focused development checks. Resets/positions isolate cases; not evidence of a full playthrough.
const {chromium}=require(process.env.NARUTO_PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict'), fs=require('node:fs');
(async()=>{
 const timeout=setTimeout(()=>{console.error('Focused browser checks exceeded 90 seconds');process.exit(1);},90000);
 const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[],reports=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:3000/');await p.waitForTimeout(2000);console.log('page loaded');await p.getByRole('button',{name:'Chapter 02: The Power of Youth'}).click();
 await p.getByRole('button',{name:'Enter the arena'}).waitFor({timeout:90000});
 console.log('chapter loaded');
 const reset=async()=>{await p.evaluate(()=>{const s=window.chuninDev.scene;s.command({type:'debug',phase:'shield'});s.duel.nextMove=s.duel.now+100000;s.bodyPhysics.reset(550,586);s.duel.lee.x=550;s.duel.gaara.x=1000;});await p.waitForTimeout(100);};
 const hold=async(a,ms)=>{console.log('input',a.join(','));await p.evaluate(a=>window.chuninDev.inputs.inject(a),a);await p.waitForTimeout(ms);};
 const read=()=>p.evaluate(()=>{const s=window.chuninDev.scene,d=s.duel;return {x:s.body.x,y:s.body.y,vx:s.bodyPhysics.velocity.x,vy:s.bodyPhysics.velocity.y,facing:d.lee.facing,action:d.lee.action?.definition.id,charge:d.lee.chargeStarted,air:d.lee.airDashUsed,jumps:s.jumps,lag:s.landingUntil-d.now,gx:d.gaara.x,gy:d.gaara.y,hp:d.gaara.health,texture:s.lee.texture.key,frame:s.lee.frame.name,gtexture:s.gaara.texture.key}});
 await reset();await hold(['jump'],60);await hold([],120);let short=await read();await reset();await hold(['jump'],180);let full=await read();assert.ok(full.y<short.y-10);reports.push({short,full});
 await reset();await hold(['jump'],110);await hold([],40);await hold(['left','melee'],110);let back=await read();assert.equal(back.action,'pf-air-back');assert.equal(back.facing,1);assert.ok(back.vx<0);assert.equal(back.texture,'ch-lee-directional');await p.screenshot({path:'outputs/platform-back-air.png'});reports.push({back});
 await reset();await hold(['up','melee'],130);let up=await read();assert.equal(up.action,'pf-tilt-up');assert.equal(up.texture,'ch-lee-directional');reports.push({up});
 await reset();await hold(['down','tool'],350);await hold(['up','tool'],150);await hold([],80);let smash=await read();assert.equal(smash.action,'pf-smash-down');reports.push({smash});
 await reset();await hold(['jump'],120);await hold([],60);await hold(['right','up','dash'],90);let dodge=await read();assert.ok(dodge.vx>350&&dodge.vy< -350);assert.equal(dodge.air,true);await hold([],260);await hold(['dash'],50);assert.notEqual((await read()).action,'airdash');reports.push({dodge});
 await reset();await hold(['jump'],450);await hold([],60);await hold(['down'],40);let fall=await read();assert.ok(fall.vy>=1000);reports.push({fall});
 await reset();await p.evaluate(()=>{const s=window.chuninDev.scene;s.duel.gaara.x=s.duel.lee.x+65;});await hold(['up','melee'],190);let launch=await read();assert.ok(launch.gy<580);assert.equal(launch.gtexture,'ch-gaara-airborne');await p.screenshot({path:'outputs/platform-launch.png'});reports.push({launch});
 await hold([],900);assert.equal((await read()).gy,586);
 await reset();await p.evaluate(()=>{const s=window.chuninDev.scene;s.duel.hitLee(10,10,false,s.duel.lee.x+100,true);});await p.waitForTimeout(80);let hurt=await read();assert.ok(hurt.vx<0&&hurt.y<586);reports.push({hurt});
 await p.evaluate(()=>window.chuninDev.scene.command('pause'));assert.deepEqual(errors,[]);
 fs.writeFileSync('outputs/platform-focused.json',JSON.stringify({passed:true,reports,errors},null,2));console.log(JSON.stringify({passed:true,reports,errors}));await b.close();clearTimeout(timeout);
})().catch(e=>{console.error(e);process.exit(1);});
