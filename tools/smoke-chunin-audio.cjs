// Production-safe UI/audio probe. Never edits fighter state, resources, or clocks.
const {chromium}=require(process.env.NARUTO_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.NARUTO_BROWSER||(process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined),headless:true});
  const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],missing=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)missing.push([r.status(),r.url()]);});
  await p.addInitScript(()=>{
    window.gameTools={};
    document.modelContext={registerTool:t=>window.gameTools[t.name]=t,unregisterTool:n=>delete window.gameTools[n]};
    window.audioProbe={contexts:[],peak:0,samples:0};
    const Base=window.AudioContext;
    window.AudioContext=class extends Base {
      constructor(...args){super(...args);window.audioProbe.contexts.push(this);}
      createDynamicsCompressor(){
        const node=super.createDynamicsCompressor(),analyser=this.createAnalyser(),zero=this.createGain();
        analyser.fftSize=2048;zero.gain.value=0;node.connect(analyser);analyser.connect(zero);zero.connect(this.destination);
        const data=new Float32Array(analyser.fftSize),timer=setInterval(()=>{
          if(this.state==='closed'){clearInterval(timer);return;}
          analyser.getFloatTimeDomainData(data);
          for(const x of data)window.audioProbe.peak=Math.max(window.audioProbe.peak,Math.abs(x));
          window.audioProbe.samples+=data.length;
        },8);
        return node;
      }
    };
  });
  const read=()=>p.evaluate(()=>window.gameTools.read_game_status.execute({}));
  await p.goto(process.env.NARUTO_TEST_URL||'http://127.0.0.1:3002/');
  await p.getByRole('button',{name:'Chapter 02: The Power of Youth'}).click();
  await p.getByRole('button',{name:'Enter the arena'}).waitFor({timeout:60000});
  const saved=await p.evaluate(()=>localStorage.getItem('narutovania.chapters.v3'));
  await p.getByRole('button',{name:'Debug / Scene Select',exact:true}).click();
  for(const label of ['Palm','Kick','Lotus impact','Parry','Attack tell','Sand cast','Sand eruption','Ricochet']){
    await p.getByRole('button',{name:label,exact:true}).click();await p.waitForTimeout(700);
    assert.equal((await read()).audio.effects,0);
  }
  const decoded=await p.evaluate(async()=>{
    const profile=await (await fetch('/audio-chunin/manifest.json')).json(),c=window.audioProbe.contexts[0];
    const result=[];
    for(const r of profile.records){const data=await (await fetch(r.file)).arrayBuffer(),b=await c.decodeAudioData(data);result.push({id:r.id,seconds:b.duration,channels:b.numberOfChannels});}
    return result;
  });
  assert.equal(decoded.length,21);assert.ok(decoded.every(r=>r.channels===1&&r.seconds>.1&&r.seconds<.5));
  await p.getByRole('button',{name:'The Fifth Gate · Fight'}).click();
  await p.waitForTimeout(1500);await p.keyboard.press('r');await p.waitForTimeout(2500);
  await p.keyboard.down('d');await p.waitForTimeout(1100);await p.keyboard.up('d');
  for(const key of ['q','j','f','j','e','j']){await p.keyboard.press(key);await p.waitForTimeout(500);}
  await p.waitForTimeout(13500);await p.keyboard.press('Escape');await p.waitForTimeout(350);
  const paused=await read();assert.equal(paused.screen,'paused');assert.equal(paused.audio.effects,0);assert.equal(paused.audio.music,0);
  assert.deepEqual(paused.audio.missing,[]);
  assert.equal(await p.evaluate(()=>localStorage.getItem('narutovania.chapters.v3')),saved);
  await p.getByRole('button',{name:'Chapters',exact:false}).first().click();await p.waitForTimeout(500);
  const probe=await p.evaluate(()=>({peak:window.audioProbe.peak,samples:window.audioProbe.samples,contexts:window.audioProbe.contexts.map(c=>c.state)}));
  assert.ok(probe.peak>0&&probe.peak<.98);assert.ok(probe.contexts.every(s=>s==='closed'));
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  const report={passed:true,decoded,probe,paused:paused.audio,errors,missing,listening:'Not performed; analyser checks are not subjective listening.'};
  fs.mkdirSync('outputs',{recursive:true});fs.writeFileSync('outputs/ch2-audio-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
