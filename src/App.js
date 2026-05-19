import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const AREAS = [
  { id:"comercial",  label:"Comercial",          icon:"📊", accent:"#1E40AF", bg:"#EFF6FF", bd:"#BFDBFE" },
  { id:"logistica",  label:"Logística",           icon:"🚚", accent:"#92400E", bg:"#FFFBEB", bd:"#FDE68A" },
  { id:"rh",         label:"Recursos Humanos",    icon:"👥", accent:"#6D28D9", bg:"#F5F3FF", bd:"#DDD6FE" },
  { id:"operacoes",  label:"Operações / Técnica", icon:"⚙️", accent:"#0E7490", bg:"#ECFEFF", bd:"#A5F3FC" },
  { id:"obras",      label:"Comercial / Obras",   icon:"🏗️", accent:"#065F46", bg:"#ECFDF5", bd:"#A7F3D0" },
  { id:"financeiro", label:"Financeiro CSC",      icon:"💰", accent:"#92400E", bg:"#FFF7ED", bd:"#FED7AA" },
  { id:"compras",    label:"Compras CSC",         icon:"🛒", accent:"#1E3A5F", bg:"#F0F9FF", bd:"#BAE6FD" },
  { id:"vistoria",   label:"Vistoria / Obras",    icon:"🔍", accent:"#7F1D1D", bg:"#FFF1F2", bd:"#FECDD3" },
  { id:"juridico",   label:"Jurídico",            icon:"⚖️", accent:"#1F2937", bg:"#F9FAFB", bd:"#D1D5DB" },
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

function fmtDate(ts) {
  var d = new Date(ts);
  return String(d.getDate()).padStart(2,"0") + "/" + String(d.getMonth()+1).padStart(2,"0") + " " + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}

async function loadItems() {
  if (supabase) {
    const { data, error } = await supabase.from("items").select("*").order("updated_at", { ascending: false });
    if (!error && data) return data.map((r) => ({ ...r, updatedAt: r.updated_at }));
  }
  try { return JSON.parse(localStorage.getItem("efatha_items") || "[]"); } catch { return []; }
}

async function upsertItem(item) {
  var updated_at = item.updatedAt;
  var row = { id: item.id, area: item.area, topic: item.topic, priority: item.priority, tag: item.tag, responsible: item.responsible, notes: item.notes||"", updated_at: updated_at };
  if (supabase) { await supabase.from("items").upsert(row, { onConflict: "id" }); }
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

const css = "@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=DM+Mono:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Mono','Courier New',monospace;background:#F1F5F9;color:#0F172A;font-size:12px}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{50%{opacity:.2}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.orb{font-family:'Orbitron',monospace;letter-spacing:.04em}.anim{animation:fadeIn .4s ease forwards}button{cursor:pointer;font-family:inherit}.scale{transition:transform .15s,box-shadow .15s}.scale:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}input{font-family:inherit;font-size:12px;outline:none}";

// ── DONUT CHART ──────────────────────────────────────────────────────────────
function DonutChart(props) {
  var items = props.items;
  var size = props.size || 140;
  var r = 52;
  var cx = size / 2;
  var cy = size / 2;
  var circ = 2 * Math.PI * r;
  var total = items.length || 1;

  var counts = PRI.map(function(p) {
    return items.filter(function(i) { return i.priority === p.id; }).length;
  });

  var segments = [];
  var offset = 0;
  counts.forEach(function(count, i) {
    var pct = count / total;
    var dash = pct * circ;
    segments.push({ dash: dash, offset: offset, color: CHART_COLORS[i], count: count, label: PRI[i].label });
    offset += dash;
  });

  return (
    <div style={{display:"flex",alignItems:"center",gap:20}}>
      <svg width={size} height={size} viewBox={"0 0 "+size+" "+size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="16"/>
        {segments.map(function(s, i) {
          if (s.count === 0) return null;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth="16"
              strokeDasharray={s.dash + " " + (circ - s.dash)}
              strokeDashoffset={-(s.offset - circ / 4)}
              strokeLinecap="butt"
              style={{transition:"stroke-dasharray .6s ease"}}
            />
          );
        })}
        <text x={cx} y={cy-6} textAnchor="middle" style={{fontFamily:"'Orbitron',monospace",fontSize:22,fontWeight:700,fill:"#0F172A"}}>{total}</text>
        <text x={cx} y={cy+14} textAnchor="middle" style={{fontFamily:"'DM Mono',monospace",fontSize:9,fill:"#64748B"}}>TEMAS</text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {PRI.map(function(p, i) {
          return (
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:8,height:8,borderRadius:2,background:CHART_COLORS[i],flexShrink:0}}/>
              <span style={{fontSize:10,color:"#64748B"}}>{p.label}</span>
              <span style={{fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:600,color:CHART_COLORS[i],marginLeft:"auto",paddingLeft:8}}>{counts[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SHARED COMPONENTS ────────────────────────────────────────────────────────
function BrandBar(props) {
  var compact = props.compact;
  var h = compact ? 16 : 22;
  var gap = compact ? 8 : 14;
  var names = ["EFATHA","MAKTUB","ROCKET IT","NEX"];
  return (
    <div style={{display:"flex",alignItems:"center",gap:gap}}>
      {names.map(function(n, i) {
        return (
          <div key={n} style={{display:"flex",alignItems:"center",gap:gap}}>
            <span style={{fontFamily:"'Orbitron',monospace",fontSize:h*0.6,fontWeight:i===0?700:400,letterSpacing:i===0?".2em":".1em",color:i===0?"#0F172A":"#94A3B8",whiteSpace:"nowrap"}}>{n}</span>
            {i < names.length-1 && <div style={{width:1,height:h,background:"#E2E8F0",flexShrink:0}}/>}
          </div>
        );
      })}
    </div>
  );
}

function Tag(props) {
  var p = props.p;
  return (
    <span style={{display:"inline-flex",alignItems:"center",fontSize:9,fontWeight:600,padding:"2px 8px",borderRadius:20,border:"1px solid "+p.bd,background:p.bg,color:p.color,whiteSpace:"nowrap",letterSpacing:".04em"}}>
      {props.text}
    </span>
  );
}

function Btn(props) {
  var bg = props.bg || "#F8FAFC";
  var color = props.color || "#475569";
  var bd = props.bd || "#E2E8F0";
  var style = props.style || {};
  return (
    <button onClick={props.onClick} style={{background:bg,color:color,border:"1px solid "+bd,borderRadius:6,padding:"8px 16px",fontWeight:500,fontFamily:"inherit",fontSize:11,...style}}>
      {props.children}
    </button>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function Home(props) {
  return (
    <div style={{maxWidth:520,margin:"0 auto",padding:"28px 16px"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:6,marginBottom:16}}>
          <div style={{padding:"6px 20px",border:"2px solid #0F172A",borderRadius:4}}>
            <span className="orb" style={{fontSize:20,fontWeight:900,letterSpacing:".4em",color:"#0F172A"}}>EFATHA</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:32,height:1,background:"#CBD5E1"}}/>
            <span style={{fontSize:8,color:"#94A3B8",letterSpacing:".15em",textTransform:"uppercase"}}>Soluções Tecnológicas</span>
            <div style={{width:32,height:1,background:"#CBD5E1"}}/>
          </div>
        </div>
        <div className="orb" style={{fontSize:10,color:"#0F172A",letterSpacing:".12em",fontWeight:700}}>PAINEL DE GESTÃO · SELECIONE SUA ÁREA</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {AREAS.map(function(a) {
          return (
            <button key={a.id} className="scale" onClick={function() { props.onArea(a.id); }}
              style={{background:a.bg,border:"1px solid "+a.bd,borderRadius:10,padding:"16px 8px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",minHeight:90}}>
              <span style={{fontSize:22}}>{a.icon}</span>
              <span style={{fontSize:10,fontWeight:700,color:a.accent,textAlign:"center",lineHeight:1.3,letterSpacing:".02em"}}>{a.label}</span>
            </button>
          );
        })}
      </div>

      <button onClick={props.onHead} className="scale"
        style={{width:"100%",background:"#0F172A",border:"none",borderRadius:10,padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:16}}>📊</span>
          </div>
          <div style={{textAlign:"left"}}>
            <div className="orb" style={{fontSize:10,fontWeight:700,color:"#FFFFFF",letterSpacing:".08em"}}>DASHBOARD EXECUTIVO</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.5)",marginTop:2}}>Visão completa · Todas as áreas</div>
          </div>
        </div>
        <div style={{width:28,height:28,borderRadius:"50%",border:"1px solid rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:"rgba(255,255,255,.7)",fontSize:14}}>→</span>
        </div>
      </button>

      <div style={{display:"flex",justifyContent:"center",padding:"12px 0",borderTop:"1px solid #E2E8F0"}}>
        <BrandBar compact={true}/>
      </div>
    </div>
  );
}

// ── FORM ──────────────────────────────────────────────────────────────────────
function Form(props) {
  var areaId = props.areaId;
  var item = props.item;
  const [topic, setTopic] = useState(item ? item.topic : "");
  const [pri, setPri] = useState(item ? item.priority : "andamento");
  const [tag, setTag] = useState(item ? item.tag : "");
  const [resp, setResp] = useState(item ? item.responsible : "");
  const [notes, setNotes] = useState(item ? (item.notes || "") : "");
  var a = getA(areaId);

  function doSave() {
    if (!topic.trim()) return;
    props.onSave({ id: item ? item.id : uid(), area: areaId, topic: topic.trim(), priority: pri, tag: tag.trim(), responsible: resp.trim(), notes: notes.trim(), updatedAt: Date.now() });
  }

  return (
    <div className="anim" style={{background:"#FFFFFF",border:"1.5px solid "+a.bd,borderRadius:12,padding:18,margin:"8px 0",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>{a.icon}</span>
          <span className="orb" style={{fontSize:9,fontWeight:700,color:a.accent,letterSpacing:".08em"}}>{item ? "EDITAR TEMA" : "NOVO TEMA"}</span>
        </div>
        <Btn onClick={props.onCancel} style={{padding:"4px 10px",fontSize:11}}>✕</Btn>
      </div>

      <div style={{marginBottom:12}}>
        <div style={{fontSize:8,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:5,fontWeight:600}}>Tema / Projeto *</div>
        <input value={topic} onChange={function(e) { setTopic(e.target.value); }} placeholder="Descreva o tema..."
          style={{width:"100%",padding:"10px 12px",border:"1.5px solid #E2E8F0",borderRadius:8,background:"#F8FAFC",color:"#0F172A",fontSize:12}}/>
      </div>

      <div style={{marginBottom:12}}>
        <div style={{fontSize:8,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8,fontWeight:600}}>Prioridade</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
          {PRI.map(function(p) {
            return (
              <button key={p.id} onClick={function() { setPri(p.id); }}
                style={{background:pri===p.id?p.bg:"#F8FAFC",border:"1.5px solid "+(pri===p.id?p.bd:"#E2E8F0"),borderRadius:8,padding:"8px 6px",fontSize:10,fontWeight:pri===p.id?700:400,color:pri===p.id?p.color:"#94A3B8",cursor:"pointer",transition:"all .15s"}}>
                {p.dot} {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <div style={{fontSize:8,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:5,fontWeight:600}}>Prazo / Status</div>
          <input value={tag} onChange={function(e) { setTag(e.target.value); }} placeholder="Ex: ATÉ 15/05"
            style={{width:"100%",padding:"9px 10px",border:"1.5px solid #E2E8F0",borderRadius:8,background:"#F8FAFC",color:"#0F172A"}}/>
        </div>
        <div>
          <div style={{fontSize:8,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:5,fontWeight:600}}>Responsável</div>
          <input value={resp} onChange={function(e) { setResp(e.target.value); }} placeholder="Nome"
            style={{width:"100%",padding:"9px 10px",border:"1.5px solid #E2E8F0",borderRadius:8,background:"#F8FAFC",color:"#0F172A"}}/>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:8,color:"#94A3B8",textTransform:"uppercase",letterSpacing:".08em",marginBottom:5,fontWeight:600}}>Anotações / Observações</div>
        <textarea value={notes} onChange={function(e) { setNotes(e.target.value); }} placeholder="Informações relevantes sobre este tema..."
          style={{width:"100%",padding:"9px 10px",border:"1.5px solid #E2E8F0",borderRadius:8,background:"#F8FAFC",color:"#0F172A",fontFamily:"inherit",fontSize:12,resize:"vertical",minHeight:72}}/>
      </div>

      <button onClick={doSave}
        style={{width:"100%",background:"#0F172A",color:"#FFFFFF",border:"none",borderRadius:8,padding:"11px",fontSize:12,fontWeight:600,cursor:"pointer",letterSpacing:".04em"}}>
        {item ? "SALVAR ALTERAÇÕES ✓" : "ADICIONAR TEMA ✓"}
      </button>
    </div>
  );
}

// ── AREA VIEW ─────────────────────────────────────────────────────────────────
function AreaView(props) {
  var areaId = props.areaId;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  var a = getA(areaId);
  var ord = {critico:0,andamento:1,aguardando:2,concluido:3};
  var mine = props.items.filter(function(i) { return i.area === areaId; }).sort(function(x,y) { return (ord[x.priority]||2)-(ord[y.priority]||2); });

  function doSave(it) { props.onSave(it); setShowForm(false); setEditing(null); }

  return (
    <div style={{maxWidth:520,margin:"0 auto",padding:16}}>
      <div style={{background:a.bg,border:"1px solid "+a.bd,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        <Btn onClick={props.onBack} style={{padding:"6px 12px",flexShrink:0,borderRadius:8}}>←</Btn>
        <span style={{fontSize:22}}>{a.icon}</span>
        <div>
          <div className="orb" style={{fontSize:10,fontWeight:700,color:a.accent,letterSpacing:".06em"}}>{a.label.toUpperCase()}</div>
          <div style={{fontSize:9,color:a.accent,opacity:.7,marginTop:2}}>{mine.length} tema{mine.length!==1?"s":""} cadastrado{mine.length!==1?"s":""}</div>
        </div>
        <button onClick={function() { setEditing(null); setShowForm(!showForm); }}
          style={{marginLeft:"auto",background:a.accent,color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontWeight:600,cursor:"pointer",fontSize:11}}>
          {showForm ? "✕ Cancelar" : "+ Novo tema"}
        </button>
      </div>

      {showForm && !editing && <Form areaId={areaId} item={null} onSave={doSave} onCancel={function() { setShowForm(false); }}/>}

      {mine.length === 0 && !showForm && (
        <div style={{textAlign:"center",padding:"40px 0",color:"#94A3B8"}}>
          <div style={{fontSize:36,marginBottom:10}}>📋</div>
          <div style={{fontSize:12,fontWeight:500}}>Nenhum tema ainda</div>
          <div style={{fontSize:10,marginTop:4}}>Clique em "+ Novo tema" para começar</div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {mine.map(function(it) {
          var p = getP(it.priority);
          if (editing && editing.id === it.id) {
            return <Form key={it.id} areaId={areaId} item={it} onSave={doSave} onCancel={function() { setEditing(null); }}/>;
          }
          return (
            <div key={it.id} className="anim" style={{background:"#FFFFFF",border:"1px solid #E2E8F0",borderLeft:"3px solid "+p.color,borderRadius:10,padding:"12px 14px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                <div style={{fontSize:12,fontWeight:600,color:"#0F172A",lineHeight:1.4,flex:1}}>{it.topic}</div>
                {it.tag && <Tag p={p} text={it.tag}/>}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:10,color:p.color,fontWeight:600}}>{p.dot} {p.label}</span>
                  {it.responsible && <span style={{fontSize:9,color:"#94A3B8"}}>· {it.responsible}</span>}
                </div>
                <div style={{display:"flex",gap:5}}>
                  <button onClick={function() { setEditing(it); }}
                    style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:6,padding:"4px 9px",fontSize:10,cursor:"pointer"}}>✏️</button>
                  <button onClick={function() { props.onDelete(it.id); }}
                    style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"4px 9px",fontSize:10,cursor:"pointer",color:"#DC2626"}}>🗑</button>
                </div>
              </div>
              {it.notes && <div style={{fontSize:10,color:"#64748B",marginTop:8,paddingTop:8,borderTop:"1px solid #F1F5F9",lineHeight:1.5}}>📝 {it.notes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── HEAD DASHBOARD ────────────────────────────────────────────────────────────
function Head(props) {
  const [tab, setTab] = useState("geral");
  const [exp, setExp] = useState(null);
  var items = props.items;
  var ts = props.ts;
  var tot = items.length;
  function byP(id) { return items.filter(function(i) { return i.priority === id; }).length; }
  var ord = {critico:0,andamento:1,aguardando:2,concluido:3};
  var aStats = AREAS.map(function(a) {
    var aItems = items.filter(function(i) { return i.area === a.id; }).sort(function(x,y) { return (ord[x.priority]||2)-(ord[y.priority]||2); });
    return Object.assign({}, a, { items: aItems, ct: aItems.length, crit: aItems.filter(function(i) { return i.priority==="critico"; }).length });
  }).filter(function(a) { return a.ct > 0; });
  var crits = items.filter(function(i) { return i.priority === "critico"; });
  var tagged = items.filter(function(i) { return i.tag && i.priority !== "concluido"; }).sort(function(a,b) { return b.updatedAt - a.updatedAt; });
  var TABS = [{id:"geral",l:"Visão Geral"},{id:"areas",l:"Por Área"},{id:"agenda",l:"Agenda"}];

  var kpis = [
    {n:tot,              l:"TOTAL",       c:"#0F172A", bg:"#F8FAFC", bd:"#E2E8F0", accent:"#0F172A"},
    {n:byP("critico"),   l:"CRÍTICO",     c:"#DC2626", bg:"#FEF2F2", bd:"#FECACA", accent:"#DC2626"},
    {n:byP("andamento"), l:"ANDAMENTO",   c:"#D97706", bg:"#FFFBEB", bd:"#FDE68A", accent:"#D97706"},
    {n:byP("aguardando"),l:"AGUARDANDO",  c:"#2563EB", bg:"#EFF6FF", bd:"#BFDBFE", accent:"#2563EB"},
    {n:byP("concluido"), l:"CONCLUÍDO",   c:"#059669", bg:"#ECFDF5", bd:"#A7F3D0", accent:"#059669"},
  ];

  return (
    <div style={{maxWidth:960,margin:"0 auto",padding:"0 0 40px"}}>
      {/* HEADER */}
      <div style={{background:"#0F172A",padding:"14px 20px",marginBottom:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",maxWidth:960,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{padding:"4px 14px",border:"1.5px solid rgba(255,255,255,.3)",borderRadius:4}}>
              <span className="orb" style={{fontSize:13,fontWeight:900,letterSpacing:".35em",color:"#FFFFFF"}}>EFATHA</span>
            </div>
            <div style={{borderLeft:"1px solid rgba(255,255,255,.15)",paddingLeft:16}}>
              <div className="orb" style={{fontSize:9,fontWeight:700,color:"#FFFFFF",letterSpacing:".1em"}}>PAINEL EXECUTIVO · GESTORES</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,.4)",marginTop:2,letterSpacing:".05em"}}>
                {ts ? "Atualizado: " + fmtDate(ts) : "Aguardando dados"} · {tot} tema{tot!==1?"s":""}
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{display:"flex",alignItems:"center",gap:5,overflow:"hidden"}}>
              {["MAKTUB","ROCKET IT","NEX"].map(function(n,i) {
                return (
                  <div key={n} style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                    <span style={{fontFamily:"'Orbitron',monospace",fontSize:7,fontWeight:700,color:"#FFFFFF",letterSpacing:".04em",whiteSpace:"nowrap"}}>{n}</span>
                    {i<2&&<div style={{width:1,height:8,background:"rgba(255,255,255,.3)",flexShrink:0}}/>}
                  </div>
                );
              })}
            </div>
            <button onClick={props.onBack}
              style={{background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.8)",border:"1px solid rgba(255,255,255,.15)",borderRadius:6,padding:"6px 14px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>
              ← Voltar
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{background:"#FFFFFF",borderBottom:"1px solid #E2E8F0",padding:"0 20px"}}>
        <div style={{display:"flex",gap:0,maxWidth:960,margin:"0 auto"}}>
          {TABS.map(function(t) {
            var active = tab === t.id;
            return (
              <button key={t.id} onClick={function() { setTab(t.id); }}
                style={{background:"transparent",border:"none",borderBottom: active?"2px solid #0F172A":"2px solid transparent",padding:"12px 18px",fontSize:10,fontWeight:active?700:400,color:active?"#0F172A":"#94A3B8",cursor:"pointer",fontFamily:"inherit",letterSpacing:".04em",transition:"all .15s",marginBottom:-1}}>
                {t.l}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{padding:"18px 20px"}}>
        {/* KPI STRIP */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:18}}>
          {kpis.map(function(k, i) {
            return (
              <div key={i} className="anim" style={{background:k.bg,border:"1px solid "+k.bd,borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:k.accent,borderRadius:"12px 12px 0 0"}}/>
                <div className="orb" style={{fontSize:28,fontWeight:700,color:k.c,lineHeight:1,marginBottom:4}}>{k.n}</div>
                <div style={{fontSize:8,color:k.c,fontWeight:600,letterSpacing:".1em",opacity:.8}}>{k.l}</div>
              </div>
            );
          })}
        </div>

        {/* GERAL TAB */}
        {tab === "geral" && (
          <div className="anim">
            {/* DONUT + KPI em linha */}
            <div style={{background:"#FFFFFF",border:"1px solid #E2E8F0",borderRadius:12,padding:"16px 20px",marginBottom:14,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
              <div className="orb" style={{fontSize:8,fontWeight:700,color:"#94A3B8",letterSpacing:".1em",marginBottom:14}}>DISTRIBUIÇÃO POR PRIORIDADE</div>
              <DonutChart items={items}/>
            </div>

            {/* AREA GRID */}
            <div style={{marginBottom:14}}>
              <div className="orb" style={{fontSize:8,fontWeight:700,color:"#94A3B8",letterSpacing:".1em",marginBottom:10}}>ÁREAS ATIVAS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
                {aStats.map(function(a) {
                  return (
                    <div key={a.id} style={{background:"#FFFFFF",border:"1px solid #E2E8F0",borderLeft:"3px solid "+a.accent,borderRadius:10,padding:"10px 12px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:16}}>{a.icon}</span>
                        <span className="orb" style={{fontSize:10,fontWeight:700,color:a.accent}}>{a.ct}</span>
                      </div>
                      <div style={{fontSize:10,fontWeight:700,color:a.accent,marginBottom:5}}>{a.label}</div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {PRI.map(function(p) {
                          var ct = a.items.filter(function(i) { return i.priority===p.id; }).length;
                          if (!ct) return null;
                          return <span key={p.id} style={{fontSize:8,fontWeight:600,padding:"1px 5px",borderRadius:10,background:p.bg,color:p.color,border:"1px solid "+p.bd}}>{p.dot}{ct}</span>;
                        })}
                      </div>
                      {a.crit>0&&<div style={{fontSize:8,color:"#DC2626",marginTop:4,fontWeight:600,animation:"blink 1s step-end infinite"}}>⚠ {a.crit} crítico{a.crit>1?"s":""}</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CRITICALS */}
            {crits.length > 0 && (
              <div style={{background:"#FFFFFF",border:"1px solid #FECACA",borderRadius:12,padding:"16px",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{width:8,height:8,borderRadius:2,background:"#DC2626",animation:"pulse 1.5s ease infinite"}}/>
                  <span className="orb" style={{fontSize:8,fontWeight:700,color:"#DC2626",letterSpacing:".1em"}}>ITENS CRÍTICOS — AÇÃO IMEDIATA</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {crits.map(function(it) {
                    var ar = getA(it.area); var p = getP(it.priority);
                    return (
                      <div key={it.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"10px 12px",background:"#FEF2F2",borderRadius:8,border:"1px solid #FECACA"}}>
                        <div>
                          <div style={{fontSize:9,color:ar.accent,marginBottom:2,fontWeight:600}}>{ar.icon} {ar.label}</div>
                          <div style={{fontSize:12,fontWeight:600,color:"#0F172A"}}>{it.topic}</div>
                          {it.responsible&&<div style={{fontSize:9,color:"#94A3B8",marginTop:1}}>{it.responsible}</div>}
                        </div>
                        {it.tag&&<Tag p={p} text={it.tag}/>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tot===0&&(
              <div style={{textAlign:"center",padding:"60px 0",color:"#94A3B8"}}>
                <div style={{fontSize:48,marginBottom:12}}>📊</div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Painel aguardando dados</div>
                <div style={{fontSize:11}}>Compartilhe o link com as áreas para começar</div>
              </div>
            )}
          </div>
        )}

        {/* AREAS TAB */}
        {tab === "areas" && (
          <div className="anim" style={{display:"flex",flexDirection:"column",gap:8}}>
            {aStats.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"#94A3B8"}}>Nenhum dado disponível</div>}
            {aStats.map(function(a) {
              return (
                <div key={a.id} style={{background:"#FFFFFF",border:"1px solid #E2E8F0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                  <button onClick={function() { setExp(exp===a.id?null:a.id); }}
                    style={{width:"100%",background:a.bg,border:"none",borderBottom:"1px solid "+a.bd,padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:20}}>{a.icon}</span>
                      <div style={{textAlign:"left"}}>
                        <div style={{fontSize:11,fontWeight:700,color:a.accent,letterSpacing:".03em"}}>{a.label}</div>
                        <div style={{display:"flex",gap:4,marginTop:4}}>
                          {PRI.map(function(p) {
                            var ct = a.items.filter(function(i) { return i.priority===p.id; }).length;
                            if (!ct) return null;
                            return <span key={p.id} style={{fontSize:8,fontWeight:600,padding:"1px 6px",borderRadius:10,background:p.bg,color:p.color}}>{p.dot}{ct}</span>;
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span className="orb" style={{fontSize:10,fontWeight:700,color:a.accent}}>{a.ct}</span>
                      <span style={{color:a.accent,fontSize:12}}>{exp===a.id?"▲":"▼"}</span>
                    </div>
                  </button>
                  {exp===a.id&&(
                    <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:5}}>
                      {a.items.map(function(it) {
                        var p = getP(it.priority);
                        return (
                          <div key={it.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"#F8FAFC",borderRadius:8,border:"1px solid #E2E8F0"}}>
                            <div style={{width:3,height:32,background:p.color,borderRadius:2,flexShrink:0}}/>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:11,fontWeight:600,color:"#0F172A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.topic}</div>
                              <div style={{fontSize:9,color:"#94A3B8",marginTop:2}}>{p.dot} {p.label}{it.responsible?" · "+it.responsible:""}</div>
                              {it.notes&&<div style={{fontSize:9,color:"#64748B",marginTop:3}}>📝 {it.notes}</div>}
                            </div>
                            {it.tag&&<Tag p={p} text={it.tag}/>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AGENDA TAB */}
        {tab === "agenda" && (
          <div className="anim">
            {tagged.length===0
              ? <div style={{textAlign:"center",padding:"40px 0",color:"#94A3B8"}}><div style={{fontSize:32,marginBottom:8}}>📅</div><div>Nenhum item com prazo definido</div></div>
              : (
                <div>
                  <div className="orb" style={{fontSize:8,fontWeight:700,color:"#94A3B8",letterSpacing:".1em",marginBottom:14}}>ITENS COM PRAZO DEFINIDO</div>
                  <div style={{position:"relative",paddingLeft:24}}>
                    <div style={{position:"absolute",left:8,top:6,bottom:6,width:2,background:"linear-gradient(to bottom,#0F172A,#E2E8F0)",borderRadius:1}}/>
                    {tagged.map(function(it) {
                      var p = getP(it.priority); var ar = getA(it.area);
                      return (
                        <div key={it.id} style={{position:"relative",marginBottom:10}}>
                          <div style={{position:"absolute",left:-20,top:6,width:10,height:10,borderRadius:"50%",border:"2px solid "+p.color,background:"#FFFFFF",display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <div style={{width:4,height:4,borderRadius:"50%",background:p.color}}/>
                          </div>
                          <div style={{background:"#FFFFFF",border:"1px solid #E2E8F0",borderLeft:"3px solid "+p.color,borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:9,color:ar.accent,marginBottom:2,fontWeight:600}}>{ar.icon} {ar.label}</div>
                              <div style={{fontSize:11,fontWeight:600,color:"#0F172A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.topic}</div>
                            </div>
                            <Tag p={p} text={it.tag}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            }
          </div>
        )}
      </div>
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
      var last = data.reduce(function(m, i) { return Math.max(m, i.updatedAt||0); }, 0);
      if (last) setTs(last);
      setLoading(false);
    });
  }, []);

  useEffect(function() {
    if (view !== "head") return;
    if (supabase) {
      var sub = supabase.channel("items-changes")
        .on("postgres_changes", { event:"*", schema:"public", table:"items" }, function() {
          loadItems().then(function(data) {
            setItems(data);
            var last = data.reduce(function(m, i) { return Math.max(m, i.updatedAt||0); }, 0);
            if (last) setTs(last);
          });
        }).subscribe();
      return function() { supabase.removeChannel(sub); };
    } else {
      var t = setInterval(function() {
        loadItems().then(function(data) {
          setItems(data);
          var last = data.reduce(function(m, i) { return Math.max(m, i.updatedAt||0); }, 0);
          if (last) setTs(last);
        });
      }, 3000);
      return function() { clearInterval(t); };
    }
  }, [view]);

  async function doSave(it) {
    await upsertItem(it);
    setItems(function(prev) {
      var idx = prev.findIndex(function(i) { return i.id === it.id; });
      return idx >= 0 ? prev.map(function(i) { return i.id===it.id?it:i; }) : [...prev, it];
    });
    setTs(it.updatedAt);
  }

  async function doDel(id) {
    await deleteItem(id);
    setItems(function(prev) { return prev.filter(function(i) { return i.id !== id; }); });
  }

  if (loading) {
    return (
      <div style={{minHeight:"100vh",background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{padding:"8px 20px",border:"2px solid #0F172A",borderRadius:4,display:"inline-block",marginBottom:16}}>
            <span style={{fontFamily:"'Orbitron',monospace",fontSize:16,fontWeight:900,letterSpacing:".4em",color:"#0F172A"}}>EFATHA</span>
          </div>
          <div style={{fontSize:10,color:"#94A3B8",letterSpacing:".1em"}}>CARREGANDO...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#F1F5F9"}}>
      <style>{css}</style>
      {view==="home" && <Home onArea={function(id) { setArea(id); setView("area"); }} onHead={function() { setView("head"); }}/>}
      {view==="area" && <AreaView areaId={area} items={items} onSave={doSave} onDelete={doDel} onBack={function() { setView("home"); }}/>}
      {view==="head" && <Head items={items} ts={ts} onBack={function() { setView("home"); }}/>}
    </div>
  );
}
