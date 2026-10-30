// Shadowfall Idle ADMIN-only Worker. Never deploy to the public shadowfall-ideas-api Worker.
// REQUIRE: Cloudflare Access enabled for ALL traffic on this separate admin Worker.
// Cloudflare validates Access first; ctx.access.getIdentity() is the authenticated identity.
// Require ADMIN_EMAIL secret as second check. D1 binding must be DB.
const STATES = new Set(["pending","acknowledged","added","rejected"]);
const ALLOWED = {
  pending: new Set(["acknowledged","rejected"]),
  acknowledged: new Set(["added","rejected"]),
  rejected: new Set(["acknowledged"]),
  added: new Set(["acknowledged"])
};
const BASE_HEADERS = {
  "Cache-Control":"no-store, max-age=0",
  "Pragma":"no-cache",
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
  "Referrer-Policy":"no-referrer",
  "Cross-Origin-Resource-Policy":"same-origin"
};
function respond(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...BASE_HEADERS}})}
function safeId(value){return /^\d{1,12}$/.test(value||"")&&Number(value)>0?Number(value):null}
async function review(request,env,ctx){
  if(!env.ADMIN_EMAIL)return {error:respond({error:"Admin allowlist not configured"},503)};
  if(!ctx.access)return {error:respond({error:"Cloudflare Access must be enabled on this Worker"},403)};
  let identity;
  try{identity=await ctx.access.getIdentity()}catch{return {error:respond({error:"Could not verify Access identity"},403)}}
  const email=(identity?.email||"").trim().toLowerCase();
  if(!email||email!==env.ADMIN_EMAIL.trim().toLowerCase())return {error:respond({error:"Not authorized to review ideas"},403)};
  return {email};
}

