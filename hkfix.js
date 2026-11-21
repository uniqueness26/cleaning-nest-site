/* Rules the page must follow itself so nobody hits an error: admins cannot bid; floors show only after the other steps of that job are taken. Needs hk.js */
var _hkHtml=hkHtml;
hkHtml=function(){
 var all=HK.steps,held=0;
 var openBy={};all.forEach(function(s){if(s.key!=='floors')openBy[s.order_id]=true});
 HK.steps=all.filter(function(s){if(s.key==='floors'&&openBy[s.order_id]){delete HK.pick[s.id];held++;return false}return true});
 var h;try{h=_hkHtml()}finally{HK.steps=all}
 if(held)h=h.replace(/(<p class="sub">Pick the steps[^<]*)<\/p>/,'$1 Floors appear once the other steps of that job are taken.</p>');
 if(sess&&sess.profile&&sess.profile.role==='admin')h=h.replace(/<button class="go"[^>]*data-h="bid"[^>]*>Submit bid<\/button>/,'<p class="sub">You are signed in as admin, so you can look at jobs here but not bid. Use a housekeeper account to bid.</p>');
 return h};
if(sess&&sess.profile)render();
