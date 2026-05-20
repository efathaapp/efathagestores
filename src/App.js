import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ── AREAS (1: remove Comercial/Obras | 2: add Diretoria | 4: remove CSC) ────
const AREAS = [
  { id:"comercial",  label:"Comercial",        icon:"📊", accent:"#1E40AF", bg:"#EFF6FF", bd:"#BFDBFE" },
  { id:"logistica",  label:"Logística",         icon:"🚚", accent:"#92400E", bg:"#FFFBEB", bd:"#FDE68A" },
  { id:"rh",         label:"Recursos Humanos",  icon:"👥", accent:"#6D28D9", bg:"#F5F3FF", bd:"#DDD6FE" },
  { id:"operacoes",  label:"Operações/Técnica", icon:"⚙️", accent:"#0E7490", bg:"#ECFEFF", bd:"#A5F3FC" },
  { id:"financeiro", label:"Financeiro",        icon:"💰", accent:"#92400E", bg:"#FFF7ED", bd:"#FED7AA" },
  { id:"compras",    label:"Compras",           icon:"🛒", accent:"#1E3A5F", bg:"#F0F9FF", bd:"#BAE6FD" },
  { id:"vistoria",   label:"Vistoria/Obras",    icon:"🔍", accent:"#7F1D1D", bg:"#FFF1F2", bd:"#FECDD3" },
  { id:"juridico",   label:"Jurídico",          icon:"⚖️", accent:"#1F2937", bg:"#F9FAFB", bd:"#D1D5DB" },
  { id:"diretoria",  label:"Diretoria",         icon:"🎯", accent:"#0F172A", bg:"#F8FAFC", bd:"#94A3B8" },
];

const PRI = [
  { id:"critico",    label:"Crítico",       color:"#DC2626", bg:"#FEF2F2", bd:"#FECACA", dot:"🔴" },
  { id:"andamento",  label:"Em andamento",  color:"#D97706", bg:"#FFFBEB", bd:"#FDE68A", dot:"🟡" },
  { id:"aguardando", label:"Aguardando",    color:"#2563EB", bg:"#EFF6FF", bd:"#BFDBFE", dot:"🔵" },
  { id:"concluido",  label:"Concluído",     color:"#059669", bg:"#ECFDF5", bd:"#A7F3D0", dot:"🟢" },
];
const CHART_COLORS = ["#DC2626","#D97706","#2563EB","#059669"];
const uid = () => Math.random().toString(36).slice(2, 9);
const getP = (id) => PRI.find((p) => p.id === id) || PRI[2];
const getA = (id) => AREAS.find((a) => a.id === id) || AREAS[0];

// ── 8: AUTO-EXPIRE — se prazo passou e não concluído → crítico ──────────────
function checkExpired(item) {
  if (item.priority === "concluido") return false;
  var tag = item.tag || "";
  var match = tag.match(/(\d{1,2})\/(\d{2})(?:\/(\d{4}))?/);
  if (!match) return false;
  var day = parseInt(match[1]);
  var month = parseInt(match[2]) - 1;
  var year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
  var deadline = new Date(year, month, day + 1);
  return deadline < new Date();
}

function applyExpiry(items) {
  return items.map(function(it) {
    if (checkExpired(it)) return Object.assign({}, it, { priority:"critico", expired:true });
    return it;
  });
}

function fmtDate(ts) {
  var d = new Date(ts);
  return String(d.getDate()).padStart(2,"0") + "/" + String(d.getMonth()+1).padStart(2,"0") + " " + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}
function fmtFull(ts) {
  var d = new Date(ts);
  return String(d.getDate()).padStart(2,"0") + "/" + String(d.getMonth()+1).padStart(2,"0") + "/" + d.getFullYear() + " " + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}

// ── DATA LAYER ───────────────────────────────────────────────────────────────
async function loadItems() {
  if (supabase) {
    const { data, error } = await supabase.from("items").select("*").order("updated_at", { ascending: false });
    if (!error && data) return applyExpiry(data.map((r) => ({ ...r, updatedAt: r.updated_at, history: r.history || [] })));
  }
  try { return applyExpiry(JSON.parse(localStorage.getItem("efatha_items") || "[]")); } catch { return []; }
}

async function upsertItem(item) {
  var updated_at = item.updatedAt;
  var row = { id:item.id, area:item.area, topic:item.topic, priority:item.priority, tag:item.tag, responsible:item.responsible, notes:item.notes||"", updated_at, history:item.history||[] };
  if (supabase) { await supabase.from("items").upsert(row, { onConflict:"id" }); }
  else {
    const all = JSON.parse(localStorage.getItem("efatha_items") || "[]");
    const idx = all.findIndex((i) => i.id === item.id);
    idx >= 0 ? (all[idx] = item) : all.push(item);
    localStorage.setItem("efatha_items", JSON.stringify(all));
  }
}

async function deleteItem(id) {
  if (supabase) { await supabase.from("items").delete().eq("id", id); }
  else {
    const all = JSON.parse(localStorage.getItem("efatha_items") || "[]").filter((i) => i.id !== id);
    localStorage.setItem("efatha_items", JSON.stringify(all));
  }
}

