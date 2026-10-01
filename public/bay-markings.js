/* Generic bay markings ported from the supplied Commercial Build 129. */
function cleanBayText(v){
  return String(v??"").replace(/\r/g,"").split("\n").slice(0,3).map(s=>s.slice(0,40)).join("\n").slice(0,80);
}
function drawPaintedBayText(c,text,x,y,maxW,maxH){
  const lines=cleanBayText(text).split("\n").map(s=>s.trim()).filter(Boolean);
  if(!lines.length) return;
  c.save();
  const longest=Math.max(...lines.map(s=>s.length),1);
  const fs=Math.max(6.5,Math.min(maxW/Math.max(5,longest*.62),maxH/Math.max(1.25,lines.length*1.28)));
  c.font=`850 ${fs}px -apple-system,system-ui,sans-serif`; c.fillStyle="rgba(248,250,252,.94)";
  c.textAlign="center"; c.textBaseline="middle"; c.strokeStyle="rgba(0,0,0,.42)"; c.lineWidth=Math.max(1.3,fs*.09);
  const gap=fs*1.27, y0=y-(lines.length-1)*gap/2;
  lines.forEach((line,i)=>{ c.strokeText(line,x,y0+i*gap,maxW); c.fillText(line,x,y0+i*gap,maxW); });
  c.restore();
}
function evSymbolPalette(it){
  const whitePaint=it&&it.bayPaintColour==="white";
  return whitePaint
    ? {paint:"rgba(248,250,252,.97)",dark:"rgba(4,20,33,.86)",detail:"rgba(4,20,33,.72)",halo:"rgba(0,0,0,.38)"}
    : {paint:"#24A35A",dark:"#0B5B35",detail:"rgba(248,250,252,.94)",halo:"rgba(0,0,0,.30)"};
}
/* scalable painted EV pictogram: top-down car with its charging lead looping around it */
function drawEVCarCableSymbol(c,x,y,s,it){
  if(!(s>0)) return;
  const palette=evSymbolPalette(it), green=palette.paint, dark=palette.dark, white=palette.detail;
  const cw=s*0.32, ch=s*0.72;
  const traceCable=()=>{
    c.beginPath();
    c.moveTo(cw*0.54,ch*0.20);
    c.bezierCurveTo(s*0.34,s*0.20,s*0.46,s*0.30,s*0.39,s*0.45);
    c.bezierCurveTo(s*0.27,s*0.53,-s*0.22,s*0.54,-s*0.39,s*0.38);
    c.bezierCurveTo(-s*0.50,s*0.27,-s*0.49,-s*0.08,-s*0.46,-s*0.29);
  };
  c.save(); c.translate(x,y); c.lineCap="round"; c.lineJoin="round";
  // Pale under-stroke keeps the cable legible over survey photographs and in PDF exports.
  traceCable(); c.strokeStyle=white; c.lineWidth=Math.max(2.6,s*0.080); c.stroke();
  traceCable(); c.strokeStyle=green; c.lineWidth=Math.max(1.8,s*0.046); c.stroke();
  // Plug at the free end of the loop.
  c.save(); c.translate(-s*0.46,-s*0.29); c.rotate(0.12);
  c.fillStyle=white; rrect(c,-s*0.083,-s*0.075,s*0.166,s*0.145,s*0.036); c.fill();
  c.fillStyle=green; rrect(c,-s*0.064,-s*0.058,s*0.128,s*0.112,s*0.028); c.fill();
  c.strokeStyle=green; c.lineWidth=Math.max(1.5,s*0.018);
  [-1,1].forEach(sg=>{ c.beginPath(); c.moveTo(sg*s*0.032,-s*0.052); c.lineTo(sg*s*0.032,-s*0.105); c.stroke(); });
  c.restore();
  // Vehicle body and wheels.
  c.shadowColor="rgba(0,0,0,.28)"; c.shadowBlur=Math.max(2,s*0.025); c.shadowOffsetY=s*0.012;
  c.fillStyle=white; rrect(c,-cw*0.57,-ch*0.53,cw*1.14,ch*1.06,cw*0.28); c.fill();
  c.shadowColor="transparent";
  c.fillStyle=green; rrect(c,-cw*0.50,-ch*0.50,cw,ch,cw*0.24); c.fill();
  c.strokeStyle=dark; c.lineWidth=Math.max(1.2,s*0.014); rrect(c,-cw*0.50,-ch*0.50,cw,ch,cw*0.24); c.stroke();
  c.fillStyle=dark;
  [[-cw*0.60,-ch*0.30],[cw*0.47,-ch*0.30],[-cw*0.60,ch*0.18],[cw*0.47,ch*0.18]].forEach(p=>{ rrect(c,p[0],p[1],cw*0.13,ch*0.16,cw*0.05); c.fill(); });
  // Windscreens and centre EV bolt.
  c.fillStyle="rgba(248,250,252,.84)";
  c.beginPath(); c.moveTo(-cw*0.34,-ch*0.29); c.lineTo(cw*0.34,-ch*0.29); c.lineTo(cw*0.27,-ch*0.08); c.lineTo(-cw*0.27,-ch*0.08); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-cw*0.27,ch*0.11); c.lineTo(cw*0.27,ch*0.11); c.lineTo(cw*0.34,ch*0.30); c.lineTo(-cw*0.34,ch*0.30); c.closePath(); c.fill();
  c.fillStyle=white; c.beginPath();
  c.moveTo(s*0.015,-s*0.095); c.lineTo(-s*0.075,s*0.015); c.lineTo(-s*0.008,s*0.015); c.lineTo(-s*0.052,s*0.105); c.lineTo(s*0.075,-s*0.035); c.lineTo(s*0.010,-s*0.035); c.closePath(); c.fill();
  // Charging port connects the loop cleanly to the car.
  c.fillStyle=white; c.beginPath(); c.arc(cw*0.51,ch*0.20,Math.max(2,s*0.038),0,Math.PI*2); c.fill();
  c.fillStyle=dark; c.beginPath(); c.arc(cw*0.51,ch*0.20,Math.max(1.3,s*0.019),0,Math.PI*2); c.fill();
  c.restore();
}
/* bespoke concept: side-profile car with one continuous charging lead wrapping around it */

function drawPlannerBayMarking(c,it,w,h,acc){
 const marking=it.bayMarking||(it.evText===false?'none':'ev_only');
 if(marking==='ev_car')drawEVCarCableSymbol(c,0,acc?-h*.17:-h*.02,Math.min(w*.82,h*.45),it);
 else if(marking!=='none')drawPaintedBayText(c,marking==='visitors'?'VISITORS':marking==='custom'?(it.bayText||''):'ELECTRIC\nVEHICLES\nONLY',0,acc?-h*.20:-h*.06,w*.80,h*.30);
}
