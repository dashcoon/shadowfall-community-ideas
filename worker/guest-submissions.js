/**
 * Shadowfall Idle anonymous nickname submissions.
 * Cloudflare Worker; required SECRETS: GITHUB_TOKEN, TURNSTILE_SECRET.
 * Public text variables: REPOSITORY = dashcoon/shadowfall-community-ideas.
 * Protected by Turnstile server validation; NEVER put secrets in GitHub Pages files.
 */
const ALLOWED_ORIGIN="https://dashcoon.github.io";
const CATEGORIES=new Set(["Combat & Auto-play","Character Progression","Equipment & Loot","World & Bosses","Other"]);
const reply=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{"content-type":"application/json; charset=utf-8","access-control-allow-origin":ALLOWED_ORIGIN,"vary":"Origin","cache-control":"no-store","x-content-type-options":"nosniff"}});
export default {
async fetch(request,env){
const url=new URL(request.url);
if(url.pathname!=="/suggest")return reply({error:"Not found"},404);
if(request.headers.get("origin")!==ALLOWED_ORIGIN)return reply({error:"Forbidden origin"},403);
if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":ALLOWED_ORIGIN,"access-control-allow-methods":"POST, OPTIONS","access-control-allow-headers":"content-type","access-control-max-age":"600","vary":"Origin"}});
if(request.method!=="POST")return reply({error:"POST required"},405);
if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))return reply({error:"JSON required"},415);
if(Number(request.headers.get("content-length")||0)>8000)return reply({error:"Request too large"},413);
if(!env.GITHUB_TOKEN||!env.TURNSTILE_SECRET)return reply({error:"Submission service not configured"},503);
let data;try{const payload=await request.text();if(payload.length>8000)return reply({error:"Request too large"},413);data=JSON.parse(payload)}catch{return reply({error:"Invalid JSON"},400)}
if(!data||typeof data!=="object"||Array.isArray(data))return reply({error:"Invalid body"},400);
if(data.website)return reply({ok:true});
const nickname=(typeof data.nickname==="string"?data.nickname:"").trim()||"Anonymous adventurer";
const title=(typeof data.title==="string"?data.title:"").trim();
const description=(typeof data.description==="string"?data.description:"").trim();
const category=String(data.category||"");
if(nickname.length>24||!/^[-_\p{L}\p{N} .]{2,24}$/u.test(nickname))return reply({error:"Call name must be 2–24 letters, numbers, spaces, dots, dashes or underscores"},400);
if(title.length<5||title.length>100||description.length<30||description.length>1200||!CATEGORIES.has(category))return reply({error:"Please enter a title (5–100 characters), description (30–1200 characters) and valid category."},400);
const token=typeof data.turnstileToken==="string"?data.turnstileToken:"";
if(!token||token.length>4096)return reply({error:"Bot check required"},400);
const ip=request.headers.get("CF-Connecting-IP")||"";
const challenge=new URLSearchParams({secret:env.TURNSTILE_SECRET,response:token});if(ip)challenge.set("remoteip",ip);
let verified;try{const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:challenge});verified=await r.json()}catch{return reply({error:"Bot protection temporarily unavailable"},503)}
if(!verified.success||verified.hostname!=="dashcoon.github.io")return reply({error:"Bot protection failed; please retry"},403);
const escapeHeading=v=>v.replace(/\r/g," ").replace(/\n/g," ").replace(/#/g,"＃");
const body="### Call name\n\n"+escapeHeading(nickname)+"\n\n### Category\n\n"+escapeHeading(category)+"\n\n### What is your idea?\n\n"+description.replace(/\r/g,"")+"\n\n---\nSubmitted via the public Shadowfall Idle community form. The call name is self-chosen and not verified. Pending creator review.";
let r;try{r=await fetch("https://api.github.com/repos/dashcoon/shadowfall-community-ideas/issues",{method:"POST",headers:{"Authorization":"Bearer "+env.GITHUB_TOKEN,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"shadowfall-community-submissions","content-type":"application/json"},body:JSON.stringify({title:"[Idea]: "+escapeHeading(title),body})})}catch{return reply({error:"Submission service unreachable"},502)}
if(!r.ok)return reply({error:"Could not save your idea. Please try again later."},502);
const issue=await r.json();
return reply({ok:true,id:issue.number},201);
}
};