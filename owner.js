/* Owner booking: houses, service toggles, drafts, confirm. Needs app.js (sess, api, esc, $) */
var OW={loaded:false,loading:false,houses:[],svc:[],orders:[],open:false,house:'',co:'',gu:'',pick:{},msg:null,busy:false,adding:false,hf:{a:'',b:'',t:''}};
var _lead=leadHtml;
leadHtml=function(){return (sess&&sess.profile)?'':_lead()};
var _render=render;
render=function(){_render();ownerRender()};
function oapi(path,opt){opt=opt||{};opt.token=sess.access_token;return api(path,opt).then(function(r){if(r.status===401){save(null);OW.loaded=false;render();throw new Error('expired')}return r})}
function money(c){return '$'+(c/100).toFixed(c%100?2:0)}
function ownerLoad(){
  if(OW.loaded||OW.loading)return;OW.loading=true;
  Promise.all([oapi('/rest/v1/houses?select=*&order=created_at'),oapi('/rest/v1/services?select=*&active=eq.true&order=sort'),oapi('/rest/v1/settings?select=key,value&key=eq.accept_new_orders'),oapi('/rest/v1/orders?select=*,order_items(service_id)&order=created_at.desc')]).then(function(a){
    OW.houses=a[0].j||[];OW.svc=a[1].j||[];OW.open=!!(a[2].j&&a[2].j[0]&&a[2].j[0].value===true);OW.orders=a[3].j||[];
    if(!OW.house&&OW.houses[0])OW.house=OW.houses[0].id;
    OW.loaded=true;OW.loading=false;ownerRender();
  }).catch(function(){OW.loading=false});
}
function total(){var c=0,m=0;OW.svc.forEach(function(s){if(OW.pick[s.id]){c+=s.price_cents;m+=s.minutes}});return {c:c,m:m}}
function hasBase(){return OW.svc.some(function(s){return s.grp==='base'&&OW.pick[s.id]})}
function ownerHtml(){
  var h='<div class="card"><h1>Your homes</h1>';
  if(!OW.houses.length&&!OW.adding)h+='<p class="sub">Add the home you want cleaned.</p>';
  OW.houses.forEach(function(x){h+='<div class="row"><span>'+esc(x.address)+'</span><b>'+(x.bedrooms||'?')+' bd / '+(x.bathrooms||'?')+' ba</b></div>'});
  if(OW.adding){
    h+='<form id="hf" novalidate><label for="ha">Street address</label><input id="ha" type="text" autocomplete="street-address" value="'+esc(OW.hf.a)+'"><label for="hb">Bedrooms</label><input id="hb" type="text" inputmode="numeric" value="'+esc(OW.hf.b)+'"><label for="ht">Bathrooms</label><input id="ht" type="text" inputmode="decimal" value="'+esc(OW.hf.t)+'"><button class="go" type="submit" aria-disabled="'+OW.busy+'">Save home</button></form>';
  }else h+='<button class="go" type="button" data-o="addhouse">Add a home</button>';
  h+='</div>';
  if(OW.houses.length){
    var t=total();
    h+='<div class="card" style="margin-top:16px"><h1>Book a clean</h1><p class="sub">'+(OW.open?'Pick what you want. Confirming locks it in with a time stamp.':'Booking opens soon. You can save your choices as a draft now.')+'</p>';
    h+='<label for="oh">Home</label><select id="oh" style="width:100%;font:inherit;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">'+OW.houses.map(function(x){return '<option value="'+x.id+'"'+(x.id===OW.house?' selected':'')+'>'+esc(x.address)+'</option>'}).join('')+'</select>';
    h+='<label for="oc">Guests check out</label><input id="oc" type="datetime-local" value="'+esc(OW.co)+'" style="width:100%;font:inherit;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">';
    h+='<label for="og">Next guests arrive</label><input id="og" type="datetime-local" value="'+esc(OW.gu)+'" style="width:100%;font:inherit;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">';
    var grp={base:'Base clean (pick one)',add:'Add-ons',rescue:'Rescue'};
    ['base','add','rescue'].forEach(function(g){
      h+='<label>'+grp[g]+'</label>';
      OW.svc.filter(function(s){return s.grp===g}).forEach(function(s){
        var on=!!OW.pick[s.id];
        h+='<button type="button" role="switch" aria-checked="'+on+'" data-o="tog" data-v="'+s.id+'" style="all:unset;box-sizing:border-box;display:flex;width:100%;justify-content:space-between;align-items:center;gap:10px;padding:12px;margin-bottom:6px;border:2px solid '+(on?'var(--brand)':'var(--line)')+';background:'+(on?'var(--soft)':'var(--surface)')+';border-radius:12px;cursor:pointer"><span><b>'+esc(s.name)+'</b>'+(s.description?'<br><small style="color:var(--muted)">'+esc(s.description)+'</small>':'')+'</span><span style="white-space:nowrap"><b>'+money(s.price_cents)+'</b> &nbsp;'+(on?'ON':'OFF')+'</span></button>';
      });
    });
    h+='<div class="row"><span>Estimated total</span><b>'+money(t.c)+'</b></div><div class="row"><span>Estimated time</span><b>'+Math.floor(t.m/60)+'h '+(t.m%60)+'m</b></div>';
    h+='<button class="go" type="button" data-o="draft" aria-disabled="'+OW.busy+'">Save draft</button>';
    if(OW.msg)h+='<div class="msg '+OW.msg.t+'" role="alert">'+esc(OW.msg.m)+'</div>';
    h+='</div>';
  }
  if(OW.orders.length){
    h+='<div class="card" style="margin-top:16px"><h1>Your bookings</h1>';
    OW.orders.forEach(function(o){
      var h0=OW.houses.filter(function(x){return x.id===o.house_id})[0];
      h+='<div class="row"><span>'+esc(h0?h0.address:'Home')+'<br><small style="color:var(--muted)">'+new Date(o.checkout_at).toLocaleString([], {dateStyle:'medium',timeStyle:'short'})+'</small></span><span style="text-align:right"><span class="pill">'+esc(o.status.replace('_',' '))+'</span><br><b>'+money(o.total_cents||0)+'</b>'+(o.status==='draft'&&OW.open?'<br><button class="out" type="button" data-o="lock" data-v="'+o.id+'" style="margin-top:6px">Confirm and lock</button>':'')+'</span></div>';
    });
    h+='</div>';
  }
  return h;
}
function ownerRender(){
  var box=$('ownerbox');
  var ok=window.PAGE&&PAGE.audience==='owner'&&sess&&sess.profile&&(sess.profile.role==='owner'||sess.profile.role==='admin');
  if(!ok){if(box)box.innerHTML='';return}
  if(!box){box=document.createElement('div');box.id='ownerbox';box.style.marginTop='16px';var a=$('auth');a.parentNode.insertBefore(box,a.nextSibling)}
  if(!OW.loaded){box.innerHTML='<div class="card"><p class="sub">Loading your homes...</p></div>';ownerLoad();return}
  keepO();box.innerHTML=ownerHtml();bindO();
}
function keepO(){
  if($('oh'))OW.house=$('oh').value;if($('oc'))OW.co=$('oc').value;if($('og'))OW.gu=$('og').value;
  if($('ha')){OW.hf.a=$('ha').value;OW.hf.b=$('hb').value;OW.hf.t=$('ht').value}
}
function bindO(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-o]'),function(b){b.onclick=function(){
    keepO();var a=b.getAttribute('data-o'),v=b.getAttribute('data-v');
    if(a==='addhouse'){OW.adding=true}
    else if(a==='tog'){
      var s=OW.svc.filter(function(x){return x.id===v})[0];
      if(s.grp==='base'){OW.svc.forEach(function(x){if(x.grp==='base')OW.pick[x.id]=false});OW.pick[v]=true}
      else OW.pick[v]=!OW.pick[v];
      OW.msg=null;
    }
    else if(a==='draft'){saveDraft();return}
    else if(a==='lock'){lockOrder(v);return}
    ownerRender();
  }});
  var f=$('hf');if(f)f.onsubmit=function(e){e.preventDefault();keepO();addHouse()};
}
function addHouse(){
  if(OW.busy)return;
  if(!OW.hf.a.trim()){OW.msg={t:'err',m:'Enter the street address.'};ownerRender();return}
  OW.busy=true;
  var row={owner_id:sess.user.id,address:OW.hf.a.trim(),bedrooms:parseInt(OW.hf.b,10)||null,bathrooms:parseFloat(OW.hf.t)||null};
  oapi('/rest/v1/houses',{method:'POST',body:row,prefer:'return=representation'}).then(function(r){
    if(r.ok&&r.j&&r.j[0]){OW.houses.push(r.j[0]);OW.house=r.j[0].id;OW.adding=false;OW.hf={a:'',b:'',t:''};OW.msg=null}
    else OW.msg={t:'err',m:'We could not save that home. Try again.'};
  }).catch(function(){}).then(function(){OW.busy=false;ownerRender()});
}
function saveDraft(){
  if(OW.busy)return;
  if(!OW.co||!OW.gu){OW.msg={t:'err',m:'Pick the check-out and next-arrival times.'};ownerRender();return}
  var co=new Date(OW.co),gu=new Date(OW.gu),t=total();
  if(!(gu>co)){OW.msg={t:'err',m:'Next guests must arrive after check-out.'};ownerRender();return}
  if(!hasBase()){OW.msg={t:'err',m:'Pick a base clean.'};ownerRender();return}
  if((gu-co)/60000<t.m+60){OW.msg={t:'err',m:'That window is too short for this clean. Move the arrival later or turn something off.'};ownerRender();return}
  OW.busy=true;OW.msg=null;ownerRender();
  oapi('/rest/v1/orders',{method:'POST',prefer:'return=representation',body:{house_id:OW.house,owner_id:sess.user.id,checkout_at:co.toISOString(),guests_at:gu.toISOString(),status:'draft'}}).then(function(r){
    if(!(r.ok&&r.j&&r.j[0]))throw new Error('order');
    var id=r.j[0].id,items=OW.svc.filter(function(s){return OW.pick[s.id]}).map(function(s){return {order_id:id,service_id:s.id,price_cents:s.price_cents,minutes:s.minutes}});
    return oapi('/rest/v1/order_items',{method:'POST',body:items,prefer:'return=minimal'}).then(function(r2){if(!r2.ok)throw new Error('items')});
  }).then(function(){
    OW.pick={};OW.co='';OW.gu='';OW.msg={t:'ok',m:'Draft saved. It appears under Your bookings.'};
    return oapi('/rest/v1/orders?select=*,order_items(service_id)&order=created_at.desc').then(function(r){OW.orders=r.j||[]});
  }).catch(function(){OW.msg={t:'err',m:'We could not save that. Try again.'}}).then(function(){OW.busy=false;ownerRender()});
}
function lockOrder(id){
  if(OW.busy)return;OW.busy=true;
  oapi('/rest/v1/orders?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{status:'locked'},prefer:'return=representation'}).then(function(r){
    if(r.ok&&r.j&&r.j[0]){OW.orders=OW.orders.map(function(o){return o.id===id?Object.assign(o,r.j[0]):o});OW.msg={t:'ok',m:'Locked in. Time stamp saved.'}}
    else OW.msg={t:'err',m:'Booking is not open yet.'};
  }).catch(function(){}).then(function(){OW.busy=false;ownerRender()});
}
if(sess&&sess.profile)render();
