import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;


const AREAS = [
  { id:"comercial",  label:"Comercial",          icon:"📊", accent:"#1255A0", bg:"#E8F0FC", bd:"#A2C0F0" },
  { id:"logistica",  label:"Logística",           icon:"🚚", accent:"#7B3F00", bg:"#FEF0E2", bd:"#F5C07A" },
  { id:"rh",         label:"Recursos Humanos",    icon:"👥", accent:"#5B1A8A", bg:"#F3E8FD", bd:"#C9A6F0" },
  { id:"operacoes",  label:"Operações / Técnica", icon:"⚙️", accent:"#005C8A", bg:"#DDF0FA", bd:"#8ECAE6" },
  { id:"obras",      label:"Comercial / Obras",   icon:"🏗️", accent:"#145E32", bg:"#E6F5EE", bd:"#8ED4AC" },
  { id:"financeiro", label:"Financeiro CSC",      icon:"💰", accent:"#7C3A09", bg:"#FEF3E2", bd:"#F5C07A" },
  { id:"compras",    label:"Compras CSC",         icon:"🛒", accent:"#1E3A5F", bg:"#EBF3FB", bd:"#8ECAE6" },
  { id:"vistoria",   label:"Vistoria / Obras",    icon:"🔍", accent:"#8B1A1A", bg:"#FDECEA", bd:"#F4ADA7" },
  { id:"juridico",   label:"Jurídico",            icon:"⚖️", accent:"#374151", bg:"#F3F4F6", bd:"#9CA3AF" },
];

const PRI = [
  { id:"critico",    label:"Crítico",       color:"#B91C1C", bg:"#FEE2E2", bd:"#FCA5A5", dot:"🔴" },
  { id:"andamento",  label:"Em andamento",  color:"#92400E", bg:"#FEF3C7", bd:"#FCD34D", dot:"🟡" },
  { id:"aguardando", label:"Aguardando",    color:"#1E40AF", bg:"#DBEAFE", bd:"#93C5FD", dot:"🔵" },
  { id:"concluido",  label:"Concluído",     color:"#14532D", bg:"#DCFCE7", bd:"#86EFAC", dot:"🟢" },
];

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
  const row = { ...item, updated_at: item.updatedAt };
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

const css = "*{box-sizing:border-box;margin:0;padding:0}body{font-family:'IBM Plex Mono','Courier New',monospace;background:#EDF2F7;color:#0D1B2A;font-size:12px}.orb{font-family:'Orbitron',Arial,monospace;letter-spacing:.04em}button{cursor:pointer;font-family:inherit;font-size:11px}input{font-family:inherit;font-size:12px;outline:none}.blink{animation:bk .9s step-end infinite}@keyframes bk{50%{opacity:.2}}.scale:hover{transform:scale(1.02);transition:.15s}";

function AllLogos() {
  var names = ["EFATHA","MAKTUB","ROCKET IT","NEX"];
  return (
    <div style={{display:"flex",alignItems:"center",gap:0,background:"#F5F8FC",border:"1px solid #D0DCE8",borderRadius:5,padding:"5px 12px"}}>
      {names.map(function(n, i) {
        return (
          <div key={n} style={{display:"flex",alignItems:"center",gap:0}}>
            <span style={{fontFamily:"'Courier New',monospace",fontSize:10,fontWeight:600,letterSpacing:".08em",color:"#1E3A5F",whiteSpace:"nowrap",padding:"0 8px"}}>{n}</span>
            {i < names.length - 1 && <div style={{width:1,height:14,background:"#D0DCE8",flexShrink:0}}/>}
          </div>
        );
      })}
    </div>
  );
}

function HomeLogos() {
  var names = ["EFATHA","MAKTUB","ROCKET IT","NEX"];
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:0,padding:"10px 0",borderTop:"1px solid #E2EAF2"}}>
      {names.map(function(n, i) {
        return (
          <div key={n} style={{display:"flex",alignItems:"center",gap:0}}>
            <span style={{fontFamily:"'Courier New',monospace",fontSize:10,fontWeight:600,letterSpacing:".08em",color:"#1E3A5F",padding:"0 10px"}}>{n}</span>
            {i < names.length - 1 && <div style={{width:1,height:14,background:"#D0DCE8",flexShrink:0}}/>}
          </div>
        );
      })}
    </div>
  );
}