// ── 6: EXPORT FUNCTIONS ──────────────────────────────────────────────────────
function exportExcel(items) {
  var data = items.map(function(it) {
    return {
      "Área": getA(it.area).label,
      "Tema": it.topic,
      "Prioridade": getP(it.priority).label,
      "Status/Prazo": it.tag || "",
      "Responsável": it.responsible || "",
      "Anotações": it.notes || "",
      "Atualizado": it.updatedAt ? fmtFull(it.updatedAt) : "",
    };
  });
  var ws = XLSX.utils.json_to_sheet(data);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Temas");
  XLSX.writeFile(wb, "CSC_Gestores_" + new Date().toLocaleDateString("pt-BR").replace(/\//g,"-") + ".xlsx");
}

function exportPDF() {
  window.print();
}

function exportWord(items) {
  var rows = items.map(function(it) {
    return "<tr><td>" + getA(it.area).label + "</td><td>" + it.topic + "</td><td>" + getP(it.priority).label + "</td><td>" + (it.tag||"") + "</td><td>" + (it.responsible||"") + "</td></tr>";
  }).join("");
  var html = "<!DOCTYPE html><html><head><meta charset='utf-8'><style>body{font-family:Arial;font-size:12pt}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 8px}th{background:#1E3A5F;color:#fff}</style></head><body><h2>CSC · Painel de Gestores</h2><p>" + new Date().toLocaleDateString("pt-BR") + "</p><table><tr><th>Área</th><th>Tema</th><th>Prioridade</th><th>Status</th><th>Responsável</th></tr>" + rows + "</table></body></html>";
  var blob = new Blob([html], {type:"application/msword"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = "CSC_Gestores.doc"; a.click();
  URL.revokeObjectURL(url);
}

// ── CSS ──────────────────────────────────────────────────────────────────────
const css = "@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=DM+Mono:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Mono','Courier New',monospace;background:#F1F5F9;color:#0F172A;font-size:12px}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{50%{opacity:.2}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}@media print{.no-print{display:none!important}.print-area{display:block!important}}.orb{font-family:'Orbitron',monospace;letter-spacing:.04em}.anim{animation:fadeIn .3s ease forwards}button{cursor:pointer;font-family:inherit}input,select,textarea{font-family:inherit;font-size:12px;outline:none}.scale{transition:transform .15s,box-shadow .15s}.scale:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}";

// ── COMPONENTS ───────────────────────────────────────────────────────────────
function DonutChart(props) {
  var items = props.items; var size = props.size || 130; var r = 48;
  var cx = size/2; var cy = size/2; var circ = 2*Math.PI*r;
  var total = items.length || 1;
  var counts = PRI.map(function(p) { return items.filter(function(i) { return i.priority===p.id; }).length; });
  var segments = []; var offset = 0;
  counts.forEach(function(count, i) {
    var dash = (count/total)*circ;
    segments.push({ dash, offset, color:CHART_COLORS[i], count, label:PRI[i].label });
    offset += dash;
  });
  return (
    <div style={{display:"flex",alignItems:"center",gap:16}}>
      <svg width={size} height={size} viewBox={"0 0 "+size+" "+size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="14"/>
        {segments.map(function(s, i) {
          if (!s.count) return null;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14"
            strokeDasharray={s.dash+" "+(circ-s.dash)} strokeDashoffset={-(s.offset-circ/4)} strokeLinecap="butt"/>;
        })}
        <text x={cx} y={cy-5} textAnchor="middle" style={{fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:700,fill:"#0F172A"}}>{items.length}</text>
        <text x={cx} y={cy+12} textAnchor="middle" style={{fontSize:8,fill:"#64748B"}}>TEMAS</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {PRI.map(function(p,i) {
          return <div key={p.id} style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:8,height:8,borderRadius:2,background:CHART_COLORS[i],flexShrink:0}}/>
            <span style={{fontSize:9,color:"#64748B"}}>{p.label}</span>
            <span style={{fontFamily:"'Orbitron',monospace",fontSize:9,fontWeight:600,color:CHART_COLORS[i],marginLeft:"auto",paddingLeft:8}}>{counts[i]}</span>
          </div>;
        })}
      </div>
    </div>
  );
}

function Tag(props) {
  var p = props.p;
  return <span style={{display:"inline-flex",alignItems:"center",fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20,border:"1px solid "+p.bd,background:p.bg,color:p.color,whiteSpace:"nowrap"}}>{props.text}</span>;
}

function Btn(props) {
  return <button onClick={props.onClick} style={{background:props.bg||"#F8FAFC",color:props.color||"#475569",border:"1px solid "+(props.bd||"#E2E8F0"),borderRadius:6,padding:"7px 14px",fontWeight:500,fontSize:11,...(props.style||{})}}>{props.children}</button>;
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function Home(props) {
  return (
    <div style={{maxWidth:520,margin:"0 auto",padding:"24px 16px"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        {/* 3: EFATHA → CSC */}
        <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:5,marginBottom:14}}>
          <div style={{padding:"6px 24px",border:"2px solid #0F172A",borderRadius:4}}>
            <span className="orb" style={{fontSize:22,fontWeight:900,letterSpacing:".5em",color:"#0F172A"}}>CSC</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:1,background:"#CBD5E1"}}/>
            <span style={{fontSize:8,color:"#94A3B8",letterSpacing:".14em"}}>Soluções Corporativas</span>
            <div style={{width:28,height:1,background:"#CBD5E1"}}/>
          </div>
        </div>
        <div className="orb" style={{fontSize:10,color:"#0F172A",letterSpacing:".1em",fontWeight:700}}>PAINEL DE GESTÃO · SELECIONE SUA ÁREA</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:14}}>
        {AREAS.map(function(a) {
          return (
            <button key={a.id} className="scale" onClick={function() { props.onArea(a.id); }}
              style={{background:a.bg,border:"1px solid "+a.bd,borderRadius:10,padding:"14px 8px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer",minHeight:85}}>
              <span style={{fontSize:20}}>{a.icon}</span>
              <span style={{fontSize:10,fontWeight:700,color:a.accent,textAlign:"center",lineHeight:1.3}}>{a.label}</span>
            </button>
          );
        })}
      </div>

      <button onClick={props.onHead} className="scale"
        style={{width:"100%",background:"#0F172A",border:"none",borderRadius:10,padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:15}}>📊</span>
          </div>
          <div style={{textAlign:"left"}}>
            <div className="orb" style={{fontSize:10,fontWeight:700,color:"#fff",letterSpacing:".06em"}}>DASHBOARD EXECUTIVO</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.5)",marginTop:2}}>Visão completa · Filtros · Exportar</div>
          </div>
        </div>
        <span style={{color:"rgba(255,255,255,.6)",fontSize:14}}>→</span>
      </button>

      <div style={{display:"flex",justifyContent:"center",padding:"10px 0",borderTop:"1px solid #E2E8F0"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {["MAKTUB","ROCKET IT","NEX"].map(function(n,i) {
            return <div key={n} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"'Orbitron',monospace",fontSize:7,fontWeight:700,color:"#64748B",letterSpacing:".06em"}}>{n}</span>
              {i<2&&<div style={{width:1,height:10,background:"#E2E8F0"}}/>}
            </div>;
          })}
        </div>
      </div>
    </div>
  );
}

