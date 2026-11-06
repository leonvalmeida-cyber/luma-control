/* LUMA FLOW V5.1 – integrated digital local-file music mode.
   No stored audio, no remote audio upload. Requires tokenized LAN relay.
   Legacy microphone and main light/scene modules remain unchanged. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const token=params.get('t')||'';
const onRelay=Boolean(token)&&location.protocol==='http:';
let ctx=null,analyser=null,source=null,url=null,streamReady=false,busy=false,stopping=false,timer=0;
let previousBass=0,bassMean=.015,beatAt=-10,pulse=0,beats=0,frames=0,runStart=0,rttSum=0,rttSamples=0;
let lastError='';
const audio=document.createElement('audio');audio.preload='metadata';audio.playsInline=true;audio.hidden=true;
function status(message){$('v51Status').textContent=message}
function mode(legacy){
 document.body.classList.toggle('v51-mode-legacy',legacy);
 document.body.classList.toggle('v51-mode-digital',!legacy);
 $('v51Toggle').textContent=legacy?'Zur digitalen Musik':'Alte Mikrofonsteuerung';
 $('v51Toggle').setAttribute('aria-pressed',String(legacy));
 if(legacy&&streamReady)stopAll('Digitale Musik beendet. Mikrofonsteuerung sichtbar.');
}
async function api(path,body,verb='POST'){
 if(!onRelay)throw new Error('Windows-Relay nicht verbunden');
 const response=await fetch('/api/'+path,{
  method:verb,credentials:'same-origin',cache:'no-store',
  headers:{'Content-Type':'application/json','X-Luma-Token':token},
  ...(verb!=='GET'?{body:JSON.stringify(body||{})}:{})
 });
 if(!response.ok){const text=await response.text();throw new Error((text||'HTTP '+response.status).slice(0,180))}
 return response.json();
}
function localBridgeRequest(method,path,body){
 if(!/^\/(lights|groups|config)(\/\d{1,3}\/state)?$/.test(path)) return Promise.reject(new Error('Dieser Bridge-Pfad ist im lokalen Test nicht erlaubt'));
 return api('hue'+path,body,method);
}
if(onRelay){
 window.lumaV51Proxy={token,request:localBridgeRequest};
}
function html(){
 const box=document.createElement('section');
 box.id='v51Digital';
 box.innerHTML=`
 <div class="v51-top">
  <span class="v51-kicker">LUMA FLOW 5.1 · MUSIK</span>
  <button type="button" class="v51-alt" id="v51Toggle" aria-pressed="false">Alte Mikrofonsteuerung</button>
 </div>
 <div class="v51-main">
 <h2>Musik wird Licht.</h2>
 <p class="v51-muted">Direkte digitale Analyse – kein Mikrofon, keine Umgebungsgeräusche. Apple-Music-Abotitel sind noch nicht verfügbar.</p>
 <p class="v51-steps">1. Musikdatei wählen &nbsp; 2. Hue verbinden &nbsp; 3. Musik + Licht starten</p>
 <label for="v51File">MP3, WAV oder ungeschützte M4A aus „Dateien“</label>
 <input id="v51File" type="file" accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg">
 <div class="v51-actions">
  <button id="v51Connect" disabled>Mit Hue verbinden</button>
  <button id="v51Play" disabled>▶ Musik + Licht</button>
  <button id="v51Stop" class="v51-alt" disabled>■ Stoppen</button>
 </div>
 <div id="v51Status" class="v51-status" role="status">Wird vorbereitet …</div>
 <div class="v51-pair"><span>Lautstärke</span><span id="v51LevelNum">0%</span></div><div class="v51-bar"><div id="v51LevelBar" class="v51-fill"></div></div>
 <div class="v51-pair"><span>Bass</span><span id="v51BassNum">0%</span></div><div class="v51-bar"><div id="v51BassBar" class="v51-fill"></div></div>
 <div class="v51-pair"><span>Mitten</span><span id="v51MidNum">0%</span></div><div class="v51-bar"><div id="v51MidBar" class="v51-fill"></div></div>
 <div class="v51-pair"><span>Höhen</span><span id="v51HighNum">0%</span></div><div class="v51-bar"><div id="v51HighBar" class="v51-fill"></div></div>
 <div class="v51-light" id="v51Preview" aria-label="Digitale Lichtvorschau"></div>
 <div class="v51-pair"><label for="v51Focus">Musikreaktion</label><select id="v51Focus"><option value="balanced">Ausgewogen</option><option value="bass">Bass</option><option value="mid">Mitten</option><option value="high">Höhen</option></select></div>
 <div class="v51-metrics">
  <div class="v51-metric"><strong id="v51Beats">0</strong><small>Bassimpulse</small></div>
  <div class="v51-metric"><strong id="v51Frames">0</strong><small>RGB-Frames</small></div>
  <div class="v51-metric"><strong id="v51Rtt">–</strong><small>PC-Antwortzeit (nicht Lichtlatenz)</small></div>
  <div class="v51-metric"><strong id="v51Clock">0 / 60 s</strong><small>Testdauer</small></div>
 </div>
 <p class="v51-muted">7 Lampen · 9 Kanäle · lokaler Windows-Streamer. Dies ist ein isolierter 60-Sekunden-Test. Während Musik läuft, bitte keine Szenen gleichzeitig schalten. Für den späteren Betrieb ohne PC ist eine weitere Lösung nötig.</p>
 </div>`;
 return box;
}
function bar(id,v){v=Math.min(100,Math.max(0,Math.round(v*100)));$(id+'Bar').style.width=v+'%';$(id+'Num').textContent=v+'%'}
function band(data,low,high){
 const hz=ctx.sampleRate/analyser.fftSize;
 const i0=Math.max(1,Math.ceil(low/hz)),i1=Math.min(data.length,Math.ceil(high/hz));
 let sum=0;for(let i=i0;i<i1;i++)sum+=data[i];
 return sum/(Math.max(1,i1-i0)*255);
}
function hsv(h,s,v){
 function component(n){const k=(n+h*6)%6;return Math.max(0,Math.min(65535,Math.round((v-v*s*Math.max(Math.min(k,4-k,1),0))*65535)))}
 return [component(5),component(3),component(1)];
}
function preview(rgb){
 const c='rgb('+rgb.map(v=>Math.round(v/257)).join(',')+')';
 const lamp=$('v51Preview');lamp.style.background=c;lamp.style.boxShadow='0 0 44px 10px '+c;
}
async function initAudio(){
 if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();source=ctx.createMediaElementSource(audio);analyser=ctx.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.23;source.connect(analyser);analyser.connect(ctx.destination)}
 await ctx.resume();
}
async function stopAll(message){
 if(stopping)return;stopping=true;clearInterval(timer);timer=0;
 audio.pause();streamReady=false;busy=false;
 $('v51Play').disabled=true;$('v51Stop').disabled=true;
 $('v51Connect').disabled=!audio.src;
 try{if(onRelay)await api('stop')}catch(e){lastError=e.message;}
 if(message)status(message+(lastError?'\nLetzter Stopp-Hinweis: '+lastError:''));
 stopping=false;
}
async function tick(){
 if(busy||stopping||!streamReady||audio.paused)return;
 const seconds=(performance.now()-runStart)/1000;
 if(seconds>=60){await stopAll('60 Sekunden abgeschlossen – Entertainment gestoppt.');return}
 busy=true;
 try{
  const bins=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(bins);
  const bass=band(bins,45,180),mid=band(bins,180,2000),high=band(bins,2000,8000);
  const level=Math.min(1,(bass*.42+mid*.38+high*.2)*1.6);
  bar('v51Level',level);bar('v51Bass',bass);bar('v51Mid',mid);bar('v51High',high);
  bassMean=bassMean*.975+bass*.025;
  const t=audio.currentTime;
  if(bass>Math.max(.05,bassMean*1.36)&&bass-previousBass>Math.max(.012,bassMean*.15)&&t-beatAt>.22){
   beats++;beatAt=t;pulse=1;$('v51Beats').textContent=String(beats);
  }
  previousBass=bass;pulse*=.76;
  const focus=$('v51Focus').value;
  const val=focus==='bass'?Math.max(bass,pulse*.86):focus==='mid'?mid:focus==='high'?high:Math.min(1,level*.78+pulse*.72);
  const bright=Math.min(.84,.045+val*.72),hue=(t/14)%1;
  const colors=Array.from({length:9},(_,i)=>hsv((hue+i*.058)%1,.91,Math.max(.025,bright*(.86+.14*Math.sin(i+t)))));
  preview(colors[0]);
  const t0=performance.now();await api('frame',{colors});
  rttSum+=performance.now()-t0;rttSamples++;frames++;
  $('v51Rtt').textContent=(rttSum/rttSamples).toFixed(1)+' ms';
  $('v51Frames').textContent=String(frames);$('v51Clock').textContent=seconds.toFixed(0)+' / 60 s';
 }catch(e){lastError=e.message;await stopAll('Übertragung gestoppt: '+e.message)}
 finally{busy=false}
}
async function connect(){
 if(!audio.src){status('Zuerst eine lokale Musikdatei auswählen.');return}
 $('v51Connect').disabled=true;status('Verbinde neun Entertainment-Kanäle …');
 try{
  await initAudio();
  if(typeof window.lumaStopMusic==='function')window.lumaStopMusic();
  const s=await api('start');
  if(s.channels!==9)throw new Error('Unerwartete Kanalzahl');
  streamReady=true;lastError='';$('v51Play').disabled=false;$('v51Stop').disabled=false;
  status('Hue bereit: 7 Lampen / 9 Kanäle. Jetzt Musik + Licht starten.');
 }catch(e){
  streamReady=false;$('v51Connect').disabled=false;
  status('Verbindung fehlgeschlagen: '+e.message);
 }
}
async function play(){
 if(!streamReady)return;
 try{
  await initAudio();await audio.play();
  frames=0;beats=0;previousBass=0;bassMean=.015;beatAt=-10;pulse=0;rttSum=0;rttSamples=0;
  $('v51Beats').textContent='0';$('v51Frames').textContent='0';
  runStart=performance.now();clearInterval(timer);timer=setInterval(tick,40);
  $('v51Play').disabled=true;$('v51Stop').disabled=false;
  status('Musik + Hue aktiv. Deine Datei bleibt auf dem iPhone.');
 }catch(e){await stopAll('Wiedergabe fehlgeschlagen: '+e.message)}
}
async function connectBridgeProxy(){
 if(!onRelay){
  status('Diese Vorschau zeigt die App. Für echte Hue-Musik bitte die lokale Windows-Adresse aus PowerShell öffnen.');
  return;
 }
 try{
  const r=await api('bridge-info',null,'GET');
  const ip=$('bridgeIp'),key=$('hueKey');
  ip.value=r.bridge;key.value='V5.1-Windows-Relay';
  const label=key.previousElementSibling;
  if(label)label.textContent='Zugriff erfolgt über dein Windows-Relay (Schlüssel bleibt am PC)';
  $('hueLoad')?.click();
  status('Windows-Relay verbunden. Musikdatei auswählen und Hue Entertainment starten.');
 }catch(e){status('Windows-Relay nicht erreichbar: '+e.message)}
}
function init(){
 const pane=$('musicPane');if(!pane)return;
 pane.prepend(html());pane.append(audio);
 mode(false);
 $('v51Toggle').onclick=()=>{const legacy=!document.body.classList.contains('v51-mode-legacy');if(!legacy)$('stop')?.click();mode(legacy)};
 $('v51File').onchange=e=>{
  if(streamReady){status('Bitte zuerst den laufenden Musikstream stoppen.');return}
  const file=e.target.files?.[0];if(!file)return;
  if(url)URL.revokeObjectURL(url);
  url=URL.createObjectURL(file);audio.src=url;audio.load();
  $('v51Connect').disabled=!onRelay;status('Datei bereit: '+file.name+'\nVerbinde jetzt Hue Entertainment.');
 };
 $('v51Connect').onclick=connect;$('v51Play').onclick=play;
 $('v51Stop').onclick=()=>stopAll('Stream beendet. Du kannst erneut verbinden.');
 audio.addEventListener('ended',()=>stopAll('Song beendet. Entertainment geschlossen.'));
 audio.addEventListener('error',()=>{if(audio.error)status('Safari kann diese Datei nicht abspielen. Bitte eine ungeschützte MP3/WAV auswählen.')});
 $('tabs')?.addEventListener('click',()=>setTimeout(()=>{if(pane.hidden&&streamReady)stopAll('Musik beim Bereichswechsel beendet.');},0));
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&streamReady)stopAll('Safari im Hintergrund – Entertainment sicher beendet.')});
 window.addEventListener('pagehide',()=>{
  clearInterval(timer);
  if(streamReady)navigator.sendBeacon('/api/stop?t='+encodeURIComponent(token),new Blob(['{}'],{type:'application/json'}));
  if(url)URL.revokeObjectURL(url);
 });
 connectBridgeProxy();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();