function Tag(props) {
  var p = props.p;
  return (
    <span style={{display:"inline-flex",alignItems:"center",fontSize:10,fontWeight:500,padding:"2px 7px",borderRadius:3,border:"1px solid "+p.bd,background:p.bg,color:p.color,whiteSpace:"nowrap"}}>
      {props.text}
    </span>
  );
}

function Btn(props) {
  var bg = props.bg || "#F5F8FC";
  var color = props.color || "#4A6278";
  var bd = props.bd || "#D0DCE8";
  var style = props.style || {};
  return (
    <button onClick={props.onClick} style={{background:bg,color:color,border:"1px solid "+bd,borderRadius:4,padding:"7px 14px",fontWeight:500,...style}}>
      {props.children}
    </button>
  );
}

function Home(props) {
  return (
    <div style={{maxWidth:480,margin:"0 auto",padding:"20px 14px"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontFamily:"'Courier New',monospace",fontSize:20,fontWeight:200,letterSpacing:".35em",color:"#1a2035",marginBottom:10,padding:"4px 14px",border:"1.5px solid #1a2035",borderRadius:3,display:"inline-block"}}>EFATHA</div>
        <div style={{fontSize:9,color:"#7A94A8",letterSpacing:".06em"}}>PAINEL DE GESTÃO · SELECIONE SUA ÁREA</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {AREAS.map(function(a) {
          return (
            <button key={a.id} className="scale" onClick={function() { props.onArea(a.id); }}
              style={{background:a.bg,border:"1px solid "+a.bd,borderRadius:5,padding:"10px 8px",textAlign:"left"}}>
              <div style={{fontSize:16,marginBottom:3}}>{a.icon}</div>
              <div style={{fontSize:10,fontWeight:500,color:a.accent,lineHeight:1.3}}>{a.label}</div>
            </button>
          );
        })}
      </div>

      <button onClick={props.onHead} className="scale"
        style={{width:"100%",background:"#1E3A5F",border:"none",borderRadius:5,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>📊</span>
          <div style={{textAlign:"left"}}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:10,fontWeight:700,color:"#fff",letterSpacing:".06em"}}>DASHBOARD HEAD</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.6)",marginTop:2}}>Visão completa de todas as áreas</div>
          </div>
        </div>
        <span style={{color:"rgba(255,255,255,.7)",fontSize:16}}>→</span>
      </button>

      <HomeLogos/>
    </div>
  );
}

