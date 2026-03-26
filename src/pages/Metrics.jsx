import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Activity, Users, Map, Tv, Flame, Target, Compass, Sparkles, AlertTriangle, CheckCircle, Brain, Eye } from 'lucide-react';
import './Metrics.css';

const Metrics = () => {
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [projRes, chanRes, avRes, sceRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('channels').select('*'),
        supabase.from('avatars').select('*'),
        supabase.from('scenarios').select('*')
      ]);
      setProjects(projRes.data || []);
      setChannels(chanRes.data || []);
      setAvatars(avRes.data || []);
      setScenarios(sceRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div style={{padding:'2rem', color:'white'}}>Cargando Analíticas...</div>;

  // 1. MACRO METRICS (CHANNELS & PROJECTS)
  const totalViews = channels.reduce((acc, c) => {
    let mt = typeof c.metrics === 'string' ? JSON.parse(c.metrics) : (c.metrics || {});
    return acc + (mt?.views || 0);
  }, 0);
  const totalSubs = channels.reduce((acc, c) => {
    let mt = typeof c.metrics === 'string' ? JSON.parse(c.metrics) : (c.metrics || {});
    return acc + (mt?.subs || 0);
  }, 0);
  const totalFinishedProjects = projects.filter(p => (p.status||'').toLowerCase() === 'finalizado').length;
  const projectCompletionRate = projects.length > 0 ? Math.round((totalFinishedProjects / projects.length) * 100) : 0;

  // HEURISTIC ENGINE: TikTok Short-form Rules Evaluator
  const getCharacterInsights = (char) => {
    let strengths = [];
    let weaknesses = [];
    let score = 50;

    // Rules
    if (char.catchphrases && char.catchphrases.length > 5) {
      strengths.push("Posee muletillas definidas. Fuerte Hook algorítmico.");
      score += 20;
    } else {
      weaknesses.push("Riesgo de Swipe: Carece de anclajes verbales/muletillas fuertes.");
      score -= 10;
    }

    const persLower = (char.personality || '').toLowerCase();
    const boringWords = ['tranquilo', 'normal', 'amable', 'neutral', 'pasivo'];
    if (boringWords.some(w => persLower.includes(w))) {
      weaknesses.push("Personalidad demasiado neutra. Añade un rasgo polarizador extremo.");
      score -= 15;
    } else {
      strengths.push("Perfil polarizante detectado. Buen material para generar comentarios.");
      score += 15;
    }

    if (char.clothing && char.clothing.length > 5 && char.visualPrompt && char.visualPrompt.length > 5) {
       score += 15;
    } else {
       weaknesses.push("Falta consistencia visual inmutable (Ropa/Cara muy breves).");
    }

    // Projects Data
    const charProjects = projects.filter(p => {
      let ids = Array.isArray(p.character_ids) ? p.character_ids : (typeof p.character_ids==='string'?JSON.parse(p.character_ids||'[]'):[]);
      return ids.includes(char.id);
    });

    const viewsGenerated = charProjects.reduce((acc, p) => {
      let m = typeof p.metrics === 'string' ? JSON.parse(p.metrics) : (p.metrics || {views:0});
      return acc + (m.views || 0);
    }, 0);

    let label = "Estable";
    if (viewsGenerated > 10000 && score > 60) label = "🚀 Imán de Retención";
    else if (viewsGenerated > 5000) label = "⭐ Estrella Rentable";
    else if (charProjects.length > 3 && viewsGenerated < 1000) label = "⚠️ Riesgo de Desgaste (Fatiga)";
    else if (score < 50) label = "🔄 Necesita Rework Visual";

    return { strengths, weaknesses, score: Math.min(100, Math.max(0, score)), label, viewsResult: viewsGenerated, projCount: charProjects.length };
  };

  const getScenarioInsights = (sce) => {
    let strengths = [];
    let weaknesses = [];
    
    const eraLower = (sce.era || '').toLowerCase();
    const highContrastEras = ['cyberpunk', 'espacial', 'distópico', 'neón', 'guerra', 'imperio', 'medieval', 'antiguo egipto'];
    if (highContrastEras.some(w => eraLower.includes(w))) {
      strengths.push("Entorno de Alto Contraste: Retiene bien la atención visual.");
    } else {
      weaknesses.push("Entorno potencialmente soso. Sugerencia de prompt: Añade iluminación dramática o props agresivos.");
    }

    const sceProjects = projects.filter(p => {
      let ids = Array.isArray(p.scenario_ids) ? p.scenario_ids : (typeof p.scenario_ids==='string'?JSON.parse(p.scenario_ids||'[]'):[]);
      return ids.includes(sce.id);
    });

    const viewsGenerated = sceProjects.reduce((acc, p) => {
      let m = typeof p.metrics === 'string' ? JSON.parse(p.metrics) : (p.metrics || {views:0});
      return acc + (m.views || 0);
    }, 0);

    return { strengths, weaknesses, projCount: sceProjects.length, viewsResult: viewsGenerated };
  };

  // Compile data
  const charData = avatars.map(c => ({...c, insights: getCharacterInsights(c)})).sort((a,b) => b.insights.viewsResult - a.insights.viewsResult);
  const sceData = scenarios.map(s => ({...s, insights: getScenarioInsights(s)})).sort((a,b) => b.insights.viewsResult - a.insights.viewsResult);

  return (
    <div className="metrics-page animation-fade-in">
      <header className="metrics-header">
        <div>
          <h1><Brain className="icon-gold" size={28} /> Inteligencia y Algoritmo</h1>
          <p>Motor heurístico de retención, engagement de TikTok y KPIs del ecosistema.</p>
        </div>
      </header>

      {/* MACRO KPIS */}
      <section className="macro-kpis">
         <div className="kpi-card glass-panel" style={{borderBottom:'4px solid #38bdf8'}}>
           <div className="kpi-icon blue"><Tv /></div>
           <div className="kpi-info">
             <span className="kpi-val">{(totalViews/1000).toFixed(1)}k</span>
             <span className="kpi-lbl">Visualizaciones Globales</span>
           </div>
         </div>
         <div className="kpi-card glass-panel" style={{borderBottom:'4px solid var(--primary-color)'}}>
           <div className="kpi-icon orange"><Users /></div>
           <div className="kpi-info">
             <span className="kpi-val">{(totalSubs/1000).toFixed(1)}k</span>
             <span className="kpi-lbl">Comunidad Total</span>
           </div>
         </div>
         <div className="kpi-card glass-panel" style={{borderBottom:'4px solid var(--green-color)'}}>
           <div className="kpi-icon green"><CheckCircle /></div>
           <div className="kpi-info">
             <span className="kpi-val">{projectCompletionRate}%</span>
             <span className="kpi-lbl">Tasa de Finalización de Pipeline</span>
             <div className="progress-bar-container"><div className="progress-bar-fill green " style={{width: `${projectCompletionRate}%`}}></div></div>
           </div>
         </div>
         <div className="kpi-card glass-panel" style={{borderBottom:'4px solid var(--gold-color)'}}>
           <div className="kpi-icon gold"><Activity /></div>
           <div className="kpi-info">
             <span className="kpi-val">{avatars.length} / {scenarios.length}</span>
             <span className="kpi-lbl">Actores / Sets Activos</span>
           </div>
         </div>
      </section>

      <div className="metrics-grid">
        {/* CHARACTERS INSIGHTS */}
        <section className="insight-section">
          <h2><Users className="icon-primary" size={20}/> Casting: Patrones de Retención</h2>
          <div className="insight-list">
            {charData.map(c => (
              <div key={c.id} className="insight-card glass-panel">
                <div className="insight-card-head">
                   <img src={c.profileImage || '/placeholder.jpg'} alt="av"/>
                   <div className="head-text">
                     <h3>{c.name}</h3>
                     <span className={`algo-label ${c.insights.score >= 70 ? 'good' : (c.insights.score < 50 ? 'bad' : 'warn')}`}>
                       {c.insights.label}
                     </span>
                   </div>
                   <div className="head-metrics">
                      <span><Eye size={12}/> {c.insights.viewsResult} v</span>
                      <span><Activity size={12}/> {c.insights.projCount} p</span>
                   </div>
                </div>
                <div className="insight-body">
                   <div className="algo-score-bar">
                     <span className="algo-score-lbl">Algorithmic Score (Visibilidad IA): {c.insights.score}%</span>
                     <div className="progress-bar-container"><div className="progress-bar-fill gold" style={{width: `${c.insights.score}%`}}></div></div>
                   </div>
                   <div className="feedback-lists">
                      {c.insights.strengths.length > 0 && (
                        <div className="f-list">
                           <span style={{color:'var(--green-color)', fontWeight:'bold', fontSize:'0.8rem'}}>Fuerzas:</span>
                           {c.insights.strengths.map((s,i) => <p key={i}><CheckCircle size={10} color="var(--green-color)"/> {s}</p>)}
                        </div>
                      )}
                      {c.insights.weaknesses.length > 0 && (
                        <div className="f-list">
                           <span style={{color:'var(--danger-color)', fontWeight:'bold', fontSize:'0.8rem'}}>Riesgos (Swipe):</span>
                           {c.insights.weaknesses.map((s,i) => <p key={i}><AlertTriangle size={10} color="var(--danger-color)"/> {s}</p>)}
                        </div>
                      )}
                   </div>
                </div>
              </div>
            ))}
            {charData.length === 0 && <p className="no-data">Sin metadatos de actores.</p>}
          </div>
        </section>

        {/* SCENARIOS INSIGHTS */}
        <section className="insight-section">
          <h2><Map className="icon-blue" size={20}/> Locations: Engagement</h2>
          <div className="insight-list">
            {sceData.map(s => (
              <div key={s.id} className="insight-card glass-panel">
                 <div className="insight-card-head">
                   <img src={s.coverUrl || '/placeholder.jpg'} alt="sc"/>
                   <div className="head-text">
                     <h3>{s.name}</h3>
                     <span style={{fontSize:'0.75rem', color:'var(--text-secondary)'}}>{s.era}</span>
                   </div>
                   <div className="head-metrics">
                      <span><Eye size={12}/> {s.insights.viewsResult} v</span>
                      <span><Activity size={12}/> {s.insights.projCount} p</span>
                   </div>
                </div>
                <div className="insight-body">
                   <div className="feedback-lists">
                      {s.insights.strengths.length > 0 && (
                        <div className="f-list">
                           <span style={{color:'var(--green-color)', fontWeight:'bold', fontSize:'0.8rem'}}>Fuerzas Ambientales:</span>
                           {s.insights.strengths.map((st,i) => <p key={i}><CheckCircle size={10} color="var(--green-color)"/> {st}</p>)}
                        </div>
                      )}
                      {s.insights.weaknesses.length > 0 && (
                        <div className="f-list">
                           <span style={{color:'var(--gold-color)', fontWeight:'bold', fontSize:'0.8rem'}}>Avisos Estéticos:</span>
                           {s.insights.weaknesses.map((w,i) => <p key={i}><Flame size={10} color="var(--gold-color)"/> {w}</p>)}
                        </div>
                      )}
                   </div>
                </div>
              </div>
            ))}
            {sceData.length === 0 && <p className="no-data">Sin metadatos de locaciones.</p>}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Metrics;
