/* Admins can look at jobs on the housekeeper page but cannot bid. Needs hk.js */
var _hkHtml=hkHtml;
hkHtml=function(){var h=_hkHtml();
 if(sess&&sess.profile&&sess.profile.role==='admin')h=h.replace(/<button class="go"[^>]*data-h="bid"[^>]*>Submit bid<\/button>/,'<p class="sub">You are signed in as admin, so you can look at jobs here but not bid. Use a housekeeper account to bid.</p>');
 return h};
if(sess&&sess.profile)render();
