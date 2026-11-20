var SB='https://rhqqmdgeqhxirpholjsb.supabase.co';
var KEY='sb_publishable_8A2yEyzocYKD5YEVn1mkZQ_TGks3GUd';
var AUD=(window.PAGE&&window.PAGE.audience)||'owner';
var mode='in',busy=false,msg=null,showPw=false,form={name:'',email:'',phone:''},lmsg=null,lbusy=false,ldone=false,lform={name:'',contact:'',phone:'',zip:'',ok:false};
var sess=null;try{sess=JSON.parse(localStorage.getItem('cn_session')||'null')}catch(e){}
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function save(s){sess=s;try{if(s)localStorage.setItem('cn_session',JSON.stringify(s));else localStorage.removeItem('cn_session')}catch(e){}}
function api(path,opt){opt=opt||{};var h={apikey:KEY,'Content-Type':'application/json'};
  h.Authorization='Bearer '+(opt.token||KEY);if(opt.prefer)h.Prefer=opt.prefer;
  return fetch(SB+path,{method:opt.method||'GET',headers:h,body:opt.body?JSON.stringify(opt.body):undefined}).then(function(r){
    return r.text().then(function(t){var j=null;try{j=t?JSON.parse(t):null}catch(e){}return {ok:r.ok,status:r.status,j:j}})})}
function nice(r){var j=r.j||{},c=j.error_code||j.code||'',m=(j.msg||j.message||j.error_description||'').toLowerCase();
  if(c==='invalid_credentials'||m.indexOf('invalid login')>-1)return 'That email and password do not match. Check them and try again.';
  if(c==='email_not_confirmed'||m.indexOf('not confirmed')>-1)return 'Your email is not confirmed yet. Check your inbox, or ask Nestled to confirm it.';
  if(c==='user_already_exists'||m.indexOf('already')>-1)return 'That email already has an account. Use Sign in instead.';
  if(c==='weak_password'||m.indexOf('password')>-1)return 'Use a password with at least 8 characters.';
  if(r.status===429||c==='over_email_send_rate_limit')return 'Too many tries. Wait a minute and try again.';
  if(r.status===0)return 'No connection. Check your internet and try again.';
  return 'Something went wrong. Try again in a moment.'}
function setMsg(t,m){msg=m?{t:t,m:m}:null}
var WORD={owner:'Property owner',housekeeper:'Housekeeper',admin:'Nest admin'};
function authHtml(){
  if(sess&&sess.profile)return home();
  var canUp=AUD!=='admin';
  var h='<div class="card" id="signin">';
  if(canUp)h+='<div class="seg" role="group" aria-label="Sign in or create account"><button type="button" data-a="mode" data-v="in" aria-pressed="'+(mode==='in')+'">Sign in</button><button type="button" data-a="mode" data-v="up" aria-pressed="'+(mode==='up')+'">Create account</button></div>';
  h+='<h1>'+(AUD==='admin'?'Nest admin sign in':(mode==='in'?'Welcome back':'Create your account'))+'</h1><p class="sub">'+(AUD==='admin'?'For the Nest team only.':(mode==='in'?'Sign in as a '+WORD[AUD].toLowerCase()+'.':'It takes under a minute.'))+'</p><form id="f" novalidate>';
  if(mode==='up')h+='<label for="name">Full name</label><input id="name" type="text" autocomplete="name" value="'+esc(form.name)+'">';
  h+='<label for="email">Email</label><input id="email" type="email" autocomplete="email" inputmode="email" autocapitalize="none" value="'+esc(form.email)+'">';
  h+='<label for="pw">Password</label><div class="pw"><input id="pw" type="'+(showPw?'text':'password')+'" autocomplete="'+(mode==='in'?'current-password':'new-password')+'"><button type="button" data-a="pw">'+(showPw?'Hide':'Show')+'</button></div>';
  if(mode==='up')h+='<label for="phone">Mobile number</label><input id="phone" type="tel" autocomplete="tel" inputmode="tel" value="'+esc(form.phone)+'"><p class="fine">Account texts only after you opt in below the lead form or in your settings.</p>';
  h+='<button class="go" type="submit" aria-disabled="'+busy+'">'+(busy?'One moment...':(mode==='in'?'Sign in':'Create account'))+'</button></form>';
  if(msg)h+='<div class="msg '+msg.t+'" role="alert">'+esc(msg.m)+'</div>';
  if(mode==='up'&&AUD==='housekeeper')h+='<p class="fine">Housekeeper accounts are approved by Nest admin before you can see any jobs.</p>';
  return h+'</div>';
}
function home(){
  var p=sess.profile,r=p.role,rq=(sess.user.user_metadata||{}).requested_role;
  var pend=r==='owner'&&rq==='housekeeper';
  var h='<div class="card"><span class="pill">'+(pend?'Pending approval':esc(r))+'</span><h1 style="margin-top:10px">Hi'+(p.full_name?', '+esc(p.full_name.split(' ')[0]):'')+'</h1>';
  if(AUD==='admin'&&r!=='admin')h+='<p class="sub">This page is for Nest admin only. Your account is a '+esc(r)+' account.</p>';
  else if(pend)h+='<p class="sub">Your housekeeper account is created. Nest admin needs to approve it before you can see jobs.</p>';
  else if(r==='admin')h+='<p class="sub">You are signed in as Nest admin. The admin panel is the next piece we connect.</p>';
  else if(r==='housekeeper')h+='<p class="sub">You are approved as a housekeeper. Job bidding opens when the platform goes live.</p>';
  else h+='<p class="sub">Your account is ready. Booking opens when the platform goes live.</p>';
  h+='<div class="row"><span>Email</span><b>'+esc(sess.user.email)+'</b></div><div class="row"><span>Role</span><b>'+esc(r)+'</b></div>';
  return h+'<button class="out" type="button" data-a="out">Sign out</button></div>';
}
function utm(){var o={},q=new URLSearchParams(location.search);['utm_source','utm_medium','utm_campaign'].forEach(function(k){var v=q.get(k);if(v)o[k]=v.slice(0,80)});
  try{if(Object.keys(o).length)sessionStorage.setItem('cn_utm',JSON.stringify(o));else o=JSON.parse(sessionStorage.getItem('cn_utm')||'{}')}catch(e){}return o}
