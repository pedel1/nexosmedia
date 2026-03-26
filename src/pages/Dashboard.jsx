import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Video, BookOpen, Scissors, Eye, CheckCircle, Bell, AlertTriangle, PlayCircle, Users, Tv, Compass, Sparkles, Activity, Flame, Star, Target } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [avatars, setAvatars] = useState([]);

  useEffect(() => {
    supabase.from('projects').select('*').then(({data}) => setProjects(data || []));
    supabase.from('channels').select('*').then(({data}) => setChannels(data || []));
    supabase.from('avatars').select('*').then(({data}) => setAvatars(data || []));
  }, []);

  // Compute Funnel
  const funnel = {
    guion: projects.filter(p => (p.status || '').toLowerCase() === 'guión'),
    edicion: projects.filter(p => (p.status || '').toLowerCase() === 'edición'),
    revision: projects.filter(p => (p.status || '').toLowerCase() === 'revisión'),
    finalizado: projects.filter(p => (p.status || '').toLowerCase() === 'finalizado')
  };

  // Generate Smart Reminders
  const generateReminders = () => {
    const alerts = [];
    
    // Check High Priority projects first
    projects.filter(p => p.priority === 'Alta' && (p.status || '').toLowerCase() !== 'finalizado').forEach(p => {
        alerts.push({ id: `hipri-${p.id}`, type: 'warning', text: `Prioridad Alta: El proyecto "${p.title}" requiere de tu atención prioritaria.`, icon: <Flame size={16}/>, action: 'Ver Proyecto' });
    });

    // Check missing scripts in Guion stage
    funnel.guion.forEach(p => {
      if (!p.script || p.script.length < 10) {
        alerts.push({ id: `script-${p.id}`, type: 'action', text: `Pendiente de Guion: Abre "${p.title}" y añade el texto base.`, icon: <BookOpen size={16}/>, action: 'Ir a Proyectos' });
      }
    });

    // Check missing videos in Edicion stage
    funnel.edicion.forEach(p => {
      if (!p.videoUrl) {
        alerts.push({ id: `vid-${p.id}`, type: 'action', text: `Montaje Pendiente: Sube el metraje final para "${p.title}".`, icon: <Scissors size={16}/>, action: 'Editar' });
      }
    });

    if (alerts.length === 0 && projects.length > 0) {
      alerts.push({ id: 'all-good', type: 'success', text: `¡Todo al día! Buen trabajo gestionando la línea temporal.`, icon: <Sparkles size={16}/> });
    }

    // Only keep top 5
    const uniqueAlerts = Array.from(new Map(alerts.map(item => [item.id, item])).values());
    return uniqueAlerts.slice(0, 5); 
  };

  const reminders = generateReminders();
  
  // Total Network Metrics
  const totalSubs = channels.reduce((acc, c) => {
    let mt = typeof c.metrics === 'string' ? JSON.parse(c.metrics) : (c.metrics || {});
    return acc + (mt?.subs || 0);
  }, 0);
  
  const totalViews = channels.reduce((acc, c) => {
    let mt = typeof c.metrics === 'string' ? JSON.parse(c.metrics) : (c.metrics || {});
    return acc + (mt?.views || 0);
  }, 0);

  // Compute Top Characters
  const charactersWithMetrics = avatars.map(av => {
    const charProjects = projects.filter(p => {
      let ids = Array.isArray(p.character_ids) ? p.character_ids : (typeof p.character_ids==='string'?JSON.parse(p.character_ids||'[]'):[]);
      return ids.includes(av.id);
    });
    const tViews = charProjects.reduce((acc, p) => {
      let m = typeof p.metrics === 'string' ? JSON.parse(p.metrics) : (p.metrics || {views:0});
      return acc + (m.views || 0);
    }, 0);
    return { ...av, tViews };
  });
  const topCharacters = charactersWithMetrics.filter(c => c.tViews > 0).sort((a,b) => b.tViews - a.tViews).slice(0, 5);

  return (
    <div className="dashboard animation-fade-in">
      <header className="top-bar">
        <div className="top-bar-content">
          <h1>Centro de Control</h1>
          <p className="subtitle" style={{color: 'var(--text-secondary)'}}>
            Buenos días. Tienes {funnel.guion.length + funnel.edicion.length} producciones activas en curso.
          </p>
        </div>
        <div className="top-bar-actions">
          <button className="btn-primary" onClick={() => navigate('/proyectos')}>
            <PlayCircle size={18} />
            Entrar a la Sala de Montaje
          </button>
        </div>
      </header>

      {/* ---------- PRIORITY RADAR (Fase 19) ---------- */}
      <h2 className="dashboard-section-title"><Target size={20} className="icon-blue" /> Radar de Prioridades</h2>
      <div style={{display:'flex', gap:'1.5rem', marginBottom:'2rem', flexWrap:'wrap'}}>
        <div className="glass-panel" style={{flex:1, minWidth: '250px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.5rem', borderLeft:'4px solid var(--danger-color)'}}>
          <div>
             <h3 style={{margin:0, color:'var(--danger-color)', display:'flex', alignItems:'center', gap:'0.5rem'}}><Flame size={18}/> Alta Prioridad (Urgente)</h3>
             <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin:'0.5rem 0 0 0'}}>Requieren atención inmediata.</p>
          </div>
          <span style={{fontSize:'2.5rem', fontWeight:'bold', color:'var(--danger-color)'}}>{projects.filter(p => p.priority === 'Alta' && p.status !== 'Finalizado').length}</span>
        </div>
        
        <div className="glass-panel" style={{flex:1, minWidth: '250px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.5rem', borderLeft:'4px solid var(--gold-color)'}}>
          <div>
             <h3 style={{margin:0, color:'var(--gold-color)', display:'flex', alignItems:'center', gap:'0.5rem'}}><Target size={18}/> Prioridad Media</h3>
             <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin:'0.5rem 0 0 0'}}>Línea temporal estable.</p>
          </div>
          <span style={{fontSize:'2.5rem', fontWeight:'bold', color:'var(--gold-color)'}}>{projects.filter(p => p.priority === 'Media' && p.status !== 'Finalizado').length}</span>
        </div>

        <div className="glass-panel" style={{flex:1, minWidth: '250px', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.5rem', borderLeft:'4px solid #38bdf8'}}>
          <div>
             <h3 style={{margin:0, color:'#38bdf8', display:'flex', alignItems:'center', gap:'0.5rem'}}><Compass size={18}/> Prioridad Baja</h3>
             <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', margin:'0.5rem 0 0 0'}}>Guiones a fuego lento.</p>
          </div>
          <span style={{fontSize:'2.5rem', fontWeight:'bold', color:'#38bdf8'}}>{projects.filter(p => p.priority === 'Baja' && p.status !== 'Finalizado').length}</span>
        </div>
      </div>

      {/* Production Funnel (Kanban Style Stats) */}
      <h2 className="dashboard-section-title"><Activity size={20} className="icon-orange" /> Embudo de Producción</h2>
      <div className="funnel-grid">
        <div className="funnel-card guion">
          <div className="funnel-icon"><BookOpen size={24}/></div>
          <div className="funnel-info">
            <span className="funnel-count">{funnel.guion.length}</span>
            <span className="funnel-label">En Guionización</span>
          </div>
        </div>
        <div className="funnel-card edicion">
          <div className="funnel-icon"><Scissors size={24}/></div>
          <div className="funnel-info">
            <span className="funnel-count">{funnel.edicion.length}</span>
            <span className="funnel-label">En Edición (AI/Montaje)</span>
          </div>
        </div>
        <div className="funnel-card revision">
          <div className="funnel-icon"><Eye size={24}/></div>
          <div className="funnel-info">
            <span className="funnel-count">{funnel.revision.length}</span>
            <span className="funnel-label">Pendientes de Revisión</span>
          </div>
        </div>
        <div className="funnel-card finalizado">
          <div className="funnel-icon"><CheckCircle size={24}/></div>
          <div className="funnel-info">
            <span className="funnel-count">{funnel.finalizado.length}</span>
            <span className="funnel-label">Videos Finalizados</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        {/* Left Column: Reminders / Action Items */}
        <div className="dashboard-col">
          <h2 className="dashboard-section-title"><Bell size={20} className="icon-orange" /> Tareas del Día (Action Items)</h2>
          <div className="reminders-list glass-panel">
            {reminders.map(r => (
              <div key={r.id} className={`reminder-item type-${r.type}`}>
                <div className="reminder-icon">{r.icon}</div>
                <div className="reminder-content">
                  <p>{r.text}</p>
                </div>
                {r.action && (
                  <button className="reminder-btn" onClick={() => navigate('/proyectos')}>
                    {r.action}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="network-summary glass-panel" style={{marginBottom:'1.5rem'}}>
            <h3 style={{marginBottom:'1rem', fontSize:'1rem', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <Tv size={18} className="icon-blue"/> Vista de la Red de Canales
            </h3>
            <div className="network-stats-row">
              <div className="net-stat">
                <span className="net-val">{channels.length}</span>
                <span className="net-lbl">Canales Activos</span>
              </div>
              <div className="net-stat">
                <span className="net-val">{avatars.length}</span>
                <span className="net-lbl">Avatares Creados</span>
              </div>
              <div className="net-stat">
                <span className="net-val">{(totalViews/1000).toFixed(1)}k</span>
                <span className="net-lbl">Visualizaciones Totales</span>
              </div>
            </div>
          </div>

          {/* Nuevo Panel de Estrellas del Multiverso (Fase 17) */}
          <div className="network-summary glass-panel" style={{border:'1px solid var(--primary-color)'}}>
            <h3 style={{marginBottom:'1rem', fontSize:'1rem', color:'var(--text-primary)', display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <Star size={18} className="icon-orange" fill="var(--primary-color)"/> Estrellas del Multiverso (Top Actores)
            </h3>
            <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
               {topCharacters.length === 0 ? (
                 <p className="no-data">Sin métricas registradas en los proyectos.</p>
               ) : (
                 topCharacters.map((char, i) => (
                   <div key={char.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-background)', padding:'0.5rem 1rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                        <span style={{color: i===0?'var(--gold-color)':'var(--text-muted)', fontWeight:'bold', fontSize:'1.2rem'}}>{i+1}</span>
                        <img src={char.profileImage||'/placeholder.jpg'} alt="c" style={{width:'32px', height:'32px', borderRadius:'50%', objectFit:'cover'}}/>
                        <span style={{fontSize:'0.95rem', fontWeight:'500'}}>{char.name}</span>
                      </div>
                      <span style={{fontSize:'0.9rem', color:'var(--green-color)', fontWeight:'bold'}}>{(char.tViews/1000).toFixed(1)}k <Eye size={12} style={{display:'inline'}}/></span>
                   </div>
                 ))
               )}
            </div>
          </div>

        </div>

        {/* Right Column: Active Roadmap / Calendar Approximation */}
        <div className="dashboard-col">
          <h2 className="dashboard-section-title"><Compass size={20} className="icon-orange" /> Roadmap de Contenidos Activo</h2>
          <div className="roadmap-panel glass-panel">
            {projects.length === 0 ? (
              <p className="no-data" style={{padding:'2rem', textAlign:'center'}}>
                Aún no hay expediciones en el mapa temporal.
              </p>
            ) : (
              <div className="timeline">
                {[...funnel.guion, ...funnel.edicion, ...funnel.revision]
                  .sort((a,b) => (a.priority==='Alta' ? -1 : (b.priority==='Alta' ? 1 : 0)))
                  .slice(0, 5)
                  .map((p, idx) => (
                  <div key={p.id} className={`timeline-item status-${(p.status || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <h4>{p.priority === 'Alta' && <Flame size={14} color="var(--danger-color)" style={{display:'inline', marginRight:'0.3rem'}}/>}{p.title}</h4>
                        <span className="timeline-tag">{p.status}</span>
                      </div>
                      <p className="timeline-meta" style={{display:'flex', gap:'0.5rem', alignItems:'center'}}>
                         {p.priority === 'Alta' && <span style={{fontSize:'0.7rem', background:'rgba(239, 68, 68, 0.2)', color:'var(--danger-color)', padding:'2px 6px', borderRadius:'10px', fontWeight:'bold'}}>Alta Prioridad</span>}
                         <span style={{color:'var(--primary-color)'}}>{p.historicalEra || 'Destino Desconocido'}</span>
                      </p>
                      <div className="timeline-cast" style={{marginTop:'0.5rem'}}>
                        {p.character_ids && (Array.isArray(p.character_ids) ? p.character_ids : JSON.parse(p.character_ids || '[]')).map(avId => {
                          const av = avatars.find(a => a.id === avId);
                          return av ? <img key={avId} src={av.profileImage || '/placeholder.jpg'} title={av.name} alt="av"/> : null;
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
