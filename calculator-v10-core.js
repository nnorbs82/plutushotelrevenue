(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PlutusBreakEven=factory()})(typeof self!=='undefined'?self:this,function(){
 function n(v){if(v===null||v===undefined||v==='')return null;const x=Number(v);return Number.isFinite(x)?x:null}
 function calculate(i={}){
  const rooms=n(i.rooms),days=n(i.days),adr=n(i.adr),vc=n(i.variableCost),fixed=n(i.fixedCost),occ=n(i.currentOccupancy),target=n(i.targetProfit)??0,anc=n(i.ancillaryRevenue)??0,ota=n(i.otaShare)??0,commission=n(i.otaCommission)??0,pay=n(i.paymentFee)??0;
  const errors=[];[['rooms',rooms],['days',days],['adr',adr],['variableCost',vc],['fixedCost',fixed]].forEach(([k,v])=>{if(v===null||v<0||(k==='rooms'||k==='days')&&v<=0)errors.push(k)});
  if(errors.length)return{valid:false,errors};
  const inventory=rooms*days,otaCost=adr*(ota/100)*(commission/100),payment=(adr+anc)*(pay/100),variable=vc+otaCost+payment,revenuePer=adr+anc,contribution=revenuePer-variable;
  if(contribution<=0)return{valid:false,errors:['contribution']};
  const beNights=fixed/contribution,beOcc=beNights/inventory*100,targetNights=(fixed+target)/contribution,targetOcc=targetNights/inventory*100;
  let currentProfit=null,currentRevenue=null,currentNights=null;
  if(occ!==null){currentNights=inventory*occ/100;currentRevenue=currentNights*revenuePer;currentProfit=currentNights*contribution-fixed}
  const breakEvenRevenue=beNights*revenuePer;
  return{valid:true,errors:[],inventory,revenuePer,variable,contribution,beNights,beOcc,targetOcc,currentProfit,currentRevenue,currentNights,breakEvenRevenue};
 }
 return{calculate};
});