var CONSENT='I agree to receive texts from Cleaning Nest (a B&B Nest company) about my cleaning requests, jobs and offers. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.';
function leadHtml(){
  if(AUD==='admin')return '';
  var own=AUD==='owner';
  if(ldone)return '<div class="card" id="lead"><span class="pill">Thank you</span><h1 style="margin-top:10px">You are on the list</h1><p class="sub">'+(own?'We will contact you about your first clean as soon as booking opens.':'We will contact you when we are approving housekeepers in your area.')+'</p></div>';
  var h='<div class="card" id="lead"><h1>'+(own?'Get on the list for your first clean':'Apply to work with Cleaning Nest')+'</h1><p class="sub">'+(own?'No payment now. We will reach out when booking opens in your area.':'Tell us where you work. We review every application.')+'</p><form id="lf" novalidate>';
  h+='<label for="ln">Full name</label><input id="ln" type="text" autocomplete="name" value="'+esc(lform.name)+'">';
  h+='<label for="le">Email</label><input id="le" type="email" autocomplete="email" inputmode="email" autocapitalize="none" value="'+esc(lform.contact)+'">';
  h+='<label for="lp">Mobile number</label><input id="lp" type="tel" autocomplete="tel" inputmode="tel" value="'+esc(lform.phone)+'">';
  h+='<label for="lz">ZIP code</label><input id="lz" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="10" value="'+esc(lform.zip)+'">';
  h+='<label class="chk" for="lc"><input id="lc" type="checkbox"'+(lform.ok?' checked':'')+'><span>'+esc(CONSENT)+' <a href="../privacy.html" style="color:inherit">Privacy</a></span></label>';
  h+='<button class="go" type="submit" aria-disabled="'+lbusy+'">'+(lbusy?'One moment...':(own?'Join the list':'Send application'))+'</button></form>';
  if(lmsg)h+='<div class="msg '+lmsg.t+'" role="alert">'+esc(lmsg.m)+'</div>';
  return h+'</div>';
}
function render(){var a=$('auth');if(a)a.innerHTML=authHtml();var l=$('leadbox');if(l)l.innerHTML=leadHtml();bind()}
function keepL(){if($('ln')){lform.name=$('ln').value;lform.contact=$('le').value;lform.phone=$('lp').value;lform.zip=$('lz').value;lform.ok=$('lc').checked}}
function keep(){if($('name'))form.name=$('name').value;if($('email'))form.email=$('email').value;if($('phone'))form.phone=$('phone').value}
function bind(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-a]'),function(b){b.onclick=function(){
    var a=b.getAttribute('data-a'),v=b.getAttribute('data-v');keep();
    if(a==='mode'){mode=v;msg=null}else if(a==='pw'){showPw=!showPw}else if(a==='out'){out();return}
    render()}});
  var f=$('f');if(f)f.onsubmit=function(e){e.preventDefault();submit()};
  var lf=$('lf');if(lf)lf.onsubmit=function(e){e.preventDefault();sendLead()};
}
function digits(p){var d=String(p||'').replace(/\D/g,'');if(d.length===11&&d[0]==='1')d=d.slice(1);return d.length===10?'+1'+d:null}
function uuid(){return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16)})}
function sendLead(){
  if(lbusy)return;keepL();
  var em=lform.contact.trim(),ph=digits(lform.phone);
  if(!lform.name.trim()){lmsg={t:'err',m:'Enter your full name.'};render();return}
  if(!em&&!ph){lmsg={t:'err',m:'Enter an email or a mobile number.'};render();return}
  if(em&&em.indexOf('@')<1){lmsg={t:'err',m:'That email does not look right.'};render();return}
  if(lform.phone.trim()&&!ph){lmsg={t:'err',m:'Enter a 10-digit mobile number.'};render();return}
  if(lform.ok&&!ph){lmsg={t:'err',m:'To get texts, enter your mobile number.'};render();return}
  lbusy=true;lmsg=null;render();
  var id=uuid(),u=utm();
  var row={id:id,kind:AUD,full_name:lform.name.trim(),email:em||null,phone:ph,zip:lform.zip.trim()||null,utm_source:u.utm_source||null,utm_medium:u.utm_medium||null,utm_campaign:u.utm_campaign||null};
  api('/rest/v1/leads',{method:'POST',body:row,prefer:'return=minimal'}).then(function(r){
    if(!r.ok){lmsg={t:'err',m:'We could not save that. Try again in a moment.'};return}
    ldone=true;
    if(lform.ok&&ph)return api('/rest/v1/sms_consent',{method:'POST',prefer:'return=minimal',body:{phone:ph,lead_id:id,purpose:'marketing',status:'opted_in',consent_text:CONSENT,source_url:location.href.slice(0,300)}});
  }).catch(function(){lmsg={t:'err',m:nice({status:0})}}).then(function(){lbusy=false;render()});
}
function loadProfile(s){return api('/rest/v1/profiles?select=role,full_name&id=eq.'+encodeURIComponent(s.user.id),{token:s.access_token}).then(function(r){
  s.profile=(r.ok&&r.j&&r.j[0])||{role:'owner',full_name:(s.user.user_metadata||{}).full_name||''};save(s);return s})}
