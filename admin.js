/* Nest admin: switches, housekeeper approvals, leads, bookings. Needs app.js */
var AD={loaded:false,loading:false,set:{},people:[],leads:[],orders:[],bids:[],texts:[],armed:'',msg:null,busy:false};
var _home=home;
home=function(){return _home().replace(' The admin panel is the next piece we connect.','')};
var _render=render;
render=function(){_render();adminRender()};
function aapi(path,opt){opt=opt||{};opt.token=sess.access_token;return api(path,opt).then(function(r){if(r.status===401){save(null);AD.loaded=false;render();throw new Error('expired')}return r})}
function adminLoad(){
  if(AD.loaded||AD.loading)return;AD.loading=true;
  Promise.all([aapi('/rest/v1/settings?select=key,value'),aapi('/rest/v1/profiles?select=id,full_name,email,phone,role,requested_role,active,created_at&order=created_at.desc'),aapi('/rest/v1/leads?select=*&order=created_at.desc&limit=25'),aapi('/rest/v1/orders?select=*,houses(address)&order=created_at.desc&limit=25'),aapi('/rest/v1/bids?select=*,profiles!bids_housekeeper_id_fkey(full_name),bid_steps(steps(key,pay_cents,orders(checkout_at,houses(address))))&status=eq.pending&order=created_at'),aapi('/rest/v1/sms_outbox?select=id,to_phone,event,body,status,reason,created_at,sent_at&order=created_at.desc&limit=25')]).then(function(a){
    AD.set={};(a[0].j||[]).forEach(function(s){AD.set[s.key]=s.value});
    AD.people=a[1].j||[];AD.leads=a[2].j||[];AD.orders=a[3].j||[];AD.bids=(a[4].j||[]).filter(function(b){return (b.bid_steps||[]).length});AD.texts=a[5].j||[];AD.loaded=true;AD.loading=false;adminRender();
  }).catch(function(){AD.loading=false});
}
function m$(c){return '$'+((c||0)/100).toFixed((c||0)%100?2:0)}
function when(t){return new Date(t).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}
function sw(key,label,note){
  var on=AD.set[key]===true,armed=AD.armed===key;
  return '<div class="row" style="align-items:center"><span><b>'+label+'</b><br><small style="color:var(--muted)">'+note+'</small></span><button type="button" role="switch" aria-checked="'+on+'" data-d="sw" data-v="'+key+'" style="all:unset;cursor:pointer;padding:10px 14px;border-radius:999px;font-weight:800;font-size:14px;border:2px solid '+(on?'var(--ok)':'var(--line)')+';background:'+(armed?'var(--err-bg)':(on?'var(--ok-bg)':'var(--surface)'))+';color:'+(armed?'var(--err)':(on?'var(--ok)':'var(--muted)'))+'">'+(armed?'Tap again to '+(on?'turn OFF':'turn ON'):(on?'ON':'OFF'))+'</button></div>';
}
function adminHtml(){
  var h='<div class="card"><h1>Switches</h1><p class="sub">Everything stays off until you turn it on.</p>'+sw('platform_on','Platform','Housekeepers can see and bid on jobs')+sw('accept_new_orders','Accept bookings','Owners can confirm and lock bookings')+sw('sms_sending_on','Job texts','Automatic texts to opted-in people, 9am to 8pm Eastern')+'</div>';
  var pend=AD.people.filter(function(p){return p.requested_role==='housekeeper'&&p.role==='owner'});
  var hk=AD.people.filter(function(p){return p.role==='housekeeper'});
  h+='<div class="card" style="margin-top:16px"><h1>Housekeepers</h1>';
  if(!pend.length&&!hk.length)h+='<p class="sub">No applications yet.</p>';
  pend.forEach(function(p){h+='<div class="row" style="align-items:center"><span><b>'+esc(p.full_name||'No name')+'</b><br><small style="color:var(--muted)">'+esc(p.email||'')+' '+esc(p.phone||'')+'<br>Applied '+when(p.created_at)+'</small></span><button type="button" class="out" data-d="appr" data-v="'+p.id+'">Approve</button></div>'});
  hk.forEach(function(p){h+='<div class="row" style="align-items:center"><span><b>'+esc(p.full_name||'No name')+'</b> <span class="pill">approved</span><br><small style="color:var(--muted)">'+esc(p.email||'')+'</small></span><button type="button" class="out" data-d="rem" data-v="'+p.id+'">Remove</button></div>'});
  h+='</div>';
  h+='<div class="card" style="margin-top:16px"><h1>Bids to review</h1>';
  if(!AD.bids.length)h+='<p class="sub">No pending bids.</p>';
  var LB={trash:'Trash',laundry:'Laundry',baths:'Baths',kitchen:'Kitchen',floors:'Floors'};
  AD.bids.forEach(function(b){var st=b.bid_steps.map(function(x){return x.steps}),a0=st[0]&&st[0].orders&&st[0].orders.houses?st[0].orders.houses.address:'';
    h+='<div class="row" style="align-items:center"><span><b>'+esc(b.profiles?b.profiles.full_name:'Housekeeper')+'</b> <span class="pill">'+b.rate_pct+'%</span><br><small style="color:var(--muted)">'+st.map(function(x){return LB[x.key]||x.key}).join(', ')+'<br>'+esc(a0)+(b.start_at?' &middot; starts '+when(b.start_at):'')+'</small></span><span style="text-align:right"><b>'+m$(b.total_cents)+'</b><br><button type="button" class="out" data-d="bacc" data-v="'+b.id+'">Accept</button> <button type="button" class="out" data-d="bdec" data-v="'+b.id+'">Decline</button></span></div>'});
  h+='</div>';
  h+='<div class="card" style="margin-top:16px"><h1>Bookings</h1>';
  if(!AD.orders.length)h+='<p class="sub">No bookings yet.</p>';
  AD.orders.forEach(function(o){h+='<div class="row"><span>'+esc(o.houses?o.houses.address:'Home')+'<br><small style="color:var(--muted)">'+when(o.checkout_at)+'</small></span><span style="text-align:right"><span class="pill">'+esc(o.status.replace('_',' '))+'</span><br><b>'+m$(o.total_cents)+'</b></span></div>'});
  h+='</div>';
  h+='<div class="card" style="margin-top:16px"><h1>Leads</h1>';
  if(!AD.leads.length)h+='<p class="sub">No leads yet.</p>';
  var stages=['new','contacted','signed_up','booked','lost'];
  AD.leads.forEach(function(l){h+='<div class="row" style="align-items:center"><span><b>'+esc(l.full_name||'No name')+'</b> <span class="pill">'+esc(l.kind)+'</span><br><small style="color:var(--muted)">'+esc(l.email||'')+' '+esc(l.phone||'')+' '+esc(l.zip||'')+'<br>'+esc(l.utm_source||'direct')+(l.utm_campaign?' / '+esc(l.utm_campaign):'')+' &middot; '+when(l.created_at)+'</small></span><select data-d="stage" data-v="'+l.id+'" aria-label="Lead stage" style="font:inherit;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">'+stages.map(function(s){return '<option'+(s===l.stage?' selected':'')+'>'+s+'</option>'}).join('')+'</select></div>'});
  h+='</div>';
  h+='<div class="card" style="margin-top:16px"><h1>Text log</h1>';
  if(!AD.texts.length)h+='<p class="sub">No texts yet.</p>';
  AD.texts.forEach(function(t){h+='<div class="row"><span>'+esc((t.to_phone||'').replace(/^\+1(\d{3})(\d{3})(\d{4})$/,'($1) $2-$3'))+'<br><small style="color:var(--muted)">'+esc(t.event)+' &middot; '+when(t.created_at)+(t.reason?' &middot; '+esc(t.reason):'')+'</small></span><span class="pill">'+esc(t.status)+'</span></div>'});
  h+='</div>';
  if(AD.msg)h+='<div class="msg '+AD.msg.t+'" role="alert">'+esc(AD.msg.m)+'</div>';
  return h;
}
function adminRender(){
  var box=$('adminbox');
  var ok=window.PAGE&&PAGE.audience==='admin'&&sess&&sess.profile&&sess.profile.role==='admin';
  if(!ok){if(box)box.innerHTML='';return}
  if(!box){box=document.createElement('div');box.id='adminbox';box.style.marginTop='16px';var a=$('auth');a.parentNode.insertBefore(box,a.nextSibling)}
  if(!AD.loaded){box.innerHTML='<div class="card"><p class="sub">Loading admin data...</p></div>';adminLoad();return}
  box.innerHTML=adminHtml();bindA();
}
function bindA(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-d]'),function(b){
    var a=b.getAttribute('data-d'),v=b.getAttribute('data-v');
    if(a==='stage'){b.onchange=function(){setStage(v,b.value)};return}
    b.onclick=function(){
      if(a==='sw'){if(AD.armed===v){AD.armed='';setSwitch(v)}else{AD.armed=v;adminRender()}return}
      AD.armed='';
      if(a==='appr')setRole(v,'housekeeper');
      else if(a==='rem')setRole(v,'owner');
      else if(a==='bacc')setBid(v,'accepted');
      else if(a==='bdec')setBid(v,'declined');
    };
  });
}
function setSwitch(key){
  if(AD.busy)return;AD.busy=true;var val=AD.set[key]!==true;
  aapi('/rest/v1/settings?key=eq.'+key,{method:'PATCH',body:{value:val,updated_by:sess.user.id},prefer:'return=representation'}).then(function(r){
    if(r.ok&&r.j&&r.j[0]){AD.set[key]=r.j[0].value;AD.msg=null}else AD.msg={t:'err',m:'That did not save. Try again.'};
  }).catch(function(){}).then(function(){AD.busy=false;adminRender()});
}
function setRole(id,role){
  if(AD.busy)return;AD.busy=true;
  aapi('/rest/v1/profiles?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{role:role},prefer:'return=representation'}).then(function(r){
    if(r.ok&&r.j&&r.j[0]){AD.people=AD.people.map(function(p){return p.id===id?Object.assign(p,r.j[0]):p});AD.msg=null}else AD.msg={t:'err',m:'That did not save. Try again.'};
  }).catch(function(){}).then(function(){AD.busy=false;adminRender()});
}
function setBid(id,status){
  if(AD.busy)return;AD.busy=true;
  aapi('/rest/v1/bids?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{status:status},prefer:'return=representation'}).then(function(r){
    if(r.ok&&r.j&&r.j[0]){AD.bids=AD.bids.filter(function(b){return b.id!==id});AD.msg={t:'ok',m:status==='accepted'?'Bid accepted. Those steps are assigned.':'Bid declined.'};if(status==='accepted')AD.loaded=false}
    else AD.msg={t:'err',m:(r.j&&r.j.message)||'That did not save. Try again.'};
  }).catch(function(){}).then(function(){AD.busy=false;adminRender()});
}
function setStage(id,stage){
  aapi('/rest/v1/leads?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{stage:stage},prefer:'return=minimal'}).then(function(r){
    if(!r.ok){AD.msg={t:'err',m:'That did not save. Try again.'};adminRender()}
  }).catch(function(){});
}
if(sess&&sess.profile)render();