// ── FORM ──────────────────────────────────────────────────────────────────────
function Form(props) {
  var item = props.item;
  const [topic, setTopic] = useState(item?item.topic:"");
  const [pri, setPri] = useState(item?item.priority:"andamento");
  const [tag, setTag] = useState(item?item.tag:"");
  const [resp, setResp] = useState(item?item.responsible:"");
  const [notes, setNotes] = useState(item?(item.notes||""):"");
  var a = getA(props.areaId);

  function doSave() {
    if (!topic.trim()) return;
    // 5: add history entry
    var prevHistory = item ? (item.history||[]) : [];
    var newHistory = item ? [...prevHistory, {topic:item.topic,priority:item.priority,tag:item.tag,responsible:item.responsible,notes:item.notes||"",changedAt:Date.now()}] : prevHistory;
    props.onSave({id:item?item.id:uid(),area:props.areaId,topic:topic.trim(),priority:pri,tag:tag.trim(),responsible:resp.trim(),notes:notes.trim(),history:newHistory,updatedAt:Date.now()});
  }

  return (
    <div className="anim" style={{background:"#fff",border:"1.5px solid "+a.bd,borderRadius:12,padding:18,margin:"8px 0",boxShadow:"0 4px 16px rgba(0,0,0,.06)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>{a.icon}</span>
          <span className="orb" style={{fontSize:9,fontWeight:700,color:a.accent}}>{item?"EDITAR TEMA":"NOVO TEMA"}</span>
        </div>
        <Btn onClick={props.onCancel} style={{padding:"4px 10px"}}>✕</Btn>
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:8,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4,fontWeight:600}}>Tema / Projeto *</div>
        <input value={topic} onChange={function(e){setTopic(e.target.value);}} placeholder="Descreva o tema..."
          style={{width:"100%",padding:"9px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,background:"#F8FAFC",color:"#0F172A"}}/>
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:8,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6,fontWeight:600}}>Prioridade</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:5}}>
          {PRI.map(function(p) {
            return <button key={p.id} onClick={function(){setPri(p.id);}}
              style={{background:pri===p.id?p.bg:"#F8FAFC",border:"1.5px solid "+(pri===p.id?p.bd:"#E2E8F0"),borderRadius:8,padding:"8px 6px",fontSize:10,fontWeight:pri===p.id?700:400,color:pri===p.id?p.color:"#94A3B8",cursor:"pointer",transition:"all .15s"}}>
              {p.dot} {p.label}
            </button>;
          })}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <div>
          <div style={{fontSize:8,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4,fontWeight:600}}>Prazo / Status</div>
          <input value={tag} onChange={function(e){setTag(e.target.value);}} placeholder="Ex: 22/05"
            style={{width:"100%",padding:"8px 10px",border:"1.5px solid #E2E8F0",borderRadius:8,background:"#F8FAFC",color:"#0F172A"}}/>
        </div>
        <div>
          <div style={{fontSize:8,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4,fontWeight:600}}>Responsável</div>
          <input value={resp} onChange={function(e){setResp(e.target.value);}} placeholder="Nome"
            style={{width:"100%",padding:"8px 10px",border:"1.5px solid #E2E8F0",borderRadius:8,background:"#F8FAFC",color:"#0F172A"}}/>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:8,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4,fontWeight:600}}>Anotações</div>
        <textarea value={notes} onChange={function(e){setNotes(e.target.value);}} placeholder="Observações relevantes..."
          style={{width:"100%",padding:"8px 10px",border:"1.5px solid #E2E8F0",borderRadius:8,background:"#F8FAFC",color:"#0F172A",resize:"vertical",minHeight:60}}/>
      </div>
      <button onClick={doSave} style={{width:"100%",background:"#0F172A",color:"#fff",border:"none",borderRadius:8,padding:"11px",fontSize:12,fontWeight:600,cursor:"pointer",letterSpacing:".04em"}}>
        {item?"SALVAR ✓":"ADICIONAR TEMA ✓"}
      </button>
    </div>
  );
}

