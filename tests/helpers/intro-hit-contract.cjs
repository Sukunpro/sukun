'use strict';
const assert=require('node:assert/strict');
function near(a,b){assert(Math.abs(a-b)<1e-9,`${a} differs from ${b}`);}
function assertHit(f,audioTime=10){
 const c=f.contexts[0],t=audioTime+.02,parts=[{ratio:1,peak:.30},{ratio:2,peak:.14},{ratio:3,peak:.07}];
 assert.equal(f.contexts.length,1);assert.equal(c.oscillators.length,6);assert.equal(c.gains.length,7);
 const expected=[];for(const layer of [{delay:0,level:1},{delay:.12,level:.12}])for(const part of parts)expected.push({...part,...layer});
 expected.forEach((p,i)=>{const o=c.oscillators[i],g=c.gains[i+1],onset=t+p.delay;
  assert.equal(o.type,'sine');assert.equal(o.starts.length,1);near(o.starts[0],onset);near(o.stops[0],t+.65);
  assert.deepEqual(o.frequency.schedule,[['set',86*p.ratio,onset],['exponential',48*p.ratio,onset+.13]]);
  assert.deepEqual(g.gain.schedule,[['set',0,onset],['linear',p.peak*p.level,onset+.016],['exponential',.0001*p.level,onset+.49],['linear',0,onset+.52]]);
  assert(o.startedAt-Number(f.root.dataset.started)<1730);assert(g.gain.schedule.every(v=>v[2]>audioTime));
 });
 near(c.gains[0].gain.value,.75);near(expected.reduce((sum,p)=>sum+p.peak*p.level,0)*.75,.4284);
 return c;
}
module.exports={assertHit,near};
