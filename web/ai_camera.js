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
    this.mode = 'studio';
    this.customBg = null;
    this.uploadedPhoto = null;
    this.frozen = false;
    this.blurPx = 18;
  }

  connectedCallback() {
    this.render();
    this.bind();
    this.initializeModel();
  }

  disconnectedCallback() { this.stopCamera(); }

  render() {
    this.shadowRoot.innerHTML = `
    <style>
      *{box-sizing:border-box} :host{display:block;width:100%;height:100%;font-family:Inter,system-ui,Segoe UI,sans-serif;background:#f4f6fb;color:#111827;overflow:auto}
      .page{max-width:1180px;margin:auto;padding:20px}.head{text-align:center;margin-bottom:14px}.head h1{margin:0;font-size:clamp(25px,4vw,40px)}.head p{margin:7px 0;color:#64748b}
      .grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(280px,1fr);gap:18px}.card{background:white;border-radius:20px;padding:16px;box-shadow:0 12px 30px #17203a12}
      .stage{position:relative;overflow:hidden;border-radius:16px;background:#111827;aspect-ratio:16/10}.stage video,.stage canvas{position:absolute;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}.stage video{opacity:0}.empty{position:absolute;inset:0;display:grid;place-items:center;color:#cbd5e1;text-align:center;padding:20px}.empty b{font-size:24px}.status{margin:10px 0 0;color:#475569;font-size:14px}.error{color:#b91c1c}
      button,.upload{border:0;padding:11px 15px;border-radius:12px;font-weight:700;cursor:pointer;background:#eef2ff;color:#3730a3;display:inline-flex;align-items:center;justify-content:center;gap:7px}.primary{background:#5b5bd6;color:white}.danger{background:#fee2e2;color:#991b1b}.row{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}button:disabled{opacity:.5;cursor:not-allowed}
      h3{margin:0 0 12px}.backgrounds{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.bg{min-height:64px;border:2px solid transparent;background:#f8fafc}.bg.active{border-color:#5b5bd6}.office{background:linear-gradient(145deg,#1e3a5f,#b8d8e8);color:white}.beach{background:linear-gradient(#58b8e8 0 52%,#f4d28b 52%);color:#063}.nature{background:linear-gradient(145deg,#174d2b,#8ecf75);color:white}.studio{background:radial-gradient(circle,#5d6472,#111827);color:white}.white{background:#fff;border-color:#e2e8f0}.blue{background:#2f67c7;color:white}.blur{background:linear-gradient(135deg,#777,#ddd);color:white}
      input[type=range]{width:100%}.small{font-size:12px;color:#64748b;line-height:1.5}.upload input{display:none}.download{width:100%;margin-top:10px}
      @media(max-width:820px){.grid{grid-template-columns:1fr}.page{padding:12px}.backgrounds{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:520px){.backgrounds{grid-template-columns:repeat(2,1fr)}button,.upload{flex:1}}
    </style>
    <div class="page">
      <div class="head"><h1>Realtime AI Background Studio</h1><p>Live person segmentation, background replacement, photo capture and download</p></div>
      <div class="grid">
        <section class="card">
          <div class="stage"><video playsinline muted></video><canvas></canvas><div class="empty"><div><b>Camera is off</b><br>Select Open Camera and allow permission</div></div></div>
          <div class="status">Loading AI segmentation model...</div>
          <div class="row"><button class="primary open">Open Camera</button><label class="upload photoUpload">Upload Photo<input class="photoFile" type="file" accept="image/*"></label><button class="capture" disabled>Capture Photo</button><button class="danger stop" disabled>Stop Camera</button><button class="switch" disabled>Switch Camera</button></div>
        </section>
        <aside class="card">
          <h3>Choose background</h3>
          <div class="backgrounds">
            <button class="bg active studio" data-mode="studio">Studio</button><button class="bg office" data-mode="office">Office</button><button class="bg beach" data-mode="beach">Beach</button><button class="bg nature" data-mode="nature">Nature</button><button class="bg white" data-mode="white">White</button><button class="bg blue" data-mode="blue">Blue</button><button class="bg blur" data-mode="blur">Blur</button><button class="bg" data-mode="original">Original</button>
          </div>
          <label style="display:block;margin-top:16px;font-weight:700">Blur strength</label><input class="blurRange" type="range" min="4" max="35" value="18">
          <label class="upload" style="margin-top:14px;width:100%">Upload custom background<input class="bgFile" type="file" accept="image/*"></label>
          <button class="primary download" disabled>Download Last Capture</button>
          <p class="small">For the cleanest edges, use even lighting, keep the full body inside the frame, and avoid clothing that closely matches the original background.</p>
        </aside>
      </div>
    </div>`;
    this.video=this.$('video'); this.canvas=this.$('canvas'); this.ctx=this.canvas.getContext('2d',{willReadFrequently:true});
  }

  $(q){return this.shadowRoot.querySelector(q)}
  $all(q){return [...this.shadowRoot.querySelectorAll(q)]}
  bind(){
    this.$('.open').onclick=()=>this.openCamera(); this.$('.stop').onclick=()=>this.stopCamera(); this.$('.capture').onclick=()=>this.capture(); this.$('.download').onclick=()=>this.download();
    this.$('.switch').onclick=()=>{this.facing=this.facing==='user'?'environment':'user';this.openCamera()};
    this.$all('.bg').forEach(b=>b.onclick=()=>{this.mode=b.dataset.mode;this.$all('.bg').forEach(x=>x.classList.toggle('active',x===b));if(this.uploadedPhoto)this.processUploadedPhoto();});
    this.$('.blurRange').oninput=e=>this.blurPx=Number(e.target.value);
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
      this.stopTracks(); this.uploadedPhoto=null; this.frozen=false; this.facing=this.facing||'user';
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

  drawBackground(w,h){
    const c=this.ctx;if(this.mode==='original'){c.drawImage(this.video,0,0,w,h);return}
    if(this.mode==='custom'&&this.customBg){c.drawImage(this.customBg,0,0,w,h);return}
    if(this.mode==='blur'){c.save();c.filter=`blur(${this.blurPx}px)`;c.drawImage(this.video,-25,-25,w+50,h+50);c.restore();return}
    const grads={studio:['#111827','#687386'],office:['#173b63','#d5edf7'],beach:['#55bdec','#f5d58e'],nature:['#174d2b','#9bd17f'],white:['#ffffff','#f1f5f9'],blue:['#2454a6','#64a1e8']};
    const pair=grads[this.mode]||grads.studio,g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,pair[0]);g.addColorStop(1,pair[1]);c.fillStyle=g;c.fillRect(0,0,w,h);
  }

  compose(result){
    const w=this.canvas.width,h=this.canvas.height,c=this.ctx;if(this.mode==='original'){c.drawImage(this.video,0,0,w,h);return}
    const mask=result.confidenceMasks?.[0];if(!mask){c.drawImage(this.video,0,0,w,h);return}
    const mw=mask.width,mh=mask.height,data=mask.getAsFloat32Array();
    const mc=document.createElement('canvas');mc.width=mw;mc.height=mh;const mx=mc.getContext('2d');const id=mx.createImageData(mw,mh);
    for(let i=0;i<data.length;i++){const a=Math.max(0,Math.min(255,(data[i]-.12)*330));id.data[i*4]=255;id.data[i*4+1]=255;id.data[i*4+2]=255;id.data[i*4+3]=a}
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
    for(let i=0;i<data.length;i++){const a=Math.max(0,Math.min(255,(data[i]-.12)*330));id.data[i*4]=255;id.data[i*4+1]=255;id.data[i*4+2]=255;id.data[i*4+3]=a}
    mx.putImageData(id,0,0);c.clearRect(0,0,w,h);
    if(this.mode==='blur'){c.save();c.filter=`blur(${this.blurPx}px)`;c.drawImage(source,-25,-25,w+50,h+50);c.restore()}
    else if(this.mode==='custom'&&this.customBg)c.drawImage(this.customBg,0,0,w,h);
    else this.drawBackground(w,h);
    const person=document.createElement('canvas');person.width=w;person.height=h;const px=person.getContext('2d');px.drawImage(source,0,0,w,h);px.globalCompositeOperation='destination-in';px.filter='blur(1.2px)';px.drawImage(mc,0,0,w,h);c.drawImage(person,0,0);mask.close?.();
  }

  download(){if(!this.lastCapture)return;const a=document.createElement('a');a.href=this.lastCapture;a.download=`AI_Background_${Date.now()}.jpg`;a.click()}
}
customElements.define('ai-camera-studio',AiCameraStudio);