const PAGE = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<meta name=\"robots\" content=\"noindex,nofollow\">\n<title>Shadowfall Idle | Private Idea Inbox</title>\n<style nonce=\"@NONCE@\">\n:root{color-scheme:dark;--bg:#0c111b;--panel:#171f30;--panel2:#222d40;--border:#34445b;--text:#efe8db;--muted:#afbcd1;--gold:#e6b963;--green:#a4d8b6;--red:#efadb1}\n*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse 75% 30% at 45% -5%,#29354c,transparent),var(--bg);font:15px/1.55 system-ui,sans-serif;color:var(--text)}\nmain{width:min(1170px,calc(100% - 30px));margin:25px auto 70px}.eyebrow{text-transform:uppercase;color:var(--gold);letter-spacing:.18em;font-size:11px;font-weight:750}\nh1,h2{font-family:Georgia,serif;margin:5px 0 9px}h1{font-size:clamp(27px,4vw,43px)}h2{font-size:21px}.subtitle{color:var(--muted);max-width:800px}\nheader{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;align-items:start}\nbutton{font:inherit;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}\n.btn{border:1px solid #60728c;background:#2b3950;border-radius:9px;color:#f7f2e8;font-size:13px;font-weight:650;padding:9px 12px}\n.btn:hover:not(:disabled){filter:brightness(1.14)}.btn.gold{color:#151a24;background:var(--gold);border-color:var(--gold)}\n.btn.reject{border-color:#9c5965;color:#ffd3da}.btn.approve{border-color:#679884;color:#bcf1d2}\n.stats{margin:20px 0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}\n.stat{padding:13px 16px;background:var(--panel);border:1px solid var(--border);border-radius:12px}\n.stat strong{display:block;font-size:25px}.stat span{font-size:12px;color:var(--muted)}\n.controls{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}\n.tab{padding:9px 12px;border-radius:8px;background:transparent;color:var(--muted);border:1px solid transparent;font-weight:650}\n.tab.active{background:var(--panel2);color:var(--gold);border-color:var(--border)}\n.notice{margin:13px 0;padding:12px 13px;background:#1e3038;border:1px solid #568080;border-radius:9px;color:#d5f0ec}\n.notice.error{background:#3b252b;border-color:#995964;color:#ffcbd0}\n.card-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr));gap:13px}\n.idea{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px}\n.meta{color:var(--gold);font-size:12px;font-weight:750;letter-spacing:.025em}.idea h2{font-family:system-ui,sans-serif;font-size:19px;line-height:1.35;margin:0}\n.description{white-space:pre-wrap;overflow-wrap:anywhere;color:#d4dded;font-size:14px}\n.nickname{font-size:13px;color:var(--muted)}.status{display:inline-block;padding:3px 9px;border:1px solid var(--border);border-radius:30px;font-size:12px;text-transform:capitalize}\n.actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:auto}.review-note{font:inherit;background:#101727;color:var(--text);padding:9px;border:1px solid var(--border);border-radius:8px;width:100%;resize:vertical;min-height:44px}\n.review-note::placeholder{color:#9aabc6}.empty{border:1px dashed #4c5d76;border-radius:12px;padding:45px 18px;text-align:center;color:var(--muted)}\n.footer{margin:30px 0;color:var(--muted);font-size:12px}\n@media(max-width:660px){.stats{grid-template-columns:repeat(2,1fr)}.idea{padding:13px}}\n</style>\n</head>\n<body><main>\n<header><div><div class=\"eyebrow\">Owner only · Private moderation</div><h1>Shadowfall Idea Inbox</h1><p class=\"subtitle\">Player submissions are private until approved. Acknowledgement and approval are separate decisions. This dashboard never edits the private game-development repository.</p></div><button id=\"refresh\" class=\"btn gold\" type=\"button\">Refresh inbox</button></header>\n<section class=\"stats\" aria-label=\"Suggestion totals\">\n<div class=\"stat\"><strong id=\"countPending\">…</strong><span>Pending</span></div>\n<div class=\"stat\"><strong id=\"countAcknowledged\">…</strong><span>Acknowledged</span></div>\n<div class=\"stat\"><strong id=\"countAdded\">…</strong><span>Added to public map</span></div>\n<div class=\"stat\"><strong id=\"countRejected\">…</strong><span>Rejected</span></div>\n</section>\n<nav class=\"controls\" aria-label=\"Review filters\">\n<button class=\"tab active\" data-filter=\"pending\">Pending</button>\n<button class=\"tab\" data-filter=\"acknowledged\">Acknowledged</button>\n<button class=\"tab\" data-filter=\"added\">Added</button>\n<button class=\"tab\" data-filter=\"rejected\">Rejected</button>\n<button class=\"tab\" data-filter=\"all\">All</button>\n</nav>\n<p id=\"message\" role=\"status\" aria-live=\"polite\" class=\"notice\">Loading suggestions…</p>\n<section id=\"ideas\" class=\"card-list\" aria-label=\"Ideas requiring review\"></section>\n<footer class=\"footer\">Shadowfall Idle · Cloudflare Access protected · Submissions remain in D1 · Changes are recorded in a moderation audit log</footer>\n</main>\n<script nonce=\"@NONCE@\">\n(function(){\n\"use strict\";\nvar filter=\"pending\",busy=false;\nvar $=function(id){return document.getElementById(id)};\nfunction text(tag,value,klass){var x=document.createElement(tag);x.textContent=String(value??\"\");if(klass)x.className=klass;return x}\nfunction show(message,error){var x=$(\"message\");x.textContent=message;x.classList.toggle(\"error\",Boolean(error))}\nfunction makeButton(label,status,item,note){var btn=text(\"button\",label,\"btn \"+(status===\"added\"?\"approve\":status===\"rejected\"?\"reject\":\"\"));btn.type=\"button\";btn.disabled=busy;btn.addEventListener(\"click\",function(){changeStatus(item,status,note.value.slice(0,600))});return btn}\nfunction actionsFor(item){\nvar status=item.status;\nif(status===\"pending\")return [[\"Acknowledge\",\"acknowledged\"],[\"Reject\",\"rejected\"]];\nif(status===\"acknowledged\")return [[\"Approve for mind map\",\"added\"],[\"Reject\",\"rejected\"]];\nif(status===\"rejected\")return [[\"Reconsider · Acknowledge\",\"acknowledged\"]];\nif(status===\"added\")return [[\"Undo approval\",\"acknowledged\"]];\nreturn [];\n}\nfunction render(items){\nvar root=$(\"ideas\");root.replaceChildren();\nif(!items.length){root.append(text(\"p\",\"No ideas in this view yet.\",\"empty\"));return}\nitems.forEach(function(item){\nvar card=document.createElement(\"article\");card.className=\"idea\";\ncard.append(text(\"span\",\"#\"+item.id+\" · \"+item.category+\" · \"+new Date(item.created_at*1000).toLocaleString(),\"meta\"));\ncard.append(text(\"h2\",item.title));\ncard.append(text(\"p\",\"Submitted by \"+item.nickname+\" (unverified nickname)\",\"nickname\"));\ncard.append(text(\"p\",item.description,\"description\"));\ncard.append(text(\"span\",item.status,\"status\"));\nif(item.reviewer_note&&item.status===\"rejected\")card.append(text(\"p\",\"Review note: \"+item.reviewer_note,\"nickname\"));\nvar note=document.createElement(\"textarea\");note.maxLength=600;note.className=\"review-note\";note.rows=2;note.placeholder=\"Optional private reviewer note (especially when rejecting)\";\nnote.value=item.reviewer_note||\"\";\ncard.append(note);\nvar buttons=document.createElement(\"div\");buttons.className=\"actions\";\nactionsFor(item).forEach(function(pair){\nvar btn=makeButton(pair[0],pair[1],item,note);\nbuttons.append(btn);\n});\ncard.append(buttons);\nroot.append(card);\n});\n}\nasync function refresh(){\nshow(\"Loading suggestions…\");\ntry{\nvar res=await fetch(\"/api/suggestions?status=\"+encodeURIComponent(filter),{credentials:\"same-origin\",cache:\"no-store\"});\nif(!res.ok)throw Error(\"Dashboard request failed (\"+res.status+\"). Check your Access login.\");\nvar data=await res.json();\n[\"pending\",\"acknowledged\",\"added\",\"rejected\"].forEach(function(status){\nvar el=$(\"count\"+status[0].toUpperCase()+status.slice(1));el.textContent=data.counts[status]||0\n});\nrender(data.ideas||[]);\nshow(\"Showing \"+(data.ideas||[]).length+\" \"+filter+\" suggestion(s).\");\n}catch(e){show(e.message,true)}\n}\nasync function changeStatus(item,status,reviewNote){\nif(busy)return;\nif(status===\"added\"&&!confirm(\"Approve this idea for the PUBLIC mind map?\"))return;\nif(status===\"rejected\"&&!confirm(\"Reject this idea? It will remain private.\"))return;\nif(status===\"acknowledged\"&&item.status===\"added\"&&!confirm(\"Remove this idea from the PUBLIC mind map?\"))return;\nbusy=true;\nshow(\"Saving decision for #\"+item.id+\"…\");\ntry{\nvar res=await fetch(\"/api/suggestions/\"+item.id+\"/status\",{\nmethod:\"POST\",credentials:\"same-origin\",headers:{\"Content-Type\":\"application/json\",\"X-Shadowfall-Action\":\"review\"},\nbody:JSON.stringify({status:status,reviewer_note:reviewNote||\"\"})\n});\nvar data=await res.json().catch(function(){return {}});\nif(!res.ok)throw Error(data.error||\"Could not update idea (\"+res.status+\")\");\nshow(\"Idea #\"+item.id+\" updated to \"+status+\".\");\nawait refresh();\n}catch(e){show(e.message,true)}finally{busy=false}\n}\ndocument.querySelectorAll(\"[data-filter]\").forEach(function(btn){\nbtn.addEventListener(\"click\",function(){\nfilter=btn.dataset.filter;\ndocument.querySelectorAll(\"[data-filter]\").forEach(function(el){el.classList.toggle(\"active\",el===btn)});\nrefresh();\n});\n});\n$(\"refresh\").addEventListener(\"click\",refresh);refresh();\n})();\n</script>\n</body></html>";