function Form(props) {
  var areaId = props.areaId;
  var item = props.item;
  const [topic, setTopic] = useState(item ? item.topic : "");
  const [pri, setPri] = useState(item ? item.priority : "andamento");
  const [tag, setTag] = useState(item ? item.tag : "");
  const [resp, setResp] = useState(item ? item.responsible : "");
  var a = getA(areaId);

  function doSave() {
    if (!topic.trim()) return;
    props.onSave({ id: item ? item.id : uid(), area: areaId, topic: topic.trim(), priority: pri, tag: tag.trim(), responsible: resp.trim(), updatedAt: Date.now() });
  }

  return (
    <div style={{background:"#fff",border:"2px solid "+a.bd,borderRadius:8,padding:16,margin:"8px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span className="orb" style={{fontSize:10,fontWeight:700,color:a.accent}}>{item ? "EDITAR TEMA" : "NOVO TEMA"}</span>
        <Btn onClick={props.onCancel} style={{padding:"3px 10px"}}>✕</Btn>
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:9,color:"#7A94A8",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Tema / Projeto *</div>
        <input value={topic} onChange={function(e) { setTopic(e.target.value); }} placeholder="Ex: Contrato Rocket IT"
          style={{width:"100%",padding:"8px 10px",border:"1px solid #D0DCE8",borderRadius:4,background:"#F5F8FC",color:"#0D1B2A"}}/>
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:9,color:"#7A94A8",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>Prioridade</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:5}}>
          {PRI.map(function(p) {
            return (
              <button key={p.id} onClick={function() { setPri(p.id); }}
                style={{background:p.bg,border:"1px solid "+p.bd,borderRadius:3,padding:"7px 6px",fontSize:10,fontWeight:500,color:p.color,opacity:pri===p.id?1:.4}}>
                {p.dot} {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div>
          <div style={{fontSize:9,color:"#7A94A8",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Prazo / Status</div>
          <input value={tag} onChange={function(e) { setTag(e.target.value); }} placeholder="Ex: ATÉ 15/05"
            style={{width:"100%",padding:"7px 10px",border:"1px solid #D0DCE8",borderRadius:4,background:"#F5F8FC",color:"#0D1B2A"}}/>
        </div>
        <div>
          <div style={{fontSize:9,color:"#7A94A8",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>Responsável</div>
          <input value={resp} onChange={function(e) { setResp(e.target.value); }} placeholder="Ex: Cris"
            style={{width:"100%",padding:"7px 10px",border:"1px solid #D0DCE8",borderRadius:4,background:"#F5F8FC",color:"#0D1B2A"}}/>
        </div>
      </div>
      <Btn onClick={doSave} bg={a.accent} color="#fff" bd={a.accent} style={{width:"100%",padding:10,fontSize:12}}>
        {item ? "Salvar ✓" : "Adicionar tema ✓"}
      </Btn>
    </div>
  );
}

function AreaView(props) {
  var areaId = props.areaId;
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  var a = getA(areaId);
  var ord = {critico:0,andamento:1,aguardando:2,concluido:3};
  var mine = props.items.filter(function(i) { return i.area === areaId; }).sort(function(x,y) { return (ord[x.priority]||2)-(ord[y.priority]||2); });

  function doSave(it) { props.onSave(it); setShowForm(false); setEditing(null); }

  return (
    <div style={{maxWidth:480,margin:"0 auto",padding:14}}>
      <div style={{background:a.bg,border:"1px solid "+a.bd,borderRadius:6,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <Btn onClick={props.onBack} style={{padding:"4px 10px",flexShrink:0}}>←</Btn>
        <span style={{fontSize:20}}>{a.icon}</span>
        <div>
          <div className="orb" style={{fontSize:10,fontWeight:700,color:a.accent}}>{a.label.toUpperCase()}</div>
          <div style={{fontSize:9,color:a.accent,opacity:.7}}>{mine.length} tema{mine.length!==1?"s":""}</div>
        </div>
        <Btn onClick={function() { setEditing(null); setShowForm(!showForm); }} bg={a.accent} color="#fff" bd={a.accent} style={{marginLeft:"auto",padding:"6px 12px"}}>
          {showForm ? "Cancelar" : "+ Novo tema"}
        </Btn>
      </div>

      {showForm && !editing && <Form areaId={areaId} item={null} onSave={doSave} onCancel={function() { setShowForm(false); }}/>}

      {mine.length === 0 && !showForm && (
        <div style={{textAlign:"center",padding:"32px 0",color:"#7A94A8"}}>
          <div style={{fontSize:32,marginBottom:8}}>📋</div>
          <div>Nenhum tema ainda — clique em "+ Novo tema"</div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {mine.map(function(it) {
          var p = getP(it.priority);
          if (editing && editing.id === it.id) {
            return <Form key={it.id} areaId={areaId} item={it} onSave={doSave} onCancel={function() { setEditing(null); }}/>;
          }
          return (
            <div key={it.id} style={{background:"#fff",border:"1px solid #D0DCE8",borderRadius:4,display:"flex",overflow:"hidden"}}>
              <div style={{width:4,background:p.color,flexShrink:0}}/>
              <div style={{flex:1,padding:"9px 10px 9px 12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{fontSize:12,fontWeight:500,color:"#0D1B2A",lineHeight:1.35,flex:1}}>{it.topic}</div>
                  {it.tag && <Tag p={p} text={it.tag}/>}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
                  <div style={{display:"flex",gap:6}}>
                    <span style={{fontSize:9,color:p.color,fontWeight:500}}>{p.dot} {p.label}</span>
                    {it.responsible && <span style={{fontSize:9,color:"#7A94A8"}}>· {it.responsible}</span>}
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <Btn onClick={function() { setEditing(it); }} style={{padding:"2px 8px",fontSize:10}}>✏️</Btn>
                    <Btn onClick={function() { props.onDelete(it.id); }} bg="#FEE2E2" color="#B91C1C" bd="#FCA5A5" style={{padding:"2px 8px",fontSize:10}}>🗑</Btn>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    return Object.assign({}, a, { items: aItems, ct: aItems.length, crit: aItems.filter(function(i) { return i.priority === "critico"; }).length });
  }).filter(function(a) { return a.ct > 0; });
  var crits = items.filter(function(i) { return i.priority === "critico"; });
  var tagged = items.filter(function(i) { return i.tag && i.priority !== "concluido"; }).sort(function(a,b) { return b.updatedAt - a.updatedAt; });
  var TABS = [{id:"geral",l:"Visão Geral"},{id:"areas",l:"Por Área"},{id:"agenda",l:"Agenda"}];
  var kpis = [
    {n:tot,               l:"Total",        c:"#005C8A", bg:"#DDF0FA", bd:"#8ECAE6"},
    {n:byP("critico"),    l:"Crítico ⚠",   c:"#B91C1C", bg:"#FEE2E2", bd:"#FCA5A5"},
    {n:byP("andamento"),  l:"Andamento",    c:"#92400E", bg:"#FEF3C7", bd:"#FCD34D"},
    {n:byP("aguardando"), l:"Aguardando",   c:"#1E40AF", bg:"#DBEAFE", bd:"#93C5FD"},
    {n:byP("concluido"),  l:"Concluído ✓",  c:"#14532D", bg:"#DCFCE7", bd:"#86EFAC"},
  ];

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:14}}>
      <div style={{background:"#fff",border:"1px solid #ABBDCE",borderRadius:6,padding:"10px 14px",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div className="orb" style={{fontSize:10,fontWeight:700,color:"#0D1B2A"}}>PAINEL EXECUTIVO · GESTORES</div>
            <div style={{fontSize:9,color:"#7A94A8"}}>
              {ts ? "Atualizado: " + fmtDate(ts) : "Aguardando dados"} · {tot} tema{tot!==1?"s":""}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <AllLogos/>
            <Btn onClick={props.onBack} style={{padding:"5px 12px",fontSize:11}}>← Voltar</Btn>
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          {TABS.map(function(t) {
            return <Btn key={t.id} onClick={function() { setTab(t.id); }} bg={tab===t.id?"#1E3A5F":"#F5F8FC"} color={tab===t.id?"#fff":"#4A6278"} bd={tab===t.id?"#1E3A5F":"#D0DCE8"} style={{padding:"5px 12px",fontSize:10}}>{t.l}</Btn>;
          })}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
        {kpis.map(function(k, i) {
          return (
            <div key={i} style={{background:k.bg,border:"1px solid "+k.bd,borderRadius:5,padding:"9px 8px",position:"relative"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:k.c,borderRadius:"4px 4px 0 0"}}/>
              <div className="orb" style={{fontSize:22,fontWeight:700,color:k.c,lineHeight:1}}>{k.n}</div>
              <div style={{fontSize:8,color:k.c,marginTop:3,opacity:.85}}>{k.l}</div>
            </div>
          );
        })}
      </div>

      {tab === "geral" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:8,marginBottom:14}}>
            {aStats.map(function(a) {
              return (
                <div key={a.id} style={{background:"#fff",border:"1px solid #D0DCE8",borderLeft:"3px solid "+a.accent,borderRadius:4,padding:"10px 12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:18}}>{a.icon}</span>
                    <span className="orb" style={{fontSize:9,color:a.accent}}>{a.ct}</span>
                  </div>
                  <div style={{fontSize:11,fontWeight:500,color:a.accent,marginBottom:6}}>{a.label}</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {PRI.map(function(p) {
                      var ct = a.items.filter(function(i) { return i.priority === p.id; }).length;
                      if (!ct) return null;
                      return <span key={p.id} style={{fontSize:8,fontWeight:500,padding:"1px 6px",borderRadius:2,border:"1px solid "+p.bd,background:p.bg,color:p.color}}>{p.dot}{ct}</span>;
                    })}
                  </div>
                  {a.crit > 0 && <div className="blink" style={{fontSize:9,color:"#B91C1C",marginTop:5,fontWeight:600}}>⚠ {a.crit} crítico{a.crit>1?"s":""}</div>}
                </div>
              );
            })}
          </div>
          {crits.length > 0 && (
            <div>
              <div style={{fontSize:9,color:"#B91C1C",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8,fontWeight:600}}>⚠ ITENS CRÍTICOS</div>
              {crits.map(function(it) {
                var ar = getA(it.area); var p = getP(it.priority);
                return (
                  <div key={it.id} style={{background:"#fff",border:"1px solid #D0DCE8",borderLeft:"3px solid #B91C1C",borderRadius:4,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:5}}>
                    <div>
                      <div style={{fontSize:10,color:ar.accent,marginBottom:2}}>{ar.icon} {ar.label}</div>
                      <div style={{fontSize:12,fontWeight:500,color:"#0D1B2A"}}>{it.topic}</div>
                      {it.responsible && <div style={{fontSize:9,color:"#7A94A8",marginTop:1}}>{it.responsible}</div>}
                    </div>
                    {it.tag && <Tag p={p} text={it.tag}/>}
                  </div>
                );
              })}
            </div>
          )}
          {tot === 0 && <div style={{textAlign:"center",padding:"40px 0",color:"#7A94A8"}}><div style={{fontSize:36,marginBottom:8}}>📊</div><div>Nenhuma área alimentou dados ainda</div></div>}
        </div>
      )}

      {tab === "areas" && (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {aStats.length === 0 && <div style={{textAlign:"center",padding:"40px 0",color:"#7A94A8"}}>Nenhum dado disponível</div>}
          {aStats.map(function(a) {
            return (
              <div key={a.id} style={{background:"#fff",border:"1px solid #D0DCE8",borderRadius:5,overflow:"hidden"}}>
                <button onClick={function() { setExp(exp===a.id?null:a.id); }}
                  style={{width:"100%",background:a.bg,border:"none",borderBottom:"1px solid "+a.bd,padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18}}>{a.icon}</span>
                    <div style={{textAlign:"left"}}>
                      <div className="orb" style={{fontSize:10,fontWeight:600,color:a.accent}}>{a.label}</div>
                      <div style={{display:"flex",gap:5,marginTop:3}}>
                        {PRI.map(function(p) {
                          var ct = a.items.filter(function(i) { return i.priority === p.id; }).length;
                          if (!ct) return null;
                          return <span key={p.id} style={{fontSize:8,fontWeight:500,padding:"1px 5px",borderRadius:2,border:"1px solid "+p.bd,background:p.bg,color:p.color}}>{p.dot}{ct}</span>;
                        })}
                      </div>
                    </div>
                  </div>
                  <span style={{color:a.accent}}>{exp===a.id?"▲":"▼"}</span>
                </button>
                {exp === a.id && (
                  <div style={{padding:"8px 12px",display:"flex",flexDirection:"column",gap:5}}>
                    {a.items.map(function(it) {
                      var p = getP(it.priority);
                      return (
                        <div key={it.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",background:"#F8FAFC",borderRadius:3,border:"1px solid #D0DCE8"}}>
                          <div style={{width:3,height:28,background:p.color,borderRadius:2,flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:11,fontWeight:500,color:"#0D1B2A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.topic}</div>
                            <div style={{fontSize:9,color:"#7A94A8",marginTop:1}}>{p.dot} {p.label}{it.responsible ? " · " + it.responsible : ""}</div>
                          </div>
                          {it.tag && <Tag p={p} text={it.tag}/>}
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

      {tab === "agenda" && (
        <div>
          {tagged.length === 0
            ? <div style={{textAlign:"center",padding:"40px 0",color:"#7A94A8"}}>Nenhum item com prazo definido</div>
            : (
              <div style={{position:"relative",paddingLeft:22}}>
                <div style={{position:"absolute",left:7,top:4,bottom:4,width:1.5,background:"linear-gradient(to bottom,#005C8A,#D0DCE8)"}}/>
                {tagged.map(function(it) {
                  var p = getP(it.priority); var ar = getA(it.area);
                  return (
                    <div key={it.id} style={{position:"relative",marginBottom:9}}>
                      <div style={{position:"absolute",left:-17,top:5,width:9,height:9,borderRadius:"50%",border:"1.5px solid "+p.color,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <div style={{width:3,height:3,borderRadius:"50%",background:p.color}}/>
                      </div>
                      <div style={{background:"#fff",border:"1px solid #D0DCE8",borderLeft:"2px solid "+p.color,borderRadius:3,padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:10,color:ar.accent,marginBottom:1}}>{ar.icon} {ar.label}</div>
                          <div style={{fontSize:11,fontWeight:500,color:"#0D1B2A",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.topic}</div>
                        </div>
                        <Tag p={p} text={it.tag}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [area, setArea] = useState(null);
  const [items, setItems] = useState([]);
  const [ts, setTs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    loadItems().then(function(data) {
      setItems(data);
      var last = data.reduce(function(m, i) { return Math.max(m, i.updatedAt || 0); }, 0);
      if (last) setTs(last);
      setLoading(false);
    });
  }, []);

  useEffect(function() {
    if (view !== "head") return;
    if (supabase) {
      var sub = supabase.channel("items-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "items" }, function() {
          loadItems().then(function(data) {
            setItems(data);
            var last = data.reduce(function(m, i) { return Math.max(m, i.updatedAt || 0); }, 0);
            if (last) setTs(last);
          });
        }).subscribe();
      return function() { supabase.removeChannel(sub); };
    } else {
      var t = setInterval(function() {
        loadItems().then(function(data) {
          setItems(data);
          var last = data.reduce(function(m, i) { return Math.max(m, i.updatedAt || 0); }, 0);
          if (last) setTs(last);
        });
      }, 20000);
      return function() { clearInterval(t); };
    }
  }, [view]);

  async function doSave(it) {
    await upsertItem(it);
    setItems(function(prev) {
      var idx = prev.findIndex(function(i) { return i.id === it.id; });
      return idx >= 0 ? prev.map(function(i) { return i.id === it.id ? it : i; }) : [...prev, it];
    });
    setTs(it.updatedAt);
  }

  async function doDel(id) {
    await deleteItem(id);
    setItems(function(prev) { return prev.filter(function(i) { return i.id !== id; }); });
  }

  if (loading) {
    return <div style={{textAlign:"center",padding:40,color:"#7A94A8"}}><div style={{fontFamily:"'Orbitron',monospace",fontSize:12}}>CARREGANDO...</div></div>;
  }

  return (
    <div style={{minHeight:"100vh",background:"#EDF2F7"}}>
      <style>{css}</style>
      {view === "home" && <Home onArea={function(id) { setArea(id); setView("area"); }} onHead={function() { setView("head"); }}/>}
      {view === "area" && <AreaView areaId={area} items={items} onSave={doSave} onDelete={doDel} onBack={function() { setView("home"); }}/>}
      {view === "head" && <Head items={items} ts={ts} onBack={function() { setView("home"); }}/>}
    </div>
  );
}
