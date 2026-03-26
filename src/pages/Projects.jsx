import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { uploadFile } from '../supabaseHelpers';
import { Plus, Trash2, MapPin, BookOpen, Edit, Tv, ChevronLeft, FileText, Play, Target, Wand2, Globe, User, AlertTriangle, Flame, Scissors, CheckCircle, MessageCircle, Image, BarChart } from 'lucide-react';
import './Projects.css';

const INITIAL_FORM_STATE = { 
  id: null, title: '', status: 'Guión', priority: 'Media', historicalEra: '', economicTopic: '', 
  script: '', aiInstructions: '', master_prompt_ai: '', cover: null, video: null, channel_id: '', 
  character_ids: [], scenario_ids: [], universe_id: '',
  existingCover: null, existingVideo: null,
  
  // Phase 17 additions
  comments: '',
  content_notes: '',
  ig_stories: [],
  existing_ig_stories: [],
  metrics: { views: 0, likes: 0 }
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [universes, setUniverses] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Guion, 2: Guion IA, 3: Edicion, 4: Revision

  const [openAiKey, setOpenAiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleSaveApiKey = (val) => {
    localStorage.setItem('openai_api_key', val);
    setOpenAiKey(val);
  };

  const generateAI = async () => {
    if (!openAiKey) return alert("Por favor, introduce tu API Key de OpenAI para conectar el cerebro.");
    if (!formData.script) return alert("Primero debes escribir un guion literario en la Fase 1.");
    setIsGeneratingAi(true);
    const targetUniverse = universes.find(u => u.id === formData.universe_id);
    const targetScenarios = scenarios.filter(s => formData.scenario_ids.includes(s.id));
    const targetCharacters = avatars.filter(a => formData.character_ids.includes(a.id));

    let sys = `Eres un "Showrunner" experto y Asistente de Director para videoclips generados por IA hiper-optimizados para TikTok e Instagram Reels. 
TU OBJETIVO INQUEBRANTABLE: Recibir el Guion Literario y escupir un "Master Prompt Técnico" MASIVO, HIPER-DETALLADO Y CINEMATOGRÁFICO, segmentado OBLIGATORIAMENTE en mini-escenas de MÁXIMO 9 SEGUNDOS (Límite visual de IAs como Runway/Sora).
ESTÁ ESTRICTAMENTE PROHIBIDO DEVOLVER PROMPTS CORTOS O RESUMIDOS. Tienes que describir hasta el más mínimo detalle visual, actitudinal y de iluminación. Tienes que tener en cuenta TODO EL CONTEXTO del personaje (su personalidad, su ropa, su forma de ser) y del entorno temporal. NO TE DEJES NINGÚN DATO FUERA.
APLICA LA REGLA DE ORO DE LA RETENCIÓN ALGORTÍMICA:
- Ningún plano debe durar más de 2-3 segundos vacío.
- Los inicios no deben saludar, deben ir directos a un Hook agresivo ("Te están robando", "Mira esto", movimiento lateral brusco).
- Obliga a los personajes a mantener alta proximidad y dinámicas parasitarias (Romper 4º pared, dirigirse al espectador bruscamente).
Para cada escena debes FUSIONAR E INTEGRAR PERFECTAMENTE TODOS los siguientes elementos sin omisión, y exprimir sus características:
`;
    if (targetUniverse) sys += `\n[NÚCLEO 1 - UNIVERSO VISUAL]\n- Atmósfera y Estilo: ${targetUniverse.visualStyle || 'Ninguno'}\n- Tono Narrativo: ${targetUniverse.narrativeTone || 'Ninguno'}\n- Instrucciones Directrices de Cámara: ${targetUniverse.directorPrompt || 'Ninguna'}\n--> El estilo del Universo DEBE dominar la estética visual de cada escena.\n`;
    if (targetScenarios.length > 0) sys += `\n[NÚCLEO 2 - LOCACIONES]\nLos hechos SUCEDEN en estos lugares obligatoriamente:\n` + targetScenarios.map(s => `- ${s.name} (Contexto Temporal: ${s.era})`).join('\n') + `\n`;
    if (targetCharacters.length > 0) {
      sys += `\n[NÚCLEO 3 - REPARTO DE ACTORES]\nCada vez que hable alguien, su diálogo DEBE EMPAPARSE de sus muletillas y personalidad. Su aparición visual DEBE incluir sus ropas invariables:\n`;
      targetCharacters.forEach(c => {
        sys += `- Personaje "${c.name}": Personalidad [${c.personality}]. MULETILLAS Y GESTOS CLAVES [${c.catchphrases}]. RASGOS CARAS/CUERPO/ROPA [${c.visualPrompt}].\n`;
      });
    }

    let userP = `Divide el siguiente guion en secuencias técnicas exactas para la IA de vídeo.
⚠️ IMPORTANTE: TU RESPUESTA DEBE SER MASIVA Y ENORME. CADA ESCENA DEBE CONTENER UNA DESCRIPCIÓN CINEMATOGRÁFICA Y NARRATIVA EXTREMADAMENTE EXTENSA. NO SEAS BREVE. NO RESUMAS. TIENES QUE APROVECHAR AL 100% CADA ATRIBUTO, PROCEDENCIA, GESTO, PERSONALIDAD Y ASPECTO VISUAL QUE TE HEMOS PASADO DEL ESCENARIO Y DEL ACTOR.
FORMATO OBLIGATORIO DE RESPUESTA EN MARKDOWN PARA CADA ESCENA:
### Escena X (Dur. Estimada: Z segs)
- **Acción/Contexto Analítico:** Qué pasa exactamente en la escena. Qué actitud, pose, gestos físicos (muletillas corporales) e intenciones exudan los personajes. ¿Dónde están ubicados? ¿Cómo se comportan?
- **Master Prompt Visual (INGLÉS - PÁRRAFO GIGANTE):** Escribe el prompt hiper-detallado de imagen para Midjourney/Sora. OBLIGATORIO combinar en un bloque orgánico y rico: [Paleta del Universo] + [Facial, Ropa y Complexiometría del Personaje] + [Texturas y Atmósfera del Escenario/Época]. Detalla la iluminación (volumétrica, sombras), encuadre, textura de piel y ropa, lentes y foco.
- **Movimiento de Cámara (INGLÉS):** Instrucción técnica (ej: fast tracking shot, aggressive whip pan to right, handheld shaky cam).
- **Voz en Off / Locución:** El diálogo exacto a inyectar en ElevenLabs. Si habla un personaje, EMPÁPALE de su personalidad, acérucale usando sus muletillas dadas, y que la forma sintáctica de este texto respire el ADN de su trasfondo.
`;
    if (formData.aiInstructions) userP += `\n[INSTRUCCIÓN DEL DIRECTOR PARA ESTE CLIP CONCRETO]: ${formData.aiInstructions}`;
    userP += `\n\n=== GUION LITERARIO BASE A ADAPTAR ===\n${formData.script}`;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + openAiKey },
        body: JSON.stringify({ model: 'gpt-4o', messages: [ { role: 'system', content: sys }, { role: 'user', content: userP } ] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setFormData({...formData, master_prompt_ai: data.choices[0].message.content});
      alert("¡Prompt Maestro generado con éxito!\nRevisa la caja de texto.");
    } catch(e) {
      alert("Error IA: " + e.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => { 
    fetchProjects(); 
    fetchChannels();
    fetchAvatars();
    fetchUniverses();
    fetchScenarios();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
      if (selectedProject) {
        const updated = (data || []).find(p => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    } catch (e) {
      console.error(e.message);
    }
  };

  const fetchChannels = async () => {
    const { data } = await supabase.from('channels').select('id, title');
    setChannels(data || []);
  };

  const fetchAvatars = async () => {
    const { data } = await supabase.from('avatars').select('id, name, profileImage, role, personality, catchphrases, visualPrompt, bodyLanguage');
    setAvatars(data || []);
  };

  const fetchUniverses = async () => {
    const { data } = await supabase.from('universe').select('*');
    setUniverses(data || []);
  };

  const fetchScenarios = async () => {
    const { data } = await supabase.from('scenarios').select('id, name, coverUrl, era');
    setScenarios(data || []);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("¿Seguro que quieres borrar permanentemente este proyecto?")) return;
    try {
      await supabase.from('projects').delete().eq('id', id);
      if (selectedProject && selectedProject.id === id) setSelectedProject(null);
      fetchProjects();
    } catch (e) {
      alert("Error borrando el proyecto.");
    }
  };

  const openCreateModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setWizardStep(1);
    setShowModal(true);
  };

  const openEditModal = (proj, e) => {
    if (e) e.stopPropagation();
    
    let parsedMetrics = { views: 0, likes: 0 };
    if (proj.metrics) {
      parsedMetrics = typeof proj.metrics === 'string' ? JSON.parse(proj.metrics) : proj.metrics;
    }

    setFormData({
      id: proj.id,
      title: proj.title || '',
      status: proj.status || 'Guión',
      priority: proj.priority || 'Media',
      historicalEra: proj.historicalEra || '',
      economicTopic: proj.economicTopic || '',
      script: proj.script || '',
      aiInstructions: proj.aiInstructions || '',
      master_prompt_ai: proj.master_prompt_ai || '',
      channel_id: proj.channel_id || '',
      character_ids: Array.isArray(proj.character_ids) ? proj.character_ids : (typeof proj.character_ids==='string'?JSON.parse(proj.character_ids||'[]'):[]),
      scenario_ids: Array.isArray(proj.scenario_ids) ? proj.scenario_ids : (typeof proj.scenario_ids==='string'?JSON.parse(proj.scenario_ids||'[]'):[]),
      universe_id: proj.universe_id || '',
      
      comments: proj.comments || '',
      content_notes: proj.content_notes || '',
      metrics: parsedMetrics,

      cover: null, video: null, ig_stories: [],
      existingCover: proj.coverUrl,
      existingVideo: proj.videoUrl,
      existing_ig_stories: Array.isArray(proj.ig_story_urls) ? proj.ig_story_urls : (typeof proj.ig_story_urls==='string'?JSON.parse(proj.ig_story_urls||'[]'):[])
    });

    // Auto-navigate to correct tab based on status
    const stat = (proj.status || '').toLowerCase();
    if (stat.includes('edición')) setWizardStep(3);
    else if (stat.includes('revisión') || stat.includes('finalizado')) setWizardStep(4);
    else setWizardStep(1);

    setShowModal(true);
  };

  const toggleCharacterSelection = (avatarId) => {
    setFormData(prev => {
      const isSelected = prev.character_ids.includes(avatarId);
      if (isSelected) return { ...prev, character_ids: prev.character_ids.filter(id => id !== avatarId) };
      else return { ...prev, character_ids: [...prev.character_ids, avatarId] };
    });
  };

  const toggleScenarioSelection = (scenarioId) => {
    setFormData(prev => {
      const isSelected = prev.scenario_ids.includes(scenarioId);
      if (isSelected) return { ...prev, scenario_ids: prev.scenario_ids.filter(id => id !== scenarioId) };
      else return { ...prev, scenario_ids: [...prev.scenario_ids, scenarioId] };
    });
  };

  const handleIgStoriesChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({...formData, ig_stories: [...formData.ig_stories, ...files]});
  };
  const removeIgStory = (index) => {
    const updated = [...formData.existing_ig_stories];
    updated.splice(index, 1);
    setFormData({...formData, existing_ig_stories: updated});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return alert("El título es obligatorio");
    setIsSubmitting(true);

    try {
      let coverFin = formData.existingCover;
      if (formData.cover instanceof File) coverFin = await uploadFile(formData.cover, 'projects');
      
      let videoFin = formData.existingVideo;
      if (formData.video instanceof File) videoFin = await uploadFile(formData.video, 'projects');

      const stUrls = [...formData.existing_ig_stories];
      for (let file of formData.ig_stories) {
        if (file instanceof File) {
          const u = await uploadFile(file, 'projects');
          if (u) stUrls.push(u);
        }
      }

      const payload = {
        title: formData.title,
        status: formData.status,
        priority: formData.priority,
        "historicalEra": formData.historicalEra,
        "economicTopic": formData.economicTopic,
        script: formData.script,
        "aiInstructions": formData.aiInstructions,
        "master_prompt_ai": formData.master_prompt_ai,
        channel_id: formData.channel_id || null,
        universe_id: formData.universe_id || null,
        character_ids: formData.character_ids,
        scenario_ids: formData.scenario_ids,
        "coverUrl": coverFin,
        "videoUrl": videoFin,
        
        comments: formData.comments,
        "content_notes": formData.content_notes,
        "ig_story_urls": stUrls,
        metrics: formData.metrics
      };

      if (formData.id) {
        await supabase.from('projects').update(payload).eq('id', formData.id);
      } else {
        await supabase.from('projects').insert([payload]);
      }
      
      setShowModal(false);
      fetchProjects();
    } catch (e) {
      alert("Error guardando proyecto: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChannelName = (channelId) => {
    const ch = channels.find(c => c.id === channelId);
    return ch ? ch.title : "Sin canal";
  };
  
  const getStatusColorClass = (status) => {
    const s = status.toLowerCase();
    if (s.includes('finalizado')) return 'status-finalizado';
    if (s.includes('revisión')) return 'status-revision';
    if (s.includes('edición')) return 'status-edicion';
    return 'status-guion';
  };

  if (selectedProject) {
    const charIdsArray = Array.isArray(selectedProject.character_ids) ? selectedProject.character_ids : (typeof selectedProject.character_ids==='string'?JSON.parse(selectedProject.character_ids||'[]'):[]);
    const cast = avatars.filter(a => charIdsArray.includes(a.id));
    
    const scenIdsArray = Array.isArray(selectedProject.scenario_ids) ? selectedProject.scenario_ids : (typeof selectedProject.scenario_ids==='string'?JSON.parse(selectedProject.scenario_ids||'[]'):[]);
    const envs = scenarios.filter(s => scenIdsArray.includes(s.id));

    const activeUniverse = universes.find(u => u.id === selectedProject.universe_id);
    let stUrls = Array.isArray(selectedProject.ig_story_urls) ? selectedProject.ig_story_urls : (typeof selectedProject.ig_story_urls==='string'?JSON.parse(selectedProject.ig_story_urls||'[]'):[]);
    let projMetrics = selectedProject.metrics ? (typeof selectedProject.metrics==='string'?JSON.parse(selectedProject.metrics):selectedProject.metrics) : {views:0, likes:0};
    
    return (
      <div className="project-detail-page animation-fade-in">
        <button className="btn-secondary back-btn" onClick={() => setSelectedProject(null)}>
          <ChevronLeft size={16} /> Volver a Proyectos
        </button>

        <div className="project-hero" style={{backgroundImage: selectedProject.coverUrl ? `url(${selectedProject.coverUrl})` : 'none'}}>
          <div className="project-hero-overlay"></div>
          <div className="project-hero-content">
            <span className={`badge ${getStatusColorClass(selectedProject.status)}`}>{selectedProject.status}</span>
            <span className="badge" style={{marginLeft: '0.5rem', background: selectedProject.priority === 'Alta' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)', color: selectedProject.priority === 'Alta' ? 'var(--danger-color)' : 'white'}}>
              {selectedProject.priority === 'Alta' && <Flame size={12} style={{marginRight: '0.2rem', display:'inline'}}/>} 
              Prioridad: {selectedProject.priority || 'Media'}
            </span>
            {activeUniverse && (
              <span className="badge" style={{marginLeft: '0.5rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid #38bdf8'}}>
                <Globe size={12} style={{marginRight: '0.2rem', display:'inline'}}/> Hereda: {activeUniverse.name}
              </span>
            )}
            <h1>{selectedProject.title}</h1>
            <div className="project-hero-meta">
              <span><MapPin size={16}/> {selectedProject.historicalEra || 'Destino Desconocido'}</span>
              <span><BookOpen size={16}/> {selectedProject.economicTopic || 'Tema General'}</span>
              <span><Tv size={16}/> {getChannelName(selectedProject.channel_id)}</span>
              <span><BarChart size={16}/> {(projMetrics.views/1000).toFixed(1)}k visualizaciones</span>
            </div>
            <div className="hero-actions">
              <button className="btn-secondary" onClick={(e) => openEditModal(selectedProject, e)}>
                <Edit size={16} /> Abrir Sala de Montaje
              </button>
            </div>
          </div>
        </div>

        <div className="project-content-grid">
          <div className="content-main">
            
            <div className="section-panel glass-panel" style={activeUniverse ? {borderColor: '#38bdf8'} : {}}>
              <h2 className="section-title">
                {activeUniverse ? <Globe size={20} className="icon-blue"/> : <Wand2 size={20} className="icon-orange"/>} 
                {activeUniverse ? `Mandamientos IA (Heredados del Universo: ${activeUniverse.name})` : "Instrucciones IA"}
              </h2>
              
              {activeUniverse ? (
                <div className="universe-inherited-banner" style={{marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)'}}>
                  <p style={{color: '#38bdf8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1rem', fontWeight: 'bold'}}>
                    Estos parámetros se insertan de forma predeterminada en todo el videoclip.
                  </p>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem'}}>
                    <div>
                      <strong style={{color:'var(--text-primary)'}}>Tono Narrativo:</strong>
                      <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>{activeUniverse.narrativeTone || 'Sin definir.'}</p>
                    </div>
                    <div>
                      <strong style={{color:'var(--text-primary)'}}>Master Prompt Visual:</strong>
                      <p style={{fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{activeUniverse.visualStyle || 'Sin definir.'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                 <p className="no-data" style={{marginBottom:'1rem'}}>Este video es aislado, no consta con biblias de mundo heredadas.</p>
              )}

              <div style={{marginTop: '2rem'}}>
                <strong style={{color:'var(--text-primary)', fontSize:'1rem', textTransform:'uppercase', display: 'flex', alignItems:'center', gap:'0.5rem', marginBottom: '1rem'}}>
                  <MapPin size={18} className="icon-blue"/> Locaciones Confirmadas
                </strong>
                {envs.length === 0 ? (
                  <p className="no-data" style={{marginBottom:'1.5rem'}}>Ningún escenario asignado.</p>
                ) : (
                  <div style={{display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1.5rem'}}>
                    {envs.map(env => (
                      <div key={env.id} style={{display:'flex', alignItems:'center', gap:'0.5rem', background:'var(--bg-background)', padding:'0.5rem 1rem', borderRadius:'20px', border:'1px solid var(--border-color)'}}>
                        <img src={env.coverUrl || '/placeholder.jpg'} style={{width:'20px', height:'20px', borderRadius:'4px', objectFit:'cover'}} alt="c"/>
                        <span style={{fontSize:'0.85rem', color:'var(--text-primary)'}}>{env.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{marginTop: '2rem', marginBottom: '1.5rem'}}>
                <strong style={{color:'var(--text-primary)', fontSize:'1rem', textTransform:'uppercase', display: 'flex', alignItems:'center', gap:'0.5rem', marginBottom: '1rem'}}>
                  <User size={18} className="icon-gold"/> Directrices Inmutables del Reparto
                </strong>
                <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem'}}>El Universo dicta la luz, pero los Actores tienen sus prompts inmutables y de ropa propios.</p>
                
                {cast.length === 0 ? (
                   <p className="no-data">Sin personajes asignados.</p>
                ) : (
                  <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                    {cast.map(c => (
                       <div key={c.id} style={{background: 'var(--bg-background)', border: '1px solid var(--primary-color)', borderRadius: '8px', padding: '1rem'}}>
                          <h4 style={{margin:'0 0 0.5rem 0', display:'flex', alignItems:'center', gap:'0.5rem', color: 'var(--primary-color)'}}>
                            <img src={c.profileImage || '/placeholder.jpg'} style={{width:'24px', height:'24px', borderRadius:'50%', objectFit:'cover'}} alt="c"/>
                            {c.name}
                          </h4>
                          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                            <div>
                              <strong style={{fontSize:'0.8rem', color:'var(--text-secondary)', display:'block'}}>Personalidad:</strong>
                              <span style={{fontSize:'0.85rem', color:'var(--text-primary)', fontStyle:'italic'}}>
                                "{c.personality ? c.personality.substring(0,60) + '...' : ''}"
                              </span>
                            </div>
                            <div>
                              <strong style={{fontSize:'0.8rem', color:'var(--text-secondary)', display:'block'}}>Visual Prompt Inmutable (Para IA):</strong>
                              <span style={{fontSize:'0.85rem', color:'var(--text-primary)', fontFamily:'monospace'}}>
                                {c.visualPrompt || c.bodyLanguage || 'Ninguna'}
                              </span>
                            </div>
                          </div>
                       </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="section-panel glass-panel">
              <h2 className="section-title"><FileText size={20} className="icon-gold"/> Guion de Producción</h2>
              <div className="script-box">
                {selectedProject.script ? (
                  <p>{selectedProject.script}</p>
                ) : (
                  <p className="no-data">Aún no hay guion escrito para este viaje temporal.</p>
                )}
              </div>
            </div>

            <div className="section-panel glass-panel">
              <h2 className="section-title"><MessageCircle size={20} className="icon-blue"/> Notas de Publicación y Feedback</h2>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem'}}>
                 <div>
                   <strong style={{color:'var(--text-secondary)', fontSize:'0.85rem'}}>NOTAS DE CONTENIDO</strong>
                   <div className="script-box" style={{marginTop:'0.5rem', minHeight:'80px'}}>{selectedProject.content_notes || 'Ninguna nota.'}</div>
                 </div>
                 <div>
                   <strong style={{color:'var(--text-secondary)', fontSize:'0.85rem'}}>FEEDBACK (REVISIÓN)</strong>
                   <div style={{marginTop:'0.5rem', background:'rgba(239, 68, 68, 0.05)', padding:'1rem', borderRadius:'8px', border:'1px solid rgba(239,68,68,0.2)', color:'var(--text-primary)', whiteSpace:'pre-wrap'}}>
                     {selectedProject.comments || 'Sin comentarios de cambio.'}
                   </div>
                 </div>
              </div>
            </div>

            <div className="section-panel glass-panel">
              <h2 className="section-title"><Play size={20} className="icon-green"/> Resultados Visuales (Assets)</h2>
              <div className="assets-grid" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
                <div className="asset-card">
                  <h4>Miniatura / Portada</h4>
                  {selectedProject.coverUrl ? (
                    <img src={selectedProject.coverUrl} className="asset-preview" alt="Portada"/>
                  ) : <div className="asset-placeholder">Sin Portada</div>}
                </div>
                <div className="asset-card">
                  <h4>Video Final (Montaje)</h4>
                  {selectedProject.videoUrl ? (
                    <video src={selectedProject.videoUrl} controls className="asset-preview"></video>
                  ) : <div className="asset-placeholder">Sin Video</div>}
                </div>
                <div className="asset-card">
                  <h4>Materiales Secundarios (IG, YouTube Shorts)</h4>
                  {stUrls.length > 0 ? (
                    <div style={{display:'flex', gap:'5px', flexWrap:'wrap', padding:'10px'}}>
                      {stUrls.map((sUrl, idx) => (
                        <a key={idx} href={sUrl} target="_blank" rel="noopener noreferrer" style={{display:'block', width:'45px', height:'45px', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--border-color)'}}>
                           {sUrl.match(/\.(mp4|webm)$/i) ? (
                             <video src={sUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} muted />
                           ) : (
                             <img src={sUrl} alt="s" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                           )}
                        </a>
                      ))}
                    </div>
                  ) : <div className="asset-placeholder">Sin Extras</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="content-sidebar">
             <div className="section-panel glass-panel" style={{marginBottom: '1rem'}}>
              <h2 className="section-title"><User size={20} className="icon-gold"/> Casting ({cast.length})</h2>
              {cast.length === 0 ? (
                <p className="no-data" style={{fontSize:'0.8rem'}}>Ningún Viajero.</p>
              ) : (
                <div className="cast-list">
                  {cast.map(av => (
                    <div key={av.id} className="cast-item">
                      <img src={av.profileImage || '/placeholder.jpg'} alt="av" />
                      <div>
                        <strong>{av.name}</strong>
                        <p>{av.role || 'Actor'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="section-panel glass-panel">
              <h2 className="section-title"><MapPin size={20} className="icon-blue"/> Escenarios ({envs.length})</h2>
              {envs.length === 0 ? (
                <p className="no-data" style={{fontSize:'0.8rem'}}>Ningún Escenario marcado.</p>
              ) : (
                <div className="cast-list">
                  {envs.map(env => (
                    <div key={env.id} className="cast-item">
                      <img src={env.coverUrl || '/placeholder.jpg'} alt="e" style={{borderRadius: '4px'}}/>
                      <div>
                        <strong>{env.name}</strong>
                        <p>{env.era}</p>
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
  }

  return (
    <div className="projects-page">
      <header className="top-bar sticky-header">
        <div className="top-bar-content">
          <h1>Sala de Producción (Roadmap)</h1>
          <p className="subtitle">Explora todos los proyectos, ordena por prioridad y ensambla tus componentes.</p>
        </div>
        <div className="top-bar-actions">
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Crear Video
          </button>
        </div>
      </header>

      <div className="visual-projects-grid">
        {projects.map(proj => {
          const u = universes.find(un => un.id === proj.universe_id);
          const charIdsArray = Array.isArray(proj.character_ids) ? proj.character_ids : (typeof proj.character_ids==='string'?JSON.parse(proj.character_ids||'[]'):[]);
          return (
            <div key={proj.id} className={`vis-project-card glass-panel ${proj.priority === 'Alta' ? 'high-priority-border' : ''}`} onClick={() => setSelectedProject(proj)}>
              <div className="vis-project-cover" style={{backgroundImage: proj.coverUrl ? `url(${proj.coverUrl})` : 'none'}}>
                <div className="cover-fade"></div>
                <span className={`vis-status-badge ${getStatusColorClass(proj.status)}`}>{proj.status}</span>
                {u && (
                  <span style={{position:'absolute', top: '10px', left:'10px', background: 'rgba(56, 189, 248, 0.8)', color: 'white', padding:'0.3rem 0.6rem', borderRadius:'20px', display:'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 'bold'}}>
                    <Globe size={12}/> {u.name}
                  </span>
                )}
              </div>
              <div className="vis-project-body">
                <h3 className="vis-title">{proj.priority === 'Alta' && <Flame size={14} color="var(--danger-color)" style={{display:'inline', marginRight:'0.3rem', position:'relative', top:'2px'}}/>}{proj.title}</h3>
                <div className="vis-badges">
                  {proj.priority === 'Alta' && <span className="vis-badge" style={{color:'var(--danger-color)', borderColor:'rgba(239, 68, 68, 0.3)'}}>🔥 Alta Prioridad</span>}
                  <span className="vis-badge"><Tv size={12}/> {getChannelName(proj.channel_id)}</span>
                  {proj.historicalEra && <span className="vis-badge era"><MapPin size={12}/> {proj.historicalEra}</span>}
                </div>
                <div className="vis-footer">
                  <div className="cast-bubbles">
                    {charIdsArray.slice(0, 3).map((avId, index) => {
                      const av = avatars.find(a => a.id === avId);
                      if (!av) return null;
                      return <img key={avId} src={av.profileImage || '/placeholder.jpg'} alt={av.name} style={{zIndex: 10 - index}} />
                    })}
                  </div>
                  <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openEditModal(proj, e); }}>
                    <Edit size={16} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {projects.length === 0 && (
        <div className="panel" style={{textAlign: 'center', padding: '4rem'}}>
          <p>Línea temporal vacía. Organiza un nuevo rodaje para tus viajeros.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal" style={{maxWidth: '900px'}}>
            <div className="modal-header">
              <h2>{formData.id ? 'Asistente de Producción' : 'Crear Película / Video'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            {/* WIZARD STEPS NAVEGATION */}
            <div style={{display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', background:'var(--bg-elevated)', borderRadius:'8px 8px 0 0', overflowX: 'auto'}}>
               <button type="button" onClick={()=>setWizardStep(1)} style={{minWidth: '150px', flex:1, background:'transparent', border:'none', padding:'1rem 0', color: wizardStep===1?'var(--primary-color)':'var(--text-secondary)', borderBottom: wizardStep===1?'3px solid var(--primary-color)':'3px solid transparent', outline:'none', cursor:'pointer', fontWeight: wizardStep===1?'bold':'normal', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', transition:'all 0.2s'}}>
                 <BookOpen size={16}/> 1. Guion
               </button>
               <button type="button" onClick={()=>setWizardStep(2)} style={{minWidth: '150px', flex:1, background:'transparent', border:'none', padding:'1rem 0', color: wizardStep===2?'var(--gold-color)':'var(--text-secondary)', borderBottom: wizardStep===2?'3px solid var(--gold-color)':'3px solid transparent', outline:'none', cursor:'pointer', fontWeight: wizardStep===2?'bold':'normal', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', transition:'all 0.2s'}}>
                 <Wand2 size={16}/> 2. Prompt IA
               </button>
               <button type="button" onClick={()=>setWizardStep(3)} style={{minWidth: '150px', flex:1, background:'transparent', border:'none', padding:'1rem 0', color: wizardStep===3?'var(--green-color)':'var(--text-secondary)', borderBottom: wizardStep===3?'3px solid var(--green-color)':'3px solid transparent', outline:'none', cursor:'pointer', fontWeight: wizardStep===3?'bold':'normal', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', transition:'all 0.2s'}}>
                 <Scissors size={16}/> 3. Edición
               </button>
               <button type="button" onClick={()=>setWizardStep(4)} style={{minWidth: '150px', flex:1, background:'transparent', border:'none', padding:'1rem 0', color: wizardStep===4?'var(--primary-color)':'var(--text-secondary)', borderBottom: wizardStep===4?'3px solid var(--primary-color)':'3px solid transparent', outline:'none', cursor:'pointer', fontWeight: wizardStep===4?'bold':'normal', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', transition:'all 0.2s'}}>
                 <CheckCircle size={16}/> 4. Revisión
               </button>
            </div>

            <form onSubmit={handleSubmit} className="advanced-form">
              <div className="form-grid" style={{minHeight: '400px', display: 'block'}}>
                
                {/* ---------- WIZARD STEP 1 ---------- */}
                {wizardStep === 1 && (
                  <div className="animation-fade-in" style={{display:'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap:'2rem', width:'100%'}}>
                    <div className="form-column">
                      <div className="form-group">
                        <label>Título / Hook del Video *</label>
                        <input type="text" required placeholder="Ej: La Crisis..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                      </div>
                      
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem'}}>
                        <div className="form-group">
                          <label>Fase de Trabajo</label>
                          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                            <option>Guión</option><option>Edición</option><option>Revisión</option><option>Finalizado</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label style={{color: formData.priority === 'Alta' ? 'var(--danger-color)' : 'inherit'}}>Prioridad</label>
                          <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} style={{borderColor: formData.priority === 'Alta' ? 'var(--danger-color)' : 'var(--border-color)'}}>
                            <option>Alta</option><option>Media</option><option>Baja</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Canal Principal</label>
                          <select value={formData.channel_id} onChange={e => setFormData({...formData, channel_id: e.target.value || ''})}>
                            <option value="">-- Ninguno --</option>
                            {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="universe-toggle-box" style={{marginTop: '0.5rem', padding: '1rem', background: formData.universe_id ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-background)', border: formData.universe_id ? '1px solid #38bdf8' : '1px solid var(--border-color)', borderRadius: '8px'}}>
                        <h4 style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: formData.universe_id ? '#38bdf8' : 'var(--text-primary)', margin: '0 0 0.5rem 0', fontSize:'0.9rem'}}>
                          <Globe size={14}/> Inserción en el Multiverso
                        </h4>
                        <select 
                          value={formData.universe_id} 
                          onChange={e => setFormData({...formData, universe_id: e.target.value || ''})}
                          style={{background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'white', padding: '0.5rem', borderRadius: '4px', width: '100%', fontSize:'0.9rem'}}
                        >
                          <option value="">-- Sin Universo (Aislado) --</option>
                          {universes.map(u => (
                            <option key={u.id} value={u.id}>🔮 Hereda Biblia: {u.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{marginTop:'1.5rem'}}>
                        <label>Prompt General / Instrucciones IA de Clip</label>
                        <textarea rows="3" value={formData.aiInstructions} onChange={e => setFormData({...formData, aiInstructions: e.target.value})} placeholder="Master prompt para IA visual o contexto especial..." style={{border:'1px dashed var(--primary-color)'}}></textarea>
                      </div>
                      
                      <div className="form-group" style={{marginTop:'1rem'}}>
                        <label>Guion Literario (Tu Texto Base)</label>
                        <textarea rows="6" value={formData.script} onChange={e => setFormData({...formData, script: e.target.value})} placeholder="Escribe tu guion aquí..."></textarea>
                      </div>
                    </div>

                    <div className="form-column">
                      
                      <div style={{background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', height:'100%', display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                        <div>
                           <h4 style={{margin: '0 0 1rem 0', color: 'var(--text-secondary)', display:'flex', alignItems:'center', gap:'0.5rem'}}><User size={16}/> Selección de Personajes (Casting)</h4>
                           <div className="cast-selector-grid" style={{maxHeight:'200px', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', paddingBottom:'5px'}}>
                              {avatars.map(av => (
                                <div key={av.id} 
                                     className={`cast-selector-card ${formData.character_ids.includes(av.id) ? 'selected' : ''}`}
                                     onClick={() => toggleCharacterSelection(av.id)}
                                     style={{padding:'0.2rem'}}>
                                  <img src={av.profileImage || '/placeholder.jpg'} alt="av" style={{width:'40px', height:'40px'}}/>
                                  <span style={{fontSize:'0.65rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%'}}>{av.name}</span>
                                </div>
                              ))}
                              {avatars.length === 0 && <p style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>No hay personajes.</p>}
                           </div>
                        </div>

                        <div>
                           <h4 style={{margin: '0 0 1rem 0', color: 'var(--text-secondary)', display:'flex', alignItems:'center', gap:'0.5rem'}}><MapPin size={16}/> Contextos Ambientales (Escenarios)</h4>
                           <div className="cast-selector-grid" style={{maxHeight:'200px', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', paddingBottom:'5px'}}>
                              {scenarios.map(env => (
                                <div key={env.id} 
                                     className={`cast-selector-card ${formData.scenario_ids.includes(env.id) ? 'selected' : ''}`}
                                     onClick={() => toggleScenarioSelection(env.id)}
                                     style={{aspectRatio: 'auto', padding: '0.4rem'}}>
                                  <img src={env.coverUrl || '/placeholder.jpg'} alt="env" style={{width: '100%', height:'60px', borderRadius:'4px', objectFit:'cover', marginBottom:'0.3rem'}}/>
                                  <span style={{fontSize:'0.75rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', width:'100%'}}>{env.name}</span>
                                </div>
                              ))}
                              {scenarios.length === 0 && <p style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>No hay escenarios.</p>}
                           </div>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* ---------- WIZARD STEP 2 ---------- */}
                {wizardStep === 2 && (
                  <div className="animation-fade-in" style={{display:'grid', gridTemplateColumns: 'minmax(400px, 1fr)', gap:'2rem', width:'100%', maxWidth:'800px', margin:'0 auto'}}>

                    <div style={{background: 'rgba(56, 189, 248, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.2)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <h4 style={{color:'#38bdf8', margin:'0 0 0.5rem 0', display:'flex', alignItems:'center', gap:'0.5rem'}}><Wand2 size={16}/> OpenAI API Key (Client-Side)</h4>
                        <p style={{fontSize:'0.8rem', color:'var(--text-secondary)', margin:0}}>Se guarda seguro en tu LocalStorage para generar Prompts en este navegador.</p>
                      </div>
                      <input type="password" value={openAiKey} onChange={e => handleSaveApiKey(e.target.value)} placeholder="sk-..." style={{width:'200px', background:'var(--bg-elevated)', border:'1px solid var(--border-color)', color:'white', padding:'0.5rem', borderRadius:'6px'}}/>
                    </div>

                    <div style={{background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                        <label style={{color:'var(--gold-color)', display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:'bold', fontSize:'1.1rem'}}><FileText size={18}/> Cerebro Multiverso (Master Prompt)</label>
                        <button type="button" onClick={generateAI} disabled={isGeneratingAi || !openAiKey} className="btn-primary" style={{background: 'var(--gold-color)', color:'black', fontWeight:'bold'}}>
                          {isGeneratingAi ? 'Pensando...' : 'Generar Máster Prompt AI'}
                        </button>
                      </div>
                      <textarea rows="8" value={formData.master_prompt_ai || ''} onChange={e => setFormData({...formData, master_prompt_ai: e.target.value})} placeholder={!openAiKey ? "Introduce tu API Key arriba para habilitar." : "Guion técnico segmentado en <=9s, prompts en inglés con estilo visual heredado..."} style={{fontFamily:'monospace', fontSize:'0.85rem', lineHeight:'1.5', background:'var(--bg-background)'}}></textarea>
                    </div>
                  </div>
                )}

                {/* ---------- WIZARD STEP 3 ---------- */}
                {wizardStep === 3 && (
                  <div className="animation-fade-in" style={{display:'grid', gridTemplateColumns: '1fr', gap:'2rem', width:'100%', maxWidth:'600px', margin:'0 auto'}}>
                    <div style={{textAlign:'center', marginBottom:'1rem'}}>
                      <h3 style={{color:'var(--primary-color)'}}>Archivos Magistrales y Montaje Visual</h3>
                      <p style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>Sube a esta estación el montaje definitivo que ha salido de la IA y el equipo de Edición.</p>
                    </div>

                    <div style={{display: 'flex', flexDirection:'column', gap: '1.5rem', background: 'var(--bg-elevated)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                      <div className="form-group" style={{margin:0}}>
                        <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><Play size={16} className="icon-green"/> Video Final (MP4 / Webm)</label>
                        {formData.existingVideo && !formData.video && (
                          <div style={{marginBottom:'0.5rem', background:'var(--bg-background)', padding:'0.5rem', borderRadius:'8px', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                            <CheckCircle size={14} color="var(--green-color)"/><span style={{fontSize:'0.8rem'}}>Ya hay un video subido para este proyecto.</span>
                          </div>
                        )}
                        <input type="file" accept="video/*" onChange={e => setFormData({...formData, video: e.target.files[0]})} style={{width:'100%', padding:'1rem', border:'2px dashed var(--border-color)', borderRadius:'8px', cursor:'pointer'}}/>
                      </div>
                      <div className="form-group" style={{margin:0}}>
                        <label style={{display:'flex', alignItems:'center', gap:'0.5rem'}}><FileText size={16} className="icon-gold"/> Portada o Miniatura (Thumbnail YouTube)</label>
                        {formData.existingCover && !formData.cover && (
                          <div style={{marginBottom:'0.5rem', display:'flex', gap:'1rem'}}>
                             <img src={formData.existingCover} alt="c" style={{height:'60px', borderRadius:'4px'}}/>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={e => setFormData({...formData, cover: e.target.files[0]})} style={{width:'100%'}}/>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------- WIZARD STEP 4 ---------- */}
                {wizardStep === 4 && (
                  <div className="animation-fade-in" style={{display:'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap:'2rem', width:'100%'}}>
                    <div className="form-column">
                      <h3 style={{color:'var(--green-color)', marginBottom:'1rem'}}>Revisión y Publicación Cruzada</h3>
                      
                      <div className="form-group">
                        <label style={{display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--danger-color)'}}>
                          <MessageCircle size={16}/> Comentarios de Montaje / Correcciones
                        </label>
                        <textarea rows="4" value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} placeholder="El minuto 1:20 tiene mal el audio. Cambiar ese personaje..." style={{border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.02)'}}></textarea>
                      </div>

                      <div className="form-group">
                        <label>Notas de Contenido (A tener en cuenta luego)</label>
                        <textarea rows="3" value={formData.content_notes} onChange={e => setFormData({...formData, content_notes: e.target.value})} placeholder="Poner en la descripción links de la fuente 1..."></textarea>
                      </div>

                      <div style={{marginTop:'2rem', background:'var(--bg-background)', padding:'1.5rem', borderRadius:'12px', border:'1px solid var(--border-color)'}}>
                         <h4 style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem'}}><BarChart size={16} className="icon-blue"/> Resultados / Métricas del Vídeo</h4>
                         <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                           <div className="form-group">
                             <label>Nº Visualizaciones</label>
                             <input type="number" min="0" value={formData.metrics.views} onChange={e => setFormData({...formData, metrics: {...formData.metrics, views: parseInt(e.target.value)||0}})} />
                           </div>
                           <div className="form-group">
                             <label>Nº Likes</label>
                             <input type="number" min="0" value={formData.metrics.likes} onChange={e => setFormData({...formData, metrics: {...formData.metrics, likes: parseInt(e.target.value)||0}})} />
                           </div>
                         </div>
                      </div>
                    </div>

                    <div className="form-column">
                      <div style={{background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', height:'100%'}}>
                        <h4 style={{margin: '0 0 1rem 0', display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-primary)'}}><Image className="icon-orange" size={18}/> Materiales para Historias y Shorts</h4>
                        <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'1rem'}}>Sube extractos verticales, imágenes o memes que el equipo ha extraído de este proyecto para publicar de forma secundaria.</p>
                        
                        <input type="file" multiple accept="image/*,video/*" onChange={handleIgStoriesChange} style={{width:'100%', padding:'0.5rem', borderRadius:'8px', background:'var(--bg-background)', border:'1px dashed var(--border-color)'}}/>
                        
                        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(60px, 1fr))', gap:'10px', marginTop:'1.5rem'}}>
                          {formData.existing_ig_stories.map((url, i) => (
                            <div key={i} style={{position:'relative', width:'60px', height:'60px', borderRadius:'8px', overflow:'hidden', border:'1px solid var(--border-color)'}}>
                              {url.match(/\.(mp4|webm)$/i) ? (
                                <video src={url} style={{width:'100%', height:'100%', objectFit:'cover'}} muted />
                              ) : (
                                <img src={url} alt="g" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                              )}
                              <button type="button" onClick={()=>removeIgStory(i)} style={{position:'absolute', top:'-2px', right:'-2px', background:'var(--danger-color)', color:'white', border:'none', borderRadius:'50%', width:'18px', height:'18px', fontSize:'10px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
                            </div>
                          ))}
                          {formData.ig_stories.map((file, i) => (
                             <div key={`new-${i}`} style={{width:'60px', height:'60px', background:'var(--primary-color)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'white', fontWeight:'bold', textAlign:'center'}}>Nuevo<br/>Archivo</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
              <div className="modal-footer" style={{marginTop:'1.5rem', display:'flex', justifyContent:'space-between', borderTop: '1px solid var(--border-color)', paddingTop:'1.5rem'}}>
                <div>
                  {formData.id && <button type="button" className="btn-secondary" style={{color: 'var(--text-secondary)', borderColor: 'transparent'}} onClick={(e) => handleDelete(formData.id, e)}>Eliminar Obra</button>}
                </div>
                <div style={{display:'flex', gap:'1rem'}}>
                  {wizardStep > 1 && (
                    <button type="button" className="btn-secondary" onClick={() => setWizardStep(wizardStep - 1)}>Anterior</button>
                  )}
                  {wizardStep < 4 ? (
                    <button type="button" className="btn-primary" onClick={() => setWizardStep(wizardStep + 1)}>Siguiente Fase</button>
                  ) : (
                    <button type="submit" className="btn-primary" disabled={isSubmitting} style={{fontWeight:'bold', padding:'0.75rem 2.5rem', background:'var(--green-color)'}}>{isSubmitting ? 'Acoplando Final...' : 'Confirmar Todo'}</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
