const {chromium}=require(process.env.NARUTO_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');fs.mkdirSync('outputs',{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:process.env.NARUTO_BROWSER||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined),headless:true});
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[],missing=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push([r.status(),r.url()]);});
 await p.addInitScript(()=>{window.gameTools={};document.modelContext={registerTool:t=>window.gameTools[t.name]=t,unregisterTool:n=>delete window.gameTools[n]};window.mockButtons=Array.from({length:17},()=>({pressed:false,value:0}));window.mockConnected=false;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>window.mockConnected?[{connected:true,id:'simulated-standard',mapping:'standard',index:0,axes:[0,0],buttons:window.mockButtons}]:[]});});
 const read=()=>p.evaluate(()=>window.gameTools.read_game_status?.execute({}));
 await p.goto(process.env.NARUTO_TEST_URL||'http://127.0.0.1:3002/');await p.waitForTimeout(2000);
 await p.getByRole('button',{name:'Chapter 02: The Power of Youth'}).click();await p.getByRole('button',{name:'Enter the arena'}).waitFor({timeout:60000});
 assert.equal(await p.evaluate(()=>typeof window.chuninDev),'undefined');await p.getByRole('button',{name:'Enter the arena'}).click();await p.waitForTimeout(15500);assert.equal((await read()).screen,'playing');
 await p.keyboard.press('r');await p.waitForTimeout(2500);assert.ok((await read()).ultimate<100);
 await p.getByRole('button',{name:'Controls',exact:true}).click();const before=(await read()).elapsed;await p.keyboard.press('Escape');await p.waitForTimeout(500);assert.equal((await read()).screen,'paused');assert.equal((await read()).elapsed,before);
 await p.getByRole('button',{name:'Resume',exact:true}).click();await p.evaluate(()=>{window.mockConnected=true;window.mockButtons[15].pressed=true;window.mockButtons[15].value=1;});await p.waitForTimeout(300);assert.equal((await read()).device,'gamepad');
 await p.evaluate(()=>{window.mockButtons[15].pressed=false;window.mockButtons[15].value=0;window.mockConnected=false;});await p.waitForTimeout(150);assert.equal((await read()).device,'keyboard');
 await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await read()).screen,'paused');
 const saved=await p.evaluate(()=>localStorage.getItem('narutovania.chapters.v3'));
 for(const title of ['Weights Released','The Fifth Gate']){await p.getByRole('button',{name:'Debug / Scene Select',exact:true}).click();await p.getByRole('button',{name:title+' · Fight'}).click();await p.waitForTimeout(1800);assert.equal((await read()).screen,'playing');await p.keyboard.press('j');await p.waitForTimeout(500);}
 await p.setViewportSize({width:1024,height:768});await p.waitForTimeout(300);assert.equal(await p.locator('canvas').count(),1);
 await p.getByRole('button',{name:'Debug / Scene Select',exact:true}).click();await p.getByRole('button',{name:'Guy intervenes'}).click();await p.waitForTimeout(16500);assert.equal((await read()).screen,'victory');assert.equal(await p.evaluate(()=>localStorage.getItem('narutovania.chapters.v3')),saved);
 await p.screenshot({path:'outputs/ch2-production-ending.jpg',type:'jpeg'});
 await p.getByRole('button',{name:'Chapters',exact:false}).first().click();await p.waitForTimeout(500);assert.equal(await p.locator('canvas').count(),0);
 await p.getByRole('button',{name:'Chapter 01: Land of Waves'}).click();await p.waitForFunction(()=>window.gameTools.read_game_status?.execute({}).screen==='title',null,{timeout:90000});assert.equal(await p.locator('canvas').count(),1);
 for(const [label,phase]of [['Kakashi · Assassin of the Mist','mist'],['Naruto + Sasuke · Rescue Kakashi','rescue'],['Sasuke · Crystal Ice Mirrors','mirrors'],['Naruto · The Broken Seal','seal']]){await p.getByRole('button',{name:'DEBUG / SCENE SELECT',exact:false}).click();await p.getByRole('button',{name:label,exact:false}).click();await p.waitForTimeout(1000);assert.equal((await read()).phase,phase);}
 assert.equal(await p.evaluate(()=>!!window.gameTools.run_combat_playtest),false);
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log(JSON.stringify({passed:true,errors,missing,checks:'Ch2 intro/ultimate/modal/controller/focus/resize/debug ending/save isolation; Ch1 four fight initialization; production pilot exclusion'}));await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
