/* Luma Flow • optional ambient / conversation guard (experimental DSP core)
 * Input: FFT-bin dB values, no microphone or bridge access.
 * Modes OFF | AMBIENT | CONVERSATION. NOT speech or music source separation.
 * No network, no storage, no player interaction.  */
(function(root){'use strict';
const MODES=Object.freeze({OFF:'off',AMBIENT:'ambient',CONVERSATION:'conversation'});
const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
const pow=db=>Number.isFinite(db)?Math.pow(10,Math.max(-120,Math.min(0,db))/10):0;
const db=p=>p>1e-12?10*Math.log10(p):-120;
const normalize=d=>clamp((d+87)/52);
class NoiseGuard{
 constructor({mode=MODES.OFF,profileDurationMs=2600}={}){
  if(!Object.values(MODES).includes(mode))throw Error('Unbekannter Störschutz-Modus');
  this.mode=mode;this.profileDurationMs=Math.max(800,profileDurationMs);
  this.profile=null;this.calibration=null;this.lastFrame=0;
  this.bassAverage=0;
 }
 setMode(mode){if(!Object.values(MODES).includes(mode))throw Error('Unbekannter Störschutz-Modus');this.mode=mode;this.resetDynamics()}
 resetDynamics(){this.bassAverage=0;this.lastFrame=0}
 startCalibration({sampleRate,binCount,nowMs=0}={}){
  if(!Number.isFinite(sampleRate)||sampleRate<8000||!Number.isInteger(binCount)||binCount<16)throw Error('Ungültiges Audioprofil');
  this.calibration={sampleRate,binCount,start:nowMs,samples:0,powers:new Float64Array(binCount)};
  return true;
 }
 cancelCalibration(){this.calibration=null}
 resetProfile(){this.profile=null;this.resetDynamics()}
 get profileReady(){return Boolean(this.profile)}
 get calibrating(){return Boolean(this.calibration)}
 sampleCalibration(spectrumDb,{sampleRate,nowMs}={}){
  const c=this.calibration;
  if(!c)return {progress:0,done:false,ready:this.profileReady};
  if(!spectrumDb||spectrumDb.length!==c.binCount||sampleRate!==c.sampleRate)throw Error('FFT oder Sample-Rate hat sich geändert');
  for(let i=0;i<c.binCount;i++)c.powers[i]+=pow(spectrumDb[i]);
  c.samples++;
  const progress=clamp((nowMs-c.start)/this.profileDurationMs);
  if(progress>=1){
   if(c.samples<10){this.calibration=null;throw Error('Zu wenige Audiobilder für das Raumprofil')}
   this.profile={sampleRate,binCount:c.binCount,powers:Float64Array.from(c.powers,x=>x/c.samples)};
   this.calibration=null;this.resetDynamics();
   return {progress:1,done:true,ready:true}
  }
  return {progress,done:false,ready:false}
 }
 process(spectrumDb,{sampleRate,nowMs=0}={}){
  if(!spectrumDb||!spectrumDb.length||!Number.isFinite(sampleRate)||sampleRate<=0)throw Error('Ungültige FFT-Daten');
  const profile=this.profile;
  const matched=profile&&profile.sampleRate===sampleRate&&profile.binCount===spectrumDb.length;
  const spectralSubtraction=Boolean(this.mode!==MODES.OFF&&matched);
  const bins=new Float32Array(spectrumDb.length);
  let total=0,clean=0;
  for(let i=0;i<spectrumDb.length;i++){
   const original=pow(spectrumDb[i]);
   total+=original;
   const subtract=spectralSubtraction?profile.powers[i]*(this.mode===MODES.CONVERSATION?2.25:1.6):0;
   const corrected=Math.max(0,original-subtract);
   clean+=corrected;bins[i]=db(corrected);
  }
  const band=(lo,hi)=>{
   const size=bins.length,step=sampleRate/(2*size),a=Math.max(1,Math.floor(lo/step)),b=Math.min(size,Math.max(a+1,Math.ceil(hi/step)));
   if(b<=a)return -120;
   let sum=0;for(let i=a;i<b;i++)sum+=pow(bins[i]);
   return db(sum/(b-a))
  };
  const raw={bass:normalize(band(35,210)),mid:normalize(band(250,3500)),high:normalize(band(3500,9000))};
  const dt=this.lastFrame?clamp((nowMs-this.lastFrame)/1000,.001,.1):.033;
  this.lastFrame=nowMs;
  // A persistent fan/vacuum generates much less positive transient energy than music beats.
  // It still may cause false positives; calibration is recommended.
  const prior=this.bassAverage;
  const coefficient=1-Math.exp(-dt/.65);
  this.bassAverage+=(raw.bass-this.bassAverage)*coefficient;
  const transient=clamp((raw.bass-prior)*2.2);
  let bands=raw,signal=Math.sqrt((raw.bass**2+raw.mid**2+raw.high**2)/3);
  if(this.mode===MODES.CONVERSATION){
   // Suppress effects driven by mid/high speech-like energy; do NOT identify speech.
   // This also reduces music vocals/instruments, a documented intentional tradeoff.
   bands={bass:raw.bass,mid:raw.mid*.13,high:raw.high*.12};
   signal=clamp(raw.bass*.53+transient*.4+raw.mid*.035);
  }
  return {bands,signal:clamp(signal),transient,filteredSpectrum:bins,profileReady:matched?true:false,
    protectionActive:this.mode!==MODES.OFF&&Boolean(matched),
    suppression:total>1e-12?clamp(1-clean/total):0,
    mode:this.mode,calibrating:this.calibrating};
 }
}
root.LumaFlowNoiseGuard={NoiseGuard,MODES};
if(typeof module!=='undefined'&&module.exports)module.exports={NoiseGuard,MODES};
})(typeof globalThis!=='undefined'?globalThis:this);
