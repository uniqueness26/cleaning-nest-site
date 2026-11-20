/* Housekeeper: open jobs, bid on steps, my bids, my jobs. Needs app.js */
var HK={loaded:false,loading:false,on:false,steps:[],bids:[],mine:[],pick:{},rate:100,start:'',msg:null,busy:false};
var _render=render;
render=function(){_render();hkRender()};
function hapi(path,opt){opt=opt||{};opt.token=sess.access_token;return api(path,opt).then(function(r){if(r.status===401){save(null);HK.loaded=false;render();throw new Error('expired')}return r})}
var LBL={trash:'Trash and reset',laundry:'Laundry',baths:'Bathrooms',kitchen:'Kitchen',floors:'Floors (last)'};
function mm(c){return '$'+((c||0)/100).toFixed((c||0)%100?2:0)}
function wh(t){return new Date(t).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}
function hkLoad(){
  if(HK.loaded||HK.loading)return;HK.loading=true;var u=encodeURIComponent(sess.user.id);
  Promise.all([hapi('/rest/v1/settings?select=key,value&key=eq.platform_on'),hapi('/rest/v1/steps?select=*,orders(checkout_at,guests_at)&status=eq.open&order=window_start.asc,seq.asc'),hapi('/rest/v1/bids?select=*,bid_steps(step_id)&housekeeper_id=eq.'+u+'&order=created_at.desc'),hapi('/rest/v1/steps?select=*,orders(checkout_at,guests_at,houses(address))&assigned_to=eq.'+u+'&order=window_start.asc,seq.asc')]).then(function(a){
    HK.on=!!(a[0].j&&a[0].j[0]&&a[0].j[0].value===true);HK.steps=a[1].j||[];HK.bids=a[2].j||[];HK.mine=a[3].j||[];HK.loaded=true;HK.loading=false;hkRender();
  }).catch(function(){HK.loading=false});
}
function picked(){return HK.steps.filter(function(s){return HK.pick[s.id]})}
function hkHtml(){
  var h='';
  if(!HK.on){return '<div class="card"><h1>Jobs</h1><p class="sub">Jobs open when the platform goes live. We will text you.</p></div>'}
  var byO={},order=[];
  HK.steps.forEach(function(s){if(!byO[s.order_id]){byO[s.order_id]=[];order.push(s.order_id)}byO[s.order_id].push(s)});
  h+='<div class="card"><h1>Open jobs</h1><p class="sub">Pick the steps you want across any homes. Floors always go last.</p>';
  if(!order.length)h+='<p class="sub">No open jobs right now.</p>';
  order.forEach(function(oid){
    var ss=byO[oid],o=ss[0].orders;
    h+='<label>'+(o?wh(o.checkout_at)+' to '+wh(o.guests_at):'Job')+'</label>';
    ss.forEach(function(s){var on=!!HK.pick[s.id];
      h+='<button type="button" role="switch" aria-checked="'+on+'" data-h="tog" data-v="'+s.id+'" style="all:unset;box-sizing:border-box;display:flex;width:100%;justify-content:space-between;align-items:center;gap:10px;padding:12px;margin-bottom:6px;border:2px solid '+(on?'var(--brand)':'var(--line)')+';background:'+(on?'var(--soft)':'var(--surface)')+';border-radius:12px;cursor:pointer"><span><b>'+esc(LBL[s.key]||s.key)+'</b><br><small style="color:var(--muted)">'+s.minutes+' min</small></span><span style="white-space:nowrap"><b>'+mm(s.pay_cents)+'</b> &nbsp;'+(on?'ON':'OFF')+'</span></button>';
    });
  });
  if(order.length){
    var p=picked(),tot=0,min=0;p.forEach(function(s){tot+=s.pay_cents;min+=s.minutes});tot=Math.round(tot*HK.rate/100);
    h+='<label for="hr">Your rate</label><select id="hr" style="width:100%;font:inherit;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">'+[80,90,100,110,120].map(function(r){return '<option value="'+r+'"'+(r===HK.rate?' selected':'')+'>'+r+'% of listed pay</option>'}).join('')+'</select>';
    h+='<label for="hs">When can you start?</label><input id="hs" type="datetime-local" value="'+esc(HK.start)+'" style="width:100%;font:inherit;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">';
    h+='<div class="row"><span>Steps picked</span><b>'+p.length+'</b></div><div class="row"><span>Work time</span><b>'+Math.floor(min/60)+'h '+(min%60)+'m</b></div><div class="row"><span>Your bid</span><b>'+mm(tot)+'</b></div>';
    h+='<button class="go" type="button" data-h="bid" aria-disabled="'+HK.busy+'">Submit bid</button>';
  }
  if(HK.msg)h+='<div class="msg '+HK.msg.t+'" role="alert">'+esc(HK.msg.m)+'</div>';
  h+='</div>';
  if(HK.mine.length){
    h+='<div class="card" style="margin-top:16px"><h1>My jobs</h1>';
    HK.mine.forEach(function(s){var o=s.orders,a=o&&o.houses?o.houses.address:'Address on its way';
      h+='<div class="row"><span><b>'+esc(LBL[s.key]||s.key)+'</b><br><small style="color:var(--muted)">'+esc(a)+'<br>'+(o?wh(o.checkout_at):'')+'</small></span><span style="text-align:right"><span class="pill">'+esc(s.status.replace('_',' '))+'</span><br><b>'+mm(s.pay_cents)+'</b></span></div>';
    });h+='</div>';
  }
  if(HK.bids.length){
    h+='<div class="card" style="margin-top:16px"><h1>My bids</h1>';
    HK.bids.forEach(function(b){var n=(b.bid_steps||[]).length;if(!n)return;
      h+='<div class="row"><span>'+n+' step'+(n>1?'s':'')+'<br><small style="color:var(--muted)">'+wh(b.created_at)+'</small></span><span style="text-align:right"><span class="pill">'+esc(b.status)+'</span><br><b>'+mm(b.total_cents)+'</b></span></div>';
    });h+='</div>';
  }
  return h;
}
function hkRender(){
  var box=$('hkbox');
  var ok=window.PAGE&&PAGE.audience==='housekeeper'&&sess&&sess.profile&&(sess.profile.role==='housekeeper'||sess.profile.role==='admin');
  if(!ok){if(box)box.innerHTML='';return}
  if(!box){box=document.createElement('div');box.id='hkbox';box.style.marginTop='16px';var a=$('auth');a.parentNode.insertBefore(box,a.nextSibling)}
  if(!HK.loaded){box.innerHTML='<div class="card"><p class="sub">Loading jobs...</p></div>';hkLoad();return}
  if($('hr'))HK.rate=parseInt($('hr').value,10)||100;if($('hs'))HK.start=$('hs').value;
  box.innerHTML=hkHtml();bindH();
}
function bindH(){
  var rs=$('hr');if(rs)rs.onchange=function(){HK.rate=parseInt(rs.value,10)||100;hkRender()};
  Array.prototype.forEach.call(document.querySelectorAll('[data-h]'),function(b){b.onclick=function(){
    var a=b.getAttribute('data-h'),v=b.getAttribute('data-v');
    if($('hr'))HK.rate=parseInt($('hr').value,10)||100;if($('hs'))HK.start=$('hs').value;
    if(a==='tog'){HK.pick[v]=!HK.pick[v];HK.msg=null}
    else if(a==='bid'){submitBid();return}
    hkRender();
  }});
}
function submitBid(){
  if(HK.busy)return;var p=picked();
  if(!p.length){HK.msg={t:'err',m:'Pick at least one step.'};hkRender();return}
  HK.busy=true;HK.msg=null;hkRender();
  hapi('/rest/v1/bids',{method:'POST',prefer:'return=representation',body:{housekeeper_id:sess.user.id,rate_pct:HK.rate,start_at:HK.start?new Date(HK.start).toISOString():null}}).then(function(r){
    if(!(r.ok&&r.j&&r.j[0]))throw new Error('Jobs are not open to you yet.');
    var id=r.j[0].id;
    return hapi('/rest/v1/bid_steps',{method:'POST',prefer:'return=minimal',body:p.map(function(s){return {bid_id:id,step_id:s.id}})}).then(function(r2){
      if(!r2.ok){var m=(r2.j&&r2.j.message)||'';throw new Error(/Floors|no longer|not open/.test(m)?m:'We could not submit that bid. Try again.')}
    });
  }).then(function(){HK.pick={};HK.loaded=false;HK.msg={t:'ok',m:'Bid sent. Nest admin will review it.'}}).catch(function(e){HK.msg={t:'err',m:e.message||'We could not submit that bid. Try again.'}}).then(function(){HK.busy=false;hkRender()});
}
if(sess&&sess.profile)render();
