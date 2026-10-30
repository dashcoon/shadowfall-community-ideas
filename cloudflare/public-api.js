// Cloudflare Worker: public read + guest submissions. Server-side Turnstile, D1, abuse controls.
const categories=new Set(["Combat & Auto-play","Character Progression","Equipment & Loot","World & Bosses","Other"]);
const cors=(env)=>({"Access-Control-Allow-Origin":env.ALLOWED_ORIGIN||"https://dashcoon.github.io","Vary":"Origin","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
function json(env,value,status=200){return new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8",...cors(env)}})}
async function digest(value){const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("")}
export default {async fetch(request,env){
const origin=request.headers.get("Origin");
if(origin&&origin!==(env.ALLOWED_ORIGIN||"https://dashcoon.github.io"))return json(env,{error:"Origin forbidden"},403);
const u=new URL(request.url),method=request.method;
if(method==="OPTIONS")return new Response(null,{status:204,headers:cors(env)});
if(method==="GET"&&u.pathname==="/public/ideas"){
const {results}=await env.DB.prepare("SELECT id,nickname,title,category,description,status,created_at FROM suggestions WHERE status='added' ORDER BY added_at DESC LIMIT 100").all();
return json(env,{ideas:results.map(x=>({...x,author:x.nickname,source:"Community suggestion"}))});
}
if(method==="POST"&&u.pathname==="/public/suggestions"){
if(!origin)return json(env,{error:"Browser origin required"},403);
if(!env.TURNSTILE_SECRET||!env.RATE_HASH_SALT)return json(env,{error:"Submission service not configured"},503);
if(!request.headers.get("content-type")?.startsWith("application/json"))return json(env,{error:"JSON expected"},415);
if(Number(request.headers.get("content-length")||0)>8000)return json(env,{error:"Request too large"},413);
let d;try{let raw=await request.text();if(raw.length>8000)throw 0;d=JSON.parse(raw)}catch{return json(env,{error:"Invalid submission"},400)}
if(d.website)return json(env,{ok:true,queued:true},202);
const nickname=String(d.nickname||"Anonymous adventurer").trim(),title=String(d.title||"").trim(),description=String(d.description||"").trim(),category=String(d.category||""),turnstileToken=String(d.turnstileToken||"");
if(!/^[\p{L}\p{N} ._-]{2,24}$/u.test(nickname)||title.length<5||title.length>100||description.length<30||description.length>1200||!categories.has(category))return json(env,{error:"Please check all form fields."},400);
if(!turnstileToken||turnstileToken.length>2048)return json(env,{error:"Please complete the bot check.",code:"missing_token"},400);
const payload=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:turnstileToken});
const ip=request.headers.get("CF-Connecting-IP")||"";if(ip)payload.set("remoteip",ip);
let check;
try{
  const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:payload
  });
  if(!r.ok)throw Error("Turnstile API returned "+r.status);
  check=await r.json();
}catch{
  return json(env,{error:"Bot verification service temporarily unavailable.",code:"verification_unavailable"},503);
}
if(!check?.success){
  const errors=Array.isArray(check?.["error-codes"])?check["error-codes"]:[];
  // No tokens, keys, addresses or personal details are ever returned or logged.
  console.warn("Turnstile siteverify rejected token; codes:",errors.filter(x=>typeof x==="string").slice(0,6));
  if(errors.includes("timeout-or-duplicate"))return json(env,{error:"Verification expired or was already used. Please complete a fresh Cloudflare check and retry.",code:"timeout_or_duplicate"},403);
  if(errors.includes("invalid-input-secret")||errors.includes("missing-input-secret"))return json(env,{error:"Bot protection is misconfigured on the server. Please contact the website owner.",code:"secret_configuration"},503);
  if(errors.includes("invalid-input-response")||errors.includes("missing-input-response"))return json(env,{error:"Cloudflare did not accept the verification token. Please refresh the challenge and retry.",code:"invalid_token"},403);
  return json(env,{error:"Bot check failed. Please retry with a fresh verification.",code:"verification_rejected"},403);
}
if(check.hostname!==(env.TURNSTILE_HOSTNAME||"dashcoon.github.io")){
  console.warn("Turnstile siteverify hostname differs from the expected website hostname");
  return json(env,{error:"Bot protection hostname configuration is incorrect.",code:"hostname_mismatch"},403);
}
const ipHash=await digest((env.RATE_HASH_SALT||"")+":"+ip+":"+new Date().toISOString().slice(0,10));
const now=Math.floor(Date.now()/1000);
const recent=await env.DB.prepare("SELECT count(*) AS count FROM suggestions WHERE ip_hash = ? AND created_at > ?").bind(ipHash,now-3600).first();
if((recent?.count||0)>=3)return json(env,{error:"Too many suggestions. Please try again later."},429);
try{
const result=await env.DB.prepare("INSERT INTO suggestions (nickname,title,category,description,status,created_at,updated_at,ip_hash) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)").bind(nickname,title,category,description,now,now,ipHash).run();
return json(env,{ok:true,id:result.meta.last_row_id,status:"pending"},201);
}catch{return json(env,{error:"Unable to save. Please try again later."},503)}
}
return json(env,{error:"Not found"},404);
}};
