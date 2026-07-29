import React, { useState, useEffect, useRef, useCallback } from "react";

const THEMES = {
  dark:   { bg:"#0A0E1A",bg2:"#0F1427",bg3:"#141930",card:"#111626",border:"#1E2540",text:"#EEF0F6",sub:"#C8D0E0",muted:"#5A6480" },
  light:  { bg:"#F0F2F8",bg2:"#FFFFFF", bg3:"#E8EBF5",card:"#FFFFFF", border:"#D1D9EE",text:"#0A0E1A",sub:"#3A4460",muted:"#8A94B0" },
  amoled: { bg:"#000000",bg2:"#050508", bg3:"#0A0A0F",card:"#080810", border:"#151520",text:"#FFFFFF", sub:"#C0C8E0",muted:"#404860" },
};
const A = { indigo:"#5B4FE9",mint:"#00F5C4",gold:"#F5A623",rose:"#FF6B8A",sky:"#38BDF8",violet:"#A78BFA",green:"#34D399",orange:"#FB923C" };

function factorial(n){ if(n<0||n>170) return Infinity; if(n<=1) return 1; let r=1; for(let i=2;i<=n;i++) r*=i; return r; }
function gcd(a,b){ return b?gcd(b,a%b):a; }
function isPrime(n){ if(n<2) return false; for(let i=2;i<=Math.sqrt(n);i++) if(n%i===0) return false; return true; }

