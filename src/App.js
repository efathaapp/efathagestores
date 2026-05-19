import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const LOGO_NEX    = "data:image/png;base64,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";

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
  var updated_at = item.updatedAt;
  var row = { id: item.id, area: item.area, topic: item.topic, priority: item.priority, tag: item.tag, responsible: item.responsible, updated_at: updated_at };
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
