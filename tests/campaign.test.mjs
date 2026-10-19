import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/missions/Campaign.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {freshState,missions,advance,applyChoice,choiceBlock,endingFor,validState,addItems,capacity,useItem,puzzleValid}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
test('Every campaign branch completes all eight missions with valid state',()=>{
 let leaves=0;const endings=new Set();
 function walk(state){if(state.ending){assert.equal(state.completed.length,8);assert(validState(state));endings.add(state.ending);leaves++;return;}
  const step=missions[state.mission].steps[state.step];
  if(step.reward)addItems(state,step.reward);
  if(step.choices){for(const c of step.choices){const s=structuredClone(state);if(applyChoice(s,c)){advance(s);walk(s);}}}
  else {advance(state);walk(state);}
 }
 walk(freshState());assert(leaves>100);for(const ending of ['Alone','The City Holds','A New Morning','Survival at a Cost'])assert(endings.has(ending),ending);console.log(`  ${leaves} full decision paths checked`);
});
test('All five endings have explicit reachable state combinations',()=>{const s=freshState();s.trust={Maya:4,Imran:2,Raghav:4,Sen:2};s.flags={pump:true,clinic:true,rescue:true,stay:true};assert.equal(endingFor(s),'The City Holds');s.flags={pump:true,together:true};assert.equal(endingFor(s),'A New Morning');s.flags={stay:true};assert.equal(endingFor(s),'Survival at a Cost');s.flags={alone:true};assert.equal(endingFor(s),'Alone');s.hour=48;assert.equal(endingFor(s),'Too Late');s.hour=1;s.stats.health=0;assert.equal(endingFor(s),'Too Late');});
test('Inventory capacity, consumption and missing supplies',()=>{const s=freshState();assert(!useItem(s,'water'));addItems(s,{water:30});assert.equal(capacity(s),18);s.stats.hydration=1;assert(useItem(s,'water'));assert.equal(s.stats.hydration,39);assert.equal(s.inventory.water,17);const c=missions[0].steps[2].choices[0];s.inventory.water=0;assert(choiceBlock(s,c));assert(!applyChoice(s,c));assert(!s.flags.neighbor);});
test('Trust opens a faster route; detour time persists through advancement',()=>{const s=freshState();s.mission=4;s.hour=18;const choices=missions[4].steps[0].choices;assert(choiceBlock(s,choices[0]));s.trust.Maya=2;assert.equal(choiceBlock(s,choices[0]),'');assert(applyChoice(s,choices[1]));advance(s);assert.equal(s.hour,20.7);});
test('Malformed and corrupted saves are rejected',()=>{for(const v of [null,{},[],{version:2},'bad'])assert(!validState(v));for(const mutate of [s=>s.inventory.water=-1,s=>s.stats.health=NaN,s=>s.step=20,s=>s.position=[Infinity,0,0],s=>s.trust.Maya='bad',s=>s.flags.foo=3,s=>s.journal=[{}],s=>s.ending='invented']){const s=freshState();mutate(s);assert(!validState(s));}assert(validState(JSON.parse(JSON.stringify(freshState()))));});
test('Objectives and world target identifiers are complete',()=>{assert.equal(missions.length,8);for(const m of missions){assert.equal(m.steps.length,4);for(const step of m.steps){assert(step.title&&step.target&&step.text);if(step.choices)assert(step.choices.some(c=>!c.cost&&c.flag!=='negotiated'));}}});
test('Planning boards reject overloads, duplicates, closed routes and incorrect sequences',()=>{assert(puzzleValid('power',[2,0,1]));for(let mask=0;mask<32;mask++){const selection=[0,1,2,3,4].filter(i=>mask&(1<<i));assert.equal(puzzleValid('power',selection),mask===7);}assert(!puzzleValid('power',[0,0,0]));for(const sequence of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]])assert.equal(puzzleValid('water',sequence),sequence.join(',')==='1,2,0');assert(!puzzleValid('water',[]));assert(puzzleValid('route',[1]));assert(!puzzleValid('route',[0]));assert(!puzzleValid('route',[2]));});
console.log(`\n${checks} test groups passed.`);