export default {
  async fetch(request,env,ctx) {
    const auth=await review(request,env,ctx);
    if(auth.error)return auth.error;
    if(!env.DB)return respond({error:"D1 database binding DB is required"},503);
    const url=new URL(request.url);
    if(request.method==="GET"&&(url.pathname==="/"||url.pathname==="/admin")){
      const nonce=crypto.randomUUID().replaceAll("-","");
      const html=PAGE.replaceAll("@NONCE@",nonce);
      return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8",...BASE_HEADERS,
        "Content-Security-Policy":"default-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; script-src 'nonce-"+nonce+"'; style-src 'nonce-"+nonce+"'; connect-src 'self'; object-src 'none'; upgrade-insecure-requests"}});
    }
    if(request.method==="GET"&&url.pathname==="/api/suggestions"){
      let status=url.searchParams.get("status")||"pending";
      if(status!=="all"&&!STATES.has(status))return respond({error:"Invalid filter"},400);
      try{
        const [counts,rows]=await Promise.all([
          env.DB.prepare("SELECT status, COUNT(*) AS total FROM suggestions GROUP BY status").all(),
          status==="all"
            ?env.DB.prepare("SELECT id,nickname,title,category,description,status,created_at,updated_at,reviewer_note FROM suggestions ORDER BY created_at DESC,id DESC LIMIT 200").all()
            :env.DB.prepare("SELECT id,nickname,title,category,description,status,created_at,updated_at,reviewer_note FROM suggestions WHERE status=? ORDER BY created_at DESC,id DESC LIMIT 200").bind(status).all()
        ]);
        const result={pending:0,acknowledged:0,added:0,rejected:0};
        for(const row of counts.results||[])if(STATES.has(row.status))result[row.status]=row.total;
        return respond({ideas:rows.results||[],counts:result});
      }catch{return respond({error:"Database read failed"},503)}
    }
    const match=url.pathname.match(/^\/api\/suggestions\/(\d+)\/status$/);
    if(request.method==="POST"&&match){
      if(request.headers.get("Origin")!==url.origin)return respond({error:"Browser origin rejected"},403);
      if(request.headers.get("X-Shadowfall-Action")!=="review")return respond({error:"Missing action header"},403);
      if(!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json"))return respond({error:"JSON required"},415);
      if(Number(request.headers.get("Content-Length")||"0")>2500)return respond({error:"Request too large"},413);
      const id=safeId(match[1]);if(!id)return respond({error:"Invalid idea ID"},400);
      let data;try{const raw=await request.text();if(raw.length>2500)throw 0;data=JSON.parse(raw)}catch{return respond({error:"Invalid request"},400)}
      const target=data?.status, note=typeof data?.reviewer_note==="string"?data.reviewer_note.trim():"";
      if(!STATES.has(target)||note.length>600)return respond({error:"Invalid status or reviewer note"},400);
      try{
        const current=await env.DB.prepare("SELECT status FROM suggestions WHERE id=?").bind(id).first();
        if(!current)return respond({error:"Idea not found"},404);
        if(!ALLOWED[current.status]?.has(target))return respond({error:"Please acknowledge an idea before approving it, or select a permitted transition"},409);
        const stamp=Date.now(), seconds=Math.floor(stamp/1000);
        const change=env.DB.prepare(
          "UPDATE suggestions SET status=?,updated_at=?,reviewer_note=?,acknowledged_at=CASE WHEN ?='acknowledged' THEN ? ELSE acknowledged_at END,added_at=CASE WHEN ?='added' THEN ? ELSE added_at END,rejected_at=CASE WHEN ?='rejected' THEN ? ELSE rejected_at END WHERE id=? AND status=?"
        ).bind(target,stamp,note,target,seconds,target,seconds,target,seconds,id,current.status);
        // D1 batch executes atomically. Only insert audit row for a matching updated status+timestamp.
        const log=env.DB.prepare(
          "INSERT INTO moderation_events (suggestion_id,from_status,to_status,admin_email,at) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM suggestions WHERE id=? AND status=? AND updated_at=?)"
        ).bind(id,current.status,target,auth.email,seconds,id,target,stamp);
        const results=await env.DB.batch([change,log]);
        if(!results[0]?.meta?.changes||!results[1]?.meta?.changes)return respond({error:"Conflict. Reload the inbox and retry."},409);
        return respond({ok:true,id,status:target});
      }catch{return respond({error:"Could not save moderation decision"},503)}
    }
    return respond({error:"Not found"},404);
  }
};
