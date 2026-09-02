(function(global){
  'use strict';
  const num=(v,f=0)=>{if(v===undefined||v===null||v==='')return f;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:NaN;};
  function calculate(input){
    const v={rooms:num(input.rooms,NaN),days:num(input.days,NaN),adr:num(input.adr,NaN),variableCost:num(input.variableCost,NaN),fixedCost:num(input.fixedCost,NaN),currentOccupancy:num(input.currentOccupancy,0),targetProfit:num(input.targetProfit,0),ancillaryRevenue:num(input.ancillaryRevenue,0),otaShare:num(input.otaShare,0),otaCommission:num(input.otaCommission,0),paymentFee:num(input.paymentFee,0)};
    const errors=[];
    if(!(v.rooms>0))errors.push('Enter the number of rooms.');
    if(!(v.days>0&&v.days<=366))errors.push('Enter a valid number of days.');
    if(!(v.adr>=0))errors.push('Enter ADR.');
    if(!(v.variableCost>=0))errors.push('Enter variable cost per occupied room.');
    if(!(v.fixedCost>=0))errors.push('Enter fixed costs for the period.');
    ['currentOccupancy','otaShare','otaCommission','paymentFee'].forEach(k=>{if(!(v[k]>=0&&v[k]<=100))errors.push('Percentages must be between 0 and 100.');});
    if(errors.length)return{valid:false,errors,values:v};
    const available=v.rooms*v.days;
    const revenuePerRoom=v.adr+v.ancillaryRevenue;
    const otaCost=v.adr*(v.otaShare/100)*(v.otaCommission/100);
    const paymentCost=revenuePerRoom*(v.paymentFee/100);
    const variable=v.variableCost+otaCost+paymentCost;
    const contribution=revenuePerRoom-variable;
    if(!(contribution>0))return{valid:false,errors:['Revenue per occupied room must be higher than variable and distribution costs.'],values:v};
    const beNights=v.fixedCost/contribution;
    const beOcc=(beNights/available)*100;
    const currentNights=available*(v.currentOccupancy/100);
    const currentProfit=v.currentOccupancy>0?(currentNights*contribution)-v.fixedCost:null;
    const targetNights=(v.fixedCost+v.targetProfit)/contribution;
    const targetOcc=v.targetProfit>0?(targetNights/available)*100:null;
    const graph=[];for(let occ=0;occ<=100;occ+=4){const nights=available*(occ/100);graph.push({occ,revenue:nights*revenuePerRoom,cost:v.fixedCost+nights*variable});}
    return{valid:true,values:v,available,revenuePerRoom,variable,contribution,beNights,beOcc,currentProfit,targetOcc,graph};
  }
  const api={calculate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(global)global.PlutusCalcCore=api;
})(typeof window!=='undefined'?window:globalThis);
