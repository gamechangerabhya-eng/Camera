import { FilesetResolver, ImageSegmenter } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/+esm';

const MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm';

class AiCameraStudio extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.stream = null;
    this.segmenter = null;
    this.running = false;
    this.lastVideoTime = -1;
    this.lastInference = 0;
    this.mode = 'executive-office';
    this.customBg = null;
    this.uploadedPhoto = null;
    this.frozen = false;
    this.blurPx = 18;
    this.threshold = 0.58;
    this.edgeSoftness = 0.07;
    this.portraitCleanup = true;
    this.temporalMask = null;
    this.assetBg = new Image();
  }

  connectedCallback() {
    this.render();
    this.bind();
    this.assetBg.src='backgrounds/executive-office.jpg';
    this.initializeModel();
  }

  disconnectedCallback() { this.stopCamera(); }

  render() {
    this.shadowRoot.innerHTML = `
    <style>
      *{box-sizing:border-box} :host{display:block;width:100%;min-height:100vh;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;background:linear-gradient(135deg,#070b18 0%,#111a35 48%,#161a2d 100%);color:#f8fafc;overflow:auto}
      button,.upload{font:inherit}.shell{max-width:1440px;margin:auto;padding:24px}.topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}.brand{display:flex;gap:12px;align-items:center}.logo{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(145deg,#7567ff,#28b7ff);box-shadow:0 8px 30px #5769ff55;font-size:22px}.brand h1{font-size:21px;margin:0}.brand p{margin:3px 0 0;color:#94a3b8;font-size:13px}.badge{font-size:12px;font-weight:800;color:#8be0bd;border:1px solid #2d6652;background:#12362988;padding:7px 11px;border-radius:999px}
      .workspace{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:20px}.viewer,.panel{border:1px solid #ffffff15;background:#ffffff0d;backdrop-filter:blur(20px);box-shadow:0 24px 80px #0005;border-radius:26px}.viewer{padding:16px}.stage{position:relative;overflow:hidden;border-radius:20px;background:#060913;aspect-ratio:16/10;border:1px solid #ffffff12}.stage:after{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 60px #0006}.stage video,.stage canvas{position:absolute;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}.stage video{opacity:0}.empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;color:#94a3b8;background:radial-gradient(circle at center,#17213c,#070b17 70%)}.empty .camIcon{width:76px;height:76px;margin:0 auto 14px;display:grid;place-items:center;border-radius:24px;background:#ffffff0c;border:1px solid #ffffff18;font-size:32px}.empty b{display:block;color:white;font-size:22px;margin-bottom:6px}
      .viewerBottom{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px}.status{font-size:13px;color:#aab7ca;display:flex;align-items:center;gap:8px}.status:before{content:'';width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 12px #4ade80}.status.error{color:#fecaca}.status.error:before{background:#ef4444}.actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      button,.upload{border:1px solid #ffffff15;padding:10px 14px;border-radius:13px;font-weight:750;cursor:pointer;background:#ffffff0c;color:#e8edf7;display:inline-flex;align-items:center;justify-content:center;gap:7px;transition:.18s transform,.18s background,.18s border}.primary{border:0;background:linear-gradient(135deg,#6e5cff,#3db8ff);color:#fff;box-shadow:0 9px 24px #526dff45}.danger{color:#fecaca;background:#7f1d1d2b}.actions button:hover,.upload:hover,.bg:hover{transform:translateY(-1px);border-color:#ffffff35}button:disabled{opacity:.4;cursor:not-allowed;transform:none}
      .panel{padding:18px;max-height:calc(100vh - 96px);overflow:auto;scrollbar-width:thin}.panelHeader{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.panel h2{font-size:17px;margin:0}.panel .hint{font-size:12px;color:#8ea0b8}.backgrounds{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.bg{position:relative;min-height:94px;border-radius:16px;overflow:hidden;padding:0;border:2px solid transparent;background:#222;color:white;background-size:cover;background-position:center}.bg span{position:absolute;inset:auto 7px 7px;padding:6px 8px;background:#050814a8;backdrop-filter:blur(10px);border-radius:9px;font-size:11px;font-weight:800;text-align:left}.bg.active{border-color:#7c6cff;box-shadow:0 0 0 3px #7567ff30}.bg[data-mode="executive-office"]{background-image:url('backgrounds/executive-office.jpg')}.bg[data-mode="home-office"]{background-image:url('backgrounds/home-office.jpg')}.bg[data-mode="conference-room"]{background-image:url('backgrounds/conference-room.jpg')}.bg[data-mode="coworking"]{background-image:url('backgrounds/coworking.jpg')}.bg[data-mode="photo-studio"]{background-image:url('backgrounds/photo-studio.jpg')}.bg[data-mode="tech-office"]{background-image:url('backgrounds/tech-office.jpg')}.white{background:#f8fafc;color:#111}.blue{background:linear-gradient(135deg,#1d4ed8,#38bdf8)}.blur{background:linear-gradient(135deg,#334155,#94a3b8)}.original{background:linear-gradient(135deg,#202838,#101423)}
      .section{padding-top:16px;margin-top:16px;border-top:1px solid #ffffff12}.labelRow{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.labelRow label{font-size:12px;font-weight:800}.labelRow small{color:#8797ae}input[type=range]{width:100%;accent-color:#7968ff}.upload{width:100%;margin-top:10px;background:#ffffff0a}.upload input{display:none}.download{width:100%;margin-top:9px}.privacy{display:flex;gap:9px;margin-top:14px;padding:10px 11px;border-radius:13px;background:#071912aa;color:#8bd8b8;font-size:11px;line-height:1.45}
      @media(max-width:960px){.shell{padding:16px}.workspace{grid-template-columns:1fr}.panel{max-height:none}.backgrounds{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:640px){:host{background:#080c18}.shell{padding:10px}.topbar{padding:6px 4px 10px}.brand p,.badge{display:none}.brand h1{font-size:17px}.logo{width:38px;height:38px;border-radius:12px}.workspace{gap:12px}.viewer,.panel{border-radius:20px}.viewer{padding:8px}.stage{border-radius:15px;aspect-ratio:3/4}.viewerBottom{display:block}.status{padding:4px 3px 10px}.actions{display:grid;grid-template-columns:1fr 1fr}.actions button,.actions .upload{min-height:46px;margin:0}.actions .primary{grid-column:1/-1}.panel{padding:14px}.backgrounds{display:flex;overflow-x:auto;gap:9px;padding-bottom:6px;scroll-snap-type:x mandatory}.bg{flex:0 0 128px;min-height:90px;scroll-snap-align:start}.section{margin-top:13px;padding-top:13px}.download{min-height:48px}.privacy{margin-bottom:4px}}
    </style>
    <main class="shell">
      <header class="topbar"><div class="brand"><div class="logo">✦</div><div><h1>Portrait Studio AI</h1><p>Private, realtime background replacement in your browser</p></div></div><div class="badge">● AI READY</div></header>
      <div class="workspace">
        <section class="viewer">
          <div class="stage"><video playsinline muted></video><canvas></canvas><div class="empty"><div><div class="camIcon">▣</div><b>Ready for your portrait</b><span>Open the camera or upload a photo to begin</span></div></div></div>
          <div class="viewerBottom"><div class="status">Loading AI segmentation...</div><div class="actions"><button class="primary open">Open Camera</button><label class="upload photoUpload">Upload Photo<input class="photoFile" type="file" accept="image/*"></label><button class="capture" disabled>Capture</button><button class="switch" disabled>Flip</button><button class="danger stop" disabled>Stop</button></div></div>
        </section>
        <aside class="panel">
          <div class="panelHeader"><h2>Professional backgrounds</h2><span class="hint">Live preview</span></div>
          <div class="backgrounds">
            <button class="bg active" data-mode="executive-office"><span>Executive</span></button><button class="bg" data-mode="home-office"><span>Home Office</span></button><button class="bg" data-mode="conference-room"><span>Conference</span></button><button class="bg" data-mode="coworking"><span>Coworking</span></button><button class="bg" data-mode="photo-studio"><span>Photo Studio</span></button><button class="bg" data-mode="tech-office"><span>Tech Office</span></button><button class="bg white" data-mode="white"><span>Clean White</span></button><button class="bg blue" data-mode="blue"><span>Corporate Blue</span></button><button class="bg blur" data-mode="blur"><span>Smart Blur</span></button><button class="bg original" data-mode="original"><span>Original</span></button>
          </div>
          <div class="section"><div class="labelRow"><label>Detection precision</label><small>Person only</small></div><input class="thresholdRange" type="range" min="42" max="78" value="58"><div class="labelRow" style="margin-top:12px"><label>Edge refinement</label><small>Hair & shoulders</small></div><input class="edgeRange" type="range" min="2" max="18" value="7"><label class="cleanupToggle" style="display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding:11px;border-radius:12px;background:#ffffff0a;font-size:12px;font-weight:800"><span>Portrait cleanup <small style="display:block;font-weight:500;color:#8797ae">Reject chairs and side objects</small></span><input class="cleanupCheck" type="checkbox" checked style="width:20px;height:20px;accent-color:#7968ff"></label><div class="labelRow" style="margin-top:12px"><label>Background blur</label><small>Depth</small></div><input class="blurRange" type="range" min="4" max="35" value="18"></div>
          <div class="section"><label class="upload">＋ Upload custom background<input class="bgFile" type="file" accept="image/*"></label><button class="primary download" disabled>Download portrait</button><div class="privacy"><b>✓</b><span>Camera access stops immediately after capture. Processing stays in the browser.</span></div></div>
        </aside>
      </div>
    </main>`;
    this.video=this.$('video'); this.canvas=this.$('canvas'); this.ctx=this.canvas.getContext('2d',{willReadFrequently:true});
  }

  $(q){return this.shadowRoot.querySelector(q)}
  $all(q){return [...this.shadowRoot.querySelectorAll(q)]}
  bind(){
    this.$('.open').onclick=()=>this.openCamera(); this.$('.stop').onclick=()=>this.stopCamera(); this.$('.capture').onclick=()=>this.capture(); this.$('.download').onclick=()=>this.download();
    this.$('.switch').onclick=()=>{this.facing=this.facing==='user'?'environment':'user';this.openCamera()};
    this.$all('.bg').forEach(b=>b.onclick=()=>{this.mode=b.dataset.mode;this.$all('.bg').forEach(x=>x.classList.toggle('active',x===b));if(this.isAssetMode())this.assetBg.src=`backgrounds/${this.mode}.jpg`;if(this.uploadedPhoto)this.processUploadedPhoto();});
    this.$('.blurRange').oninput=e=>this.blurPx=Number(e.target.value);
    this.$('.thresholdRange').oninput=e=>{this.threshold=Number(e.target.value)/100;if(this.uploadedPhoto)this.processUploadedPhoto();};
    this.$('.edgeRange').oninput=e=>{this.edgeSoftness=Number(e.target.value)/100;if(this.uploadedPhoto)this.processUploadedPhoto();};
    this.$('.cleanupCheck').onchange=e=>{this.portraitCleanup=e.target.checked;this.temporalMask=null;if(this.uploadedPhoto)this.processUploadedPhoto();};
    this.$('.photoFile').onchange=e=>this.loadPhoto(e);
    this.$('.bgFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const im=new Image();im.onload=()=>{this.customBg=im;this.mode='custom';this.$all('.bg').forEach(x=>x.classList.remove('active'))};im.src=URL.createObjectURL(f)};
  }

  async initializeModel(){
    try{
      const vision=await FilesetResolver.forVisionTasks(WASM);
      this.segmenter=await ImageSegmenter.createFromOptions(vision,{baseOptions:{modelAssetPath:MODEL,delegate:'GPU'},runningMode:'VIDEO',outputConfidenceMasks:true,outputCategoryMask:false});
      this.setStatus('AI model ready. Open the camera.');
    }catch(e){this.setStatus('AI model failed to load: '+e.message,true)}
  }

  async openCamera(){
    try{
      this.stopTracks(); this.uploadedPhoto=null; this.frozen=false; this.temporalMask=null; this.facing=this.facing||'user';
      this.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:this.facing},width:{ideal:1280},height:{ideal:720}},audio:false});
      this.video.srcObject=this.stream; await this.video.play(); this.running=true; this.$('.empty').style.display='none'; this.$('.capture').disabled=false;this.$('.stop').disabled=false;this.$('.switch').disabled=false;
      if(this.segmenter)await this.segmenter.setOptions({runningMode:'VIDEO'});this.canvas.width=this.video.videoWidth||1280;this.canvas.height=this.video.videoHeight||720;this.setStatus(this.segmenter?'Realtime AI segmentation active.':'Camera active; waiting for AI model...');requestAnimationFrame(t=>this.loop(t));
    }catch(e){this.setStatus('Camera access failed. Allow camera permission in the browser. '+e.message,true)}
  }
  stopTracks(){if(this.stream)this.stream.getTracks().forEach(t=>t.stop())}
  stopCamera(showEmpty=true){this.running=false;this.stopTracks();this.stream=null;if(this.video)this.video.srcObject=null;if(this.shadowRoot){this.$('.empty').style.display=showEmpty?'grid':'none';this.$('.capture').disabled=true;this.$('.stop').disabled=true;this.$('.switch').disabled=true}}
  setStatus(s,err=false){const x=this.$('.status');x.textContent=s;x.classList.toggle('error',err)}

  loop(now){
    if(!this.running)return;
    if(this.video.readyState>=2&&this.segmenter&&this.video.currentTime!==this.lastVideoTime&&now-this.lastInference>33){
      this.lastVideoTime=this.video.currentTime;this.lastInference=now;
      this.segmenter.segmentForVideo(this.video,now,r=>this.compose(r));
    }else if(!this.segmenter&&this.video.readyState>=2){this.ctx.drawImage(this.video,0,0,this.canvas.width,this.canvas.height)}
    requestAnimationFrame(t=>this.loop(t));
  }

  isAssetMode(){return ['executive-office','home-office','conference-room','coworking','photo-studio','tech-office'].includes(this.mode)}
  drawCover(ctx,img,w,h){const r=Math.max(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*r,dh=img.naturalHeight*r;ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh)}
  drawBackground(w,h){
    const c=this.ctx;if(this.isAssetMode()){if(this.assetBg.complete&&this.assetBg.naturalWidth)this.drawCover(c,this.assetBg,w,h);else{this.assetBg.onload=()=>{};this.assetBg.src=`backgrounds/${this.mode}.jpg`;c.fillStyle='#263142';c.fillRect(0,0,w,h)}return}if(this.mode==='original'){c.drawImage(this.video,0,0,w,h);return}
    if(this.mode==='custom'&&this.customBg){c.drawImage(this.customBg,0,0,w,h);return}
    if(this.mode==='blur'){c.save();c.filter=`blur(${this.blurPx}px)`;c.drawImage(this.video,-25,-25,w+50,h+50);c.restore();return}
    const grads={studio:['#111827','#687386'],office:['#173b63','#d5edf7'],beach:['#55bdec','#f5d58e'],nature:['#174d2b','#9bd17f'],white:['#ffffff','#f1f5f9'],blue:['#2454a6','#64a1e8']};
    const pair=grads[this.mode]||grads.studio,g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,pair[0]);g.addColorStop(1,pair[1]);c.fillStyle=g;c.fillRect(0,0,w,h);
  }


  cleanPersonMask(data,w,h){
    const n=w*h,raw=new Float32Array(n),binary=new Uint8Array(n),seen=new Uint8Array(n);
    // 3x3 confidence smoothing reduces pinholes and unstable isolated pixels.
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sum=0,count=0;for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){sum+=data[yy*w+xx];count++}raw[y*w+x]=sum/count}
    for(let i=0;i<n;i++)binary[i]=raw[i]>=this.threshold?1:0;
    // Keep the largest central connected foreground component.
    let best=[],stack=[];const dirs=[-1,1,-w,w];
    for(let i=0;i<n;i++){if(!binary[i]||seen[i])continue;let comp=[];stack=[i];seen[i]=1;let central=0;
      while(stack.length){const q=stack.pop();comp.push(q);const x=q%w,y=(q/w)|0;if(x>w*.25&&x<w*.75&&y<h*.82)central++;for(const d of dirs){const z=q+d;if(z<0||z>=n||seen[z]||!binary[z])continue;if((d===-1||d===1)&&Math.abs((z%w)-x)>1)continue;seen[z]=1;stack.push(z)}}
      if(central>20&&comp.length>best.length)best=comp;
    }
    const keep=new Float32Array(n);for(const i of best)keep[i]=raw[i];
    if(this.portraitCleanup){
      // Portrait-aware lower-frame taper suppresses connected chair/desk regions
      // while preserving the central head, shoulders and torso.
      for(let y=0;y<h;y++){const yn=y/h;const half=yn<.52?.48:Math.max(.28,.48-(yn-.52)*.36);const cx=.5;
        for(let x=0;x<w;x++){const xn=x/w;if(Math.abs(xn-cx)>half)keep[y*w+x]*=.03;else if(yn>.68){const edge=Math.abs(xn-cx)/half;if(edge>.82)keep[y*w+x]*=(1-edge)/.18}}
      }
    }
    // Temporal EMA reduces flicker without delaying capture.
    if(!this.temporalMask||this.temporalMask.length!==n)this.temporalMask=keep.slice();
    else for(let i=0;i<n;i++)this.temporalMask[i]=this.temporalMask[i]*.68+keep[i]*.32;
    return this.temporalMask;
  }

  compose(result){
    const w=this.canvas.width,h=this.canvas.height,c=this.ctx;if(this.mode==='original'){c.drawImage(this.video,0,0,w,h);return}
    const mask=result.confidenceMasks?.[0];if(!mask){c.drawImage(this.video,0,0,w,h);return}
    const mw=mask.width,mh=mask.height,data=mask.getAsFloat32Array();
    const mc=document.createElement('canvas');mc.width=mw;mc.height=mh;const mx=mc.getContext('2d');const id=mx.createImageData(mw,mh);
    const keep=this.cleanPersonMask(data,mw,mh);for(let i=0;i<data.length;i++){const soft=Math.max(0,Math.min(1,(data[i]-this.threshold+this.edgeSoftness)/(this.edgeSoftness*2)));const a=keep[i]>0?Math.round(255*soft*Math.min(1,keep[i]/Math.max(.01,this.threshold))):0;id.data[i*4]=255;id.data[i*4+1]=255;id.data[i*4+2]=255;id.data[i*4+3]=a}
    mx.putImageData(id,0,0);c.clearRect(0,0,w,h);this.drawBackground(w,h);c.save();c.globalCompositeOperation='source-over';const person=document.createElement('canvas');person.width=w;person.height=h;const px=person.getContext('2d');px.drawImage(this.video,0,0,w,h);px.globalCompositeOperation='destination-in';px.filter='blur(1.2px)';px.drawImage(mc,0,0,w,h);c.drawImage(person,0,0);c.restore();mask.close?.();
  }
  capture(){
    // Freeze the already-composited frame first, then immediately release camera access.
    this.lastCapture=this.canvas.toDataURL('image/jpeg',.94);
    const frozen=new Image();
    frozen.onload=()=>{this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);this.ctx.drawImage(frozen,0,0,this.canvas.width,this.canvas.height)};
    frozen.src=this.lastCapture;
    this.frozen=true;
    this.stopCamera(false);
    this.$('.download').disabled=false;
    this.setStatus('Photo captured and camera access stopped. Download it or open the camera again.');
  }

  async loadPhoto(event){
    const file=event.target.files?.[0];
    if(!file)return;
    this.stopCamera(false);
    const image=new Image();
    image.onload=async()=>{
      this.uploadedPhoto=image;
      this.temporalMask=null;
      this.frozen=false;
      this.canvas.width=image.naturalWidth||image.width;
      this.canvas.height=image.naturalHeight||image.height;
      this.$('.empty').style.display='none';
      await this.processUploadedPhoto();
      URL.revokeObjectURL(image.src);
    };
    image.onerror=()=>this.setStatus('The selected image could not be opened.',true);
    image.src=URL.createObjectURL(file);
  }

  async processUploadedPhoto(){
    if(!this.uploadedPhoto)return;
    if(!this.segmenter){this.ctx.drawImage(this.uploadedPhoto,0,0,this.canvas.width,this.canvas.height);this.setStatus('Photo loaded; AI model is still loading.');return;}
    try{
      await this.segmenter.setOptions({runningMode:'IMAGE'});
      this.segmenter.segment(this.uploadedPhoto,result=>{
        this.composeSource(result,this.uploadedPhoto);
        this.lastCapture=this.canvas.toDataURL('image/jpeg',.94);
        this.$('.download').disabled=false;
        this.setStatus('Uploaded photo processed. Choose another background or download it.');
      });
    }catch(e){this.setStatus('Could not process uploaded photo: '+e.message,true)}
  }

  composeSource(result,source){
    const w=this.canvas.width,h=this.canvas.height,c=this.ctx;
    if(this.mode==='original'){c.clearRect(0,0,w,h);c.drawImage(source,0,0,w,h);return}
    const mask=result.confidenceMasks?.[0];if(!mask){c.drawImage(source,0,0,w,h);return}
    const mw=mask.width,mh=mask.height,data=mask.getAsFloat32Array();
    const mc=document.createElement('canvas');mc.width=mw;mc.height=mh;const mx=mc.getContext('2d');const id=mx.createImageData(mw,mh);
    const keep=this.cleanPersonMask(data,mw,mh);for(let i=0;i<data.length;i++){const soft=Math.max(0,Math.min(1,(data[i]-this.threshold+this.edgeSoftness)/(this.edgeSoftness*2)));const a=keep[i]>0?Math.round(255*soft*Math.min(1,keep[i]/Math.max(.01,this.threshold))):0;id.data[i*4]=255;id.data[i*4+1]=255;id.data[i*4+2]=255;id.data[i*4+3]=a}
    mx.putImageData(id,0,0);c.clearRect(0,0,w,h);
    if(this.mode==='blur'){c.save();c.filter=`blur(${this.blurPx}px)`;c.drawImage(source,-25,-25,w+50,h+50);c.restore()}
    else if(this.mode==='custom'&&this.customBg)c.drawImage(this.customBg,0,0,w,h);
    else this.drawBackground(w,h);
    const person=document.createElement('canvas');person.width=w;person.height=h;const px=person.getContext('2d');px.drawImage(source,0,0,w,h);px.globalCompositeOperation='destination-in';px.filter='blur(1.2px)';px.drawImage(mc,0,0,w,h);c.drawImage(person,0,0);mask.close?.();
  }

  download(){if(!this.lastCapture)return;const a=document.createElement('a');a.href=this.lastCapture;a.download=`AI_Background_${Date.now()}.jpg`;a.click()}
}
customElements.define('ai-camera-studio',AiCameraStudio);