// ── HISTORY MODAL ─────────────────────────────────────────────────────────────
function HistoryModal(props) {
  var item = props.item;
  var history = item.history || [];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:12,padding:20,width:"100%",maxWidth:460,maxHeight:"80vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span className="orb" style={{fontSize:10,fontWeight:700,color:"#0F172A"}}>HISTÓRICO · {item.topic.slice(0,30)}{item.topic.length>30?"...":""}</span>
          <Btn onClick={props.onClose} style={{padding:"3px 10px"}}>✕</Btn>
        </div>
        {history.length===0 ? (
          <div style={{textAlign:"center",padding:"20px 0",color:"#94A3B8",fontSize:11}}>Nenhuma alteração registrada ainda.</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[...history].reverse().map(function(h, i) {
              var p = getP(h.priority);
              return <div key={i} style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",border:"1px solid #E2E8F0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:9,color:"#94A3B8"}}>{h.changedAt?fmtFull(h.changedAt):"—"}</span>
                  <span style={{fontSize:9,fontWeight:600,color:p.color,background:p.bg,padding:"1px 7px",borderRadius:10,border:"1px solid "+p.bd}}>{p.dot} {p.label}</span>
                </div>
                <div style={{fontSize:11,fontWeight:500,color:"#0F172A",marginBottom:2}}>{h.topic}</div>
                {h.tag&&<div style={{fontSize:9,color:"#64748B"}}>📅 {h.tag}</div>}
                {h.responsible&&<div style={{fontSize:9,color:"#64748B"}}>👤 {h.responsible}</div>}
                {h.notes&&<div style={{fontSize:9,color:"#64748B",marginTop:3}}>📝 {h.notes}</div>}
              </div>;
            })}
          </div>
        )}
        <div style={{marginTop:14,padding:"10px 12px",background:"#EFF6FF",borderRadius:8,border:"1px solid #BFDBFE"}}>
          <div style={{fontSize:9,color:"#2563EB",marginBottom:3,fontWeight:600}}>VERSÃO ATUAL</div>
          <div style={{fontSize:11,fontWeight:500,color:"#0F172A"}}>{item.topic}</div>
          <div style={{fontSize:9,color:"#64748B",marginTop:2}}>{getP(item.priority).dot} {getP(item.priority).label} {item.tag?"· "+item.tag:""}</div>
          {item.updatedAt&&<div style={{fontSize:9,color:"#94A3B8",marginTop:2}}>Atualizado: {fmtFull(item.updatedAt)}</div>}
        </div>
      </div>
    </div>
  );
}

