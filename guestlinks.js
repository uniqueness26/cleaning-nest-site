/* Guest check-in links: tracked links, KPIs, add a property */
var GL={links:[],kpi:[],ev:[],loaded:false,loading:false,msg:null,busy:false};
function glLoad(){
  GL.loading=true;
  Promise.all([aapi('/rest/v1/guest_links?select=*&order=created_at'),aapi('/rest/v1/guest_link_kpis?select=*&order=last_open.desc&limit=100'),aapi('/rest/v1/guest_link_events?select=at,property_key,booking_code,event,tz,mobile,is_test&order=at.desc&limit=15')]).then(function(a){
    GL.links=a[0].j||[];GL.kpi=a[1].j||[];GL.ev=a[2].j||[];GL.loaded=true;GL.loading=false;adminRender();
  }).catch(function(){GL.loading=false});
}
function glBase(k){return location.origin+'/in/?p='+encodeURIComponent(k)+'&c='}
function glHtml(){
  var h='<div class="card" style="margin-top:16px"><h1>Guest check-in links</h1><p class="sub">Each guest gets their own link. Every open is counted so you can see who is close.</p>';
  if(!GL.loaded)return h+'<p class="sub">Loading...</p></div>';
  GL.links.forEach(function(l){
    var k=esc(l.property_key);
    h+='<div class="row" style="display:block"><b>'+esc(l.title)+'</b> <span class="pill">'+(l.active?'live':'paused')+'</span><br><small style="color:var(--muted)">'+k+'</small>'
     +'<div style="margin-top:8px"><input data-gc="'+k+'" placeholder="Booking code, e.g. HMQ9X4R4ER" style="font:inherit;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);width:100%;box-sizing:border-box"> <button type="button" class="out" data-g="copy" data-v="'+k+'" style="margin-top:6px">Copy guest link</button></div>'
     +'<div style="margin-top:8px"><input data-gd="'+k+'" value="'+esc(l.dest_url)+'" aria-label="Where the guest is sent" style="font:inherit;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);width:100%;box-sizing:border-box"> <button type="button" class="out" data-g="dest" data-v="'+k+'" style="margin-top:6px">Save destination</button> <button type="button" class="out" data-g="act" data-v="'+k+'" style="margin-top:6px">'+(l.active?'Pause':'Make live')+'</button></div></div>';
  });
  h+='<h2 style="margin:16px 0 4px;font-size:16px">Opens by booking</h2>';
  if(!GL.kpi.length)h+='<p class="sub">No opens yet.</p>';
  GL.kpi.forEach(function(r){h+='<div class="row"><span><b>'+esc(r.booking_code||'No code')+'</b> '+(r.is_test?'<span class="pill">test</span> ':'')+'<span class="pill">'+esc(r.property_key)+'</span><br><small style="color:var(--muted)">First '+when(r.first_open)+' &middot; last '+when(r.last_open)+'<br>'+(r.any_mobile?'On a phone':'On a computer')+(r.top_timezone?' &middot; '+esc(r.top_timezone):'')+'</small></span><span style="text-align:right"><b>'+r.opens+'</b> opens<br><small style="color:var(--muted)">'+r.continued+' tapped through &middot; '+r.days_opened+' day'+(r.days_opened==1?'':'s')+'</small></span></div>'});
  h+='<h2 style="margin:16px 0 4px;font-size:16px">Latest activity</h2>';
  if(!GL.ev.length)h+='<p class="sub">Nothing yet.</p>';
  GL.ev.forEach(function(e){h+='<div class="row"><span>'+esc(e.booking_code||'No code')+' <small style="color:var(--muted)">'+esc(e.property_key)+(e.is_test?' (test)':'')+'</small></span><span style="text-align:right"><span class="pill">'+esc(e.event)+'</span><br><small style="color:var(--muted)">'+when(e.at)+'</small></span></div>'});
  h+='<h2 style="margin:16px 0 4px;font-size:16px">Add a property</h2><p class="sub">Paste the check-in guide link for a new property. It stays paused until you make it live.</p>'
   +'<input id="glk" placeholder="Short name, e.g. killian-green" style="font:inherit;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);width:100%;box-sizing:border-box;margin-bottom:6px">'
   +'<input id="glt" placeholder="Title, e.g. Killian Green check-in instructions" style="font:inherit;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);width:100%;box-sizing:border-box;margin-bottom:6px">'
   +'<input id="gld" placeholder="Link to the check-in guide (https://...)" style="font:inherit;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);width:100%;box-sizing:border-box;margin-bottom:6px"><button type="button" class="out" data-g="add">Add property</button>';
  if(GL.msg)h+='<div class="msg '+GL.msg.t+'" role="alert">'+esc(GL.msg.m)+'</div>';
  return h+'</div>';
}
function glSave(path,opt,okm){
  if(GL.busy)return;GL.busy=true;
  aapi(path,opt).then(function(r){if(r.ok){GL.msg={t:'ok',m:okm};GL.loaded=false}else GL.msg={t:'err',m:(r.j&&r.j.message)||'That did not save. Try again.'}}).catch(function(){}).then(function(){GL.busy=false;if(!GL.loaded)glLoad();else adminRender()});
}
function glBind(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-g]'),function(b){
    var a=b.getAttribute('data-g'),v=b.getAttribute('data-v');
    b.onclick=function(){
      if(a==='copy'){var c=(document.querySelector('[data-gc="'+v+'"]').value||'').trim().replace(/[^A-Za-z0-9-]/g,''),u=glBase(v)+c;
        var done=function(){GL.msg={t:'ok',m:'Copied: '+u};adminRender()};
        if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u).then(done,function(){GL.msg={t:'ok',m:u};adminRender()});else{GL.msg={t:'ok',m:u};adminRender()}}
      else if(a==='dest'){var d=document.querySelector('[data-gd="'+v+'"]').value.trim();if(!/^https:\/\//.test(d)){GL.msg={t:'err',m:'The destination must start with https://'};adminRender();return}
        glSave('/rest/v1/guest_links?property_key=eq.'+encodeURIComponent(v),{method:'PATCH',body:{dest_url:d},prefer:'return=minimal'},'Destination saved.')}
      else if(a==='act'){var l=GL.links.filter(function(x){return x.property_key===v})[0];
        glSave('/rest/v1/guest_links?property_key=eq.'+encodeURIComponent(v),{method:'PATCH',body:{active:!(l&&l.active)},prefer:'return=minimal'},l&&l.active?'Link paused.':'Link is live.')}
      else if(a==='add'){var k=$('glk').value.trim().toLowerCase(),t=$('glt').value.trim(),d2=$('gld').value.trim();
        if(!/^[a-z0-9-]{2,30}$/.test(k)||!t||!/^https:\/\//.test(d2)){GL.msg={t:'err',m:'Use a short name (letters, numbers, dashes), a title, and a link starting with https://'};adminRender();return}
        glSave('/rest/v1/guest_links',{method:'POST',body:{property_key:k,title:t,dest_url:d2,active:false},prefer:'return=minimal'},'Added. Tap Make live when you are ready.')}
    };
  });
}
var _ah=adminHtml;
adminHtml=function(){var s=_ah(),i=s.indexOf('<div class="msg ');return i>-1?s.slice(0,i)+glHtml()+s.slice(i):s+glHtml()};
var _ar=adminRender;
adminRender=function(){_ar();if(AD.loaded){glBind();if(!GL.loaded&&!GL.loading)glLoad()}};
