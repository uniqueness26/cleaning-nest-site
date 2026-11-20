/* Text opt-in at account creation. Needs app.js. Records consent only if the box is checked. */
var JOBTXT='I agree to receive texts from Cleaning Nest (a B&B Nest company) about my jobs, bookings and account. Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out, HELP for help. Consent is not a condition of purchase.';
var JC=false;
document.addEventListener('change',function(e){if(e.target&&e.target.id==='jc')JC=e.target.checked});
var _auth=authHtml;
authHtml=function(){
  var h=_auth();
  if(mode!=='up'||(sess&&sess.profile))return h;
  var box='<label class="chk" for="jc"><input id="jc" type="checkbox"'+(JC?' checked':'')+'><span>'+esc(JOBTXT)+' <a href="../privacy.html" style="color:inherit">Privacy</a></span></label>';
  return h.replace('<button class="go" type="submit"',box+'<button class="go" type="submit"');
};
var _nice=nice;
nice=function(r){return (r.j&&r.j.custom)||_nice(r)};
var _api=api;
api=function(path,opt){
  var wantTxt=false,ph='';
  if(path==='/auth/v1/signup'&&opt&&opt.body){wantTxt=JC;ph=digits(opt.body.data&&opt.body.data.phone);if(wantTxt&&!ph)return Promise.resolve({ok:false,status:400,j:{custom:'Enter a 10-digit mobile number to get texts, or uncheck the box.'}})}
  return _api(path,opt).then(function(r){
    if(wantTxt&&ph&&r.ok){JC=false;_api('/rest/v1/sms_consent',{method:'POST',prefer:'return=minimal',body:{phone:ph,purpose:'job_alerts',status:'opted_in',consent_text:JOBTXT,source_url:location.href.slice(0,300)}}).catch(function(){})}
    return r;
  });
};
