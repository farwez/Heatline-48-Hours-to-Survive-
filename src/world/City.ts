import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {CharacterModel} from '../player/CharacterModel';
import {CharacterAnimator} from '../player/CharacterAnimator';
export const locations:Record<string,{name:string;x:number;z:number;kind?:string}>={
 home:{name:'Your apartment',x:-6,z:13},radio:{name:'Emergency radio',x:-5,z:18},raghav:{name:'Raghav',x:5,z:9,kind:'person'},market:{name:'Lal Chowk market',x:0,z:-7},cache:{name:'Market storeroom',x:-6,z:-12},shop:{name:'Leela’s provisions',x:6,z:-17,kind:'person'},shade:{name:'Covered service lane',x:6,z:-25},imran:{name:'Imran',x:-5,z:-31,kind:'person'},tools:{name:'Maintenance locker',x:-7,z:-37},power:{name:'Backup planning board',x:5,z:-34},maya:{name:'Maya',x:5,z:-47,kind:'person'},sen:{name:'Dr. Sen',x:-6,z:-50,kind:'person'},shelter:{name:'Community shelter',x:6,z:-53},rest:{name:'Covered rest area',x:7,z:-44},barrier:{name:'Road closure',x:0,z:-63},parcel:{name:'Terminal stores',x:-6,z:-72},route:{name:'Route board',x:6,z:-69},tanker:{name:'Municipal water reserve',x:-6,z:-85},pump:{name:'Distribution controller',x:6,z:-85},beacon:{name:'Evacuation beacon',x:5,z:-99},bus:{name:'Evacuation terminal',x:0,z:-108},
};
export class City {
 public collisionObjects:T.Object3D[]=[];
 public walls:T.Box3[]=[];
 public actors:{model:CharacterModel;animator:CharacterAnimator;phase:number}[]=[];
 public marker=new T.Group();
 public sun=new T.DirectionalLight(0xffe0b0,3);
 private ambient=new T.HemisphereLight(0xe5d1b0,0x514c43,2);
 private dust:T.Points;
 private lamps:T.Mesh[]=[];
 private fans:T.Group[]=[];
 private nameplates:Record<string,T.Mesh>={};
 private time=0;
 private walkers:{model:CharacterModel;animator:CharacterAnimator;base:number;phase:number}[]=[];
 private plaster:T.CanvasTexture;
 private mats=new Map<number,T.MeshStandardMaterial>();
 constructor(public scene:T.Scene){
  const surface=document.createElement('canvas');surface.width=256;surface.height=256;const paint=surface.getContext('2d')!;paint.fillStyle='#d4d0c2';paint.fillRect(0,0,256,256);for(let i=0;i<7000;i++){const v=140+Math.floor(Math.random()*100);paint.fillStyle=`rgba(${v},${v},${v},.15)`;paint.fillRect(Math.random()*256,Math.random()*256,Math.random()*4+1,Math.random()*3+1);}for(let i=0;i<20;i++){paint.fillStyle='#777b6815';paint.fillRect(Math.random()*256,150+Math.random()*100,Math.random()*35,100);}this.plaster=new T.CanvasTexture(surface);this.plaster.colorSpace=T.SRGBColorSpace;this.plaster.wrapS=this.plaster.wrapT=T.RepeatWrapping;this.plaster.repeat.set(2,2);
  scene.background=new T.Color(0xc5b398);scene.fog=new T.FogExp2(0xc5b398,.009);
  this.sun.position.set(-30,42,10);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-45,right:45,top:55,bottom:-55,near:1,far:140});this.sun.shadow.bias=-.0005;scene.add(this.sun,this.ambient,this.sun.target);
  this.box(0,-.2,-45,100,.4,185,0x847a68);
  this.box(0,-.025,-45,13,.05,160,0x484841);
  for(const x of [-8.5,8.5]){this.box(x,.06,-45,4,.12,160,0xb3a28b);for(let z=28;z>-120;z-=2)this.box(x,.125,z,3.7,.01,.025,0x817969);}
  for(let z=28;z>-122;z-=5)this.box(0,.008,z,.12,.015,2,0xc6b986);
  const labels=['OLD COLONY  /  04','LAL CHOWK MARKET','WARD 04  /  POWER','COMMUNITY SCHOOL','EAST TRANSIT ROAD','MUNICIPAL WATER','EVACUATION CENTRE'];
  for(let i=0;i<7;i++){const z=15-i*20;this.building(-14,z,i,labels[i]);this.building(14,z,i+3,['ANAND RESIDENCY','LEELA PROVISIONS','MAINTENANCE','DR. SEN  /  CLINIC','GOODS & PARCELS','WATER DISTRIBUTION','RELIEF OPERATIONS'][i]);}
  for(let i=0;i<20;i++){const x=(i%2?1:-1)*(27+(i%3)*8);const z=20-Math.floor(i/2)*17;this.box(x,8+(i%4)*2,z,10,16+(i%4)*4,12,0x99958a);}
  // Apartment, open to the street; the missing front wall preserves camera readability.
  this.box(-7,.1,16,5,.2,9,0xbaaa90);this.box(-9.4,1.6,16,.2,3.2,9,0xc6bba6,true);this.box(-7,1.6,20.5,5,3.2,.2,0xc6bba6,true);
  this.box(-8,.43,17,1.3,.65,2.5,0x626f65);this.box(-8,.8,17,1.2,.16,2.4,0xd3cab3);this.box(-8,.95,17.8,1,.18,.5,0xe2dccb);this.box(-5.5,.55,18.4,1.4,1.1,.6,0x705943);this.box(-5.5,1.2,18.4,.48,.26,.2,0x343b39);
  const fan=new T.Group();fan.position.set(-7,3.2,16);for(let i=0;i<3;i++){const blade=this.box(0,0,0,.15,.03,1.4,0x514e42);scene.remove(blade);blade.position.z=.5;const pivot=new T.Group();pivot.rotation.y=i*Math.PI*2/3;pivot.add(blade);fan.add(pivot);}scene.add(fan);this.fans.push(fan);
  // Human-scale street furniture, planted trees, parked vehicles and utility cables.
  for(let z=22;z>-115;z-=19){this.pole(-6,z);this.tree(9.8,z-4);this.tree(-10,z-8);this.awning(7.3,z-6);this.box(7,.35,z-3,2,.15,.6,0x6a5742);for(const x of [6.2,7.8])this.box(x,.17,z-3,.1,.35,.5,0x383e38);}
  for(let z=15;z>-110;z-=20){const points=[new T.Vector3(-6,6,z),new T.Vector3(-6,5.4,z-10),new T.Vector3(-6,6,z-20)];const curve=new T.CatmullRomCurve3(points);scene.add(new T.Mesh(new T.TubeGeometry(curve,16,.018,4,false),this.mat(0x242c2b)));}
  this.vehicle(-4,0,-23,0x547e69,false);this.vehicle(3,0,-59,0xb99b53,false);this.vehicle(-3,0,-111,0xc2b578,true);
  for(const [id,p] of Object.entries(locations)){
   if(p.kind==='person'){const model=new CharacterModel();model.group.position.set(p.x,.13,p.z);model.group.rotation.y=p.x<0?Math.PI/2:-Math.PI/2;const colors:Record<string,number>={maya:0x417b76,sen:0xe3dfcf,raghav:0x858b9a,imran:0xb6a05c,shop:0x93637a};model.group.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;if(m.color?.getHex()===0xba5d34){o.material=m.clone();(o.material as T.MeshStandardMaterial).color.setHex(colors[id]);}}});if(id==='maya'||id==='shop')model.group.scale.set(.93,.94,.93);scene.add(model.group);this.actors.push({model,animator:new CharacterAnimator(model.rig,{}),phase:this.actors.length});}
   else if(['cache','tools','parcel','home'].includes(id)){this.box(p.x,.42,p.z,.9,.8,.7,0x7d7053);for(const offset of [-.25,.25])this.box(p.x+offset,.43,p.z,.06,.82,.72,0x3a4540);}
   else if(['power','pump','beacon'].includes(id)){this.box(p.x,.85,p.z,1.1,1.7,.65,0x52685f,true);this.sign(id==='power'?'BACKUP / 06':id==='pump'?'FLOW CONTROL':'DISPATCH',p.x,1.3,p.z+.34,1,.25,0,0xd5c9a3);}
   if(p.kind==='person')this.nameplates[id]=this.sign(p.name.toUpperCase(),p.x,2.15,p.z,.8,.16,0,0xc4b893);
  }
  // Road closure leaves two readable pedestrian routes.
  for(const x of [-2,0,2]){this.box(x,.6,-63,1.7,1.2,.5,0xb38947,true);this.box(x,.68,-62.74,1.7,.18,.03,0x333b35);}
  this.box(-6,1.1,-85,2,1.8,4,0x6e9693,true);this.sign('MUNICIPAL RESERVE',-6,2.3,-82.95,2,.4);
  this.sign('VAR DHAN  /  EAST TERMINAL',0,5,-106,9,.9);for(const x of [-5,5])this.box(x,2.5,-106,.15,5,.15,0x4a5149);
  const ring=new T.Mesh(new T.TorusGeometry(.45,.035,8,40),new T.MeshBasicMaterial({color:0xf4ca75,depthTest:false}));ring.rotation.x=Math.PI/2;this.marker.add(ring);const diamond=new T.Mesh(new T.OctahedronGeometry(.16),new T.MeshBasicMaterial({color:0xffd68b}));diamond.position.y=1.9;this.marker.add(diamond);scene.add(this.marker);
  const positions=new Float32Array(480*3);for(let i=0;i<positions.length;i+=3){positions[i]=(Math.random()-.5)*40;positions[i+1]=Math.random()*12;positions[i+2]=30-Math.random()*155;}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));this.dust=new T.Points(geo,new T.PointsMaterial({color:0xe9cf9e,size:.035,transparent:true,opacity:.4}));scene.add(this.dust);
  this.batchStatic();
  for(let i=0;i<3;i++){const model=new CharacterModel();model.group.scale.setScalar(.94+i*.025);scene.add(model.group);this.walkers.push({model,animator:new CharacterAnimator(model.rig),base:-12-i*30,phase:i*2});}
 }
 setCampaign(mission:number,flags:Record<string,boolean>){const r=locations.raghav;r.x=mission===0?5:6;r.z=mission===0?9:mission>=7?-103:-44;const maya=locations.maya;maya.x=5;maya.z=mission>=7?-102:-47;const mapping=['raghav','shop','imran','maya','sen'];for(let i=0;i<this.actors.length;i++){const id=mapping[i],p=locations[id];this.actors[i].model.group.position.set(p.x,.13,p.z);this.nameplates[id]?.position.set(p.x,2.15,p.z);}this.scene.userData.power=!!flags.powerRestored;}
 private batchStatic(){const batches=new Map<T.Material,T.Mesh[]>();for(const o of this.scene.children){if(o instanceof T.Mesh&&o.geometry instanceof T.BoxGeometry&&!this.collisionObjects.includes(o)&&!this.lamps.includes(o)){const m=o.material as T.Material;const list=batches.get(m)||[];list.push(o);batches.set(m,list);}}for(const [material,meshes] of batches){if(meshes.length<2)continue;const geometries=meshes.map(m=>{m.updateMatrix();return m.geometry.clone().applyMatrix4(m.matrix);});const geometry=mergeGeometries(geometries);if(!geometry)continue;const batch=new T.Mesh(geometry,material);batch.castShadow=true;batch.receiveShadow=true;this.scene.add(batch);for(const m of meshes){this.scene.remove(m);m.geometry.dispose();}geometries.forEach(g=>g.dispose());}}
 mat(color:number){if(!this.mats.has(color))this.mats.set(color,new T.MeshStandardMaterial({color,roughness:.88}));return this.mats.get(color)!;}
 box(x:number,y:number,z:number,w:number,h:number,d:number,color:number,solid=false){const m=new T.Mesh(new T.BoxGeometry(w,h,d),this.mat(color));m.position.set(x,y,z);m.castShadow=h>.3;m.receiveShadow=true;this.scene.add(m);if(solid){this.collisionObjects.push(m);this.walls.push(new T.Box3().setFromObject(m));}return m;}
 sign(text:string,x:number,y:number,z:number,w:number,h:number,rotation=0,color=0xd0c1a5){const c=document.createElement('canvas');c.width=768;c.height=128;const g=c.getContext('2d')!;g.fillStyle='#243d39';g.fillRect(0,0,768,128);g.strokeStyle='#819281';g.strokeRect(6,6,756,116);g.fillStyle='#'+color.toString(16).padStart(6,'0');g.font='500 35px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,384,64,730);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:texture,roughness:1,side:T.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;this.scene.add(m);return m;}
 building(x:number,z:number,index:number,label:string){const h=8+(index%3)*3;const color=[0xc6b297,0xa9b7ac,0xb3a48d,0xc1a18b,0xa0aaa6][index%5];const facade=this.box(x,h/2,z,9,h,17,color,true);(facade.material as T.MeshStandardMaterial).map=this.plaster;const face=x<0?x+4.55:x-4.55;
  for(let floor=0;floor<Math.floor(h/3);floor++)for(let j=-1;j<=1;j++){const zz=z+j*4.8;this.box(face,2+floor*3,zz,.12,1.65,1.6,0x354947);this.box(face+(x<0?.25:-.25),1.1+floor*3,zz,.65,.12,2,0xb6b09e);for(let k=-2;k<=2;k++)this.box(face+(x<0?.4:-.4),1.6+floor*3,zz+k*.37,.04,.9,.035,0x686b5b);this.box(face+(x<0?.4:-.4),2+floor*3,zz,.05,.05,1.9,0x686b5b);}
  this.box(x,h+.2,z,9.3,.3,17.3,0x8c8e7c);this.box(x,h+.8,z-3,1.8,1.5,1.8,0x444f48);this.sign(label,face+(x<0?.12:-.12),3.1,z,7,.75,x<0?Math.PI/2:-Math.PI/2);
  for(let j=-1;j<=1;j++){const zz=z+j*4.9;this.box(face,1,zz,.15,1.9,3.2,0x777e70);for(let k=0;k<9;k++)this.box(face+(x<0?.09:-.09),.2+k*.19,zz,.04,.025,3.2,0x505e53);}
 }
 awning(x:number,z:number){this.box(x,3.1,z,3.6,.07,5.5,0x697c65);for(const dz of [-2.6,2.6])this.box(x-1.7,1.5,z+dz,.06,3,.06,0x626657);}
 tree(x:number,z:number){this.box(x,1.6,z,.24,3.2,.24,0x6e624c);for(let i=0;i<4;i++){const crown=new T.Mesh(new T.IcosahedronGeometry(1.3+i*.12,1),this.mat([0x6f7951,0x748357,0x80895d,0x687a56][i]));crown.position.set(x+Math.sin(i*2)*.65,3.5+i*.35,z+Math.cos(i*2)*.6);crown.castShadow=true;this.scene.add(crown);}}
 pole(x:number,z:number){this.box(x,3,z,.12,6,.12,0x555b50);this.box(x+.5,5.9,z,1.1,.1,.1,0x555b50);const lamp=this.box(x+1,5.85,z,.4,.09,.2,0xffdba0);this.lamps.push(lamp);}
 vehicle(x:number,y:number,z:number,color:number,bus:boolean){const length=bus?7:3;this.box(x,y+.8,z,2,1.2,length,color,true);this.box(x,y+1.75,z,1.9,bus?1.4:.8,length*.7,color);this.box(x,y+1.9,z+length*.36,1.7,.65,.025,0x344c4a);for(const side of [-1,1]){this.box(x+side*1.01,y+1.9,z,.025,.65,length*.6,0x354e4d);for(const zz of [-length*.32,length*.32]){const wheel=new T.Mesh(new T.CylinderGeometry(.4,.4,.2,12),this.mat(0x292e2b));wheel.rotation.z=Math.PI/2;wheel.position.set(x+side,y+.4,z+zz);this.scene.add(wheel);}}}
 setTarget(id:string){const p=locations[id];this.marker.position.set(p.x,.2,p.z);}
 isShaded(x:number,z:number){return Math.abs(x)>5.5||(z>10&&x< -3);}
 update(delta:number,hour:number,player:T.Vector3,reduced=false){this.time+=delta;for(const w of this.walkers){const phase=this.time*.11+w.phase;w.model.group.position.set(-7,.13,w.base+Math.sin(phase)*7);w.model.group.rotation.y=Math.cos(phase)>0?0:Math.PI;w.animator.setState('WALK');w.animator.update(delta,.77);}const night=(hour>=12&&hour<23)||hour>=32&&hour<41;const sky=night?0x263a43:0xc5b398;(this.scene.background as T.Color).lerp(new T.Color(sky),.02);(this.scene.fog as T.FogExp2).color.copy(this.scene.background as T.Color);this.sun.intensity=T.MathUtils.lerp(this.sun.intensity,night?.25:3,.02);this.ambient.intensity=night?1.1:1.8;this.sun.position.set(player.x-30,42,player.z+20);this.sun.target.position.copy(player);for(const a of this.actors){a.animator.update(delta,0);a.model.rig.head.rotation.y=Math.sin(this.time*.45+a.phase)*.12;}if(!reduced){this.marker.children[1].rotation.y+=delta;this.marker.children[1].position.y=2+Math.sin(this.time*2)*.12;this.dust.rotation.y=Math.sin(this.time*.01)*.015;}for(const lamp of this.lamps){(lamp.material as T.MeshStandardMaterial).emissive.setHex(night?0xf4c679:0);(lamp.material as T.MeshStandardMaterial).emissiveIntensity=night?1:0;}for(const f of this.fans)if(hour<.1)f.rotation.y+=delta*4;}
}