// ── AREA VIEW ─────────────────────────────────────────────────────────────────
function AreaView(props) {
  var areaId = props.areaId;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  var a = getA(areaId);
  var ord = {critico:0,andamento:1,aguardando:2,concluido:3};
  var mine = props.items.filter(function(i){return i.area===areaId;}).sort(function(x,y){return (ord[x.priority]||2)-(ord[y.priority]||2);});
  function doSave(it){props.onSave(it);setShowForm(false);setEditing(null);}
  return (
    <div style={{maxWidth:520,margin:"0 auto",padding:14}}>
      <div style={{background:a.bg,border:"1px solid "+a.bd,borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        <button onClick={props.onBack} style={{background:"#0F172A",color:"#fff",border:"2px solid #0F172A",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>⬅</button>
        <span style={{fontSize:20}}>{a.icon}</span>
        <div>
          <div className="orb" style={{fontSize:10,fontWeight:700,color:a.accent}}>{a.label.toUpperCase()}</div>
          <div style={{fontSize:9,color:a.accent,opacity:.7,marginTop:1}}>{mine.length} tema{mine.length!==1?"s":""}</div>
        </div>
        <button onClick={function(){setEditing(null);setShowForm(!showForm);}}
          style={{marginLeft:"auto",background:a.accent,color:"#fff",border:"none",borderRadius:8,padding:"7px 13px",fontWeight:600,cursor:"pointer",fontSize:11}}>
          {showForm?"✕ Cancelar":"+ Novo tema"}
        </button>
      </div>
      {showForm&&!editing&&<Form areaId={areaId} item={null} onSave={doSave} onCancel={function(){setShowForm(false);}}/>}
      {mine.length===0&&!showForm&&(
        <div style={{textAlign:"center",padding:"36px 0",color:"#94A3B8"}}>
          <div style={{fontSize:32,marginBottom:8}}>📋</div>
          <div style={{fontSize:12,fontWeight:500}}>Nenhum tema ainda</div>
        </div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {mine.map(function(it) {
          var p = getP(it.priority);
          if (editing&&editing.id===it.id) return <Form key={it.id} areaId={areaId} item={it} onSave={doSave} onCancel={function(){setEditing(null);}}/>;
          return (
            <div key={it.id} className="anim" style={{background:"#fff",border:"1px solid "+(it.expired?"#FECACA":"#E2E8F0"),borderLeft:"3px solid "+p.color,borderRadius:10,padding:"11px 13px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
              {it.expired&&<div style={{fontSize:8,color:"#DC2626",fontWeight:700,marginBottom:4,animation:"blink 1s step-end infinite"}}>⏰ PRAZO EXPIRADO — MOVIDO PARA CRÍTICO</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{fontSize:12,fontWeight:600,color:"#0F172A",lineHeight:1.4,flex:1}}>{it.topic}</div>
                {it.tag&&<Tag p={p} text={it.tag}/>}
              </div>
              {it.notes&&<div style={{fontSize:10,color:"#64748B",marginTop:6,paddingTop:6,borderTop:"1px solid #F1F5F9",lineHeight:1.5}}>📝 {it.notes}</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:7}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:9,color:p.color,fontWeight:600}}>{p.dot} {p.label}</span>
                  {it.responsible&&<span style={{fontSize:9,color:"#94A3B8"}}>· {it.responsible}</span>}
                  {it.updatedAt&&<span style={{fontSize:8,color:"#CBD5E1"}}>· {fmtDate(it.updatedAt)}</span>}
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={function(){setShowHistory(it);}} style={{background:"#F0F9FF",border:"1px solid #BAE6FD",borderRadius:6,padding:"3px 8px",fontSize:10,cursor:"pointer",color:"#0E7490"}} title="Histórico">📋</button>
                  <button onClick={function(){setEditing(it);}} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:6,padding:"3px 8px",fontSize:10,cursor:"pointer"}}>✏️</button>
                  <button onClick={function(){props.onDelete(it.id);}} style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"3px 8px",fontSize:10,cursor:"pointer",color:"#DC2626"}}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {showHistory&&<HistoryModal item={showHistory} onClose={function(){setShowHistory(null);}}/>}
    </div>
  );
}

// ── HEAD DASHBOARD ────────────────────────────────────────────────────────────
function Head(props) {
  const [tab, setTab] = useState("geral");
  const [exp, setExp] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  // 7: FILTERS
  const [fTopic, setFTopic] = useState("");
  const [fArea, setFArea] = useState("");
  const [fStatus, setFStatus] = useState("");

  var allItems = props.items;
  var ts = props.ts;

  // Apply filters
  var items = useMemo(function() {
    return allItems.filter(function(it) {
      var matchTopic = !fTopic || it.topic.toLowerCase().includes(fTopic.toLowerCase());
      var matchArea = !fArea || it.area === fArea;
      var matchStatus = !fStatus || it.priority === fStatus;
      return matchTopic && matchArea && matchStatus;
    });
  }, [allItems, fTopic, fArea, fStatus]);

  var tot = items.length;
  function byP(id) { return items.filter(function(i){return i.priority===id;}).length; }
  var ord = {critico:0,andamento:1,aguardando:2,concluido:3};
  var aStats = AREAS.map(function(a) {
    var aItems = items.filter(function(i){return i.area===a.id;}).sort(function(x,y){return (ord[x.priority]||2)-(ord[y.priority]||2);});
    return Object.assign({},a,{items:aItems,ct:aItems.length,crit:aItems.filter(function(i){return i.priority==="critico";}).length});
  }).filter(function(a){return a.ct>0;});
  var crits = items.filter(function(i){return i.priority==="critico";});
  var tagged = items.filter(function(i){return i.tag&&i.priority!=="concluido";}).sort(function(a,b){return b.updatedAt-a.updatedAt;});
  var TABS = [{id:"geral",l:"Visão Geral"},{id:"areas",l:"Por Área"},{id:"agenda",l:"Agenda"},{id:"rastreio",l:"Rastreio"}];
  var kpis = [
    {n:allItems.length,l:"TOTAL",c:"#0F172A",bg:"#F8FAFC",bd:"#E2E8F0"},
    {n:byP("critico"),l:"CRÍTICO",c:"#DC2626",bg:"#FEF2F2",bd:"#FECACA"},
    {n:byP("andamento"),l:"ANDAMENTO",c:"#D97706",bg:"#FFFBEB",bd:"#FDE68A"},
    {n:byP("aguardando"),l:"AGUARDANDO",c:"#2563EB",bg:"#EFF6FF",bd:"#BFDBFE"},
    {n:byP("concluido"),l:"CONCLUÍDO",c:"#059669",bg:"#ECFDF5",bd:"#A7F3D0"},
  ];

  return (
    <div style={{maxWidth:960,margin:"0 auto",padding:"0 0 40px"}}>
      {/* HEADER */}
      <div style={{background:"#0F172A",padding:"12px 18px"}} className="no-print">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{padding:"4px 14px",border:"1.5px solid rgba(255,255,255,.3)",borderRadius:4}}>
              <span className="orb" style={{fontSize:13,fontWeight:900,letterSpacing:".4em",color:"#fff"}}>CSC</span>
            </div>
            <div style={{borderLeft:"1px solid rgba(255,255,255,.15)",paddingLeft:14}}>
              <div className="orb" style={{fontSize:9,fontWeight:700,color:"#fff",letterSpacing:".08em"}}>PAINEL EXECUTIVO · GESTORES</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,.4)",marginTop:1}}>{ts?"Atualizado: "+fmtDate(ts):"Aguardando dados"} · {allItems.length} tema{allItems.length!==1?"s":""}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontFamily:"'Orbitron',monospace",fontSize:7,fontWeight:700,color:"#fff",letterSpacing:".06em"}}>MAKTUB</span>
                <div style={{width:1,height:8,background:"rgba(255,255,255,.3)"}}/>
                <span style={{fontFamily:"'Orbitron',monospace",fontSize:7,fontWeight:700,color:"#fff",letterSpacing:".06em"}}>ROCKET IT</span>
              </div>
              <span style={{fontFamily:"'Orbitron',monospace",fontSize:7,fontWeight:700,color:"#fff",letterSpacing:".06em"}}>NEX</span>
            </div>
            {/* 6: EXPORT BUTTONS */}
            <div style={{display:"flex",gap:5}}>
              <button onClick={function(){exportExcel(items);}} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",borderRadius:5,padding:"5px 10px",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>📊 Excel</button>
              <button onClick={function(){exportWord(items);}} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",borderRadius:5,padding:"5px 10px",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>📄 Word</button>
              <button onClick={exportPDF} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",borderRadius:5,padding:"5px 10px",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>🖨 PDF</button>
            </div>
            <button onClick={props.onBack} style={{background:"#FFFFFF",color:"#0F172A",border:"2px solid #FFFFFF",borderRadius:6,padding:"7px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:".03em"}}>⬅ Voltar</button>
          </div>
        </div>
      </div>

      {/* 7: FILTERS */}
      <div style={{background:"#fff",borderBottom:"1px solid #E2E8F0",padding:"10px 18px"}} className="no-print">
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:9,color:"#94A3B8",fontWeight:600,letterSpacing:".06em"}}>FILTROS:</span>
          <input value={fTopic} onChange={function(e){setFTopic(e.target.value);}} placeholder="🔍 Buscar tema..."
            style={{flex:1,minWidth:140,padding:"6px 10px",border:"1px solid #E2E8F0",borderRadius:6,background:"#F8FAFC",color:"#0F172A",fontSize:11}}/>
          <select value={fArea} onChange={function(e){setFArea(e.target.value);}}
            style={{padding:"6px 10px",border:"1px solid #E2E8F0",borderRadius:6,background:"#F8FAFC",color:"#0F172A",fontSize:11}}>
            <option value="">Todas as áreas</option>
            {AREAS.map(function(a){return <option key={a.id} value={a.id}>{a.icon} {a.label}</option>;})}
          </select>
          <select value={fStatus} onChange={function(e){setFStatus(e.target.value);}}
            style={{padding:"6px 10px",border:"1px solid #E2E8F0",borderRadius:6,background:"#F8FAFC",color:"#0F172A",fontSize:11}}>
            <option value="">Todos os status</option>
            {PRI.map(function(p){return <option key={p.id} value={p.id}>{p.dot} {p.label}</option>;})}
          </select>
          {(fTopic||fArea||fStatus)&&<button onClick={function(){setFTopic("");setFArea("");setFStatus("");}} style={{padding:"6px 10px",border:"1px solid #FECACA",borderRadius:6,background:"#FEF2F2",color:"#DC2626",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕ Limpar</button>}
        </div>
      </div>

      {/* TABS */}
      <div style={{background:"#fff",borderBottom:"1px solid #E2E8F0",padding:"0 18px"}} className="no-print">
        <div style={{display:"flex",gap:0}}>
          {TABS.map(function(t) {
            var active = tab===t.id;
            return <button key={t.id} onClick={function(){setTab(t.id);}}
              style={{background:"transparent",border:"none",borderBottom:active?"2px solid #0F172A":"2px solid transparent",padding:"11px 16px",fontSize:10,fontWeight:active?700:400,color:active?"#0F172A":"#94A3B8",cursor:"pointer",fontFamily:"inherit",letterSpacing:".04em",marginBottom:-1,transition:"all .15s"}}>
              {t.l}
            </button>;
          })}
        </div>
      </div>

      <div style={{padding:"16px 18px"}}>
        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:14}}>
          {kpis.map(function(k,i) {
            return <div key={i} className="anim" style={{background:k.bg,border:"1px solid "+k.bd,borderRadius:12,padding:"12px 14px",position:"relative",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:k.c,borderRadius:"12px 12px 0 0"}}/>
              <div className="orb" style={{fontSize:26,fontWeight:700,color:k.c,lineHeight:1,marginBottom:3}}>{k.n}</div>
              <div style={{fontSize:8,color:k.c,fontWeight:600,letterSpacing:".08em",opacity:.85}}>{k.l}</div>
            </div>;
          })}
        </div>

        {/* GERAL */}
        {tab==="geral"&&(
          <div className="anim">
            <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:"16px 20px",marginBottom:12,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
              <div className="orb" style={{fontSize:8,fontWeight:700,color:"#94A3B8",letterSpacing:".1em",marginBottom:12}}>DISTRIBUIÇÃO POR PRIORIDADE</div>
              <DonutChart items={items}/>
            </div>
            <div style={{marginBottom:12}}>
              <div className="orb" style={{fontSize:8,fontWeight:700,color:"#94A3B8",letterSpacing:".1em",marginBottom:10}}>ÁREAS ATIVAS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:8}}>
                {aStats.map(function(a) {
                  return <div key={a.id} style={{background:"#fff",border:"1px solid #E2E8F0",borderLeft:"3px solid "+a.accent,borderRadius:10,padding:"10px 12px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <span style={{fontSize:16}}>{a.icon}</span>
                      <span className="orb" style={{fontSize:10,fontWeight:700,color:a.accent}}>{a.ct}</span>
                    </div>
                    <div style={{fontSize:10,fontWeight:700,color:a.accent,marginBottom:5}}>{a.label}</div>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {PRI.map(function(p){var ct=a.items.filter(function(i){return i.priority===p.id;}).length;if(!ct)return null;return<span key={p.id} style={{fontSize:8,fontWeight:600,padding:"1px 5px",borderRadius:10,background:p.bg,color:p.color,border:"1px solid "+p.bd}}>{p.dot}{ct}</span>;})}
                    </div>
                    {a.crit>0&&<div style={{fontSize:8,color:"#DC2626",marginTop:4,fontWeight:600,animation:"blink 1s step-end infinite"}}>⚠ {a.crit} crítico{a.crit>1?"s":""}</div>}
                  </div>;
                })}
              </div>
            </div>
            {crits.length>0&&(
              <div style={{background:"#fff",border:"1px solid #FECACA",borderRadius:12,padding:"14px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:7,height:7,borderRadius:2,background:"#DC2626",animation:"pulse 1.5s ease infinite"}}/>
                  <span className="orb" style={{fontSize:8,fontWeight:700,color:"#DC2626",letterSpacing:".08em"}}>ITENS CRÍTICOS — AÇÃO IMEDIATA</span>
                </div>
                {crits.map(function(it){var ar=getA(it.area);var p=getP(it.priority);return(
                  <div key={it.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:"9px 10px",background:"#FEF2F2",borderRadius:8,border:"1px solid #FECACA",marginBottom:5}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:9,color:ar.accent,marginBottom:1,fontWeight:600}}>{ar.icon} {ar.label}</div>
                      <div style={{fontSize:11,fontWeight:600,color:"#0F172A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.topic}</div>
                      {it.responsible&&<div style={{fontSize:9,color:"#94A3B8"}}>{it.responsible}</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                      {it.tag&&<Tag p={p} text={it.tag}/>}
                      <button onClick={function(){setShowHistory(it);}} style={{background:"transparent",border:"none",fontSize:9,color:"#2563EB",cursor:"pointer",padding:0,fontFamily:"inherit"}}>📋 histórico</button>
                    </div>
                  </div>
                );})}
              </div>
            )}
            {tot===0&&<div style={{textAlign:"center",padding:"50px 0",color:"#94A3B8"}}><div style={{fontSize:40,marginBottom:10}}>📊</div><div style={{fontSize:13,fontWeight:600}}>Nenhum resultado para os filtros aplicados</div></div>}
          </div>
        )}

        {/* AREAS */}
        {tab==="areas"&&(
          <div className="anim" style={{display:"flex",flexDirection:"column",gap:7}}>
            {aStats.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#94A3B8"}}>Nenhum dado disponível</div>}
            {aStats.map(function(a) {
              return <div key={a.id} style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                <button onClick={function(){setExp(exp===a.id?null:a.id);}}
                  style={{width:"100%",background:a.bg,border:"none",borderBottom:"1px solid "+a.bd,padding:"12px 15px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18}}>{a.icon}</span>
                    <div style={{textAlign:"left"}}>
                      <div style={{fontSize:11,fontWeight:700,color:a.accent}}>{a.label}</div>
                      <div style={{display:"flex",gap:4,marginTop:3}}>
                        {PRI.map(function(p){var ct=a.items.filter(function(i){return i.priority===p.id;}).length;if(!ct)return null;return<span key={p.id} style={{fontSize:8,fontWeight:600,padding:"1px 6px",borderRadius:10,background:p.bg,color:p.color}}>{p.dot}{ct}</span>;})}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span className="orb" style={{fontSize:10,fontWeight:700,color:a.accent}}>{a.ct}</span>
                    <span style={{color:a.accent,fontSize:12}}>{exp===a.id?"▲":"▼"}</span>
                  </div>
                </button>
                {exp===a.id&&(
                  <div style={{padding:"8px 12px",display:"flex",flexDirection:"column",gap:5}}>
                    {a.items.map(function(it){var p=getP(it.priority);return(
                      <div key={it.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",background:"#F8FAFC",borderRadius:8,border:"1px solid #E2E8F0"}}>
                        <div style={{width:3,height:30,background:p.color,borderRadius:2,flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:11,fontWeight:600,color:"#0F172A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.topic}</div>
                          <div style={{fontSize:9,color:"#94A3B8",marginTop:1}}>{p.dot} {p.label}{it.responsible?" · "+it.responsible:""}</div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                          {it.tag&&<Tag p={p} text={it.tag}/>}
                          <button onClick={function(){setShowHistory(it);}} style={{background:"transparent",border:"none",fontSize:9,color:"#2563EB",cursor:"pointer",padding:0,fontFamily:"inherit"}}>📋</button>
                        </div>
                      </div>
                    );})}
                  </div>
                )}
              </div>;
            })}
          </div>
        )}

        {/* AGENDA */}
        {tab==="agenda"&&(
          <div className="anim">
            {tagged.length===0?<div style={{textAlign:"center",padding:"40px 0",color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:8}}>📅</div><div>Nenhum item com prazo</div></div>:(
              <div>
                <div className="orb" style={{fontSize:8,fontWeight:700,color:"#94A3B8",letterSpacing:".1em",marginBottom:12}}>ITENS COM PRAZO DEFINIDO</div>
                <div style={{position:"relative",paddingLeft:22}}>
                  <div style={{position:"absolute",left:8,top:6,bottom:6,width:2,background:"linear-gradient(to bottom,#0F172A,#E2E8F0)",borderRadius:1}}/>
                  {tagged.map(function(it){var p=getP(it.priority);var ar=getA(it.area);return(
                    <div key={it.id} style={{position:"relative",marginBottom:9}}>
                      <div style={{position:"absolute",left:-18,top:6,width:10,height:10,borderRadius:"50%",border:"2px solid "+p.color,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <div style={{width:4,height:4,borderRadius:"50%",background:p.color}}/>
                      </div>
                      <div style={{background:"#fff",border:"1px solid #E2E8F0",borderLeft:"3px solid "+p.color,borderRadius:10,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:9,color:ar.accent,marginBottom:1,fontWeight:600}}>{ar.icon} {ar.label}</div>
                          <div style={{fontSize:11,fontWeight:600,color:"#0F172A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.topic}</div>
                        </div>
                        <Tag p={p} text={it.tag}/>
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5: RASTREIO / HISTÓRICO GLOBAL */}
        {tab==="rastreio"&&(
          <div className="anim">
            <div className="orb" style={{fontSize:8,fontWeight:700,color:"#94A3B8",letterSpacing:".1em",marginBottom:12}}>RASTREIO DE ALTERAÇÕES · TODOS OS TEMAS</div>
            {allItems.filter(function(it){return it.history&&it.history.length>0;}).length===0?(
              <div style={{textAlign:"center",padding:"40px 0",color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:8}}>📋</div><div>Nenhuma alteração registrada ainda</div></div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {allItems.filter(function(it){return it.history&&it.history.length>0;}).map(function(it){
                  var a = getA(it.area); var p = getP(it.priority);
                  return <div key={it.id} style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:10,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                    <div style={{background:a.bg,padding:"8px 12px",borderBottom:"1px solid "+a.bd,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:14}}>{a.icon}</span>
                        <div>
                          <div style={{fontSize:10,fontWeight:700,color:a.accent}}>{it.topic}</div>
                          <div style={{fontSize:9,color:a.accent,opacity:.7}}>{it.history.length} alteraç{it.history.length===1?"ão":"ões"}</div>
                        </div>
                      </div>
                      <button onClick={function(){setShowHistory(it);}} style={{background:a.accent,color:"#fff",border:"none",borderRadius:6,padding:"4px 10px",fontSize:9,cursor:"pointer",fontFamily:"inherit"}}>Ver histórico</button>
                    </div>
                    <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
                      <Tag p={p} text={p.dot+" "+p.label}/>
                      {it.tag&&<span style={{fontSize:9,color:"#64748B"}}>📅 {it.tag}</span>}
                      {it.updatedAt&&<span style={{fontSize:9,color:"#94A3B8",marginLeft:"auto"}}>Última: {fmtDate(it.updatedAt)}</span>}
                    </div>
                  </div>;
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showHistory&&<HistoryModal item={showHistory} onClose={function(){setShowHistory(null);}}/>}
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("home");
  const [area, setArea] = useState(null);
  const [items, setItems] = useState([]);
  const [ts, setTs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    loadItems().then(function(data) {
      setItems(data);
      var last = data.reduce(function(m,i){return Math.max(m,i.updatedAt||0);},0);
      if (last) setTs(last);
      setLoading(false);
    });
  }, []);

  useEffect(function() {
    if (view!=="head") return;
    if (supabase) {
      var sub = supabase.channel("items-changes").on("postgres_changes",{event:"*",schema:"public",table:"items"},function(){
        loadItems().then(function(data){setItems(data);var last=data.reduce(function(m,i){return Math.max(m,i.updatedAt||0);},0);if(last)setTs(last);});
      }).subscribe();
      return function(){supabase.removeChannel(sub);};
    } else {
      var t = setInterval(function(){loadItems().then(function(data){setItems(data);var last=data.reduce(function(m,i){return Math.max(m,i.updatedAt||0);},0);if(last)setTs(last);});},3000);
      return function(){clearInterval(t);};
    }
  }, [view]);

  // 8: Check expiry every minute
  useEffect(function() {
    var t = setInterval(function(){setItems(function(prev){return applyExpiry(prev);});},60000);
    return function(){clearInterval(t);};
  }, []);

  async function doSave(it) {
    await upsertItem(it);
    setItems(function(prev){var idx=prev.findIndex(function(i){return i.id===it.id;});return idx>=0?prev.map(function(i){return i.id===it.id?it:i;}):[...prev,it];});
    setTs(it.updatedAt);
  }
  async function doDel(id) {
    await deleteItem(id);
    setItems(function(prev){return prev.filter(function(i){return i.id!==id;});});
  }

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center"}}>
        <div style={{padding:"6px 20px",border:"2px solid #0F172A",borderRadius:4,display:"inline-block",marginBottom:12}}>
          <span style={{fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:900,letterSpacing:".5em",color:"#0F172A"}}>CSC</span>
        </div>
        <div style={{fontSize:10,color:"#94A3B8",letterSpacing:".1em"}}>CARREGANDO...</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#F1F5F9"}}>
      <style>{css}</style>
      {view==="home"&&<Home onArea={function(id){setArea(id);setView("area");}} onHead={function(){setView("head");}}/>}
      {view==="area"&&<AreaView areaId={area} items={items} onSave={doSave} onDelete={doDel} onBack={function(){setView("home");}}/>}
      {view==="head"&&<Head items={items} ts={ts} onBack={function(){setView("home");}}/>}
    </div>
  );
}
