import './style.css';
import {State,missions,items,capacity,Item} from '../missions/Campaign';
import {CharacterConfig} from '../player/CharacterModel';

export const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export class GameUI {
 root=document.getElementById('app')!;
 onAction:(action:string)=>void=()=>{};

 constructor(){
   this.root.addEventListener('click',e=>{
     const el=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
     if(el&&!el.disabled)this.onAction(el.dataset.action!);
   });
 }

 menu(hasSave:boolean,charName:string='Aarav'){
   this.root.innerHTML=`<main class="menu"><header class="masthead"><div class="brand"><i></i>HEATLINE</div><div class="status">VARDHAN CITY · EMERGENCY BROADCAST</div></header><div class="menu-content"><div class="chapter-tag">A CITY ON THE EDGE</div><h1 class="hero-title">HEATLINE</h1><div class="hero-subtitle">48 HOURS TO SURVIVE</div><p class="intro-copy">The city is still alive.<br>It just can’t keep everyone alive.</p><nav class="menu-nav" aria-label="Main menu"><button class="primary" data-action="${hasSave?'continue':'new'}">${hasSave?'Continue your story':'Begin your story'} <span>↗</span></button>${hasSave?'<button data-action="new">New game <small>START AGAIN</small></button>':''}<button data-action="chapters">Chapters <small>08 STORIES</small></button><button data-action="character">Protagonist <small>${escape(charName.toUpperCase())} · CUSTOMIZE</small></button><button data-action="settings">Settings <small>MAKE IT YOURS</small></button><button data-action="credits">About the game <small>HEATLINE / 01</small></button></nav></div><aside class="world-card"><div class="eyebrow">NORTHERN INDIA · FICTIONAL CITY</div><h2>When the power goes,<br>what keeps us human?</h2><p>A survival story about ordinary people,<br>impossible choices, and the things<br>we choose to carry.</p><div class="temperature">45.8<span>°C</span></div><div class="eyebrow">EXTREME HEAT WARNING</div></aside><div class="world-index">${'<span></span>'.repeat(8)}</div><footer class="menu-footer"><span>AN ORIGINAL SURVIVAL EXPERIENCE</span><span>EXPLORATION &nbsp; / &nbsp; CONSEQUENCE &nbsp; / &nbsp; COMMUNITY</span><span>LOCAL SAVES · NO ACCOUNT REQUIRED</span></footer></main>`;
 }

 hud(){
   this.root.innerHTML=`<div class="hud"><div class="hud-top"><div><div class="hud-brand">HEATLINE <span class="eyebrow">/ 48 HOURS</span></div><div class="mission-block"><div class="eyebrow" id="mission-label"></div><h2 id="mission-title"></h2><div class="objective" id="objective"></div></div></div><div><div class="clock"><span id="clock"></span><small> / 48:00</small><div class="eyebrow" id="weather"></div></div><div class="hud-actions"><button data-action="inventory">I &nbsp; BAG</button><button data-action="journal">J &nbsp; JOURNAL</button><button data-action="character">C &nbsp; HERO</button><button data-action="pause">ESC &nbsp; PAUSE</button></div></div></div><div class="compass"><span>W</span><span>·</span><b>N</b><span>·</span><span>E</span></div><div class="crosshair"></div><div id="waypoint" class="waypoint"></div><div id="prompt" class="prompt" hidden></div><div class="field-status" id="field-status"></div><div class="stats">${[['health','Health'],['hydration','Hydration'],['stamina','Stamina'],['heatExposure','Heat stress']].map(([id,label])=>`<div class="stat ${id==='heatExposure'?'heat':id==='hydration'?'water':id}"><div class="stat-label"><span>${label.toUpperCase()}</span><span id="v-${id}"></span></div><div class="track"><i id="b-${id}"></i></div></div>`).join('')}</div><div class="controls-strip"><kbd>WASD</kbd> Move <kbd>SHIFT</kbd> Sprint <kbd>E</kbd> Interact <kbd>R</kbd> Rest <kbd>F</kbd> Light</div><div class="mini-map"><div class="eyebrow">WARD 04 / CITY MAP</div><svg viewBox="-16 -120 32 150"><path d="M-8 -118V28M8 -118V28" stroke="#526557" stroke-width="3"/><path d="M0 -118V28" stroke="#88917a" stroke-width=".5" stroke-dasharray="2 2"/><g id="map-target"></g><circle id="map-player" r="1.7" fill="#efebd8"/></svg></div></div>`;
 }

 update(s:State,distance:number,shade:boolean,target:{x:number;z:number;name:string},bearing:number){
   const m=missions[s.mission],step=m.steps[Math.min(s.step,3)];
   const set=(id:string,v:string)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
   set('mission-label',`CHAPTER ${String(s.mission+1).padStart(2,'0')} / 08 · ${m.district}`);
   set('mission-title',m.title);
   set('objective',`${s.step+1}/4  ${step.title}`);
   set('clock',`${String(Math.floor(s.hour)).padStart(2,'0')}:${String(Math.floor(s.hour%1*60)).padStart(2,'0')}`);
   set('weather',((s.hour>=12&&s.hour<23)||(s.hour>=32&&s.hour<41)?'32.4°C · NIGHT / BLACKOUT':'45.8°C · EXTREME HEAT'));
   set('field-status',s.stats.hydration<20?'LOW WATER · Open your bag [I]':s.stats.heatExposure>80?'HIGH HEAT STRESS · Find shade and rest [R]':shade?'IN SHADE · Rest here with [R]':'SUN EXPOSED · Covered lanes offer relief');
   for(const k of Object.keys(s.stats) as (keyof State['stats'])[]){
     set('v-'+k,Math.round(s.stats[k])+'%');
     const e=document.getElementById('b-'+k);if(e)e.style.width=s.stats[k]+'%';
   }
   const prompt=document.getElementById('prompt');
   if(prompt){
     prompt.hidden=distance>3;
     prompt.innerHTML=`<kbd>E</kbd> ${escape(target.name)}`;
   }
   const way=document.getElementById('waypoint');
   if(way){
     way.innerHTML=`<b style="transform:rotate(${bearing}rad)">↑</b>${Math.round(distance)} m · ${escape(target.name)}`;
     way.hidden=distance<3;
   }
   document.getElementById('map-player')?.setAttribute('cx',String(s.position[0]));
   document.getElementById('map-player')?.setAttribute('cy',String(s.position[2]));
   const mt=document.getElementById('map-target');
   if(mt)mt.innerHTML=`<circle cx="${target.x}" cy="${target.z}" r="2" fill="#e5bb70"/>`;
 }

 panel(label:string,title:string,body:string,close=true){
   document.getElementById('modal')?.remove();
   const el=document.createElement('div');
   el.id='modal';
   el.className='overlay';
   el.innerHTML=`<section class="panel" role="dialog" aria-modal="true" aria-label="${escape(title)}"><div class="panel-header"><span class="eyebrow">${escape(label)}</span>${close?'<button class="close" data-action="close" aria-label="Close panel">×</button>':''}</div><h1>${escape(title)}</h1>${body}</section>`;
   this.root.append(el);
   el.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
 }

 dismiss(){
   document.getElementById('modal')?.remove();
 }

 characterCustomizer(config:CharacterConfig){
   const isMale = config.gender === 'male';

   const maleHairNames = ['Side-Part Quiff', 'Textured Crop', 'Buzz Cut'];
   const femaleHairNames = ['High Ponytail', 'Textured Bob', 'Traditional Braid'];
   const hairNames = isMale ? maleHairNames : femaleHairNames;

   const maleFacialNames = ['Clean Shaven', '5 O’Clock Stubble', 'Trimmed Beard'];
   const femaleAccNames = ['Clean / None', 'Cooling Scarf', 'Forehead Visor'];

   const maleOutfitNames = ['Terracotta Kurta', 'Khaki Field Linen', 'Slate Navy Workwear'];
   const femaleOutfitNames = ['Saffron Kurti', 'Sage Olive Top', 'Crimson Sand Tunic'];
   const outfitNames = isMale ? maleOutfitNames : femaleOutfitNames;

   const skinColors = ['#b87b52', '#9e633d', '#764627'];
   const skinLabels = ['Wheatish', 'Warm Bronze', 'Deep Earth'];

   const hairColors = ['#151311', '#2a1c14', '#442c1e'];
   const hairColorLabels = ['Jet Black', 'Dark Espresso', 'Chestnut'];

   const body = `
     <div class="custom-tabs">
       <button class="${isMale?'active':''}" data-action="custom:gender:male">👨 AARAV (MALE)</button>
       <button class="${!isMale?'active':''}" data-action="custom:gender:female">👩 ANANYA (FEMALE)</button>
     </div>

     <div class="custom-group">
       <label>Hairstyle</label>
       <div class="custom-options">
         ${hairNames.map((name, i) => `
           <button class="custom-btn ${config.hairStyle === i ? 'active' : ''}" data-action="custom:hairStyle:${i}">
             ${name}
           </button>
         `).join('')}
       </div>
     </div>

     <div class="custom-group">
       <label>${isMale ? 'Facial Hair' : 'Accessory'}</label>
       <div class="custom-options">
         ${(isMale ? maleFacialNames : femaleAccNames).map((name, i) => `
           <button class="custom-btn ${(isMale ? config.facialHair : config.femaleAccessory) === i ? 'active' : ''}" data-action="custom:${isMale ? 'facialHair' : 'femaleAccessory'}:${i}">
             ${name}
           </button>
         `).join('')}
       </div>
     </div>

     <div class="custom-group">
       <label>Skin Complexion</label>
       <div class="custom-options">
         ${skinColors.map((color, i) => `
           <button class="custom-btn ${config.skinTone === i ? 'active' : ''}" data-action="custom:skinTone:${i}">
             <span class="swatch" style="background:${color}"></span>${skinLabels[i]}
           </button>
         `).join('')}
       </div>
     </div>

     <div class="custom-group">
       <label>Hair Tone</label>
       <div class="custom-options">
         ${hairColors.map((color, i) => `
           <button class="custom-btn ${config.hairColor === i ? 'active' : ''}" data-action="custom:hairColor:${i}">
             <span class="swatch" style="background:${color}"></span>${hairColorLabels[i]}
           </button>
         `).join('')}
       </div>
     </div>

     <div class="custom-group">
       <label>Survival Outfit & Colors</label>
       <div class="custom-options">
         ${outfitNames.map((name, i) => `
           <button class="custom-btn ${config.outfit === i ? 'active' : ''}" data-action="custom:outfit:${i}">
             ${name}
           </button>
         `).join('')}
       </div>
     </div>

     <p class="intro-note">Your character choice is saved and persists throughout the 48-hour campaign, in all cutscenes, and across checkpoints.</p>
     <div style="display:flex;gap:12px;margin-top:15px;">
       <button class="solid-button" data-action="char-confirm" style="margin-top:0;flex:1;">Confirm & Play as ${isMale ? 'Aarav' : 'Ananya'} →</button>
       <button class="quiet-button" data-action="close" style="margin:0;">Close</button>
     </div>
   `;

   this.panel('PROTAGONIST CUSTOMIZATION', isMale ? 'Aarav · Ordinary Resident' : 'Ananya · Ordinary Resident', body);
 }

 inventory(s:State){
   this.panel('FIELD INVENTORY',`What you carry · ${capacity(s)}/18`, `<div class="item-grid">${Object.entries(items).map(([k,v])=>`<div class="item-card"><div class="item-icon">${v.icon}</div><h3>${v.name}</h3><span class="eyebrow">${s.inventory[k as Item]} AVAILABLE</span><p>${v.description}</p>${['water','food','aid'].includes(k)?`<button data-action="use:${k}" ${s.inventory[k as Item]?'':'disabled'}>USE ITEM ↗</button>`:`<button data-action="drop:${k}" ${s.inventory[k as Item]?'':'disabled'}>DISCARD ONE</button>`}</div>`).join('')}</div><button class="quiet-button" data-action="craft:cool" ${s.inventory.cloth&&s.inventory.water?'':'disabled'}>Cool compress · 1 cloth + 1 water</button><button class="quiet-button" data-action="craft:kit" ${s.inventory.parts&&s.inventory.battery?'':'disabled'}>Repair kit · 1 part + 1 battery</button><p class="intro-note">Mission parcels are carried separately and cannot be discarded. Consumables and capacity are shared across chapters.</p>`);
 }

 journal(s:State){
   this.panel('FIELD NOTES','The city remembers',`<div class="network"><div>POWER<strong>${s.flags.pump?'Pump supplied':s.flags.cooling?'Shelter supplied':'Grid offline'}</strong></div><div>WATER<strong>${s.flags.split?'Two sites supplied':s.flags.fullClinic?'Clinic supplied':'Delivery disrupted'}</strong></div><div>CLINIC<strong>${s.flags.clinic||s.flags.fullClinic?'Reserve secured':'Reserve under pressure'}</strong></div></div><p>${Object.entries(s.trust).map(([k,v])=>`${k}: ${v>=2?'cooperating':v<0?'distant':'uncertain'}`).join(' · ')}</p><ul class="journal-list">${s.journal.slice().reverse().map(j=>`<li>${escape(j)}</li>`).join('')}</ul>`);
 }

 toast(message:string){
   document.getElementById('toast')?.remove();
   const e=document.createElement('div');
   e.className='toast';
   e.id='toast';
   e.setAttribute('role','status');
   e.textContent=message;
   this.root.append(e);
   setTimeout(()=>e.remove(),4500);
 }
}
