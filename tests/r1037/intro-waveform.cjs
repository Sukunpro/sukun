'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'../..')),b=fs.readFileSync(root+'/assets/audio/sukun-intro-signature-r1037.wav'),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const results=[];function test(name,fn){try{fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.message});}}
let fmt,data;for(let at=12;at<b.length;){const n=b.readUInt32LE(at+4),type=b.subarray(at,at+4).toString();if(type==='fmt ')fmt=b.subarray(at+8,at+8+n);if(type==='data')data=b.subarray(at+8,at+8+n);at+=8+n+(n%2);}
const samples=Array.from({length:data.length/2},(_,i)=>data.readInt16LE(i*2));
test('Exact approved-derived WAV asset identity',()=>assert.equal(hash(b),'19e70027ad3125d1165a09fdb529c87881048c2866094e88e1a169e41f7de457'));
test('RIFF/WAVE PCM mono48kHz16bit',()=>{assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,12).toString(),'WAVE');assert.equal(fmt.readUInt16LE(0),1);assert.equal(fmt.readUInt16LE(2),1);assert.equal(fmt.readUInt32LE(4),48000);assert.equal(fmt.readUInt16LE(14),16);});
test('Entire source window is exactly3.000 seconds',()=>assert.equal(samples.length,144000));
test('No clipped samples and peak below0.5',()=>assert(samples.every(x=>Math.abs(x)<16384)));
test('First liked hum including initial silence is exactPCM',()=>assert.equal(hash(data.subarray(0,28800*2)),'b8464666c2e1f20e9f6471fe2d915efe3cf02c2f743482a37c40340414942fc1'));
test('Second initial120ms exactPCM',()=>assert.equal(hash(data.subarray(35832*2,41592*2)),'1f6a0fe67053f65107a404d091085eefe2b89e6e706446d42c67521a794e29ec'));
test('Final initial120ms exactPCM',()=>assert.equal(hash(data.subarray(71520*2,77280*2)),'995e4f35c4d7f7b7b83e332140db27e945be9b7213a680046954329534ef690c'));
test('First entry contains no early surprise click',()=>assert(samples.slice(0,7440).every(x=>x===0)));
test('All trailing samples after2.77s are exactlyzero',()=>assert(samples.slice(132960).every(x=>x===0)));
test('Second requested longer release extends past old endpoint',()=>assert(samples.slice(56480,58000).some(x=>x!==0)));
test('Final requested longer release extends past old endpoint',()=>assert(samples.slice(126240,129600).some(x=>x!==0)));
test('No overlap joins the distinct main gestures',()=>{assert(samples.slice(28200,35800).every(x=>x===0));assert(samples.slice(60100,71400).every(x=>x===0));});
const report={total:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,scope:'Digital delivered PCM only; device resampling and subjective listening are not measured.',results};console.log(JSON.stringify(report,null,2));if(report.failed)process.exitCode=1;
