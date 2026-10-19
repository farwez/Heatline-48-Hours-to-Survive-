import * as THREE from 'three';
import {InputManager} from './InputManager';
import {SoundSynthesizer} from '../audio/SoundSynthesizer';
import {CharacterModel, CharacterConfig, defaultCharacterConfig} from '../player/CharacterModel';
import {ThirdPersonCamera} from '../player/ThirdPersonCamera';
import {PlayerController} from '../player/PlayerController';
import {City,locations} from '../world/City';
import {GameUI} from '../ui/GameUI';
import {State,freshState,missions,applyChoice,choiceBlock,advance,addItems,useItem,Item,endingFor,puzzleValid} from '../missions/Campaign';
import {SaveStore} from '../save/SaveStore';

type Settings={master:number;music:number;effects:number;sensitivity:number;quality:string;scale:number;subtitles:boolean;reduced:boolean;large:boolean};

export class Engine {
 private renderer:THREE.WebGLRenderer;
 private scene=new THREE.Scene();
 private camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,230);
 private clock=new THREE.Clock();
 private input:InputManager;
 private audio=new SoundSynthesizer();
 private model=new CharacterModel();
 private cameraController:ThirdPersonCamera;
 private player:PlayerController;
 private city:City;
 private ui=new GameUI();
 private store=new SaveStore();
 private state:State=freshState();
 private saved:State|null=null;
 private mode:'menu'|'play'|'cinematic'='menu';
 private panel='';
 private running=false;
 private elapsed=0;
 private hudTimer=0;
 private autosave=0;
 private introTime=0;
 private selections:number[]=[];
 private lamp=new THREE.PointLight(0xffe2ac,0,12,1.5);
 private settings:Settings={master:.65,music:.3,effects:.7,sensitivity:1,quality:'medium',scale:1,subtitles:true,reduced:false,large:false};
 private characterConfig:CharacterConfig={...defaultCharacterConfig};

 constructor(canvas:HTMLCanvasElement){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;

  // Load character customization
  try {
    const rawChar = JSON.parse(localStorage.getItem('heatline-character') || 'null');
    if (rawChar && typeof rawChar === 'object') {
      Object.assign(this.characterConfig, rawChar);
    }
  } catch {}
  this.model.applyConfig(this.characterConfig);

  this.input=new InputManager(canvas);this.city=new City(this.scene);this.scene.add(this.model.group,this.lamp);this.model.group.position.fromArray(this.state.position);
  this.cameraController=new ThirdPersonCamera(this.camera,this.model.group,{distance:4.8,targetHeight:1.4});
  this.player=new PlayerController(this.model,this.cameraController,this.input,this.audio,this.scene);this.player.stats=this.state.stats;this.player.setCollisionObjects(this.city.collisionObjects);

  try{const raw=JSON.parse(localStorage.getItem('heatline-settings')||'null');if(raw&&typeof raw==='object'){for(const k of ['master','music','effects','scale','sensitivity'] as const)if(Number.isFinite(raw[k]))this.settings[k]=THREE.MathUtils.clamp(raw[k],k==='sensitivity'?.3:0,k==='sensitivity'?2:1);for(const k of ['subtitles','reduced','large'] as const)if(typeof raw[k]==='boolean')this.settings[k]=raw[k];if(['low','medium','high'].includes(raw.quality))this.settings.quality=raw.quality;}}catch{/* Defaults remain usable. */}

  this.applySettings();
  this.ui.menu(false, this.characterConfig.gender === 'female' ? 'Ananya' : 'Aarav');
  this.ui.onAction=a=>void this.action(a);

  void this.store.load().then(s=>{this.saved=s;if(this.mode==='menu'&&!this.panel)this.ui.menu(!!s, this.characterConfig.gender === 'female' ? 'Ananya' : 'Aarav');});
  window.addEventListener('resize',()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);});
  window.addEventListener('keydown',e=>this.key(e));
  window.addEventListener('blur',()=>{if(this.mode==='play'&&!this.panel)this.pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.mode==='play'&&!this.panel)this.pause();});
  canvas.addEventListener('dblclick',()=>{if(this.mode==='play'&&!this.panel)this.input.requestPointerLock();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.pause();this.ui.toast('Graphics context lost. Reload the page to recover your checkpoint.');});
 }

 private get charName():string{ return this.characterConfig.gender === 'female' ? 'Ananya' : 'Aarav'; }
 private freeze(panel:string){this.panel=panel;this.input.clear();if(document.pointerLockElement)document.exitPointerLock();}
 private resume(){this.panel='';this.ui.dismiss();this.input.clear();}
 private get step(){return missions[this.state.mission].steps[Math.min(this.state.step,3)];}
 private get target(){return locations[this.step.target];}
 private distance(){return Math.hypot(this.model.group.position.x-this.target.x,this.model.group.position.z-this.target.z);}
 private syncPosition(){this.state.position=this.model.group.position.toArray() as [number,number,number];}
 private async save(show=false){if(this.state.ending==='Too Late')return;this.syncPosition();try{await this.store.save(this.state);this.saved=structuredClone(this.state);if(show)this.ui.toast('Checkpoint saved on this device.');}catch{this.ui.toast('Storage is unavailable. This session can continue, but progress could not be saved.');}}

 private enter(state:State){this.state=structuredClone(state);this.mode='play';this.player.stats=this.state.stats;this.model.group.position.fromArray(this.state.position);this.player.resetMotion();this.city.setCampaign(this.state.mission,this.state.flags);this.city.setTarget(this.step.target);this.ui.hud();this.resume();if(this.state.ending)this.showEnding();else this.brief();}
 private brief(){this.freeze('brief');const m=missions[this.state.mission];this.ui.panel(`CHAPTER ${String(this.state.mission+1).padStart(2,'0')} / 08 · HOURS ${m.time[0]}–${m.time[1]}`,m.title,`<p>${m.brief}</p><p><strong>Your next objective:</strong> ${this.step.title}</p><p class="intro-note">WASD / arrows to move · drag mouse to look · E to interact · I for supplies · R to rest in shade · C to customize hero. Follow the amber marker. Progress saves after every objective.</p><button class="solid-button" data-action="close">Step into the city →</button>`,false);}
 private startIntro(){this.state=freshState();this.player.stats=this.state.stats;this.model.group.position.fromArray(this.state.position);this.mode='cinematic';this.panel='';this.introTime=0;this.ui.root.innerHTML='<div class="cinematic"><button data-action="skip">SKIP INTRO ↗</button><div><div class="eyebrow">VARDHAN CITY · DAY ONE</div><div class="subtitle" id="subtitle"></div></div></div>';this.audio.playUIInteract();}
 private showEnding(){this.freeze('ending');const ending=this.state.ending||endingFor(this.state);this.state.ending=ending;const text:Record<string,string>={'The City Holds':'The buses leave, but the response does not. Water reaches the clinic. The shelter stays open. You helped turn strangers into a network that can endure.','A New Morning':'At sunrise, the city is behind you. The people who shared their last supplies are beside you. Recovery will take time, but nobody has to begin alone.','Survival at a Cost':'You made it through. Some lifelines held; others did not. The names and places you left behind stay with you.','Alone':'There is a seat for you. Beyond the window, the city disappears into dust. Survival is real. So is the silence.','Too Late':'The heat and the clock caught up with you. The last checkpoint is still available. A different route, a little more shade, or one saved bottle can change what happens next.'};this.ui.panel('48 HOURS · YOUR STORY',ending,`<p>${text[ending]}</p><div class="network"><div>CHAPTERS COMPLETED<strong>${this.state.completed.length} / 8</strong></div><div>PEOPLE ASSISTED<strong>${Object.values(this.state.trust).filter(n=>n>=2).length} / 4</strong></div><div>TIME ELAPSED<strong>${this.state.hour.toFixed(1)} hours</strong></div></div>${ending==='Too Late'?'<button class="solid-button" data-action="retry">Retry last checkpoint</button>':''}<button class="quiet-button" data-action="menu">Return to main menu</button><button class="quiet-button" data-action="new">Begin another story</button>`,false);if(ending!=='Too Late')void this.save();}

 private interaction(){if(this.mode!=='play'||this.panel)return;if(this.distance()>3){this.scavenge();return;}this.freeze('dialogue');const s=this.step;let text=s.text;
  if(s.target==='raghav'&&this.state.mission===6)text=this.state.flags.neighbor?'You came back. That bottle got me here. I have the others with me, but they need help reaching the terminal.':s.text;
  if(this.state.mission===3&&this.state.step===0)text=this.state.flags.shared?'Your bottle from the market is already in the relief supply. Maya’s team trusts you with the next delivery.':'You kept the market supplies. Maya is still willing to work with you, but the shelter is starting with less.';
  if(this.state.mission===7&&this.state.step===1)text=`${s.text} ${this.state.flags.pump?'The pump is running.':this.state.flags.cooling?'The shelter fans are running.':'The reserve has not been assigned.'} ${this.state.flags.rescue?'Raghav is guiding the remaining residents.':'Some residents are still finding their own way.'}`;
  const choices=s.choices?s.choices.map((c,i)=>{const blocked=choiceBlock(this.state,c);return `<button class="choice" data-action="choice:${i}" ${blocked?'disabled':''}><b>${c.label}</b><small>${blocked||c.detail}</small></button>`;}).join(''):`<button class="solid-button" data-action="${s.puzzle?'puzzle':'complete'}">${s.puzzle?'Open planning board':'Continue'} →</button>`;
  const speakerName = s.speaker === 'Aarav' ? this.charName : s.speaker;
  this.ui.panel(speakerName,s.title,`<p>${text}</p>${choices}`);
 }

 private complete(){const current=this.step;if(current.reward){const received=addItems(this.state,current.reward);if(received)this.ui.toast('Collected: '+received);else this.ui.toast('Bag full. Supplies could not be carried.');}if(this.state.mission===3&&this.state.step===2){this.state.stats.heatExposure=Math.max(0,this.state.stats.heatExposure-45);this.state.stats.health=Math.min(100,this.state.stats.health+15);}const chapter=advance(this.state);this.resume();if(this.state.ending){this.showEnding();return;}this.city.setCampaign(this.state.mission,this.state.flags);this.city.setTarget(this.step.target);void this.save();if(chapter)this.brief();else this.ui.toast('Objective complete · checkpoint saved');}
 private puzzle(reset=true){this.freeze('puzzle');if(reset)this.selections=[];const type=this.step.puzzle;const opts=type==='power'?['Emergency lights / 1 unit','Clinic / 3 units','Communications / 2 units','Advertising / 4 units','Warehouse cooling / 4 units']:type==='water'?['Delivery line','Filter','Storage tank']:['Store → red corridor → clinic','Store → covered lane → school → clinic','Store → collapsed bridge → clinic'];const cost=this.selections.reduce((a,i)=>a+[1,3,2,4,4][i],0);this.ui.panel('INFRASTRUCTURE / PLANNING SIMULATION',type==='power'?'Keep the essentials alive':type==='water'?'Reconnect the water route':'Find an open route',`<p>${type==='power'?'Select lights, clinic, and communications. Capacity: 6 units.':type==='water'?'Select each stage in order: Filter → Storage tank → Delivery line.':'Red corridor and collapsed bridge are closed. The covered lane connects the store to the school; the school road reaches the clinic.'}</p><div class="puzzle-grid">${opts.map((o,i)=>`<button class="choice ${this.selections.includes(i)?'selected':''}" data-action="select:${i}"><b>${o}</b><small>${type==='water'&&this.selections.includes(i)?'Stage '+(this.selections.indexOf(i)+1):this.selections.includes(i)?'SELECTED':'SELECT'}</small></button>`).join('')}</div><p>${type==='power'?`Assigned ${cost} / 6 units`:type==='water'?`${this.selections.length} / 3 stages connected`:'Read the route status before confirming.'}</p><button class="solid-button" data-action="solve">Confirm plan →</button><button class="quiet-button" data-action="puzzle">Reset</button>`);}
 private solve(){const type=this.step.puzzle;const good=puzzleValid(type,this.selections);if(!good){this.ui.toast('That plan does not meet the constraints. Review the board and try again.');return;}this.state.flags[type==='water'?'distribution':type==='route'?'routeOpen':'powerRestored']=true;this.complete();}
 private scavenge(){for(const id of ['cache','tools','rest','shelter']){const p=locations[id];if(Math.hypot(this.state.position[0]-p.x,this.state.position[2]-p.z)<3){const key=`${this.state.mission}:${id}`;if(this.state.collected.includes(key)){this.ui.toast('This supply point has been searched this chapter.');return;}const received=addItems(this.state,id==='tools'?{battery:1,parts:1}:{water:1,food:1});if(!received){this.ui.toast('Your bag is full. Use or discard an item first.');return;}this.state.collected.push(key);this.ui.toast('Scavenged: '+received);void this.save();return;}}const p=locations.pump;if(this.state.flags.pump&&Math.hypot(this.state.position[0]-p.x,this.state.position[2]-p.z)<3){this.state.stats.hydration=100;this.ui.toast('The restored pump refilled your drinking supply.');return;}this.ui.toast('Follow the amber objective. Supply points: market storeroom, maintenance locker and shelter.');}
 private rest(){if(!this.city.isShaded(this.state.position[0],this.state.position[2])){this.ui.toast('Move under a covered lane or awning before resting.');return;}this.freeze('rest');this.ui.panel('TAKE A BREATH','Rest in the shade',`<p>Spend 20 campaign minutes to reduce heat stress and recover stamina. Shelter cooling improves recovery when restored.</p><button class="solid-button" data-action="rest-confirm">Rest for 20 minutes →</button>`);}

 private pause(){if(this.mode!=='play'||this.state.ending)return;this.freeze('pause');this.ui.panel('TIME IS PAUSED','A moment to breathe',`<button class="choice" data-action="close"><b>Return to the city</b></button><button class="choice" data-action="character"><b>Customize character & appearance (${this.charName})</b></button><button class="choice" data-action="save"><b>Save checkpoint</b></button><button class="choice" data-action="settings"><b>Settings & accessibility</b></button><button class="choice" data-action="menu"><b>Save and return to main menu</b></button>`);}
 private settingsPanel(){this.freeze('settings');const s=this.settings;this.ui.panel('PERSONALIZE YOUR EXPERIENCE','Settings',`${[['master','Master volume'],['music','Ambient volume'],['effects','Effects volume'],['sensitivity','Mouse sensitivity'],['scale','Render scale']].map(([key,label])=>`<label class="setting">${label}<input aria-label="${label}" data-setting="${key}" type="range" min="${key==='scale'?.5:key==='sensitivity'?.3:0}" max="${key==='sensitivity'?2:1}" step="0.05" value="${s[key as keyof Settings]}"></label>`).join('')}<label class="setting">Graphics quality<select data-setting="quality">${['low','medium','high'].map(q=>`<option ${s.quality===q?'selected':''}>${q}</option>`).join('')}</select></label>${[['subtitles','Cinematic subtitles'],['reduced','Reduce motion'],['large','Larger text']].map(([key,label])=>`<label class="setting">${label}<input type="checkbox" data-setting="${key}" ${s[key as keyof Settings]?'checked':''}></label>`).join('')}<p class="intro-note">Gameplay dialogue remains visible. Low graphics disables shadows. Drag mouse to look; double-click the world to lock the pointer. Space jumps, C crouches, F toggles the lamp.</p>`);document.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-setting]').forEach(el=>el.addEventListener('input',()=>{const key=el.dataset.setting as keyof Settings;const value=el instanceof HTMLInputElement?(el.type==='checkbox'?el.checked:Number(el.value)):el.value;Object.assign(this.settings,{[key]:value});this.applySettings();try{localStorage.setItem('heatline-settings',JSON.stringify(this.settings));}catch{this.ui.toast('Settings could not be persisted.');}}));}
 private applySettings(){this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.settings.quality==='high'?2:1.25)*Math.max(.5,this.settings.scale));this.renderer.shadowMap.enabled=this.settings.quality!=='low';this.cameraController?.setSensitivity(this.settings.sensitivity);document.body.classList.toggle('reduced',this.settings.reduced);document.body.classList.toggle('large-text',this.settings.large);this.audio.setVolumes(this.settings.master,this.settings.music,this.settings.effects);}

 private async action(a:string){
  if(a==='new'){if(this.saved){this.freeze('confirm-new');this.ui.panel('START AGAIN','Begin a new story?',`<p>Your current checkpoint will be replaced when the new campaign saves.</p><button class="solid-button" data-action="new-confirm">Begin new story</button>`);}else this.startIntro();return;}
  if(a==='new-confirm'){this.resume();this.startIntro();return;}
  if(a==='skip'){this.enter(this.state);void this.save();return;}
  if(a==='continue'||a==='retry'){const saved=await this.store.load();if(saved){this.enter(saved);}else this.ui.toast('No valid checkpoint was found. Start a new story.');return;}
  if(a==='menu'){if(this.mode==='play'&&!this.state.ending)await this.save();this.mode='menu';this.panel='';this.input.clear();this.ui.menu(!!this.saved, this.charName);return;}
  if(a==='close'){if(this.panel==='character'&&this.mode==='menu'){this.panel='';this.ui.menu(!!this.saved, this.charName);}else this.resume();return;}
  if(a==='pause'){this.pause();return;}
  if(a==='settings'){this.settingsPanel();return;}
  if(a==='character'){this.freeze('character');this.ui.characterCustomizer(this.characterConfig);return;}
  if(a.startsWith('custom:')){
    const parts = a.split(':');
    const field = parts[1];
    const val = parts[2];
    if(field==='gender'){
      this.characterConfig.gender = val as 'male'|'female';
    } else if(field in this.characterConfig){
      (this.characterConfig as any)[field] = Number(val);
    }
    this.model.applyConfig(this.characterConfig);
    try{localStorage.setItem('heatline-character', JSON.stringify(this.characterConfig));}catch{}
    this.ui.characterCustomizer(this.characterConfig);
    return;
  }
  if(a==='char-confirm'){
    try{localStorage.setItem('heatline-character', JSON.stringify(this.characterConfig));}catch{}
    this.ui.toast(`Playing as ${this.charName}`);
    if(this.mode==='menu'){
      this.panel='';
      this.ui.menu(!!this.saved, this.charName);
    } else {
      this.resume();
    }
    return;
  }
  if(a==='save'){await this.save(true);return;}
  if(a==='chapters'){this.freeze('chapters');const unlocked=this.saved?.mission??0;this.ui.panel('THE 48-HOUR CAMPAIGN','Eight chapters. One city.',`<div class="chapter-list">${missions.map((m,i)=>`<button class="chapter" data-action="chapter:${i}" ${i>unlocked?'disabled':''}><span>${String(i+1).padStart(2,'0')} / HOURS ${m.time[0]}–${m.time[1]}</span><h3>${m.title}</h3><p>${i>unlocked?'LOCKED · PROGRESS THROUGH THE STORY':m.district}</p></button>`).join('')}</div><p class="intro-note">Chapters unlock as you play. Replays begin with a supplied survival kit and neutral relationships, and replace your active checkpoint after the first completed objective.</p>`);return;}
  if(a.startsWith('chapter:')){const i=Number(a.split(':')[1]);if(i>(this.saved?.mission??0))return;const s=freshState();s.mission=i;s.hour=missions[i].time[0];s.inventory={water:3,food:2,aid:1,parts:2,cloth:1,battery:2};const t=locations[missions[i].steps[0].target];s.position=[t.x,0,t.z+3];this.enter(s);return;}
  if(a==='credits'){this.freeze('credits');this.ui.panel('HEATLINE / ABOUT','Ordinary people. Extraordinary pressure.',`<p>An original browser survival adventure set in a fictional Indian city. Eight chapters connect heat exposure, essential services, and human relationships.</p><p>All world geometry, character rigs, interface, narrative, and synthesized sound are created in this project. Rendering: Three.js (MIT). Build tooling: Vite (MIT) and TypeScript (Apache-2.0).</p><p>Grounded stylized 3D; not photorealism. Survival meters and infrastructure puzzles are fictional gameplay abstractions.</p><p class="intro-note">Your progress is stored in this browser. Clearing site data removes it. Desktop keyboard and mouse recommended.</p>`);return;}
  if(this.mode!=='play'||this.state.ending)return;
  if(a==='inventory'){this.freeze('inventory');this.ui.inventory(this.state);return;}
  if(a==='journal'){this.freeze('journal');this.ui.journal(this.state);return;}
  if(a.startsWith('use:')){if(useItem(this.state,a.split(':')[1] as Item)){this.audio.playUIInteract();void this.save();}this.ui.inventory(this.state);return;}
  if(a.startsWith('drop:')){const k=a.split(':')[1] as Item;if(this.state.inventory[k]>0)this.state.inventory[k]--;this.ui.inventory(this.state);void this.save();return;}
  if(a==='craft:cool'&&this.state.inventory.water&&this.state.inventory.cloth){this.state.inventory.water--;this.state.inventory.cloth--;this.state.stats.heatExposure=Math.max(0,this.state.stats.heatExposure-45);this.ui.inventory(this.state);void this.save();return;}
  if(a==='craft:kit'&&this.state.inventory.parts&&this.state.inventory.battery){this.state.inventory.parts--;this.state.inventory.battery--;this.state.flags.repairKit=true;this.ui.inventory(this.state);this.ui.toast('Repair kit ready. The next rest gains an extra 10 health.');void this.save();return;}
  if(a==='rest-confirm'){this.state.hour+=1/3;this.state.stats.heatExposure=Math.max(0,this.state.stats.heatExposure-(this.state.flags.cooling?50:30));this.state.stats.stamina=100;if(this.state.flags.repairKit){this.state.stats.health=Math.min(100,this.state.stats.health+10);this.state.flags.repairKit=false;}this.resume();return;}
  if(a.startsWith('choice:')&&this.panel==='dialogue'){const c=this.step.choices?.[Number(a.split(':')[1])];if(c&&applyChoice(this.state,c))this.complete();return;}
  if(a==='complete'&&this.panel==='dialogue'){this.complete();return;}
  if(a==='puzzle'){this.puzzle();return;}
  if(a.startsWith('select:')&&this.panel==='puzzle'){const i=Number(a.split(':')[1]);if(this.step.puzzle==='route')this.selections=[i];else if(this.selections.includes(i))this.selections=this.selections.filter(n=>n!==i);else this.selections.push(i);this.puzzle(false);return;}
  if(a==='solve'&&this.panel==='puzzle')this.solve();
 }

 private key(e:KeyboardEvent){
  if(e.code==='Tab'&&this.panel){
    const nodes=[...document.querySelectorAll<HTMLElement>('#modal button:not(:disabled), #modal input, #modal select')];
    if(nodes.length){
      const i=nodes.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();
    }
    return;
  }
  if(e.repeat||['INPUT','SELECT'].includes((e.target as HTMLElement).tagName))return;
  if(e.code==='Escape'){
    if(this.mode==='cinematic')void this.action('skip');
    else if(this.panel&&!['ending','brief'].includes(this.panel))this.action('close');
    else this.pause();
    return;
  }
  if(this.mode!=='play')return;
  if(e.code==='KeyI'){void this.action(this.panel==='inventory'?'close':'inventory');return;}
  if(e.code==='KeyJ'){void this.action(this.panel==='journal'?'close':'journal');return;}
  if(this.panel)return;
  if(e.code==='KeyE')this.interaction();
  if(e.code==='KeyR')this.rest();
  if(e.code==='KeyF'){this.lamp.intensity=this.lamp.intensity?0:5;this.ui.toast(this.lamp.intensity?'Hand lamp on':'Hand lamp off');}
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 }

 public start(){if(this.running)return;this.running=true;this.clock.start();this.animate();}

 private animate=()=>{
  if(!this.running)return;
  requestAnimationFrame(this.animate);
  const dt=Math.min(this.clock.getDelta(),.05);
  this.elapsed+=dt;

  if(this.mode==='play'&&!this.panel){
    const before=this.model.group.position.clone();
    this.player.update(dt);
    const pos=this.model.group.position;
    pos.x=THREE.MathUtils.clamp(pos.x,-9,9);
    pos.z=THREE.MathUtils.clamp(pos.z,-119,26);
    for(const b of this.city.walls){
      if(pos.x>b.min.x-.25&&pos.x<b.max.x+.25&&pos.z>b.min.z-.25&&pos.z<b.max.z+.25&&pos.y<b.max.y&&pos.y+1.6>b.min.y){
        pos.x=before.x;pos.z=before.z;break;
      }
    }
    this.syncPosition();
    const shade=this.city.isShaded(pos.x,pos.z);
    const night=(this.state.hour>=12&&this.state.hour<23)||(this.state.hour>=32&&this.state.hour<41);
    this.state.hour+=dt/180;
    this.state.stats.hydration=Math.max(0,this.state.stats.hydration-dt*(this.input.getState().sprint?.13:.055));
    this.state.stats.heatExposure=THREE.MathUtils.clamp(this.state.stats.heatExposure+dt*(shade?-.38:night?.03:.18),0,100);
    if(this.state.stats.hydration<8||this.state.stats.heatExposure>95)this.state.stats.health=Math.max(0,this.state.stats.health-dt*.65);
    if(this.state.stats.health<=0||this.state.hour>=48){this.state.ending='Too Late';this.showEnding();}
    this.autosave+=dt;
    if(this.autosave>45){this.autosave=0;void this.save();}
  } else {
    this.input.clear();
  }

  if(this.panel==='character'){
    // Camera frames the character portrait/body during customization
    const targetPos = this.model.group.position.clone().add(new THREE.Vector3(0, 1.25, 0));
    this.camera.position.lerp(new THREE.Vector3(this.model.group.position.x, 1.35, this.model.group.position.z + 2.2), 0.1);
    this.camera.lookAt(targetPos);
  } else if(this.mode==='menu'){
    this.camera.position.set(3+Math.sin(this.elapsed*.05)*.7,5.5,26);
    this.camera.lookAt(-2,2,-32);
  }

  if(this.mode==='cinematic'){
    this.introTime+=dt;
    const t=this.introTime;
    const lines=['At 10:17, the temperature reaches 45.8 degrees.','By noon, the grid begins to fail.','The water pumps stop. The phone networks strain.','In Old Colony, a ceiling fan turns for the last time.',`A message from Raghav: “Are you still there, ${this.charName}?”`,'Forty-eight hours. The city is still alive.'];
    const sub=document.getElementById('subtitle');
    if(sub)sub.textContent=this.settings.subtitles?lines[Math.min(5,Math.floor(t/10))]:'';
    if(t<30){
      this.camera.position.set(18-t*.3,12-t*.16,24-t*.4);
      this.camera.lookAt(0,2,-25);
    }else{
      this.camera.position.set(-2,2.7,22);
      this.camera.lookAt(-7,1.5,16);
    }
    if(t>=60){this.enter(this.state);void this.save();}
  }

  this.city.marker.visible=this.mode==='play';
  this.city.update(dt,this.mode==='menu'?2:this.mode==='cinematic'?(this.introTime<30?0:1):this.state.hour,this.model.group.position,this.settings.reduced);
  this.lamp.position.copy(this.model.group.position).add(new THREE.Vector3(0,1.7,0));

  this.hudTimer+=dt;
  if(this.mode==='play'&&this.hudTimer>.12){
    this.hudTimer=0;
    this.ui.update(this.state,this.distance(),this.city.isShaded(this.state.position[0],this.state.position[2]),this.target,Math.atan2(this.target.x-this.state.position[0],-(this.target.z-this.state.position[2]))+this.cameraController.getYaw());
  }

  this.renderer.render(this.scene,this.camera);
 };
}
