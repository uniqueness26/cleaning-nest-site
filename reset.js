/* Forgot password and set-new-password. Needs app.js */
var RS={mode:'',tok:'',msg:null,busy:false};
(function(){var h=location.hash||'';if(h.indexOf('type=recovery')>-1){var q=new URLSearchParams(h.slice(1));RS.tok=q.get('access_token')||'';if(RS.tok){RS.mode='set';history.replaceState(null,'',location.pathname+location.search)}}})();
var _auth2=authHtml;
authHtml=function(){
  if(RS.mode==='set')return '<div class="card"><h1>Set a new password</h1><p class="sub">Use at least 8 characters.</p><form id="rf" novalidate><label for="np">New password</label><input id="np" type="password" autocomplete="new-password"><button class="go" type="submit" aria-disabled="'+RS.busy+'">Save password</button></form>'+(RS.msg?'<div class="msg '+RS.msg.t+'" role="alert">'+esc(RS.msg.m)+'</div>':'')+'</div>';
  var h=_auth2();
  if(mode!=='in'||(sess&&sess.profile))return h;
  var l='<button type="button" class="out" data-r="forgot" style="margin-top:10px">Forgot password?</button>'+(RS.msg?'<div class="msg '+RS.msg.t+'" role="alert">'+esc(RS.msg.m)+'</div>':'');
  return h.replace(/<\/div>$/,l+'</div>');
};
var _render2=render;
render=function(){_render2();
  Array.prototype.forEach.call(document.querySelectorAll('[data-r]'),function(b){b.onclick=forgot});
  var f=$('rf');if(f)f.onsubmit=function(e){e.preventDefault();setPw()};
};
function forgot(){
  var em=($('email')&&$('email').value||'').trim();
  if(em.indexOf('@')<1){RS.msg={t:'err',m:'Type your email above first, then tap Forgot password.'};render();return}
  form.email=em;
  api('/auth/v1/recover',{method:'POST',body:{email:em}}).then(function(){RS.msg={t:'ok',m:'If that email has an account, a reset link is on its way.'}}).catch(function(){RS.msg={t:'err',m:nice({status:0})}}).then(render);
}
function setPw(){
  var p=$('np').value;if(RS.busy)return;
  if(p.length<8){RS.msg={t:'err',m:'Use at least 8 characters.'};render();return}
  RS.busy=true;
  fetch(SB+'/auth/v1/user',{method:'PUT',headers:{apikey:KEY,'Content-Type':'application/json',Authorization:'Bearer '+RS.tok},body:JSON.stringify({password:p})}).then(function(r){
    if(r.ok){RS.mode='';RS.tok='';RS.msg={t:'ok',m:'Password saved. Sign in with it now.'};mode='in'}else RS.msg={t:'err',m:'That link has expired. Request a new one.'};
  }).catch(function(){RS.msg={t:'err',m:nice({status:0})}}).then(function(){RS.busy=false;render()});
}
render();