function safeEval(expr){
  try{
    let e=expr
      .replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-")
      .replace(/π/g,String(Math.PI))
      .replace(/sin\(([^)]+)\)/g,(_,x)=>`Math.sin((${x})*Math.PI/180)`)
      .replace(/cos\(([^)]+)\)/g,(_,x)=>`Math.cos((${x})*Math.PI/180)`)
      .replace(/tan\(([^)]+)\)/g,(_,x)=>`Math.tan((${x})*Math.PI/180)`)
      .replace(/asin\(([^)]+)\)/g,(_,x)=>`(Math.asin(${x})*180/Math.PI)`)
      .replace(/acos\(([^)]+)\)/g,(_,x)=>`(Math.acos(${x})*180/Math.PI)`)
      .replace(/atan\(([^)]+)\)/g,(_,x)=>`(Math.atan(${x})*180/Math.PI)`)
      .replace(/sinh\(/g,"Math.sinh(").replace(/cosh\(/g,"Math.cosh(").replace(/tanh\(/g,"Math.tanh(")
      .replace(/log\(/g,"Math.log10(").replace(/ln\(/g,"Math.log(")
      .replace(/√\(/g,"Math.sqrt(").replace(/∛\(/g,"Math.cbrt(")
      .replace(/abs\(/g,"Math.abs(").replace(/ceil\(/g,"Math.ceil(").replace(/floor\(/g,"Math.floor(")
      .replace(/\^/g,"**")
      .replace(/(\d+)!/g,(_,n)=>String(factorial(Number(n))));
    // eslint-disable-next-line no-new-func
    const r=new Function("return "+e)();
    if(!isFinite(r)) return "Error";
    return parseFloat(r.toFixed(10)).toString();
  }catch{ return "Error"; }
}

function fmtIN(n){
  if(n==="Error"||n==null) return n||"";
  const x=parseFloat(n);
  if(isNaN(x)) return n;
  if(Math.abs(x)>=1e15||(Math.abs(x)<0.000001&&x!==0)) return x.toExponential(4);
  return x.toLocaleString("en-IN",{maximumFractionDigits:8});
}

function calcStats(nums){
  if(!nums.length) return null;
  const n=nums.length, sum=nums.reduce((a,b)=>a+b,0), mean=sum/n;
  const sorted=[...nums].sort((a,b)=>a-b);
  const med=n%2?sorted[Math.floor(n/2)]:(sorted[n/2-1]+sorted[n/2])/2;
  const freq={}; nums.forEach(x=>{freq[x]=(freq[x]||0)+1;});
  const maxF=Math.max(...Object.values(freq));
  const mode=Object.entries(freq).filter(([,v])=>v===maxF).map(([k])=>k).join(", ");
  const variance=nums.reduce((a,x)=>a+(x-mean)**2,0)/n;
  const sd=Math.sqrt(variance);
  return{n,sum:sum.toFixed(4),mean:mean.toFixed(4),median:med.toFixed(4),mode,sd:sd.toFixed(4),variance:variance.toFixed(4),min:sorted[0],max:sorted[n-1],range:(sorted[n-1]-sorted[0]).toFixed(4)};
}

function solveQuadratic(a,b,c){
  const disc=b*b-4*a*c;
  if(disc<0) return{type:"Complex",x1:`${(-b/(2*a)).toFixed(3)} + ${(Math.sqrt(-disc)/(2*a)).toFixed(3)}i`,x2:`${(-b/(2*a)).toFixed(3)} - ${(Math.sqrt(-disc)/(2*a)).toFixed(3)}i`};
  if(disc===0) return{type:"Equal",x1:((-b)/(2*a)).toFixed(6),x2:((-b)/(2*a)).toFixed(6)};
  return{type:"Real",x1:((-b+Math.sqrt(disc))/(2*a)).toFixed(6),x2:((-b-Math.sqrt(disc))/(2*a)).toFixed(6)};
}

const UNIT_CATS={
  Length:{m:1,km:1000,cm:0.01,mm:0.001,ft:0.3048,inch:0.0254,yard:0.9144,mile:1609.34,"nautical mi":1852},
  Weight:{kg:1,g:0.001,mg:1e-6,lb:0.453592,oz:0.028349,ton:1000,grain:6.48e-5},
  Volume:{L:1,mL:0.001,m3:1000,gallon:3.78541,qt:0.946353,cup:0.236588,fl_oz:0.029574,tbsp:0.014787},
  Area:{m2:1,km2:1e6,cm2:1e-4,ft2:0.092903,inch2:6.4516e-4,acre:4046.86,hectare:1e4},
  Speed:{"km/h":1,"m/s":3.6,mph:1.60934,knot:1.852},
  Time:{s:1,ms:0.001,min:60,hr:3600,day:86400,week:604800,month:2629800,year:31557600},
  Temp:{C:1,F:1,K:1},
  Energy:{J:1,kJ:1000,cal:4.184,kcal:4184,Wh:3600,kWh:3600000},
  Pressure:{Pa:1,kPa:1000,bar:1e5,atm:101325,psi:6894.76},
  Data:{B:1,KB:1024,MB:1048576,GB:1073741824,TB:1099511627776},
};

function cvtUnit(val,from,to,type){
  if(!val||isNaN(val)) return "";
  const v=parseFloat(val);
  if(type==="Temp"){
    const toC={C:x=>x,F:x=>(x-32)*5/9,K:x=>x-273.15};
    const fromC={C:x=>x,F:x=>x*9/5+32,K:x=>x+273.15};
    if(from===to) return v.toFixed(4);
    return parseFloat(fromC[to](toC[from](v)).toFixed(6)).toString();
  }
  const map=UNIT_CATS[type]; if(!map) return "";
  return parseFloat((v*map[from]/map[to]).toFixed(8)).toString();
}

const CURRENCIES={
  INR:{sym:"₹",name:"Indian Rupee",rate:1},
  USD:{sym:"$",name:"US Dollar",rate:83.2},
  EUR:{sym:"€",name:"Euro",rate:90.1},
  GBP:{sym:"£",name:"British Pound",rate:105.3},
  JPY:{sym:"¥",name:"Japanese Yen",rate:0.56},
  AUD:{sym:"A$",name:"Australian Dollar",rate:54.2},
  CAD:{sym:"C$",name:"Canadian Dollar",rate:61.8},
  SGD:{sym:"S$",name:"Singapore Dollar",rate:62.1},
  AED:{sym:"د.إ",name:"UAE Dirham",rate:22.6},
  CNY:{sym:"¥",name:"Chinese Yuan",rate:11.5},
  CHF:{sym:"Fr",name:"Swiss Franc",rate:93.8},
  KRW:{sym:"₩",name:"South Korean Won",rate:0.063},
  SAR:{sym:"﷼",name:"Saudi Riyal",rate:22.2},
  HKD:{sym:"HK$",name:"Hong Kong Dollar",rate:10.6},
  THB:{sym:"฿",name:"Thai Baht",rate:2.35},
  BRL:{sym:"R$",name:"Brazilian Real",rate:16.8},
};

const WORLD_CITIES=[
  {name:"Mumbai",tz:"Asia/Kolkata",flag:"🇮🇳"},
  {name:"New York",tz:"America/New_York",flag:"🇺🇸"},
  {name:"London",tz:"Europe/London",flag:"🇬🇧"},
  {name:"Dubai",tz:"Asia/Dubai",flag:"🇦🇪"},
  {name:"Tokyo",tz:"Asia/Tokyo",flag:"🇯🇵"},
  {name:"Sydney",tz:"Australia/Sydney",flag:"🇦🇺"},
  {name:"Singapore",tz:"Asia/Singapore",flag:"🇸🇬"},
  {name:"Paris",tz:"Europe/Paris",flag:"🇫🇷"},
  {name:"Los Angeles",tz:"America/Los_Angeles",flag:"🇺🇸"},
  {name:"Beijing",tz:"Asia/Shanghai",flag:"🇨🇳"},
  {name:"Moscow",tz:"Europe/Moscow",flag:"🇷🇺"},
  {name:"Toronto",tz:"America/Toronto",flag:"🇨🇦"},
];

const PHYSICS_CONSTS=[
  {n:"Speed of Light",s:"c",v:"2.998 × 10⁸ m/s",raw:"299792458"},
  {n:"Planck Constant",s:"h",v:"6.626 × 10⁻³⁴ J·s",raw:"6.626e-34"},
  {n:"Gravitational Constant",s:"G",v:"6.674 × 10⁻¹¹ N·m²/kg²",raw:"6.674e-11"},
  {n:"Avogadro Number",s:"Nₐ",v:"6.022 × 10²³ mol⁻¹",raw:"6.022e23"},
  {n:"Boltzmann Constant",s:"k",v:"1.381 × 10⁻²³ J/K",raw:"1.381e-23"},
  {n:"Elementary Charge",s:"e",v:"1.602 × 10⁻¹⁹ C",raw:"1.602e-19"},
  {n:"Electron Mass",s:"mₑ",v:"9.109 × 10⁻³¹ kg",raw:"9.109e-31"},
  {n:"Proton Mass",s:"mₚ",v:"1.673 × 10⁻²⁷ kg",raw:"1.673e-27"},
  {n:"Gas Constant",s:"R",v:"8.314 J/(mol·K)",raw:"8.314"},
  {n:"Faraday Constant",s:"F",v:"96485 C/mol",raw:"96485"},
  {n:"Stefan-Boltzmann",s:"σ",v:"5.671 × 10⁻⁸ W/m²K⁴",raw:"5.671e-8"},
  {n:"Permittivity ε₀",s:"ε₀",v:"8.854 × 10⁻¹² F/m",raw:"8.854e-12"},
  {n:"Bohr Radius",s:"a₀",v:"5.292 × 10⁻¹¹ m",raw:"5.292e-11"},
  {n:"Fine Structure",s:"α",v:"7.297 × 10⁻³",raw:"7.297e-3"},
  {n:"Rydberg Constant",s:"R∞",v:"1.097 × 10⁷ m⁻¹",raw:"1.097e7"},
];

const FORMULAS={
  "📐 Algebra":[
    "Quadratic: x = (−b ± √(b²−4ac)) / 2a",
    "AP Sum: Sₙ = n/2 × (2a + (n−1)d)",
    "GP Sum: Sₙ = a(rⁿ−1) / (r−1)",
    "Binomial: (a+b)ⁿ = Σ C(n,k)·aⁿ⁻ᵏ·bᵏ",
    "Log: logₐ(MN) = logₐM + logₐN",
    "Permutation: P(n,r) = n!/(n−r)!",
    "Combination: C(n,r) = n!/r!(n−r)!",
  ],
  "📊 Geometry":[
    "Circle: A=πr², C=2πr",
    "Sphere: V=4/3·πr³, SA=4πr²",
    "Cylinder: V=πr²h, SA=2πr(r+h)",
    "Cone: V=1/3·πr²h, l=√(r²+h²)",
    "Triangle: A=½bh",
    "Pythagoras: a²+b²=c²",
    "Trapezoid: A=½(a+b)h",
    "Ellipse: A=πab",
  ],
  "⚡ Physics":[
    "F = ma (Newton's 2nd Law)",
    "KE = ½mv², PE = mgh",
    "Work: W = Fd·cosθ",
    "Power: P = W/t = VI",
    "Ohm: V = IR, P = I²R",
    "Wave: v = fλ",
    "Einstein: E = mc²",
    "Ideal Gas: PV = nRT",
  ],
  "💰 Finance":[
    "SI: I = PRT/100",
    "CI: A = P(1+r/n)^(nt)",
    "EMI: P·r·(1+r)^n / ((1+r)^n−1)",
    "ROI: (Gain−Cost)/Cost × 100",
    "CAGR: (End/Start)^(1/n) − 1",
    "Rule of 72: Years = 72/Rate",
  ],
  "📈 Statistics":[
    "Mean: x̄ = Σx/n",
    "Variance: σ² = Σ(x−x̄)²/n",
    "Std Dev: σ = √(variance)",
    "Median: middle of sorted data",
    "z-score: z = (x − μ) / σ",
  ],
  "🔺 Trigonometry":[
    "sin²θ + cos²θ = 1",
    "tanθ = sinθ / cosθ",
    "sin(A+B) = sinA·cosB + cosA·sinB",
    "cos(A+B) = cosA·cosB − sinA·sinB",
    "Sine Rule: a/sinA = b/sinB",
    "Cosine Rule: c²=a²+b²−2ab·cosC",
  ],
};

const TOOLS_LIST=[
  {id:"gst",cat:"💼 Business",icon:"📄",name:"GST Calculator",sub:"Add or remove GST",color:A.gold},
  {id:"pnl",cat:"💼 Business",icon:"💹",name:"Profit & Loss",sub:"P&L with quantity",color:A.mint},
  {id:"disc",cat:"💼 Business",icon:"🏷️",name:"Discount",sub:"Price after discount",color:A.sky},
  {id:"margin",cat:"💼 Business",icon:"📊",name:"Margin & Markup",sub:"Business margins",color:A.gold},
  {id:"invoice",cat:"💼 Business",icon:"🧾",name:"Invoice Calculator",sub:"Multi-item invoice with GST",color:A.violet},
  {id:"comm",cat:"💼 Business",icon:"🤝",name:"Commission",sub:"Sales commission & target",color:A.green},
  {id:"beven",cat:"💼 Business",icon:"⚖️",name:"Break-even",sub:"Fixed vs variable cost",color:A.rose},
  {id:"interest",cat:"💼 Business",icon:"🏛️",name:"Interest Calculator",sub:"Simple & Compound (5 types)",color:A.gold},
  {id:"curr",cat:"💼 Business",icon:"💱",name:"Currency Converter",sub:"16 major currencies",color:A.mint},
  {id:"tax",cat:"💼 Business",icon:"🧾",name:"Income Tax",sub:"New & Old regime",color:A.orange},
  {id:"emi",cat:"💰 Finance",icon:"🏠",name:"EMI Calculator",sub:"Loan with principal/interest split",color:A.rose},
  {id:"sip",cat:"💰 Finance",icon:"📈",name:"SIP Calculator",sub:"Step-up SIP returns",color:A.mint},
  {id:"fd",cat:"💰 Finance",icon:"🏧",name:"FD Calculator",sub:"Fixed deposit with TDS",color:A.gold},
  {id:"rd",cat:"💰 Finance",icon:"💰",name:"RD Calculator",sub:"Recurring deposit maturity",color:A.violet},
  {id:"salary",cat:"💰 Finance",icon:"💼",name:"Salary Calculator",sub:"CTC to in-hand (new/old regime)",color:A.sky},
  {id:"inflation",cat:"💰 Finance",icon:"📉",name:"Inflation Calculator",sub:"Future & present value",color:A.rose},
  {id:"roi",cat:"💰 Finance",icon:"💎",name:"Investment Return",sub:"ROI, CAGR & multiplier",color:A.mint},
  {id:"savings",cat:"💰 Finance",icon:"🎯",name:"Savings Goal",sub:"Monthly SIP to reach target",color:A.gold},
  {id:"retire",cat:"💰 Finance",icon:"🏖️",name:"Retirement Planner",sub:"Corpus & monthly SIP needed",color:A.violet},
  {id:"loan",cat:"💰 Finance",icon:"📋",name:"Loan Comparison",sub:"Compare two loans side by side",color:A.sky},
  {id:"unit",cat:"🎓 Student",icon:"📐",name:"Unit Converter",sub:"10 categories, 80+ units",color:A.sky},
  {id:"matrix",cat:"🎓 Student",icon:"🔢",name:"Matrix Calculator",sub:"2×2 & 3×3 operations",color:A.violet},
  {id:"numsys",cat:"🎓 Student",icon:"🖥️",name:"Number System",sub:"Binary, Octal, Hex, Decimal",color:A.indigo},
  {id:"quad",cat:"🎓 Student",icon:"📉",name:"Equation Solver",sub:"Quadratic & linear equations",color:A.rose},
  {id:"stats",cat:"🎓 Student",icon:"📊",name:"Statistics",sub:"Mean, median, SD, variance…",color:A.mint},
  {id:"cgpa",cat:"🎓 Student",icon:"🎓",name:"CGPA Calculator",sub:"8 subjects with credits",color:A.gold},
  {id:"formula",cat:"🎓 Student",icon:"📖",name:"Formula Library",sub:"Math, Physics, Finance, Trig",color:A.mint},
  {id:"physics",cat:"🎓 Student",icon:"⚛️",name:"Physics Constants",sub:"15 universal constants",color:A.sky},
  {id:"geom",cat:"🎓 Student",icon:"📐",name:"Geometry",sub:"15 shapes — area, volume, perimeter",color:A.violet},
  {id:"numth",cat:"🎓 Student",icon:"🔭",name:"Number Theory",sub:"Prime, GCD, LCM, factors",color:A.orange},
  {id:"tip",cat:"⚡ Quick",icon:"🍽️",name:"Tip & Split Bill",sub:"Restaurant bill split",color:A.gold},
  {id:"bmi",cat:"⚡ Quick",icon:"⚖️",name:"BMI & BMR",sub:"Body mass & calories (TDEE)",color:A.rose},
  {id:"age",cat:"⚡ Quick",icon:"🎂",name:"Age Calculator",sub:"Exact age & next birthday",color:A.sky},
  {id:"fuel",cat:"⚡ Quick",icon:"⛽",name:"Fuel Cost",sub:"Trip cost per person",color:A.gold},
  {id:"dateDiff",cat:"⚡ Quick",icon:"📅",name:"Date Difference",sub:"Days, weeks, months, years",color:A.violet},
  {id:"clock",cat:"⚡ Quick",icon:"🌍",name:"World Clock",sub:"12 cities live",color:A.mint},
  {id:"pct",cat:"⚡ Quick",icon:"🧮",name:"Percentage Tools",sub:"5 types of % calculations",color:A.indigo},
  {id:"speed",cat:"⚡ Quick",icon:"🚗",name:"Speed Calculator",sub:"Speed, distance, time",color:A.orange},
  {id:"notes",cat:"🚀 Advanced",icon:"📝",name:"Notes + Calc",sub:"Save notes with results",color:A.violet},
  {id:"analytics",cat:"🚀 Advanced",icon:"📊",name:"Analytics",sub:"Usage stats & graphs",color:A.indigo},
  {id:"vault",cat:"🚀 Advanced",icon:"🔒",name:"Secure Vault",sub:"PIN-locked private notes",color:A.rose},
];

export default function CalixApp() {
  const [theme,setTheme]=useState("dark");
  const T=THEMES[theme];
  const [tab,setTab]=useState("calc");
  const [tool,setTool]=useState(null);
  const [calcMode,setCalcMode]=useState("std");
  const [angleMode,setAngleMode]=useState("deg");
  const [expr,setExpr]=useState("");
  const [display,setDisplay]=useState("0");
  const [prevExpr,setPrev]=useState("");
  const [mem,setMem]=useState(null);
  const [hist,setHist]=useState([]);
  const [favs,setFavs]=useState([]);
  const [chatMsgs,setChat]=useState([{role:"ai",text:"नमस्ते! मैं Calix AI हूँ 🤖\n\nYe poocho:\n• '18% of 45800'\n• '18% GST on 50000'\n• '30% discount on 1299'\n• 'split 3000 into 4'\n• 'EMI 5 lakh at 8.5% for 20 years'\n• 'SIP 5000 for 10 years at 12%'\n• 'compound interest 100000 at 8% for 5 years'\n• 'tip 10% on 2500'"}]);
  const [chatIn,setChatIn]=useState("");
  const [tvs,setTVS]=useState({});
  const [tr,setTR]=useState(null);
  const [srch,setSrch]=useState("");
  const [wtime,setWtime]=useState({});
  const [notes,setNotes]=useState([]);
  const [noteText,setNoteText]=useState("");
  const [pin,setPin]=useState("");
  const [locked,setLocked]=useState(false);
  const [mat,setMat]=useState({a:["1","2","3","4"],b:["5","6","7","8"],size:2});
  const chatEnd=useRef(null);

  useEffect(()=>{
    const tick=()=>{const t={};WORLD_CITIES.forEach(c=>{t[c.name]=new Date().toLocaleTimeString("en-IN",{timeZone:c.tz,hour:"2-digit",minute:"2-digit",second:"2-digit"});});setWtime(t);};
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);
  useEffect(()=>{if(chatEnd.current)chatEnd.current.scrollIntoView({behavior:"smooth"});},[chatMsgs]);

  const V=k=>tvs[k]||"";
  const SV=(k,v)=>{setTVS(p=>({...p,[k]:v}));setTR(null);};
  const pn=s=>parseFloat((s||"").toString().replace(/[,₹\s]/g,""))||0;

  const press=useCallback((val)=>{
    if(val==="AC"){setExpr("");setDisplay("0");setPrev("");return;}
    if(val==="⌫"){const ne=expr.slice(0,-1);setExpr(ne);setDisplay(ne||"0");return;}
    if(val==="="){
      if(!expr) return;
      const res=safeEval(expr);
      const entry={expr,result:res,time:new Date().toLocaleTimeString("en-IN")};
      setHist(h=>[entry,...h.slice(0,99)]);
      setPrev(expr);setDisplay(res==="Error"?"Error":fmtIN(res));setExpr(res==="Error"?"":res);return;
    }
    if(val==="M+"){setMem(m=>(m||0)+(parseFloat(safeEval(expr||display))||0));return;}
    if(val==="M−"){setMem(m=>(m||0)-(parseFloat(safeEval(expr||display))||0));return;}
    if(val==="MR"){if(mem!==null){setExpr(String(mem));setDisplay(String(mem));}return;}
    if(val==="MC"){setMem(null);return;}
    if(val==="+/−"){const ne=expr.startsWith("-")?expr.slice(1):"-"+expr;setExpr(ne);setDisplay(ne);return;}
    if(val==="%"){const r=safeEval(expr||display);const p=(parseFloat(r)/100).toString();setExpr(p);setDisplay(p);return;}
    if(val==="x²"){const ne=`(${expr})**2`;setExpr(ne);setDisplay(ne);return;}
    if(val==="x³"){const ne=`(${expr})**3`;setExpr(ne);setDisplay(ne);return;}
    if(val==="1/x"){const ne=`1/(${expr})`;setExpr(ne);setDisplay(ne);return;}
    if(val==="√x"){const ne=`√(${expr})`;setExpr(ne);setDisplay(ne);return;}
    if(val==="∛x"){const ne=`∛(${expr})`;setExpr(ne);setDisplay(ne);return;}
    if(val==="n!"){setExpr(e=>e+"!");setDisplay(d=>d+"!");return;}
    if(val==="10ˣ"){const ne=`10**(${expr})`;setExpr(ne);setDisplay(ne);return;}
    if(val==="eˣ"){const ne=`Math.exp(${expr})`;setExpr(ne);setDisplay(ne);return;}
    if(val==="Rand"){const r=Math.random().toFixed(8);setExpr(r);setDisplay(r);return;}
    if(val==="π"){const ne=(expr===""||expr==="0")?"π":expr+"×π";setExpr(ne);setDisplay(ne);return;}
    const ne=(expr==="0"&&/^\d$/.test(val))?val:expr+val;
    setExpr(ne);setDisplay(ne);
  },[expr,display,mem]);

  const addFav=(item)=>setFavs(f=>f.some(x=>x.expr===item.expr)?f:[item,...f.slice(0,49)]);

  const sendChat=useCallback(()=>{
    const q=chatIn.trim();if(!q)return;
    setChatIn("");setChat(m=>[...m,{role:"user",text:q}]);
    let ans="";
    const n=s=>parseFloat((s||"").toString().replace(/[,₹\s]/g,""))||0;
    const pct=q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of|ka|का)\s*(?:₹\s*)?(\d[\d,]*(?:\.\d+)?)/i);
    const gst=q.match(/(\d+(?:\.\d+)?)\s*%\s*gst\s*(?:on|par|pe)?\s*(?:₹\s*)?(\d[\d,]*)/i);
    const disc=q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:discount|off)\s*(?:on|par)?\s*(?:₹\s*)?(\d[\d,]*)/i);
    const splitR=q.match(/split\s*(?:₹\s*)?(\d[\d,]*)\s*(?:into|among|me)?\s*(\d+)/i);
    const emiR=q.match(/emi.*?(\d[\d,.]*\s*(?:lakh|lac|l)?)\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*%.*?(\d+)\s*(?:year|yr)/i);
    const sipR=q.match(/sip\s*(?:₹\s*)?(\d[\d,]*)\s*for\s*(\d+)\s*(?:year|yr)\s*at\s*(\d+(?:\.\d+)?)\s*%/i);
    const ciR=q.match(/(?:compound|ci)\s*(?:interest)?\s*(?:₹\s*)?(\d[\d,]*)\s*at\s*(\d+(?:\.\d+)?)\s*%\s*for\s*(\d+)\s*(?:year|yr)/i);
    const siR=q.match(/(?:simple|si)\s*(?:interest)?\s*(?:₹\s*)?(\d[\d,]*)\s*at\s*(\d+(?:\.\d+)?)\s*%\s*for\s*(\d+)\s*(?:year|yr)/i);
    const tipR=q.match(/tip\s*(\d+(?:\.\d+)?)\s*%\s*on\s*(?:₹\s*)?(\d[\d,]*)/i);
    const mathQ=q.match(/(?:kya hai|what is|calculate|=\?)\s*([\d\s+\-*\/\.\(\)]+)/i);
    if(pct){const p=parseFloat(pct[1]),b=n(pct[2]);const r=p/100*b;ans=`${p}% of ₹${b.toLocaleString("en-IN")} = **₹${r.toLocaleString("en-IN")}**\nTotal = ₹${(b+r).toLocaleString("en-IN")}`;}
    else if(gst){const p=parseFloat(gst[1]),b=n(gst[2]);const g=b*p/100;ans=`${p}% GST on ₹${b.toLocaleString("en-IN")}:\nGST = **₹${g.toLocaleString("en-IN")}**\nCGST = SGST = ₹${(g/2).toFixed(2)}\nTotal = ₹${(b+g).toLocaleString("en-IN")}`;}
    else if(disc){const p=parseFloat(disc[1]),b=n(disc[2]);const s=b*p/100;ans=`${p}% discount on ₹${b.toLocaleString("en-IN")}:\nSaved = **₹${s.toLocaleString("en-IN")}**\nFinal = ₹${(b-s).toLocaleString("en-IN")}`;}
    else if(splitR){const amt=n(splitR[1]),ways=parseInt(splitR[2]);ans=`₹${amt.toLocaleString("en-IN")} ÷ ${ways} = **₹${(amt/ways).toFixed(2)}** per person`;}
    else if(emiR){let p=n(emiR[1]);if(q.toLowerCase().includes("lakh")||q.toLowerCase().includes("lac")) p*=100000;const r=parseFloat(emiR[2])/12/100,nn=parseInt(emiR[3])*12;const e=r?p*r*Math.pow(1+r,nn)/(Math.pow(1+r,nn)-1):p/nn;ans=`EMI for ₹${p.toLocaleString("en-IN")} @ ${emiR[2]}% for ${emiR[3]}yrs:\nMonthly EMI = **₹${Math.round(e).toLocaleString("en-IN")}**\nTotal = ₹${Math.round(e*nn).toLocaleString("en-IN")}\nInterest = ₹${Math.round(e*nn-p).toLocaleString("en-IN")}`;}
    else if(sipR){const m=n(sipR[1]),y=parseInt(sipR[2]),rt=parseFloat(sipR[3])/12/100,nn=y*12;const fv=m*((Math.pow(1+rt,nn)-1)/rt)*(1+rt);ans=`SIP ₹${m.toLocaleString("en-IN")}/mo for ${y}yr @ ${sipR[3]}%:\nMaturity = **₹${Math.round(fv).toLocaleString("en-IN")}**\nInvested = ₹${(m*nn).toLocaleString("en-IN")}\nGain = ₹${Math.round(fv-m*nn).toLocaleString("en-IN")}`;}
    else if(ciR){const p=n(ciR[1]),r=parseFloat(ciR[2])/100,t=parseInt(ciR[3]);const amt=p*Math.pow(1+r,t);ans=`Compound Interest:\nAmount = **₹${Math.round(amt).toLocaleString("en-IN")}**\nInterest = ₹${Math.round(amt-p).toLocaleString("en-IN")}`;}
    else if(siR){const p=n(siR[1]),r=parseFloat(siR[2])/100,t=parseInt(siR[3]);const si=p*r*t;ans=`Simple Interest = **₹${si.toLocaleString("en-IN")}**\nTotal = ₹${(p+si).toLocaleString("en-IN")}`;}
    else if(tipR){const t=parseFloat(tipR[1]),b=n(tipR[2]);const tip=b*t/100;ans=`Tip (${t}%) = **₹${tip.toLocaleString("en-IN")}**\nTotal = ₹${(b+tip).toLocaleString("en-IN")}`;}
    else if(mathQ){const r=safeEval(mathQ[1].trim());ans=r!=="Error"?`= **${fmtIN(r)}**`:"Expression samajh nahi aaya.";}
    else ans="Ye try karo:\n• '18% of 45800'\n• '18% GST on 50000'\n• '30% discount on 1299'\n• 'split 3000 into 4'\n• 'EMI 5 lakh at 8.5% for 20 years'\n• 'SIP 5000 for 10 years at 12%'\n• 'tip 10% on 2500'";
    setTimeout(()=>setChat(m=>[...m,{role:"ai",text:ans}]),500);
  },[chatIn]);

  const s={
    app:{fontFamily:"system-ui,-apple-system,sans-serif",background:T.bg,minHeight:"100vh",color:T.sub,display:"flex",flexDirection:"column",maxWidth:500,margin:"0 auto"},
    nav:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",background:T.bg2,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50},
    logo:{fontSize:20,fontWeight:900,color:T.text,letterSpacing:-0.5},
    navSub:{fontSize:10,color:T.muted,fontFamily:"monospace"},
    tabBar:{display:"flex",overflowX:"auto",background:T.bg2,borderBottom:`1px solid ${T.border}`,scrollbarWidth:"none"},
    tab:a=>({padding:"9px 11px",border:"none",borderBottom:a?`2px solid ${A.indigo}`:"2px solid transparent",background:"transparent",color:a?T.text:T.muted,fontSize:11,fontWeight:a?700:500,cursor:"pointer",whiteSpace:"nowrap"}),
    modeRow:{display:"flex",gap:4,padding:"8px 10px 0",flexWrap:"wrap"},
    modeBtn:a=>({padding:"5px 10px",borderRadius:7,border:`1px solid ${a?A.indigo:T.border}`,background:a?`rgba(91,79,233,0.18)`:"transparent",color:a?T.text:T.muted,fontSize:11,fontWeight:600,cursor:"pointer"}),
    screen:{background:"#070A14",margin:"8px 10px 0",borderRadius:14,padding:"12px 16px",border:`1px solid ${T.border}`,minHeight:95,display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"flex-end"},
    exprTxt:{fontFamily:"monospace",fontSize:11,color:T.muted,marginBottom:2,wordBreak:"break-all",textAlign:"right",minHeight:16},
    dispTxt:l=>({fontFamily:"system-ui",fontSize:l>13?20:l>9?28:38,fontWeight:900,color:T.text,letterSpacing:-1,wordBreak:"break-all",textAlign:"right"}),
    memChip:{fontSize:10,color:A.gold,fontFamily:"monospace",marginTop:2},
    keys:cols=>({display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:6,padding:"6px 10px 0"}),
    key:v=>{
      const b={borderRadius:10,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,userSelect:"none",transition:"background .1s",aspectRatio:"1",fontSize:15};
      const vv={num:{background:"#1A2038",color:T.text},op:{background:"rgba(91,79,233,0.22)",color:A.indigo},fn:{background:T.card,color:T.sub,fontSize:12},eq:{background:A.indigo,color:"#fff"},del:{background:"rgba(255,107,138,0.15)",color:A.rose},ac:{background:"rgba(245,166,35,0.18)",color:A.gold,fontSize:13}};
      return{...b,...(vv[v]||vv.num)};
    },
    memBar:{display:"flex",gap:5,padding:"4px 10px 8px"},
    memBtn:{flex:1,padding:"7px 3px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:T.muted,fontSize:11,fontWeight:700,cursor:"pointer"},
    toolArea:{flex:1,overflowY:"auto"},
    secHead:{fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:1,padding:"10px 12px 5px",borderBottom:`1px solid ${T.border}`},
    toolGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,padding:10},
    toolCard:c=>({background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"13px 11px",cursor:"pointer",borderTop:`2px solid ${c}`,transition:"transform .15s"}),
    toolIco:{fontSize:20,marginBottom:6},
    toolNm:{fontSize:12,fontWeight:700,color:T.text,marginBottom:2},
    toolSub:{fontSize:10,color:T.muted,lineHeight:1.4},
    panel:{flex:1,padding:"10px 12px",overflowY:"auto"},
    ptitle:{fontSize:17,fontWeight:800,color:T.text,marginBottom:13,letterSpacing:-.5},
    fld:{marginBottom:9},
    lbl:{fontSize:10,color:T.muted,fontWeight:700,marginBottom:3,display:"block",textTransform:"uppercase",letterSpacing:.5},
    inp:{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px",fontSize:14,color:T.text,fontWeight:600,outline:"none",boxSizing:"border-box"},
    sel:{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"10px 12px",fontSize:13,color:T.text,outline:"none",boxSizing:"border-box",cursor:"pointer"},
    calcBtnS:{width:"100%",background:A.indigo,color:"#fff",border:"none",borderRadius:9,padding:"11px",fontSize:14,fontWeight:700,cursor:"pointer",marginTop:4},
    backBtn:{background:"transparent",border:`1px solid ${T.border}`,color:T.sub,borderRadius:7,padding:"6px 12px",fontSize:12,cursor:"pointer",marginBottom:12},
    rBox:{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 13px",marginTop:11},
    rRow:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5},
    rLbl:{fontSize:11,color:T.muted},
    rVal:{fontSize:14,fontWeight:700,color:A.mint},
    div:{height:1,background:T.border,margin:"6px 0"},
    histItem:{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"9px 11px",marginBottom:6,cursor:"pointer"},
    histExpr:{fontSize:10,color:T.muted,fontFamily:"monospace",marginBottom:2},
    histRes:{fontSize:17,fontWeight:700,color:T.text},
    histTime:{fontSize:9,color:T.muted,marginTop:2},
    chatArea:{flex:1,overflowY:"auto",padding:"10px",display:"flex",flexDirection:"column",gap:8},
    chatMsg:r=>({display:"flex",gap:6,flexDirection:r==="user"?"row-reverse":"row",alignItems:"flex-end"}),
    chatBub:r=>({maxWidth:"82%",background:r==="user"?A.indigo:T.card,border:`1px solid ${r==="user"?A.indigo:T.border}`,borderRadius:r==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"9px 12px",fontSize:13,lineHeight:1.55,color:r==="user"?"#fff":T.sub,whiteSpace:"pre-line"}),
    chatAva:r=>({width:24,height:24,borderRadius:"50%",background:r==="user"?A.indigo:"rgba(0,245,196,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0,color:r==="user"?"#fff":A.mint}),
    chatBar:{display:"flex",gap:6,padding:"8px 10px",borderTop:`1px solid ${T.border}`,background:T.bg2},
    chatFld:{flex:1,background:T.card,border:`1px solid ${T.border}`,borderRadius:9,padding:"9px 12px",fontSize:13,color:T.text,outline:"none"},
    sendBtn:{background:A.indigo,border:"none",borderRadius:9,padding:"9px 14px",color:"#fff",fontSize:14,cursor:"pointer"},
    clockCard:{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 13px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"},
    barWrap:{background:T.card,border:`1px solid ${T.border}`,borderRadius:11,padding:"13px",marginBottom:10},
    barTitle:{fontSize:11,color:T.muted,marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:.5},
    barRow:{display:"flex",alignItems:"center",gap:7,marginBottom:5},
    barLbl:{fontSize:11,color:T.sub,width:65,flexShrink:0},
    barTrack:{flex:1,height:7,background:T.bg3,borderRadius:4,overflow:"hidden"},
    barFill:(w,c)=>({height:"100%",width:`${Math.min(100,w)}%`,background:c,borderRadius:4}),
    barVal:{fontSize:11,fontFamily:"monospace",color:T.muted,width:40,textAlign:"right"},
  };

  const back=<button style={s.backBtn} onClick={()=>{setTool(null);setTR(null);setTVS({});}}>← Back</button>;
  const F=(k,lbl,ph,type="text")=><div style={s.fld}><label style={s.lbl}>{lbl}</label><input type={type} style={s.inp} placeholder={ph} value={V(k)} onChange={e=>SV(k,e.target.value)}/></div>;
  const SEL=(k,lbl,opts)=><div style={s.fld}><label style={s.lbl}>{lbl}</label><select style={s.sel} value={V(k)||opts[0]} onChange={e=>SV(k,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select></div>;
  const CB=(fn,lbl="Calculate")=><button style={s.calcBtnS} onClick={fn}>{lbl}</button>;
  const RB=(rows)=><div style={s.rBox}>{rows.map(([l,v,c],i)=><div key={i} style={s.rRow}><span style={s.rLbl}>{l}</span><span style={{...s.rVal,color:c||A.mint}}>{v}</span></div>)}</div>;

  // ── CALCULATOR ──
  const renderCalc=()=>{
    const STD=[["AC","+/−","%","÷"],["7","8","9","×"],["4","5","6","−"],["1","2","3","+"],[" ","0",".","="]];
    const SCI=[["sin(","cos(","tan(","log("],["ln(","√x","∛x","n!"],["x²","x³","1/x","xʸ"],["(",")","π","Rand"]];
    const PROG=[["AND","OR","XOR","NOT"],["<<",">>","(",")"],[],[]];
    const kv=k=>{if(k==="=")return"eq";if(k==="AC")return"ac";if(k==="⌫")return"del";if(k==="÷"||k==="×"||k==="−"||k==="+")return"op";if(/^[0-9]$/.test(k)||k===".")return"num";return"fn";};
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={s.modeRow}>
          {["std","sci","prog"].map(m=><button key={m} style={s.modeBtn(calcMode===m)} onClick={()=>setCalcMode(m)}>
            {m==="std"?"Standard":m==="sci"?"Scientific":"Programmer"}
          </button>)}
          {calcMode==="sci"&&["deg","rad"].map(m=><button key={m} style={{...s.modeBtn(angleMode===m),borderColor:angleMode===m?A.gold:T.border,background:angleMode===m?"rgba(245,166,35,0.15)":"transparent",color:angleMode===m?A.gold:T.muted}} onClick={()=>setAngleMode(m)}>{m.toUpperCase()}</button>)}
        </div>
        <div style={s.screen}>
          <div style={s.exprTxt}>{prevExpr}</div>
          <div style={s.dispTxt(display.length)}>{fmtIN(display)||"0"}</div>
          {mem!==null&&<div style={s.memChip}>M = {fmtIN(String(mem))}</div>}
        </div>
        {calcMode==="sci"&&SCI.map((row,ri)=><div key={ri} style={{...s.keys(row.length),paddingBottom:0}}>{row.map(k=><button key={k} onClick={()=>{if(k==="√x")press("√x");else if(k==="∛x")press("∛x");else if(k==="n!")press("n!");else if(k==="xʸ"){setExpr(e=>e+"**");setDisplay(d=>d+"**");}else press(k);}} style={{...s.key("fn"),aspectRatio:"auto",padding:"8px 2px",fontSize:11}}>{k}</button>)}</div>)}
        {calcMode==="sci"&&<div style={{...s.keys(4),paddingBottom:0}}>{["10ˣ","eˣ","1/x","π"].map(k=><button key={k} onClick={()=>press(k)} style={{...s.key("fn"),aspectRatio:"auto",padding:"7px 2px",fontSize:11}}>{k}</button>)}</div>}
        {calcMode==="prog"&&PROG.slice(0,2).map((row,ri)=><div key={ri} style={{...s.keys(row.length),paddingBottom:0}}>{row.map(k=><button key={k} onClick={()=>{setExpr(e=>e+k);setDisplay(d=>d+k);}} style={{...s.key("fn"),aspectRatio:"auto",padding:"8px 2px",fontSize:11}}>{k}</button>)}</div>)}
        <div style={{...s.keys(4),flex:1,paddingTop:6}}>
          {STD.flat().map((k,i)=><button key={i} onClick={()=>press(k===" "?"⌫":k)} style={s.key(k===" "?"del":kv(k))}>{k===" "?"⌫":k}</button>)}
        </div>
        <div style={s.memBar}>{["M+","M−","MR","MC"].map(k=><button key={k} onClick={()=>press(k)} style={s.memBtn}>{k}</button>)}</div>
      </div>
    );
  };

  // ── TOOLS LIST ──
  const renderTools=()=>{
    if(tool) return renderPanel(tool);
    const cats=[...new Set(TOOLS_LIST.map(t=>t.cat))];
    return(
      <div style={s.toolArea}>
        <div style={{padding:"8px 10px 0"}}><input style={{...s.inp,fontSize:12}} placeholder="🔍 Search tools…" value={srch} onChange={e=>setSrch(e.target.value)}/></div>
        {cats.map(cat=>{
          const items=TOOLS_LIST.filter(t=>t.cat===cat&&(!srch||t.name.toLowerCase().includes(srch.toLowerCase())||t.sub.toLowerCase().includes(srch.toLowerCase())));
          if(!items.length) return null;
          return(<div key={cat}><div style={s.secHead}>{cat}</div><div style={s.toolGrid}>{items.map(t=><div key={t.id} style={s.toolCard(t.color)} onClick={()=>{setTool(t.id);setTR(null);setTVS({});}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}><div style={s.toolIco}>{t.icon}</div><div style={s.toolNm}>{t.name}</div><div style={s.toolSub}>{t.sub}</div></div>)}</div></div>);
        })}
      </div>
    );
  };

  const renderPanel=(id)=>{
    const w=(title,icon,content)=><div style={s.panel}>{back}<div style={s.ptitle}>{icon} {title}</div>{content}</div>;

    if(id==="gst") return w("GST Calculator","📄",<>
      {F("ga","Amount (₹)","45,800")}
      {SEL("gr","GST Rate",["3","5","12","18","28"])}
      {SEL("gd","Direction",["Add GST (Exclusive)","Remove GST (Inclusive)"])}
      {CB(()=>{const a=pn(V("ga")),r=parseFloat(V("gr")||18);if(!a)return;const inc=(V("gd")||"").includes("Remove");const base=inc?a*100/(100+r):a,gst=inc?a-base:a*r/100,total=inc?a:a+gst;setTR({base:base.toFixed(2),gst:gst.toFixed(2),cgst:(gst/2).toFixed(2),total:total.toFixed(2)});})}
      {tr&&RB([["Base Amount","₹"+parseFloat(tr.base).toLocaleString("en-IN"),A.sky],["CGST ("+(parseFloat(V("gr")||18)/2)+"%)","₹"+parseFloat(tr.cgst).toLocaleString("en-IN"),A.violet],["SGST ("+(parseFloat(V("gr")||18)/2)+"%)","₹"+parseFloat(tr.cgst).toLocaleString("en-IN"),A.violet],["GST Total","₹"+parseFloat(tr.gst).toLocaleString("en-IN"),A.gold],["Final Amount","₹"+parseFloat(tr.total).toLocaleString("en-IN"),A.mint]])}
    </>);

    if(id==="pnl") return w("Profit & Loss","💹",<>
      {F("cp","Cost Price (₹)","10,000")}
      {F("sp","Selling Price (₹)","12,500")}
      {F("qty","Quantity","1")}
      {CB(()=>{const cp=pn(V("cp")),sp=pn(V("sp")),q=parseFloat(V("qty")||1);if(!cp||!sp)return;const diff=(sp-cp)*q,pct=(Math.abs(diff)/cp/q*100);setTR({diff:Math.abs(diff).toFixed(2),pct:pct.toFixed(2),type:diff>=0?"Profit 📈":"Loss 📉",col:diff>=0?A.mint:A.rose});})}
      {tr&&RB([[tr.type,"₹"+parseFloat(tr.diff).toLocaleString("en-IN"),tr.col],[tr.type.split(" ")[0]+" %",tr.pct+"%",tr.col]])}
    </>);

    if(id==="disc") return w("Discount Calculator","🏷️",<>
      {F("dp","Original Price (₹)","1,299")}
      {F("dd","Discount (%)","30")}
      {F("dq","Quantity","1")}
      {CB(()=>{const p=pn(V("dp")),d=parseFloat(V("dd")||0),q=parseFloat(V("dq")||1);if(!p)return;const s=p*d/100,fp=p-s;setTR({saved:(s*q).toFixed(2),final:(fp*q).toFixed(2),unit:fp.toFixed(2)});})}
      {tr&&RB([["Unit Price After Disc","₹"+parseFloat(tr.unit).toLocaleString("en-IN"),A.sky],["Total Saved","₹"+parseFloat(tr.saved).toLocaleString("en-IN"),A.gold],["Final Total","₹"+parseFloat(tr.final).toLocaleString("en-IN"),A.mint]])}
    </>);

    if(id==="margin") return w("Margin & Markup","📊",<>
      {F("mc","Cost Price (₹)","500")}
      {F("ms","Selling Price (₹)","750")}
      {CB(()=>{const cp=pn(V("mc")),sp=pn(V("ms"));if(!cp||!sp)return;setTR({markup:((sp-cp)/cp*100).toFixed(2),margin:((sp-cp)/sp*100).toFixed(2),profit:(sp-cp).toFixed(2)});})}
      {tr&&RB([["Gross Profit","₹"+parseFloat(tr.profit).toLocaleString("en-IN"),A.mint],["Markup %",tr.markup+"%",A.gold],["Gross Margin %",tr.margin+"%",A.sky]])}
    </>);

    if(id==="invoice") return w("Invoice Calculator","🧾",<>
      <div style={{...s.rBox,marginTop:0,marginBottom:10}}>
        <div style={s.barTitle}>Items (up to 5)</div>
        {[0,1,2,3,4].map(i=><div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:4,marginBottom:4}}>
          <input style={{...s.inp,fontSize:11,padding:"7px 8px"}} placeholder={`Item ${i+1}`} value={V("in"+i)} onChange={e=>SV("in"+i,e.target.value)}/>
          <input style={{...s.inp,fontSize:11,padding:"7px 8px"}} placeholder="Qty" type="number" value={V("iq"+i)} onChange={e=>SV("iq"+i,e.target.value)}/>
          <input style={{...s.inp,fontSize:11,padding:"7px 8px"}} placeholder="₹" type="number" value={V("ip"+i)} onChange={e=>SV("ip"+i,e.target.value)}/>
        </div>)}
      </div>
      {SEL("igst","GST Rate",["0","5","12","18","28"])}
      {CB(()=>{let sub=0,items=[];[0,1,2,3,4].forEach(i=>{const q=parseFloat(V("iq"+i)||0),p=pn(V("ip"+i));if(q&&p){sub+=q*p;items.push({n:V("in"+i)||`Item ${i+1}`,q,p,t:q*p});}});const gst=sub*parseFloat(V("igst")||0)/100,total=sub+gst;setTR({sub:sub.toFixed(2),gst:gst.toFixed(2),total:total.toFixed(2),items});})}
      {tr&&<><div style={s.rBox}>{tr.items&&tr.items.map((it,i)=><div key={i} style={s.rRow}><span style={{...s.rLbl,fontSize:11}}>{it.n} ×{it.q}</span><span style={{fontSize:12,color:T.sub}}>₹{it.t.toLocaleString("en-IN")}</span></div>)}</div>{RB([["Subtotal","₹"+parseFloat(tr.sub).toLocaleString("en-IN"),A.sky],["GST ("+V("igst")+"%)","₹"+parseFloat(tr.gst).toLocaleString("en-IN"),A.gold],["Invoice Total","₹"+parseFloat(tr.total).toLocaleString("en-IN"),A.mint]])}</>}
    </>);

    if(id==="comm") return w("Commission Calculator","🤝",<>
      {F("cs","Sales Amount (₹)","1,00,000")}
      {F("cr","Commission Rate (%)","5")}
      {F("ct","Monthly Target (₹)","2,00,000")}
      {CB(()=>{const s2=pn(V("cs")),r=parseFloat(V("cr")||0),t=pn(V("ct"));const c=s2*r/100;const ach=t?(s2/t*100).toFixed(1):null;setTR({comm:c.toFixed(2),net:(s2-c).toFixed(2),ach});})}
      {tr&&RB([["Commission","₹"+parseFloat(tr.comm).toLocaleString("en-IN"),A.gold],["Net Receivable","₹"+parseFloat(tr.net).toLocaleString("en-IN"),A.mint],...(tr.ach?[["Target Achieved",tr.ach+"%",parseFloat(tr.ach)>=100?A.mint:A.rose]]:[])])}
    </>);

    if(id==="beven") return w("Break-even Calculator","⚖️",<>
      {F("bfc","Fixed Costs / month (₹)","50,000")}
      {F("bvc","Variable Cost per Unit (₹)","200")}
      {F("bsp","Selling Price per Unit (₹)","350")}
      {CB(()=>{const fc=pn(V("bfc")),vc=pn(V("bvc")),sp=pn(V("bsp"));if(!fc||vc>=sp)return;const contrib=sp-vc,units=fc/contrib,rev=units*sp;setTR({units:units.toFixed(0),rev:rev.toFixed(0),contrib:contrib.toFixed(2),margin:((contrib/sp)*100).toFixed(1)});})}
      {tr&&RB([["Break-even Units",parseInt(tr.units).toLocaleString("en-IN")+" units",A.mint],["Break-even Revenue","₹"+parseInt(tr.rev).toLocaleString("en-IN"),A.gold],["Contribution/Unit","₹"+tr.contrib,A.sky],["Contribution Margin",tr.margin+"%",A.violet]])}
    </>);

    if(id==="interest") return w("Interest Calculator","🏛️",<>
      {F("ip","Principal (₹)","1,00,000")}
      {F("ir","Rate (% p.a.)","8")}
      {F("it","Time (years)","3")}
      {SEL("ity","Type",["Simple Interest","Compound Yearly","Compound Half-Yearly","Compound Quarterly","Compound Monthly"])}
      {CB(()=>{const p=pn(V("ip")),r=parseFloat(V("ir")||0)/100,t=parseFloat(V("it")||0);if(!p||!t)return;const ty=V("ity")||"Simple Interest";let amt;
        if(ty==="Simple Interest")amt=p*(1+r*t);
        else if(ty==="Compound Yearly")amt=p*Math.pow(1+r,t);
        else if(ty==="Compound Half-Yearly")amt=p*Math.pow(1+r/2,2*t);
        else if(ty==="Compound Quarterly")amt=p*Math.pow(1+r/4,4*t);
        else amt=p*Math.pow(1+r/12,12*t);
        setTR({amt:amt.toFixed(2),int:(amt-p).toFixed(2),rule72:Math.round(72/parseFloat(V("ir")||1))});})}
      {tr&&RB([["Interest Earned","₹"+parseFloat(tr.int).toLocaleString("en-IN"),A.gold],["Total Amount","₹"+parseFloat(tr.amt).toLocaleString("en-IN"),A.mint],["Rule of 72","Doubles in ~"+tr.rule72+" yrs",A.sky]])}
    </>);

    if(id==="curr") return w("Currency Converter","💱",<>
      {F("ca","Amount","1,000")}
      {SEL("cf","From",Object.keys(CURRENCIES))}
      {SEL("ct","To",Object.keys(CURRENCIES))}
      {CB(()=>{const a=pn(V("ca")),f=V("cf")||"USD",t2=V("ct")||"INR";if(!a)return;const inr=a*CURRENCIES[f].rate,res=inr/CURRENCIES[t2].rate;setTR({res:res.toFixed(4),rate:(CURRENCIES[f].rate/CURRENCIES[t2].rate).toFixed(6),sym:CURRENCIES[t2].sym});})}
      {tr&&RB([["Rate","1 "+(V("cf")||"USD")+" = "+tr.rate+" "+(V("ct")||"INR"),A.gold],["Converted",tr.sym+parseFloat(tr.res).toLocaleString("en-IN",{maximumFractionDigits:4}),A.mint]])}
      <div style={{...s.rBox,marginTop:8}}><div style={s.barTitle}>Rates vs INR</div>{Object.entries(CURRENCIES).slice(1,8).map(([k,v])=><div key={k} style={s.barRow}><span style={s.barLbl}>{k}</span><div style={s.barTrack}><div style={s.barFill(Math.min(100,v.rate/1.1),A.indigo)}/></div><span style={s.barVal}>{v.rate}</span></div>)}</div>
    </>);

    if(id==="tax") return w("Income Tax Calculator","🧾",<>
      {F("ti","Annual Income (₹)","6,00,000")}
      {SEL("treg","Tax Regime",["New Regime (FY 2024-25)","Old Regime"])}
      {F("tded","Deductions (Old Regime, ₹)","1,50,000")}
      {CB(()=>{
        const inc=pn(V("ti")),ded=pn(V("tded")||0);
        const isNew=(V("treg")||"New").includes("New");
        let taxable=isNew?inc:Math.max(0,inc-ded-50000);
        let tax=0;
        if(isNew){if(taxable<=300000)tax=0;else if(taxable<=700000)tax=(taxable-300000)*0.05;else if(taxable<=1000000)tax=20000+(taxable-700000)*0.10;else if(taxable<=1200000)tax=50000+(taxable-1000000)*0.15;else if(taxable<=1500000)tax=80000+(taxable-1200000)*0.20;else tax=140000+(taxable-1500000)*0.30;if(inc<=700000)tax=0;}
        else{if(taxable<=250000)tax=0;else if(taxable<=500000)tax=(taxable-250000)*0.05;else if(taxable<=1000000)tax=12500+(taxable-500000)*0.20;else tax=112500+(taxable-1000000)*0.30;}
        const cess=tax*0.04,total=tax+cess;
        setTR({tax:tax.toFixed(0),cess:cess.toFixed(0),total:total.toFixed(0),monthly:(total/12).toFixed(0),eff:(total/inc*100).toFixed(2)});})}
      {tr&&RB([["Base Tax","₹"+parseInt(tr.tax).toLocaleString("en-IN"),A.sky],["Cess (4%)","₹"+parseInt(tr.cess).toLocaleString("en-IN"),A.gold],["Total Tax","₹"+parseInt(tr.total).toLocaleString("en-IN"),A.rose],["Monthly Tax","₹"+parseInt(tr.monthly).toLocaleString("en-IN"),A.violet],["Effective Rate",tr.eff+"%",A.mint]])}
    </>);

    if(id==="emi") return w("EMI Calculator","🏠",<>
      {F("ep","Loan Amount (₹)","5,00,000")}
      {F("er","Interest Rate (% p.a.)","8.5")}
      {F("en","Tenure (years)","20")}
      {SEL("etype","Loan Type",["Home Loan","Car Loan","Personal Loan","Education Loan","Business Loan"])}
      {CB(()=>{const p=pn(V("ep")),r=parseFloat(V("er")||0)/12/100,n=parseInt(V("en")||0)*12;if(!p||!n)return;const emi=r?p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):p/n,total=emi*n;setTR({emi:emi.toFixed(0),total:total.toFixed(0),int:(total-p).toFixed(0),pp:Math.round(p/total*100),ip:Math.round((total-p)/total*100)});})}
      {tr&&<>{RB([["Monthly EMI","₹"+parseInt(tr.emi).toLocaleString("en-IN"),A.mint],["Total Payment","₹"+parseInt(tr.total).toLocaleString("en-IN"),A.sky],["Total Interest","₹"+parseInt(tr.int).toLocaleString("en-IN"),A.rose]])}<div style={{...s.rBox,marginTop:8}}><div style={s.barTitle}>Principal vs Interest</div>{[["Principal",tr.pp,A.indigo],["Interest",tr.ip,A.rose]].map(([l,w,c])=><div key={l} style={s.barRow}><span style={s.barLbl}>{l}</span><div style={s.barTrack}><div style={s.barFill(w,c)}/></div><span style={s.barVal}>{w}%</span></div>)}</div></>}
    </>);

    if(id==="sip") return w("SIP Calculator","📈",<>
      {F("sm","Monthly SIP (₹)","5,000")}
      {F("sr","Expected Return (% p.a.)","12")}
      {F("sy","Time Period (years)","10")}
      {F("sstep","Step-up % per year","10")}
      {CB(()=>{const m=pn(V("sm")),r=parseFloat(V("sr")||12)/12/100,n=parseInt(V("sy")||0)*12,step=parseFloat(V("sstep")||0)/100;if(!m||!n)return;let fv=0,inv=0,monthly=m;if(step===0){fv=m*((Math.pow(1+r,n)-1)/r)*(1+r);inv=m*n;}else{for(let yr=0;yr<parseInt(V("sy")||0);yr++){for(let mo=0;mo<12;mo++){fv=(fv+monthly)*(1+r);inv+=monthly;}monthly*=(1+step);}}setTR({fv:fv.toFixed(0),inv:inv.toFixed(0),gain:(fv-inv).toFixed(0),gainPct:((fv/inv-1)*100).toFixed(1)});})}
      {tr&&<>{RB([["Invested","₹"+parseInt(tr.inv).toLocaleString("en-IN"),A.sky],["Est. Gain","₹"+parseInt(tr.gain).toLocaleString("en-IN"),A.gold],["Returns",tr.gainPct+"%",A.violet],["Maturity","₹"+parseInt(tr.fv).toLocaleString("en-IN"),A.mint]])}<div style={{...s.rBox,marginTop:8}}><div style={s.barTitle}>Invested vs Returns</div>{[["Invested",Math.round(parseInt(tr.inv)/parseInt(tr.fv)*100),A.indigo],["Returns",Math.round(parseInt(tr.gain)/parseInt(tr.fv)*100),A.mint]].map(([l,w,c])=><div key={l} style={s.barRow}><span style={s.barLbl}>{l}</span><div style={s.barTrack}><div style={s.barFill(w,c)}/></div><span style={s.barVal}>{w}%</span></div>)}</div></>}
    </>);

    if(id==="fd") return w("FD Calculator","🏧",<>
      {F("fp","Principal (₹)","1,00,000")}
      {F("fr","Rate (% p.a.)","7.1")}
      {F("ft","Tenure (months)","12")}
      {SEL("fc","Compounding",["Quarterly","Monthly","Half-Yearly","Yearly","Simple Interest"])}
      {SEL("ftds","TDS",["No TDS","10% TDS","20% TDS"])}
      {CB(()=>{const p=pn(V("fp")),r=parseFloat(V("fr")||0)/100,t=parseFloat(V("ft")||0)/12;if(!p||!t)return;const c=V("fc")||"Quarterly";let amt;
        if(c==="Simple Interest")amt=p*(1+r*t);else if(c==="Monthly")amt=p*Math.pow(1+r/12,12*t);else if(c==="Half-Yearly")amt=p*Math.pow(1+r/2,2*t);else if(c==="Yearly")amt=p*Math.pow(1+r,t);else amt=p*Math.pow(1+r/4,4*t);
        const int=amt-p,tds=V("ftds")==="10% TDS"?int*0.1:V("ftds")==="20% TDS"?int*0.2:0;setTR({amt:amt.toFixed(2),int:int.toFixed(2),tds:tds.toFixed(2),net:(amt-tds).toFixed(2)});})}
      {tr&&RB([["Gross Interest","₹"+parseFloat(tr.int).toLocaleString("en-IN"),A.gold],["TDS","₹"+parseFloat(tr.tds).toLocaleString("en-IN"),A.rose],["Net Maturity","₹"+parseFloat(tr.net).toLocaleString("en-IN"),A.mint]])}
    </>);

    if(id==="rd") return w("RD Calculator","💰",<>
      {F("rm","Monthly Deposit (₹)","2,000")}
      {F("rr","Rate (% p.a.)","6.8")}
      {F("rt","Tenure (months)","24")}
      {CB(()=>{const m=pn(V("rm")),r=parseFloat(V("rr")||0)/100/12,n=parseInt(V("rt")||0);if(!m||!n)return;const amt=m*((Math.pow(1+r,n)-1)/r)*(1+r),inv=m*n;setTR({amt:amt.toFixed(2),inv:inv.toFixed(2),int:(amt-inv).toFixed(2)});})}
      {tr&&RB([["Total Invested","₹"+parseFloat(tr.inv).toLocaleString("en-IN"),A.sky],["Interest Earned","₹"+parseFloat(tr.int).toLocaleString("en-IN"),A.gold],["Maturity","₹"+parseFloat(tr.amt).toLocaleString("en-IN"),A.mint]])}
    </>);

    if(id==="salary") return w("Salary Calculator","💼",<>
      {F("sc","CTC / Annual (₹)","6,00,000")}
      {SEL("sreg","Tax Regime",["New Regime","Old Regime"])}
      {F("sded","80C Deduction (₹)","1,50,000")}
      {CB(()=>{const ctc=pn(V("sc")),ded=pn(V("sded")||0);const basic=ctc*0.5,pf=Math.min(21600,basic*0.12),gross=ctc-pf;const isNew=(V("sreg")||"New").includes("New");let taxable=isNew?gross-50000:Math.max(0,gross-50000-ded);let tax=0;
        if(isNew){if(taxable>1500000)tax=140000+(taxable-1500000)*0.30;else if(taxable>1200000)tax=80000+(taxable-1200000)*0.20;else if(taxable>1000000)tax=50000+(taxable-1000000)*0.15;else if(taxable>700000)tax=20000+(taxable-700000)*0.10;else if(taxable>300000)tax=(taxable-300000)*0.05;if(ctc<=700000)tax=0;}
        else{if(taxable>1000000)tax=112500+(taxable-1000000)*0.30;else if(taxable>500000)tax=12500+(taxable-500000)*0.20;else if(taxable>250000)tax=(taxable-250000)*0.05;}
        const cess=tax*0.04,net=ctc-pf-tax-cess,monthly=net/12;setTR({monthly:monthly.toFixed(0),basic:(basic/12).toFixed(0),pf:(pf/12).toFixed(0),tax:((tax+cess)/12).toFixed(0),net:net.toFixed(0),eff:(((tax+cess)/ctc)*100).toFixed(2)});})}
      {tr&&RB([["Basic/month","₹"+parseInt(tr.basic).toLocaleString("en-IN"),A.sky],["PF/month","₹"+parseInt(tr.pf).toLocaleString("en-IN"),A.violet],["Tax/month","₹"+parseInt(tr.tax).toLocaleString("en-IN"),A.rose],["Net Annual","₹"+parseInt(tr.net).toLocaleString("en-IN"),A.gold],["In-Hand/month","₹"+parseInt(tr.monthly).toLocaleString("en-IN"),A.mint],["Eff. Tax Rate",tr.eff+"%",T.muted]])}
    </>);

    if(id==="inflation") return w("Inflation Calculator","📉",<>
      {F("ia","Current Amount (₹)","1,00,000")}
      {F("ii","Inflation Rate (% p.a.)","6")}
      {F("iy","Years","10")}
      {CB(()=>{const a=pn(V("ia")),r=parseFloat(V("ii")||6)/100,y=parseInt(V("iy")||0);if(!a||!y)return;const future=a*Math.pow(1+r,y),pwr=a/Math.pow(1+r,y);setTR({future:future.toFixed(0),pwr:pwr.toFixed(0),loss:((1-1/Math.pow(1+r,y))*100).toFixed(1)});})}
      {tr&&RB([["Future Cost","₹"+parseInt(tr.future).toLocaleString("en-IN"),A.rose],["Today's Worth in "+V("iy")+"yrs","₹"+parseInt(tr.pwr).toLocaleString("en-IN"),A.gold],["Purchasing Power Loss",tr.loss+"%",A.rose]])}
    </>);

    if(id==="roi") return w("Investment Return","💎",<>
      {F("ri","Investment (₹)","1,00,000")}
      {F("rr","Return Amount (₹)","1,40,000")}
      {F("ry","Duration (years)","3")}
      {CB(()=>{const i=pn(V("ri")),r=pn(V("rr")),y=parseFloat(V("ry")||1);if(!i||!r)return;const roi=(r-i)/i*100,cagr=(Math.pow(r/i,1/y)-1)*100;setTR({roi:roi.toFixed(2),cagr:cagr.toFixed(2),gain:(r-i).toFixed(0),x:(r/i).toFixed(2)});})}
      {tr&&RB([["Total Gain","₹"+parseInt(tr.gain).toLocaleString("en-IN"),A.mint],["ROI",tr.roi+"%",A.gold],["CAGR",tr.cagr+"%",A.sky],["Multiplier",tr.x+"x",A.violet]])}
    </>);

    if(id==="savings") return w("Savings Goal","🎯",<>
      {F("sg","Target (₹)","10,00,000")}
      {F("sc2","Current Savings (₹)","1,00,000")}
      {F("sret","Return (% p.a.)","8")}
      {F("syr","Years to Goal","5")}
      {CB(()=>{const goal=pn(V("sg")),curr=pn(V("sc2")||0),r=parseFloat(V("sret")||8)/12/100,n=parseInt(V("syr")||0)*12;if(!goal||!n)return;const fvCurr=curr*Math.pow(1+r,n),rem=goal-fvCurr,monthly=rem>0?rem*r/(Math.pow(1+r,n)-1):0;setTR({monthly:Math.max(0,monthly).toFixed(0),fvCurr:fvCurr.toFixed(0)});})}
      {tr&&RB([["Current savings → will grow to","₹"+parseInt(tr.fvCurr).toLocaleString("en-IN"),A.sky],["Monthly SIP needed","₹"+parseInt(tr.monthly).toLocaleString("en-IN"),A.mint]])}
    </>);

    if(id==="retire") return w("Retirement Planner","🏖️",<>
      {F("rage","Current Age","30")}
      {F("rret","Retirement Age","60")}
      {F("rexp","Monthly Expenses (₹)","50,000")}
      {F("rroi","Expected Return (% p.a.)","10")}
      {F("rinf","Inflation (% p.a.)","6")}
      {CB(()=>{const age=parseInt(V("rage")||30),ret=parseInt(V("rret")||60),exp=pn(V("rexp")),roi=parseFloat(V("rroi")||10)/100,inf=parseFloat(V("rinf")||6)/100;const yrs=ret-age,lifeExp=85,retYrs=lifeExp-ret;const inflExp=exp*Math.pow(1+inf,yrs)*12;const corpus=inflExp*((1-Math.pow(1/(1+roi),retYrs))/roi)*(1+roi);const monthly=corpus*(roi/12)/(Math.pow(1+roi/12,yrs*12)-1);setTR({corpus:corpus.toFixed(0),monthly:monthly.toFixed(0),inflExp:inflExp.toFixed(0),yrs});})}
      {tr&&RB([["Exp at Retirement/yr","₹"+parseInt(tr.inflExp).toLocaleString("en-IN"),A.sky],["Corpus Needed","₹"+parseInt(tr.corpus).toLocaleString("en-IN"),A.gold],["SIP for "+tr.yrs+"yrs","₹"+parseInt(tr.monthly).toLocaleString("en-IN"),A.mint]])}
    </>);

    if(id==="loan") return w("Loan Comparison","📋",<>
      <div style={{...s.rBox,marginTop:0,marginBottom:8}}><div style={s.barTitle}>Loan A</div>{F("la1","Amount (₹)","5,00,000")}{F("lr1","Rate (%)","8.5")}{F("lt1","Tenure (years)","20")}</div>
      <div style={{...s.rBox,marginBottom:8}}><div style={s.barTitle}>Loan B</div>{F("la2","Amount (₹)","5,00,000")}{F("lr2","Rate (%)","9.5")}{F("lt2","Tenure (years)","15")}</div>
      {CB(()=>{const calc=(a,r,n)=>{const rm=r/12/100,nm=n*12;const emi=rm?a*rm*Math.pow(1+rm,nm)/(Math.pow(1+rm,nm)-1):a/nm;return{emi:emi.toFixed(0),total:(emi*nm).toFixed(0),int:(emi*nm-a).toFixed(0)};};const l1=calc(pn(V("la1")),parseFloat(V("lr1")||0),parseInt(V("lt1")||0));const l2=calc(pn(V("la2")),parseFloat(V("lr2")||0),parseInt(V("lt2")||0));setTR({l1,l2,better:parseInt(l1.total)<parseInt(l2.total)?"A":"B"});})}
      {tr&&<div style={s.rBox}>{[["A",tr.l1],["B",tr.l2]].map(([nm,l])=><div key={nm} style={{marginBottom:8}}><div style={{...s.barTitle,color:nm===tr.better?A.mint:T.muted}}>Loan {nm} {nm===tr.better?"✅":""}</div>{[["EMI","₹"+parseInt(l.emi).toLocaleString("en-IN"),A.sky],["Total","₹"+parseInt(l.total).toLocaleString("en-IN"),A.gold],["Interest","₹"+parseInt(l.int).toLocaleString("en-IN"),A.rose]].map(([ll,v,c])=><div key={ll} style={s.rRow}><span style={s.rLbl}>{ll}</span><span style={{...s.rVal,color:c,fontSize:13}}>{v}</span></div>)}</div>)}<div style={{...s.rRow,paddingTop:6,borderTop:`1px solid ${T.border}`}}><span style={s.rLbl}>Save with {tr.better}</span><span style={{...s.rVal,color:A.mint}}>₹{Math.abs(parseInt(tr.l1.total)-parseInt(tr.l2.total)).toLocaleString("en-IN")}</span></div></div>}
    </>);

    if(id==="unit") return w("Unit Converter","📐",<>
      {SEL("ucat","Category",Object.keys(UNIT_CATS))}
      {F("uval","Value","100")}
      {SEL("ufr","From",Object.keys(UNIT_CATS[V("ucat")||"Length"]))}
      {SEL("uto","To",Object.keys(UNIT_CATS[V("ucat")||"Length"]))}
      {CB(()=>{const r=cvtUnit(V("uval")||"0",V("ufr")||"m",V("uto")||"km",V("ucat")||"Length");setTR({res:r});})}
      {tr&&RB([[`${V("uval")} ${V("ufr")} =`,tr.res+" "+(V("uto")||"km"),A.mint]])}
    </>);

    if(id==="matrix") return w("Matrix Calculator","🔢",<>
      {SEL("msz","Size",["2×2","3×3"])}
      {(()=>{const sz=V("msz")==="3×3"?3:2,n=sz*sz;return (<>
        <div style={s.fld}><label style={s.lbl}>Matrix A</label><div style={{display:"grid",gridTemplateColumns:`repeat(${sz},1fr)`,gap:4}}>{Array.from({length:n}).map((_,i)=><input key={i} style={{...s.inp,textAlign:"center",padding:"8px 4px",fontSize:12}} type="number" placeholder="0" value={mat.a[i]||""} onChange={e=>{const a=[...mat.a];a[i]=e.target.value;setMat(m=>({...m,a}));}}/> )}</div></div>
        {SEL("mop","Operation",["Add A+B","Subtract A-B","Multiply A×B","Determinant of A","Transpose of A"])}
        {!(V("mop")||"").match(/Det|Trans/)&&<div style={s.fld}><label style={s.lbl}>Matrix B</label><div style={{display:"grid",gridTemplateColumns:`repeat(${sz},1fr)`,gap:4}}>{Array.from({length:n}).map((_,i)=><input key={i} style={{...s.inp,textAlign:"center",padding:"8px 4px",fontSize:12}} type="number" placeholder="0" value={mat.b[i]||""} onChange={e=>{const b=[...mat.b];b[i]=e.target.value;setMat(m=>({...m,b}));}}/> )}</div></div>}
      </>);})()}
      {CB(()=>{
        const sz=V("msz")==="3×3"?3:2,op=V("mop")||"Add A+B";
        const ga=i=>parseFloat(mat.a[i]||0),gb=i=>parseFloat(mat.b[i]||0);
        let resArr=null,resStr="";
        if(sz===2){
          const A2=[[ga(0),ga(1)],[ga(2),ga(3)]],B2=[[gb(0),gb(1)],[gb(2),gb(3)]];
          if(op.includes("Add"))resArr=A2.map((r,i)=>r.map((v,j)=>v+B2[i][j]));
          else if(op.includes("Sub"))resArr=A2.map((r,i)=>r.map((v,j)=>v-B2[i][j]));
          else if(op.includes("Mul"))resArr=[[A2[0][0]*B2[0][0]+A2[0][1]*B2[1][0],A2[0][0]*B2[0][1]+A2[0][1]*B2[1][1]],[A2[1][0]*B2[0][0]+A2[1][1]*B2[1][0],A2[1][0]*B2[0][1]+A2[1][1]*B2[1][1]]];
          else if(op.includes("Det"))resStr="det(A) = "+(A2[0][0]*A2[1][1]-A2[0][1]*A2[1][0]);
          else resArr=[[A2[0][0],A2[1][0]],[A2[0][1],A2[1][1]]];
        } else {
          const g=i=>parseFloat(mat.a[i]||0);
          if(op.includes("Det")){const det=g(0)*(g(4)*g(8)-g(5)*g(7))-g(1)*(g(3)*g(8)-g(5)*g(6))+g(2)*(g(3)*g(7)-g(4)*g(6));resStr="det(A) = "+det;}
          else if(op.includes("Trans"))resArr=[[g(0),g(3),g(6)],[g(1),g(4),g(7)],[g(2),g(5),g(8)]];
          else{const A3=[[g(0),g(1),g(2)],[g(3),g(4),g(5)],[g(6),g(7),g(8)]];const h=i=>parseFloat(mat.b[i]||0);const B3=[[h(0),h(1),h(2)],[h(3),h(4),h(5)],[h(6),h(7),h(8)]];if(op.includes("Add"))resArr=A3.map((r,i)=>r.map((v,j)=>v+B3[i][j]));else if(op.includes("Sub"))resArr=A3.map((r,i)=>r.map((v,j)=>v-B3[i][j]));else resArr=A3.map((r,ri)=>A3[0].map((_,ci)=>A3[ri].reduce((sum,_,k)=>sum+A3[ri][k]*B3[k][ci],0)));}
        }
        setTR({resArr,resStr,sz});
      })}
      {tr&&<div style={s.rBox}><div style={s.barTitle}>Result</div>{tr.resArr?<div style={{display:"grid",gridTemplateColumns:`repeat(${tr.sz},1fr)`,gap:4}}>{tr.resArr.flat().map((v,i)=><div key={i} style={{...s.inp,textAlign:"center",color:A.mint,fontFamily:"monospace",padding:"8px 4px"}}>{parseFloat(Number(v).toFixed(4))}</div>)}</div>:<div style={{color:A.mint,fontFamily:"monospace",fontSize:16}}>{tr.resStr}</div>}</div>}
    </>);

    if(id==="numsys") return w("Number System","🖥️",<>
      {F("nv","Value","255")}
      {SEL("nb","From Base",["Decimal (10)","Binary (2)","Octal (8)","Hexadecimal (16)"])}
      {CB(()=>{const raw=V("nv")||"0",fromB=parseInt((V("nb")||"Decimal").match(/\d+/)[0]);try{const dec=parseInt(raw,fromB);setTR({dec:dec.toString(),bin:dec.toString(2),oct:dec.toString(8),hex:dec.toString(16).toUpperCase()});}catch{setTR({dec:"Error",bin:"",oct:"",hex:""});}})}
      {tr&&<div style={s.rBox}>{[["Decimal (10)",tr.dec,A.mint],["Binary (2)",tr.bin,A.sky],["Octal (8)",tr.oct,A.gold],["Hex (16)",tr.hex,A.violet]].map(([l,v,c])=><div key={l} style={s.rRow}><span style={s.rLbl}>{l}</span><span style={{...s.rVal,color:c,fontFamily:"monospace",wordBreak:"break-all",fontSize:12}}>{v}</span></div>)}</div>}
    </>);

    if(id==="quad") return w("Equation Solver","📉",<>
      {SEL("ety","Type",["Quadratic ax²+bx+c=0","Linear ax+b=0"])}
      {(V("ety")||"Quadratic").includes("Quadratic")?<>{F("qa","a","1")}{F("qb","b","−5")}{F("qc","c","6")}</>:<>{F("la","a","2")}{F("lb","b","−8")}</>}
      {CB(()=>{if((V("ety")||"Quadratic").includes("Linear")){const a=parseFloat(V("la")||0),b=parseFloat(V("lb")||0);setTR({type:"Linear",x1:(-b/a).toFixed(6)});}else{const a=parseFloat(V("qa")||0),b=parseFloat(V("qb")||0),c=parseFloat(V("qc")||0);setTR(solveQuadratic(a,b,c));}})}
      {tr&&<div style={s.rBox}><div style={s.rRow}><span style={s.rLbl}>Root Type</span><span style={{...s.rVal,color:tr.type==="Complex"?A.rose:A.mint}}>{tr.type}</span></div><div style={s.rRow}><span style={s.rLbl}>x₁</span><span style={{...s.rVal,fontFamily:"monospace"}}>{tr.x1}</span></div>{tr.x2&&tr.x2!==tr.x1&&<div style={s.rRow}><span style={s.rLbl}>x₂</span><span style={{...s.rVal,fontFamily:"monospace"}}>{tr.x2}</span></div>}</div>}
    </>);

    if(id==="stats") return w("Statistics","📊",<>
      <div style={s.fld}><label style={s.lbl}>Numbers (comma-separated)</label><textarea style={{...s.inp,resize:"vertical",minHeight:70,fontFamily:"monospace"}} placeholder="12, 45, 67, 23, 89, 34, 55" value={V("stn")} onChange={e=>SV("stn",e.target.value)}/></div>
      {CB(()=>{const nums=(V("stn")||"").split(/[,\s]+/).map(n=>parseFloat(n)).filter(n=>!isNaN(n));if(!nums.length)return;setTR(calcStats(nums));})}
      {tr&&<div style={s.rBox}>{[["Count",tr.n,A.sky],["Sum",tr.sum,A.gold],["Mean",tr.mean,A.mint],["Median",tr.median,A.sky],["Mode",tr.mode,A.violet],["Std Dev",tr.sd,A.gold],["Variance",tr.variance,A.orange],["Min",tr.min,A.rose],["Max",tr.max,A.green],["Range",tr.range,A.indigo]].map(([l,v,c])=><div key={l} style={s.rRow}><span style={s.rLbl}>{l}</span><span style={{...s.rVal,color:c,fontFamily:"monospace",fontSize:13}}>{v}</span></div>)}</div>}
    </>);

    if(id==="cgpa") return w("CGPA Calculator","🎓",<>
      <div style={s.fld}><label style={s.lbl}>Subject · Grade (out of 10) · Credits</label>{[0,1,2,3,4,5,6,7].map(i=><div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:4,marginBottom:4}}><input style={{...s.inp,fontSize:11,padding:"7px 8px"}} placeholder={`Sub ${i+1}`} value={V("cs"+i)} onChange={e=>SV("cs"+i,e.target.value)}/><input style={{...s.inp,fontSize:11,padding:"7px 8px"}} placeholder="Grade" type="number" value={V("cg"+i)} onChange={e=>SV("cg"+i,e.target.value)}/><input style={{...s.inp,fontSize:11,padding:"7px 8px"}} placeholder="Cred" type="number" value={V("cc"+i)} onChange={e=>SV("cc"+i,e.target.value)}/></div>)}</div>
      {CB(()=>{let tot=0,cr=0;[0,1,2,3,4,5,6,7].forEach(i=>{const g=parseFloat(V("cg"+i)||0),c=parseFloat(V("cc"+i)||0);if(c>0){tot+=g*c;cr+=c;}});if(!cr)return;const cgpa=tot/cr;setTR({cgpa:cgpa.toFixed(2),pct:(cgpa*9.5).toFixed(2),grade:cgpa>=9?"O (Outstanding)":cgpa>=8?"A+ (Excellent)":cgpa>=7?"A (Very Good)":cgpa>=6?"B+ (Good)":cgpa>=5?"B (Above Average)":"C (Average)"});})}
      {tr&&RB([["CGPA",tr.cgpa,A.mint],["Percentage",tr.pct+"%",A.gold],["Grade",tr.grade,A.sky]])}
    </>);

    if(id==="formula") return w("Formula Library","📖",<>
      {Object.entries(FORMULAS).map(([cat,fmls])=><div key={cat} style={{marginBottom:14}}><div style={{...s.lbl,color:A.indigo,marginBottom:6}}>{cat}</div>{fmls.map((f,i)=><div key={i} style={{...s.histItem,cursor:"default",marginBottom:5,padding:"8px 10px"}}><div style={{fontFamily:"monospace",fontSize:11,color:A.mint,lineHeight:1.7}}>{f}</div></div>)}</div>)}
    </>);

    if(id==="physics") return w("Physics Constants","⚛️",<>
      {PHYSICS_CONSTS.map((c,i)=><div key={i} style={{...s.histItem,marginBottom:6}} onClick={()=>{setExpr(c.raw);setDisplay(c.raw);setTab("calc");}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:12,fontWeight:700,color:T.text}}>{c.n}</div><div style={{fontSize:10,color:T.muted,marginTop:1}}>{c.s}</div></div><div style={{textAlign:"right"}}><div style={{fontFamily:"monospace",fontSize:11,color:A.mint}}>{c.v}</div><div style={{fontSize:9,color:T.muted}}>Tap → calc</div></div></div></div>)}
    </>);

    if(id==="geom") return w("Geometry Calculator","📐",<>
      {SEL("gsh","Shape",["Circle","Rectangle","Square","Triangle","Equil. Triangle","Trapezoid","Parallelogram","Rhombus","Sphere","Cylinder","Cone","Cube","Cuboid","Ellipse"])}
      {(()=>{const sh=V("gsh")||"Circle";
        if(sh==="Circle")return F("gr","Radius","7");
        if(sh==="Rectangle")return (<>{F("gl","Length","10")}{F("gw","Width","6")}</>);
        if(sh==="Square")return F("gs","Side","6");
        if(sh==="Triangle")return (<>{F("gb","Base","8")}{F("gh","Height","5")}{F("ga2","Side A (for perimeter)","8")}{F("gb2","Side B","6")}{F("gc2","Side C","10")}</>);
        if(sh==="Equil. Triangle")return F("gea","Side","6");
        if(sh==="Trapezoid")return (<>{F("gta","Side a","8")}{F("gtb","Side b","5")}{F("gth","Height","4")}</>);
        if(sh==="Parallelogram")return (<>{F("gpa","Base","8")}{F("gph","Height","5")}</>);
        if(sh==="Rhombus")return (<>{F("gd1","Diagonal 1","10")}{F("gd2","Diagonal 2","6")}</>);
        if(sh==="Sphere")return F("gsr","Radius","5");
        if(sh==="Cylinder")return (<>{F("gcr","Radius","4")}{F("gch","Height","10")}</>);
        if(sh==="Cone")return (<>{F("gcnr","Radius","3")}{F("gcnh","Height","8")}</>);
        if(sh==="Cube")return F("gcs","Side","5");
        if(sh==="Cuboid")return (<>{F("gcbl","Length","6")}{F("gcbw","Width","4")}{F("gcbh","Height","5")}</>);
        if(sh==="Ellipse")return (<>{F("gela","Semi-major (a)","6")}{F("gelb","Semi-minor (b)","4")}</>);
        return null;
      })()}
      {CB(()=>{const sh=V("gsh")||"Circle";const p=k=>parseFloat(V(k)||0);let rows=[];
        if(sh==="Circle"){const r=p("gr");rows=[["Area",(Math.PI*r*r).toFixed(4)],["Circumference",(2*Math.PI*r).toFixed(4)],["Diameter",(2*r).toFixed(4)]];}
        else if(sh==="Rectangle"){const l=p("gl"),w=p("gw");rows=[["Area",(l*w).toFixed(4)],["Perimeter",(2*(l+w)).toFixed(4)],["Diagonal",Math.sqrt(l*l+w*w).toFixed(4)]];}
        else if(sh==="Square"){const s=p("gs");rows=[["Area",(s*s).toFixed(4)],["Perimeter",(4*s).toFixed(4)],["Diagonal",(s*Math.sqrt(2)).toFixed(4)]];}
        else if(sh==="Triangle"){const b=p("gb"),h=p("gh"),a=p("ga2"),b2=p("gb2"),c=p("gc2");const sp=(a+b2+c)/2;rows=[["Area",(0.5*b*h).toFixed(4)],["Perimeter",(a+b2+c).toFixed(4)],["Heron Area",Math.sqrt(sp*(sp-a)*(sp-b2)*(sp-c)).toFixed(4)]];}
        else if(sh==="Equil. Triangle"){const a=p("gea");rows=[["Area",(Math.sqrt(3)/4*a*a).toFixed(4)],["Perimeter",(3*a).toFixed(4)],["Height",(Math.sqrt(3)/2*a).toFixed(4)]];}
        else if(sh==="Trapezoid"){const a=p("gta"),b=p("gtb"),h=p("gth");rows=[["Area",((a+b)/2*h).toFixed(4)]];}
        else if(sh==="Parallelogram"){rows=[["Area",(p("gpa")*p("gph")).toFixed(4)]];}
        else if(sh==="Rhombus"){const d1=p("gd1"),d2=p("gd2");rows=[["Area",(d1*d2/2).toFixed(4)],["Side",Math.sqrt((d1/2)**2+(d2/2)**2).toFixed(4)]];}
        else if(sh==="Sphere"){const r=p("gsr");rows=[["Volume",(4/3*Math.PI*r*r*r).toFixed(4)],["Surface Area",(4*Math.PI*r*r).toFixed(4)]];}
        else if(sh==="Cylinder"){const r=p("gcr"),h=p("gch");rows=[["Volume",(Math.PI*r*r*h).toFixed(4)],["Lateral Area",(2*Math.PI*r*h).toFixed(4)],["Total Area",(2*Math.PI*r*(r+h)).toFixed(4)]];}
        else if(sh==="Cone"){const r=p("gcnr"),h=p("gcnh"),l=Math.sqrt(r*r+h*h);rows=[["Volume",(Math.PI*r*r*h/3).toFixed(4)],["Slant Height",l.toFixed(4)],["Lateral Area",(Math.PI*r*l).toFixed(4)]];}
        else if(sh==="Cube"){const s=p("gcs");rows=[["Volume",(s*s*s).toFixed(4)],["Surface Area",(6*s*s).toFixed(4)],["Diagonal",(s*Math.sqrt(3)).toFixed(4)]];}
        else if(sh==="Cuboid"){const l=p("gcbl"),w=p("gcbw"),h=p("gcbh");rows=[["Volume",(l*w*h).toFixed(4)],["Surface Area",(2*(l*w+w*h+h*l)).toFixed(4)],["Diagonal",Math.sqrt(l*l+w*w+h*h).toFixed(4)]];}
        else if(sh==="Ellipse"){const a=p("gela"),b=p("gelb");rows=[["Area",(Math.PI*a*b).toFixed(4)],["Perimeter (approx)",(2*Math.PI*Math.sqrt((a*a+b*b)/2)).toFixed(4)]];}
        setTR({rows});})}
      {tr&&<div style={s.rBox}>{tr.rows&&tr.rows.map(([l,v],i)=><div key={i} style={s.rRow}><span style={s.rLbl}>{l}</span><span style={{...s.rVal,fontFamily:"monospace"}}>{v}</span></div>)}</div>}
    </>);

    if(id==="numth") return w("Number Theory","🔭",<>
      {F("nth","Number","48")}
      {CB(()=>{const n=parseInt(V("nth")||0);if(!n)return;const factors=[];for(let i=1;i<=n;i++)if(n%i===0)factors.push(i);const pf=[];let temp=n;for(let i=2;i*i<=temp;i++)while(temp%i===0){pf.push(i);temp/=i;}if(temp>1)pf.push(temp);setTR({prime:isPrime(n),factors:factors.join(", "),pf:pf.join(" × ")||n.toString(),fcount:factors.length,digital:String(n).split("").reduce((a,b)=>a+parseInt(b),0),even:n%2===0});})}
      {tr&&RB([["Is Prime",tr.prime?"Yes ✓":"No ✗",tr.prime?A.mint:A.rose],["Factor Count",tr.fcount+" factors",A.sky],["Factors",tr.factors,A.gold],["Prime Factors",tr.pf,A.violet],["Digital Root",tr.digital,A.mint],["Even/Odd",tr.even?"Even":"Odd",A.sky]])}
      <div style={{...s.rBox,marginTop:8}}>
        <div style={s.barTitle}>GCD & LCM</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
          <input style={s.inp} placeholder="Number 1" value={V("ng1")} onChange={e=>SV("ng1",e.target.value)}/>
          <input style={s.inp} placeholder="Number 2" value={V("ng2")} onChange={e=>SV("ng2",e.target.value)}/>
        </div>
        <button style={{...s.calcBtnS,marginTop:0}} onClick={()=>{const a=parseInt(V("ng1")||0),b=parseInt(V("ng2")||0);if(!a||!b)return;const g=gcd(a,b);setTR(t=>({...(t||{}),gcd:g,lcm:a*b/g}));}}>Find GCD & LCM</button>
        {tr&&tr.gcd&&<div style={{marginTop:8}}>{RB([["GCD",tr.gcd,A.mint],["LCM",tr.lcm,A.gold]])}</div>}
      </div>
    </>);

    if(id==="tip") return w("Tip & Split Bill","🍽️",<>
      {F("tb","Bill Amount (₹)","2,500")}
      {SEL("ttp","Tip %",["5","8","10","12","15","18","20","25"])}
      {F("tn","Number of People","4")}
      {F("tex","Extra Amount (₹)","0")}
      {CB(()=>{const b=pn(V("tb")),t=parseFloat(V("ttp")||10),n=parseInt(V("tn")||1),ex=pn(V("tex")||0);const tip=b*t/100,total=b+tip+ex;setTR({tip:tip.toFixed(2),total:total.toFixed(2),each:(total/n).toFixed(2),tipEach:(tip/n).toFixed(2)});})}
      {tr&&RB([["Tip Amount","₹"+parseFloat(tr.tip).toLocaleString("en-IN"),A.gold],["Tip per Person","₹"+parseFloat(tr.tipEach).toLocaleString("en-IN"),A.violet],["Total Bill","₹"+parseFloat(tr.total).toLocaleString("en-IN"),A.sky],["Per Person","₹"+parseFloat(tr.each).toLocaleString("en-IN"),A.mint]])}
    </>);

    if(id==="bmi") return w("BMI & BMR","⚖️",<>
      {F("bkg","Weight (kg)","65")}
      {F("bcm","Height (cm)","170")}
      {F("bage","Age","25")}
      {SEL("bgen","Gender",["Male","Female"])}
      {SEL("bact","Activity",["Sedentary","Lightly Active (1-3d/wk)","Moderately Active (3-5d/wk)","Very Active (6-7d/wk)","Extra Active"])}
      {CB(()=>{const w=pn(V("bkg")),hcm=pn(V("bcm")),hm=hcm/100,a=parseInt(V("bage")||25),gen=V("bgen")||"Male";const bmi=w/(hm*hm);const cat=bmi<16?"Severely Underweight":bmi<18.5?"Underweight":bmi<25?"Normal ✅":bmi<30?"Overweight ⚠️":bmi<35?"Obese I":"Obese II";const bmr=gen==="Female"?447.593+9.247*w+3.098*hcm-4.330*a:88.362+13.397*w+4.799*hcm-5.677*a;const actF=[1.2,1.375,1.55,1.725,1.9];const ai=["Sedentary","Lightly","Moderately","Very","Extra"].findIndex(x=>(V("bact")||"").startsWith(x));const tdee=bmr*(actF[Math.max(0,ai)]);const ideal=[18.5*hm*hm,24.9*hm*hm];setTR({bmi:bmi.toFixed(1),cat,bmr:bmr.toFixed(0),tdee:tdee.toFixed(0),col:bmi<18.5?A.sky:bmi<25?A.mint:bmi<30?A.gold:A.rose,idealMin:ideal[0].toFixed(1),idealMax:ideal[1].toFixed(1)});})}
      {tr&&RB([["BMI",tr.bmi+" — "+tr.cat,tr.col],["Ideal Weight",tr.idealMin+"–"+tr.idealMax+" kg",A.sky],["BMR",tr.bmr+" kcal/day",A.violet],["Daily Calories (TDEE)",tr.tdee+" kcal/day",A.gold]])}
    </>);

    if(id==="age") return w("Age Calculator","🎂",<>
      {F("adob","Date of Birth","","date")}
      {F("ato","Up to (blank = today)","","date")}
      {CB(()=>{if(!V("adob"))return;const dob=new Date(V("adob")),to=V("ato")?new Date(V("ato")):new Date();let y=to.getFullYear()-dob.getFullYear(),m=to.getMonth()-dob.getMonth(),d=to.getDate()-dob.getDate();if(d<0){m--;d+=30;}if(m<0){y--;m+=12;}const days=Math.floor((to-dob)/86400000);const nb=new Date(to.getFullYear(),dob.getMonth(),dob.getDate());if(nb<=to)nb.setFullYear(to.getFullYear()+1);const dtn=Math.ceil((nb-to)/86400000);const dayName=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dob.getDay()];setTR({y,m,d,days,wks:Math.floor(days/7),dtn,dayName});})}
      {tr&&<><div style={{display:"flex",justifyContent:"space-around",padding:"12px 0",background:T.bg3,borderRadius:10,marginBottom:8}}>{[["Years",tr.y],["Months",tr.m],["Days",tr.d]].map(([l,v])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,color:T.text,letterSpacing:-1}}>{v}</div><div style={{fontSize:10,color:T.muted}}>{l}</div></div>)}</div>{RB([["Total Days",tr.days?.toLocaleString("en-IN"),A.sky],["Total Weeks",tr.wks?.toLocaleString("en-IN"),A.violet],["Born on",tr.dayName,A.gold],["Next Birthday in",tr.dtn+" days 🎂",A.mint]])}</>}
    </>);

    if(id==="fuel") return w("Fuel Cost","⛽",<>
      {F("fdist","Distance (km)","300")}
      {F("fmil","Mileage (km/L)","15")}
      {F("fprice","Fuel Price (₹/L)","103")}
      {F("fpass","Passengers","1")}
      {CB(()=>{const d=pn(V("fdist")),m=pn(V("fmil"))||1,p=pn(V("fprice")),pass=parseInt(V("fpass")||1);const liters=d/m,cost=liters*p;setTR({liters:liters.toFixed(2),cost:cost.toFixed(2),per100:(100/m*p).toFixed(2),perKm:(cost/d).toFixed(2),perHead:(cost/pass).toFixed(2)});})}
      {tr&&RB([["Fuel Needed",tr.liters+" L",A.sky],["Cost/100km","₹"+tr.per100,A.violet],["Cost/km","₹"+tr.perKm,A.gold],["Per Person","₹"+parseFloat(tr.perHead).toLocaleString("en-IN"),A.green],["Total","₹"+parseFloat(tr.cost).toLocaleString("en-IN"),A.mint]])}
    </>);

    if(id==="dateDiff") return w("Date Difference","📅",<>
      {F("dd1","From Date","","date")}
      {F("dd2","To Date","","date")}
      {CB(()=>{if(!V("dd1")||!V("dd2"))return;const diff=Math.abs(new Date(V("dd2"))-new Date(V("dd1")))/86400000;setTR({days:Math.floor(diff),wks:(diff/7).toFixed(1),mos:(diff/30.44).toFixed(1),yrs:(diff/365.25).toFixed(2),hrs:Math.floor(diff*24)});})}
      {tr&&RB([["Days",parseInt(tr.days).toLocaleString("en-IN"),A.mint],["Weeks",tr.wks,A.sky],["Months",tr.mos,A.gold],["Years",tr.yrs,A.violet],["Hours",parseInt(tr.hrs).toLocaleString("en-IN"),A.orange]])}
    </>);

    if(id==="clock") return w("World Clock","🌍",<>
      {WORLD_CITIES.map(c=><div key={c.name} style={s.clockCard}><div><div style={{fontSize:13,fontWeight:700,color:T.text}}>{c.flag} {c.name}</div><div style={{fontSize:9,color:T.muted}}>{c.tz}</div></div><div style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:A.mint}}>{wtime[c.name]||"--:--:--"}</div></div>)}
    </>);

    if(id==="pct") return w("Percentage Tools","🧮",<>
      {SEL("ptype","Tool",["X% of Y","X is what % of Y","% Increase/Decrease","Original from %","% Difference"])}
      {(()=>{const t=V("ptype")||"X% of Y";
        if(t==="X% of Y")return (<>{F("px","%","18")}{F("py","Y","45800")}</>);
        if(t==="X is what % of Y")return (<>{F("px2","X","250")}{F("py2","Total Y","1000")}</>);
        if(t==="% Increase/Decrease")return (<>{F("pold","Old Value","800")}{F("pnew","New Value","1000")}</>);
        if(t==="Original from %")return (<>{F("pfv","Final Value","1180")}{F("prate","% Change","18")}</>);
        if(t==="% Difference")return (<>{F("pa","Value A","500")}{F("pb","Value B","600")}</>);
      })()}
      {CB(()=>{const t=V("ptype")||"X% of Y";let rows=[];
        if(t==="X% of Y"){const x=parseFloat(V("px")||0),y=pn(V("py"));const r=x/100*y;rows=[["Result",r.toFixed(4)],["Total",(y+r).toFixed(4)]];}
        else if(t==="X is what % of Y"){rows=[["Percentage",(pn(V("px2"))/pn(V("py2"))*100).toFixed(4)+"%"]];}
        else if(t==="% Increase/Decrease"){const o=pn(V("pold")),n=pn(V("pnew"));const ch=(n-o)/o*100;rows=[["Change",(ch>=0?"↑":"↓")+Math.abs(ch).toFixed(4)+"%"],["Difference",(n-o).toFixed(2)]];}
        else if(t==="Original from %"){const fv=pn(V("pfv")),r=parseFloat(V("prate")||0);rows=[["Original",(fv*100/(100+r)).toFixed(4)]];}
        else if(t==="% Difference"){const a=pn(V("pa")),b=pn(V("pb"));rows=[["%Diff",(Math.abs(a-b)/((a+b)/2)*100).toFixed(4)+"%"],["Absolute",Math.abs(a-b).toFixed(2)]];}
        setTR({rows});})}
      {tr&&<div style={s.rBox}>{tr.rows&&tr.rows.map(([l,v],i)=><div key={i} style={s.rRow}><span style={s.rLbl}>{l}</span><span style={{...s.rVal,color:A.mint,fontSize:16}}>{v}</span></div>)}</div>}
    </>);

    if(id==="speed") return w("Speed / Distance / Time","🚗",<>
      {SEL("spf","Find",["Speed","Distance","Time"])}
      {(V("spf")||"Speed")==="Speed"&&<>{F("spd","Distance (km)","100")}{F("spt","Time (hours)","2")}</>}
      {(V("spf")||"")==="Distance"&&<>{F("sps","Speed (km/h)","60")}{F("spt2","Time (hours)","2")}</>}
      {(V("spf")||"")==="Time"&&<>{F("spd2","Distance (km)","120")}{F("sps2","Speed (km/h)","60")}</>}
      {CB(()=>{const f=V("spf")||"Speed";if(f==="Speed"){const d=pn(V("spd")),t=parseFloat(V("spt")||1);setTR({rows:[["Speed",(d/t).toFixed(4)+" km/h"],["m/s",((d/t)/3.6).toFixed(4)],["mph",((d/t)/1.60934).toFixed(4)]]});}else if(f==="Distance"){const s=pn(V("sps")),t=parseFloat(V("spt2")||1);setTR({rows:[["Distance",(s*t).toFixed(4)+" km"]]});}else{const d=pn(V("spd2")),s=pn(V("sps2"))||1;const t=d/s;setTR({rows:[["Time",t.toFixed(4)+" hours"],["Minutes",(t*60).toFixed(1)],["H:M",`${Math.floor(t)}h ${Math.round((t%1)*60)}m`]]});}})}
      {tr&&<div style={s.rBox}>{tr.rows&&tr.rows.map(([l,v],i)=><div key={i} style={s.rRow}><span style={s.rLbl}>{l}</span><span style={{...s.rVal,color:A.mint,fontSize:15}}>{v}</span></div>)}</div>}
    </>);

    if(id==="notes") return w("Notes + Calculations","📝",<>
      <textarea style={{...s.inp,resize:"vertical",minHeight:80}} placeholder="Write notes, formulas, or calculations…" value={noteText} onChange={e=>setNoteText(e.target.value)}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:6}}>
        <button style={{...s.calcBtnS,background:A.green}} onClick={()=>{if(!noteText.trim())return;setNotes(n=>[{text:noteText,time:new Date().toLocaleString("en-IN"),id:Date.now()},...n.slice(0,19)]);setNoteText("");}}>💾 Save</button>
        <button style={{...s.calcBtnS,background:T.card,color:T.sub,border:`1px solid ${T.border}`}} onClick={()=>setNoteText("")}>Clear</button>
      </div>
      <div style={{marginTop:12}}>
        <div style={s.barTitle}>Saved ({notes.length}/20)</div>
        {notes.length===0&&<div style={{color:T.muted,fontSize:12,textAlign:"center",padding:16}}>No notes yet.</div>}
        {notes.map(n=><div key={n.id} style={{...s.histItem,marginBottom:6}}><div style={{fontSize:12,color:T.sub,lineHeight:1.6,marginBottom:4}}>{n.text}</div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:9,color:T.muted}}>{n.time}</span><button onClick={()=>setNotes(ns=>ns.filter(x=>x.id!==n.id))} style={{background:"transparent",border:"none",color:A.rose,fontSize:11,cursor:"pointer"}}>Delete</button></div></div>)}
      </div>
    </>);

    if(id==="analytics") return w("Analytics","📊",<>
      <div style={s.barWrap}><div style={s.barTitle}>Calc Mode Usage</div>{[["Standard",72,A.indigo],["Scientific",15,A.sky],["Programmer",8,A.violet],["Tools",5,A.gold]].map(([l,w,c])=><div key={l} style={s.barRow}><span style={s.barLbl}>{l}</span><div style={s.barTrack}><div style={s.barFill(w,c)}/></div><span style={s.barVal}>{w}%</span></div>)}</div>
      <div style={s.barWrap}><div style={s.barTitle}>Top Tools This Week</div>{[["GST",85,A.gold],["EMI",70,A.rose],["SIP",55,A.mint],["Currency",48,A.sky],["BMI",30,A.violet]].map(([l,w,c])=><div key={l} style={s.barRow}><span style={s.barLbl}>{l}</span><div style={s.barTrack}><div style={s.barFill(w,c)}/></div><span style={s.barVal}>{w}</span></div>)}</div>
      <div style={s.barWrap}><div style={s.barTitle}>Daily Activity</div>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d,i)=>{const h=[22,41,15,63,38,55,29][i];return(<div key={d} style={s.barRow}><span style={s.barLbl}>{d}</span><div style={s.barTrack}><div style={s.barFill(h,A.indigo)}/></div><span style={s.barVal}>{h}</span></div>);})}</div>
      {RB([["History",hist.length+" entries",A.mint],["Favorites",favs.length+" saved",A.gold],["Notes",notes.length+" notes",A.violet],["Memory",mem!==null?fmtIN(String(mem)):"Empty",A.sky]])}
    </>);

    if(id==="vault") return w("Secure Vault","🔒",<>
      {!pin?<>
        <div style={{textAlign:"center",color:T.muted,fontSize:13,padding:"20px 0"}}>Set a 4-digit PIN to protect your private notes</div>
        {F("np","New PIN (4 digits)","1234")}
        <button style={s.calcBtnS} onClick={()=>{if((V("np")||"").length>=4){setPin(V("np").slice(0,4));setLocked(true);}}}>Set PIN & Lock</button>
      </>:locked?<>
        <div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:40,marginBottom:8}}>🔒</div><div style={{color:T.muted,fontSize:13}}>Vault is locked</div></div>
        {F("pe","Enter PIN","••••")}
        <button style={s.calcBtnS} onClick={()=>{if(V("pe")===pin){setLocked(false);SV("pe","");}}}>Unlock Vault</button>
        <button style={{...s.calcBtnS,background:T.card,color:A.rose,border:`1px solid ${T.border}`,marginTop:6}} onClick={()=>{setPin("");setLocked(false);}}>Forgot PIN (Reset)</button>
      </>:<>
        <div style={{textAlign:"center",padding:"8px 0"}}><div style={{fontSize:32,marginBottom:4}}>🔓</div><div style={{color:A.mint,fontSize:12,fontWeight:700}}>Vault Unlocked</div></div>
        <textarea style={{...s.inp,resize:"vertical",minHeight:120,marginBottom:8}} placeholder="Private notes or sensitive calculations…" value={V("vn")} onChange={e=>SV("vn",e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          <button style={{...s.calcBtnS,background:A.rose}} onClick={()=>setLocked(true)}>🔒 Lock</button>
          <button style={{...s.calcBtnS,background:T.card,color:T.sub,border:`1px solid ${T.border}`}} onClick={()=>{setPin("");setLocked(false);}}>Remove PIN</button>
        </div>
      </>}
    </>);

    return <div style={s.panel}>{back}<div style={{color:T.muted}}>Coming soon…</div></div>;
  };

  // ── HISTORY ──
  const renderHist=()=><div style={{flex:1,overflowY:"auto"}}>
    <div style={{padding:"8px 10px 0"}}><input style={{...s.inp,fontSize:12}} placeholder="🔍 Search…" value={srch} onChange={e=>setSrch(e.target.value)}/></div>
    <div style={{padding:"6px 10px"}}>
      {hist.length===0&&<div style={{textAlign:"center",color:T.muted,fontSize:13,marginTop:40}}>No calculations yet.</div>}
      {hist.filter(h=>!srch||h.expr.includes(srch)||h.result.includes(srch)).map((h,i)=><div key={i} style={s.histItem} onClick={()=>{setExpr(h.result);setDisplay(h.result);setTab("calc");}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={s.histExpr}>{h.expr}</div><div style={s.histRes}>{fmtIN(h.result)}</div><div style={s.histTime}>{h.time}</div></div><button onClick={e=>{e.stopPropagation();addFav(h);}} style={{background:"transparent",border:"none",color:favs.some(f=>f.expr===h.expr)?A.gold:T.muted,fontSize:18,cursor:"pointer",padding:"0 4px"}}>★</button></div>
      </div>)}
      {hist.length>0&&<button onClick={()=>setHist([])} style={{...s.calcBtnS,background:"rgba(255,107,138,0.15)",color:A.rose,marginTop:4}}>Clear All</button>}
    </div>
  </div>;

  // ── FAVORITES ──
  const renderFavs=()=><div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>
    {favs.length===0&&<div style={{textAlign:"center",color:T.muted,fontSize:13,marginTop:40}}>No favorites yet.<br/>Tap ★ in history.</div>}
    {favs.map((h,i)=><div key={i} style={{...s.histItem,display:"flex",justifyContent:"space-between",alignItems:"center"}} onClick={()=>{setExpr(h.result);setDisplay(h.result);setTab("calc");}}>
      <div><div style={s.histExpr}>{h.expr}</div><div style={s.histRes}>{fmtIN(h.result)}</div></div>
      <button onClick={e=>{e.stopPropagation();setFavs(f=>f.filter((_,j)=>j!==i));}} style={{background:"transparent",border:"none",color:A.rose,fontSize:16,cursor:"pointer"}}>✕</button>
    </div>)}
  </div>;

  // ── AI CHAT ──
  const renderAI=()=><>
    <div style={s.chatArea}>
      {chatMsgs.map((m,i)=><div key={i} style={s.chatMsg(m.role)}>
        <div style={s.chatAva(m.role)}>{m.role==="user"?"U":"AI"}</div>
        <div style={s.chatBub(m.role)}>{m.text.split("**").map((t,j)=>j%2===1?<span key={j} style={{color:A.mint,fontFamily:"monospace",fontWeight:700}}>{t}</span>:<span key={j}>{t}</span>)}</div>
      </div>)}
      <div ref={chatEnd}/>
    </div>
    <div style={s.chatBar}>
      <input style={s.chatFld} placeholder="Poocho kuch bhi…" value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}/>
      <button style={s.sendBtn} onClick={sendChat}>↑</button>
    </div>
  </>;

  // ── SETTINGS ──
  const renderSettings=()=><div style={{flex:1,overflowY:"auto",padding:"10px 12px"}}>
    <div style={s.ptitle}>Settings ⚙️</div>
    <div style={{...s.rBox,marginTop:0}}>
      <div style={s.barTitle}>🎨 Theme</div>
      <div style={{display:"flex",gap:6}}>{Object.keys(THEMES).map(k=><button key={k} onClick={()=>setTheme(k)} style={{...s.modeBtn(theme===k),flex:1,padding:"9px 4px"}}>{k==="dark"?"🌙 Dark":k==="light"?"☀️ Light":"⚫ AMOLED"}</button>)}</div>
    </div>
    <div style={{...s.rBox,marginTop:10}}>
      <div style={s.barTitle}>📊 App Stats</div>
      {[["History",hist.length+"/100",A.mint],["Favorites",favs.length,A.gold],["Notes",notes.length,A.violet],["Memory",mem!==null?fmtIN(String(mem)):"Empty",A.sky],["Calc Mode",calcMode.toUpperCase(),A.indigo],["Angle Mode",angleMode.toUpperCase(),A.orange]].map(([l,v,c])=><div key={l} style={s.rRow}><span style={s.rLbl}>{l}</span><span style={{...s.rVal,color:c}}>{v}</span></div>)}
    </div>
    <div style={{...s.rBox,marginTop:10}}>
      <div style={s.barTitle}>⚡ Quick Actions</div>
      <button onClick={()=>setHist([])} style={{...s.calcBtnS,background:"rgba(255,107,138,0.12)",color:A.rose,marginBottom:6}}>Clear History</button>
      <button onClick={()=>setFavs([])} style={{...s.calcBtnS,background:"rgba(245,166,35,0.1)",color:A.gold,marginBottom:6}}>Clear Favorites</button>
      <button onClick={()=>{setMem(null);setExpr("");setDisplay("0");setPrev("");}} style={{...s.calcBtnS,background:T.card,color:T.sub,border:`1px solid ${T.border}`}}>Reset Calculator</button>
    </div>
    <div style={{marginTop:14,textAlign:"center",color:T.muted,fontSize:11,lineHeight:1.9}}>
      <div style={{color:T.text,fontWeight:800,fontSize:15,marginBottom:4}}>Calix v3.0</div>
      130+ Features · 40+ Tool Calculators<br/>
      Standard · Scientific · Programmer<br/>
      AI Chat · World Clock · Formula Library
    </div>
  </div>;

  const TABS=[{id:"calc",l:"🧮 Calc"},{id:"tools",l:"🛠️ Tools"},{id:"hist",l:"📜 History"},{id:"favs",l:"⭐ Favs"},{id:"ai",l:"🤖 AI"},{id:"settings",l:"⚙️ More"}];

  return(
    <div style={s.app}>
      <nav style={s.nav}>
        <div style={s.logo}>Cali<span style={{color:A.mint}}>x</span></div>
        <div style={s.navSub}>{mem!==null?"M="+fmtIN(String(mem)):tab==="calc"?calcMode.toUpperCase()+" · "+angleMode.toUpperCase():"SMART CALC · 130+ FEATURES"}</div>
      </nav>
      <div style={s.tabBar}>{TABS.map(t=><button key={t.id} style={s.tab(tab===t.id)} onClick={()=>{setTab(t.id);if(t.id!=="tools")setTool(null);setSrch("");}}>{t.l}</button>)}</div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {tab==="calc"    &&renderCalc()}
        {tab==="tools"   &&renderTools()}
        {tab==="hist"    &&renderHist()}
        {tab==="favs"    &&renderFavs()}
        {tab==="ai"      &&renderAI()}
        {tab==="settings"&&renderSettings()}
      </div>
    </div>
  );
}
