(() => {
'use strict';
const CATS=['Combat & Auto-play','Character Progression','Equipment & Loot','World & Bosses'];
const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const state={official:Array.isArray(window.SHADOWFALL_SEED)?window.SHADOWFALL_SEED:[],community:[],view:'map',filter:'',category:'',mapSearch:'',scale:1,tx:0,ty:0};
const guestConfig=window.SHADOWFALL_GUEST_CONFIG||{};
let widgetId=null;
function e(tag,attrs={}){const v=document.createElementNS(NS,tag);for(const [k,val] of Object.entries(attrs))v.setAttribute(k,String(val));return v}

function words(value,limit=26,maxRows=3){
  const content=String(value||'');
  const chunks=content.split(/\s+/);
  const lines=[];let line='';
  for(const word of chunks){
    if(!word)continue;
    if((line+' '+word).trim().length>limit&&line){lines.push(line);line=word}
    else line=(line+' '+word).trim();
  }
  if(line)lines.push(line);
  if(lines.length>maxRows){const out=lines.slice(0,maxRows);out[maxRows-1]=out[maxRows-1].slice(0,limit-1)+'…';return out}
  return lines;
}
function node(g,x,y,w,h,title,type,idea){
  const attributes={class:'node '+type,transform:'translate('+(x-w/2)+','+(y-h/2)+')',role:idea?'button':'img',tabindex:idea?'0':'-1'};
  if(idea)attributes['aria-label']=idea.title+(idea.author?' by '+idea.author:'');
  const n=e('g',attributes);
  const fullTitle=e('title');fullTitle.textContent=idea?(idea.title+(idea.author?' · by '+idea.author:'')):title;n.appendChild(fullTitle);
  n.appendChild(e('rect',{width:w,height:h,rx:10}));
  const community=type==='community';
  const parts=words(title,type==='category'?24:community?29:27,community?2:3);
  const lineHeight=community?18:18;
  const fontSize=type==='central'?21:type==='category'?17:16;
  const textCenter=community?((h-18)/2):h/2;
  const t=e('text',{x:w/2,y:textCenter-(parts.length-1)*lineHeight/2+fontSize*.32,'text-anchor':'middle','font-size':fontSize,'font-weight':type==='category'||type==='central'?700:600});
  parts.forEach((part,i)=>{const a=e('tspan',{x:w/2,dy:i?lineHeight:0});a.textContent=part;t.appendChild(a)});
  n.appendChild(t);
  if(community&&idea&&idea.author){
    const author=e('text',{x:w/2,y:h-10,'text-anchor':'middle','font-size':12,'font-weight':650,class:'author-label'});
    author.textContent='by '+String(idea.author).slice(0,24);
    n.appendChild(author);
  }
  if(idea){
    n.addEventListener('click',()=>openDetail(idea));
    n.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();openDetail(idea)}});
  }
  g.appendChild(n);
}
function edge(g,x,y,xx,yy){
  g.appendChild(e('path',{class:'edge',d:'M '+x+' '+y+' C '+x+' '+((y+yy)/2)+', '+xx+' '+((y+yy)/2)+', '+xx+' '+yy}));
}
function mapIdeas(){
  const search=state.mapSearch.trim().toLowerCase();
  return [...state.official,...state.community.filter(x=>x.status==='added')].filter(x=>!search||(x.title+' '+x.description+' '+x.category+' '+x.id+' '+(x.author||'')).toLowerCase().includes(search));
}
function renderMap(){
  const svg=$('map'),wrap=$('mapwrap'),ideas=mapIdeas();
  const cols=CATS.map(category=>ideas.filter(z=>z.category===category));
  const others=ideas.filter(z=>!CATS.includes(z.category));
  const maxRows=Math.max(1,...cols.map(group=>group.length));
  const otherCategoryY=330+maxRows*102+60;
  const canvasHeight=Math.max(810,others.length?otherCategoryY+105+others.length*102:335+maxRows*102);
  svg.setAttribute('viewBox','0 0 1200 '+canvasHeight);
  const width=wrap.clientWidth||1000;
  wrap.style.height=Math.max(530,Math.min(1450,Math.round(width*canvasHeight/1200)))+'px';
  svg.replaceChildren();
  const g=e('g',{transform:'translate('+state.tx+','+state.ty+') scale('+state.scale+')'});
  svg.appendChild(g);
  const xs=[145,445,755,1055];
  node(g,600,72,320,66,'SHADOWFALL IDLE','central');
  CATS.forEach((cat,i)=>{
    const x=xs[i];
    edge(g,600,105,x,172);
    node(g,x,202,265,62,cat,'category');
    cols[i].forEach((idea,j)=>{
      const y=314+j*102;
      edge(g,x,234,x,y-40);
      node(g,x,y,265,78,idea.author?idea.title:idea.id+' · '+idea.title,idea.author?'community':'idea',idea);
    });
  });
  if(others.length){
    edge(g,600,106,600,otherCategoryY-35);
    node(g,600,otherCategoryY,270,62,'Other community ideas','category');
    others.forEach((idea,i)=>{
      const y=otherCategoryY+104+i*102;
      edge(g,600,otherCategoryY+32,600,y-40);
      node(g,600,y,270,78,idea.author?idea.title:idea.id+' · '+idea.title,idea.author?'community':'idea',idea);
    });
  }
}
function openDetail(x){$('detailMeta').textContent=x.id+' · '+x.category+' · '+x.status+(x.author?' · by '+x.author:'');$('detailTitle').textContent=x.title;$('detailDescription').textContent=x.description;$('detailNote').textContent=x.note||(x.author?x.author+' thinks this would be a good idea.':'');$('detailLink').classList.toggle('hidden',!x.url);if(x.url)$('detailLink').href=x.url;$('detail').classList.remove('hidden')}
function render(){const arr=state.community,added=arr.filter(x=>x.status==='added');$('num-official').textContent=state.official.length+added.length;$('num-added').textContent=added.length;const feature=$('communityFeature');feature.classList.toggle('hidden',!added.length);if(added.length){$('latestCommunityName').textContent=added[0].title;$('latestCommunityAuthor').textContent='Suggested by '+added[0].author;$('communityFeatureView').onclick=()=>setView('added')}renderMap();if(state.view==='map')return;const groups={ideas:[...state.official,...added],added};$('listTitle').textContent=({ideas:'Curated official ideas',added:'Approved community suggestions'})[state.view];const list=(groups[state.view]||[]).filter(x=>(!state.category||x.category===state.category)&&(!state.filter||(x.title+' '+x.id+' '+x.description+' '+(x.author||'')).toLowerCase().includes(state.filter)));const root=$('cards');root.replaceChildren();if(!list.length){let empty=document.createElement('p');empty.className='empty';empty.textContent='No ideas in this view yet.';root.appendChild(empty);return;}for(const x of list){const tile=document.createElement('article');tile.className='tile';const span=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;tile.appendChild(n)};span('span',x.id+' · '+x.category,'meta');span('h3',x.title);if(x.author)span('p',x.author+' thinks this would be a good idea');span('p',x.description);span('span',x.status==='added'?'Added to board':x.status,'pill '+String(x.status).toLowerCase());const b=document.createElement('button');b.className='btn';b.textContent='Read details';b.onclick=()=>openDetail(x);tile.appendChild(b);root.appendChild(tile)}}
async function refresh(){if(!guestConfig.endpoint){$('hosting').textContent='Community submissions are awaiting server connection. The curated map remains available.';$('mapStatus').textContent='Live community data is not configured.';$('mapStatus').classList.remove('hidden');render();return}const status=$('status');status.classList.remove('hidden');status.textContent='Loading approved community ideas…';try{const response=await fetch(guestConfig.endpoint.replace(/\/$/,'')+'/public/ideas');if(!response.ok)throw Error('Idea service '+response.status);const data=await response.json();state.community=(data.ideas||[]).map(i=>({id:'COMM-'+i.id,author:i.nickname,title:i.title,category:i.category,description:i.description,status:'added',created:i.created_at}));status.classList.add('hidden');$('mapStatus').classList.add('hidden');$('hosting').textContent='Submit directly with a nickname. Approved ideas update on refresh or approximately every two minutes.'}catch(error){status.textContent='Could not refresh community ideas: '+error.message;$('mapStatus').textContent='Community updates are temporarily unavailable. Existing ideas remain visible.';$('mapStatus').classList.remove('hidden')}render()}
async function start(){try{const res=await fetch('official-ideas.json',{cache:'no-store'});if(res.ok)state.official=await res.json()}catch(error){}await refresh()}
function setView(v){state.view=v;document.querySelectorAll('.tab').forEach(n=>{const selected=n.dataset.view===v;n.classList.toggle('on',selected);n.setAttribute('aria-selected',String(selected))});$('panel-map').classList.toggle('hidden',v!=='map');$('panel-list').classList.toggle('hidden',v==='map');render()}
document.querySelectorAll('.tab').forEach(n=>n.onclick=()=>setView(n.dataset.view));$('filter').oninput=ev=>{state.filter=ev.target.value.toLowerCase();render()};$('mapSearch').oninput=ev=>{state.mapSearch=ev.target.value;renderMap()};$('categoryFilter').onchange=ev=>{state.category=ev.target.value;render()};$('refresh').onclick=refresh;$('refreshMap').onclick=refresh;$('closeDetail').onclick=()=>$('detail').classList.add('hidden');$('detail').onclick=ev=>{if(ev.target===$('detail'))$('detail').classList.add('hidden')};document.addEventListener('keydown',ev=>{if(ev.key==='Escape')$('detail').classList.add('hidden')});$('share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('share').textContent='✓ Link copied'}catch(error){prompt('Copy link:',location.href)}};const guest=$('guestDialog');
const guestStatus=$('guestFormStatus');
const guestForm=$('guestForm');
const guestButton=$('guestSend');
const guestSuccess=$('guestSuccess');
const resetGuestSuccess=()=>{guestSuccess.classList.add('hidden');guestForm.classList.remove('hidden');guestStatus.classList.remove('success');guestStatus.textContent='';};
$('guestDone').onclick=()=>{guest.classList.add('hidden');resetGuestSuccess()};
$('guestAnother').onclick=()=>{resetGuestSuccess();updateGuestButton()};
const hasGuestSetup=()=>Boolean(guestConfig.endpoint&&guestConfig.turnstileSiteKey);
const readyToSubmit=()=>Boolean(window.turnstile&&widgetId!==null&&window.turnstile.getResponse(widgetId)&&guestForm.checkValidity());
const updateGuestButton=()=>{guestButton.disabled=!readyToSubmit()};
guestForm.addEventListener('input',updateGuestButton);
guestForm.addEventListener('change',updateGuestButton);
const initializeTurnstile=()=>{
  if(widgetId!==null||!window.turnstile)return;
  widgetId=window.turnstile.render('#guestTurnstile',{
    sitekey:guestConfig.turnstileSiteKey,
    callback:updateGuestButton,
    'expired-callback':updateGuestButton,
    'error-callback':()=>{guestStatus.textContent='Verification failed. Close this form and try again.';guestButton.disabled=true}
  });
};
$('suggest').onclick=()=>{
  resetGuestSuccess();
  guest.classList.remove('hidden');
  guestStatus.textContent=hasGuestSetup()?'Complete Cloudflare verification before submitting.':'Guest submissions are temporarily unavailable. Please try again later.';
  if(!hasGuestSetup())return;
  if(window.turnstile)initializeTurnstile();
  else guestStatus.textContent='Loading bot protection. Please close and reopen the form if it does not appear.';
  updateGuestButton();
};
$('closeGuest').onclick=()=>guest.classList.add('hidden');
guest.onclick=ev=>{if(ev.target===guest)guest.classList.add('hidden')};
try{const remembered=localStorage.getItem('shadowfall-call-name');if(remembered)$('guestNickname').value=remembered.slice(0,24)}catch(error){}
// No GitHub login or redirect for visitors.
guestForm.onsubmit=async ev=>{
ev.preventDefault();
if(!hasGuestSetup()){guestStatus.textContent='Direct submission is not connected yet.';return}
if(!guestForm.reportValidity())return;
guestButton.disabled=true;
guestStatus.textContent='Submitting your idea…';
const token=typeof window.turnstile!=='undefined'&&widgetId!==null?window.turnstile.getResponse(widgetId):'';
if(!token){guestStatus.textContent='Please complete the bot protection first.';return}
const data={nickname:$('guestNickname').value.trim()||'Anonymous adventurer',title:$('guestTitle').value.trim(),category:$('guestCategory').value,description:$('guestDescription').value.trim(),website:$('guestWebsite').value,turnstileToken:token};
try{
const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
let response;
try{response=await fetch(guestConfig.endpoint.replace(/\/$/,'')+'/public/suggestions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal})}finally{clearTimeout(timeout)}
const result=await response.json().catch(()=>({}));
if(!response.ok)throw Error(result.error||'Submission failed');if(!result.ok||!result.id)throw Error('The server did not confirm that your idea was saved.');
guestStatus.textContent='';$('guestSuccessNumber').textContent='#'+result.id;guestForm.classList.add('hidden');guestSuccess.classList.remove('hidden');
try{if($('guestRemember').checked)localStorage.setItem('shadowfall-call-name',data.nickname);else localStorage.removeItem('shadowfall-call-name')}catch(error){}
guestForm.reset();if($('guestRemember').checked)$('guestNickname').value=data.nickname;await refresh();
}catch(error){guestStatus.textContent='Could not submit: '+error.message}
finally{if(typeof window.turnstile!=='undefined'&&widgetId!==null)window.turnstile.reset(widgetId);guestButton.disabled=true}
};

const zoom=value=>{state.scale=Math.max(.55,Math.min(4,state.scale*value));renderMap()};$('zoomIn').onclick=()=>zoom(1.2);$('zoomOut').onclick=()=>zoom(1/1.2);$('resetMap').onclick=()=>{state.tx=0;state.ty=0;state.scale=1;renderMap()};const map=$('map');let drag=null;map.addEventListener('pointerdown',ev=>{if(ev.target.closest('.node'))return;drag={x:ev.clientX,y:ev.clientY,tx:state.tx,ty:state.ty};map.setPointerCapture(ev.pointerId)});map.addEventListener('pointermove',ev=>{if(!drag)return;const rect=map.getBoundingClientRect();state.tx=drag.tx+(ev.clientX-drag.x)*1200/rect.width;const viewHeight=parseFloat(map.getAttribute('viewBox').split(' ')[3]);state.ty=drag.ty+(ev.clientY-drag.y)*viewHeight/rect.height;renderMap()});map.addEventListener('pointerup',()=>drag=null);map.addEventListener('pointercancel',()=>drag=null);map.addEventListener('wheel',ev=>{ev.preventDefault();zoom(ev.deltaY<0?1.07:1/1.07)},{passive:false});setInterval(refresh,120000);start()
})();