function submit(){
  if(busy)return;keep();
  var email=$('email').value.trim(),pw=$('pw').value;
  if(!email||email.indexOf('@')<1){setMsg('err','Enter a valid email address.');render();return}
  if(pw.length<8){setMsg('err','Use a password with at least 8 characters.');render();return}
  if(mode==='up'&&!form.name.trim()){setMsg('err','Enter your full name.');render();return}
  busy=true;setMsg();render();var p;
  if(mode==='up'){p=api('/auth/v1/signup',{method:'POST',body:{email:email,password:pw,data:{full_name:form.name.trim(),phone:form.phone.trim(),requested_role:AUD}}}).then(function(r){
    if(!r.ok){setMsg('err',nice(r));return null}var j=r.j||{};if(j.access_token)return loadProfile(j);
    setMsg('ok','Account created. Check your email to confirm it, then sign in.');mode='in';return null})}
  else{p=api('/auth/v1/token?grant_type=password',{method:'POST',body:{email:email,password:pw}}).then(function(r){if(!r.ok){setMsg('err',nice(r));return null}return loadProfile(r.j)})}
  p.catch(function(){setMsg('err',nice({status:0}))}).then(function(){busy=false;render()});
}
function out(){var t=sess&&sess.access_token;save(null);msg=null;mode='in';render();if(t)api('/auth/v1/logout',{method:'POST',token:t}).catch(function(){})}
(function(){utm();if(sess&&sess.access_token){api('/auth/v1/user',{token:sess.access_token}).then(function(r){if(r.ok){sess.user=r.j;return loadProfile(sess)}save(null)}).catch(function(){}).then(render)}render()})();
