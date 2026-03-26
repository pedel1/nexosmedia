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

  const [aiProvider, setAiProvider] = useState(localStorage.getItem('ai_provider') || 'openai');
  const [aiModel, setAiModel] = useState(localStorage.getItem('ai_model') || 'gpt-4o');
  const [aiApiKey, setAiApiKey] = useState(localStorage.getItem('ai_api_key') || '');
  const [aiBaseUrl, setAiBaseUrl] = useState(localStorage.getItem('ai_base_url') || '');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const saveAiSetting = (key, val, setter) => { localStorage.setItem(key, val); setter(val); };

  const AI_PROVIDERS = [
    { id: 'openai', name: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
    { id: 'anthropic', name: 'Anthropic (Claude)', url: 'https://api.anthropic.com/v1/messages', models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'] },
    { id: 'gemini', name: 'Google Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/models/', models: ['gemini-2.5-flash', 'gemini-2.5-pro'] },
    { id: 'custom', name: 'Custom (OpenAI Compatible)', url: '', models: [] }
  ];

  const getPriorityColor = (p) => { if (p === 'Alta') return '#ef4444'; if (p === 'Media') return '#38bdf8'; return '#22c55e'; };

  const generateAI = async () => {
    if (!aiApiKey) return alert("Por favor, introduce tu API Key en la configuración de IA.");
    if (!formData.script && !formData.aiInstructions) return alert("Primero debes rellenar el Prompt General o el Guión Literario en la Fase 1.");
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
    if (targetScenarios.length > 0) {
      sys += `\n[NÚCLEO 2 - LOCACIONES Y AMBIENTACIÓN]\nLos hechos SUCEDEN en estos lugares obligatoriamente. DEBES integrar CADA DETALLE de la locación:\n`;
      targetScenarios.map(s => {
        sys += `- ESCENARIO "${s.name}": Época [${s.era || 'N/A'}]. Lugar Real [${s.location || 'N/A'}]. Descripción del lugar [${s.description || 'N/A'}]. Contexto Cultural y Social [${s.culturalContext || 'N/A'}]. Prompt Visual del Entorno [${s.visualPrompt || 'N/A'}]. Atmósfera y Clima [${s.atmosphere || 'N/A'}]. Elementos a EVITAR (Negative) [${s.negativePrompt || 'Ninguno'}].\n`;
      });
    }
    if (targetCharacters.length > 0) {
      sys += `\n[NÚCLEO 3 - REPARTO DE ACTORES]\nCada vez que hable alguien, su diálogo DEBE EMPAPARSE de sus muletillas y personalidad. Su aparición visual DEBE incluir sus ropas invariables. INTEGRA TODO SIN OMISIÓN:\n`;
      targetCharacters.forEach(c => {
        sys += `- Personaje "${c.name}": Rol [${c.role || 'N/A'}]. Especialidad [${c.expertise || 'N/A'}]. Personalidad COMPLETA [${c.personality || 'N/A'}]. MULETILLAS, GESTOS Y FORMA DE HABLAR [${c.catchphrases || 'N/A'}]. LENGUAJE CORPORAL [${c.bodyLanguage || 'N/A'}]. PROMPT VISUAL INMUTABLE (Cara/Cuerpo/Ropa) [${c.visualPrompt || 'N/A'}].\n`;
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
    if (formData.aiInstructions) userP += `\n\n[PROMPT GENERAL / DIRECCIÓN CREATIVA Y HOOK VIRAL]:\n${formData.aiInstructions}\n---> ESTE ES EL GANCHO. El vídeo DEBE girar en torno a este enfoque. Es lo que ATRAE al espectador. Fusiona el contenido factual del Guión Literario con este ángulo creativo para maximizar la retención.\n`;
    userP += `\n\n=== GUION LITERARIO (DATOS E INVESTIGACIÓN FACTUAL) ===\n${formData.script}\n\n---> INSTRUCCIÓN FINAL: Tu Master Prompt debe FUSIONAR el Guión Literario (datos puros) con el Prompt General (ángulo viral). El resultado debe ser un guion narrado POR EL PERSONAJE SELECCIONADO, con su personalidad, muletillas y forma de hablar, que presente los datos del Guión Literario desde el ángulo del Prompt General.`;

    try {
      let result = '';
      if (aiProvider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': aiApiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: aiModel, max_tokens: 8192, system: sys, messages: [{ role: 'user', content: userP }] })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        result = data.content[0].text;
      } else if (aiProvider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${aiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: sys + '\n\n' + userP }] }] })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        result = data.candidates[0].content.parts[0].text;
      } else {
        const endpoint = aiProvider === 'custom' && aiBaseUrl ? aiBaseUrl : 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + aiApiKey },
          body: JSON.stringify({ model: aiModel, messages: [{ role: 'system', content: sys }, { role: 'user', content: userP }] })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        result = data.choices[0].message.content;
      }
      setFormData({...formData, master_prompt_ai: result});
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
      let { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) {
        // Retry without ordering if created_at doesn't exist
        const retry = await supabase.from('projects').select('*');
        data = retry.data;
      }
      setProjects(data || []);
      if (selectedProject) {
        const updated = (data || []).find(p => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    } catch (e) {
      console.error('fetchProjects error:', e.message);
    }
  };

  const fetchChannels = async () => {
    const { data } = await supabase.from('channels').select('id, title');
    setChannels(data || []);
  };

  const fetchAvatars = async () => {
    const { data } = await supabase.from('avatars').select('id, name, profileImage, role, personality, catchphrases, visualPrompt, bodyLanguage, expertise, voicePrompt, history, birthdate');
    setAvatars(data || []);
  };

  const fetchUniverses = async () => {
    const { data } = await supabase.from('universe').select('*');
    setUniverses(data || []);
  };

  const fetchScenarios = async () => {
    const { data } = await supabase.from('scenarios').select('*');
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
    if (!formData.title) return alert("Ponle un título al proyecto para guardarlo");
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

      // Payload base — solo campos que seguro existen en la tabla
      const payload = {
        title: formData.title,
        status: formData.status || 'Guión',
        script: formData.script || '',
        channel_id: formData.channel_id || null,
      };

      // Campos opcionales — se añaden solo si tienen valor, para no romper si la columna no existe
      const optionalFields = {
        priority: formData.priority || 'Media',
        historicalEra: formData.historicalEra || '',
        economicTopic: formData.economicTopic || '',
        aiInstructions: formData.aiInstructions || '',
        master_prompt_ai: formData.master_prompt_ai || '',
        universe_id: formData.universe_id || null,
        character_ids: formData.character_ids || [],
        scenario_ids: formData.scenario_ids || [],
        coverUrl: coverFin || null,
        videoUrl: videoFin || null,
        comments: formData.comments || '',
        content_notes: formData.content_notes || '',
        ig_story_urls: stUrls,
        metrics: formData.metrics || { views: 0, likes: 0 },
      };
      Object.assign(payload, optionalFields);

      let result;
      if (formData.id) {
        result = await supabase.from('projects').update(payload).eq('id', formData.id);
      } else {
        result = await supabase.from('projects').insert([payload]);
      }
      
      // Si falla (ej: columna no existe), reintentar con payload mínimo
      if (result.error) {
        console.warn('Full payload failed, retrying with minimal:', result.error.message);
        const minPayload = { title: formData.title, status: formData.status || 'Guión', script: formData.script || '', channel_id: formData.channel_id || null };
        let retry;
        if (formData.id) {
          retry = await supabase.from('projects').update(minPayload).eq('id', formData.id);
        } else {
          retry = await supabase.from('projects').insert([minPayload]);
        }
        if (retry.error) {
          console.error('Minimal save also failed:', retry.error);
          alert("Error de Supabase: " + retry.error.message + "\n\nEjecuta el SQL fix_projects_columns.sql en tu Supabase Dashboard.");
          return;
        }
        alert("Proyecto guardado (modo básico). Para guardar todos los campos, ejecuta fix_projects_columns.sql en Supabase.");
      }
      
      setShowModal(false);
      fetchProjects();
    } catch (e) {
      console.error('JS error saving project:', e);
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
            <span className="badge" style={{marginLeft: '0.5rem', background: `${getPriorityColor(selectedProject.priority)}22`, color: getPriorityColor(selectedProject.priority), border: `1px solid ${getPriorityColor(selectedProject.priority)}55`}}>
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
            <div key={proj.id} className={`vis-project-card glass-panel`} onClick={() => setSelectedProject(proj)} style={{borderLeft: `4px solid ${getPriorityColor(proj.priority)}`}}>
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
                <h3 className="vis-title">{proj.title}</h3>
                <div className="vis-badges">
                  <span className="vis-badge" style={{color: getPriorityColor(proj.priority), borderColor: `${getPriorityColor(proj.priority)}55`, background: `${getPriorityColor(proj.priority)}15`}}>{proj.priority === 'Alta' ? '🔥' : proj.priority === 'Media' ? '🔵' : '🟢'} {proj.priority}</span>
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
               {[
                 { step: 1, label: '1. Guion', icon: <BookOpen size={14}/>, color: 'var(--primary-color)' },
                 { step: 2, label: '2. Prompt IA', icon: <Wand2 size={14}/>, color: 'var(--gold-color)' },
                 { step: 3, label: '3. Edición', icon: <Scissors size={14}/>, color: 'var(--green-color)' },
                 { step: 4, label: '4. Revisión', icon: <MessageCircle size={14}/>, color: '#38bdf8' },
                 { step: 5, label: '5. Finalizado', icon: <CheckCircle size={14}/>, color: '#22c55e' }
               ].map(t => (
                 <button key={t.step} type="button" onClick={()=>setWizardStep(t.step)} style={{minWidth:'120px', flex:1, background:'transparent', border:'none', padding:'0.85rem 0', color: wizardStep===t.step ? t.color : 'var(--text-secondary)', borderBottom: wizardStep===t.step ? `3px solid ${t.color}` : '3px solid transparent', outline:'none', cursor:'pointer', fontWeight: wizardStep===t.step?'bold':'normal', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', transition:'all 0.2s', fontSize:'0.85rem'}}>
                   {t.icon} {t.label}
                 </button>
               ))}
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
                            <option>Guión</option><option>Prompt IA</option><option>Edición</option><option>Revisión</option><option>Finalizado</option>
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
                        <label style={{fontSize:'0.95rem', fontWeight:'bold', color:'var(--primary-color)', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                          <Target size={16}/> PROMPT GENERAL (Dirección Creativa / Hook)
                        </label>
                        <p style={{fontSize:'0.75rem', color:'var(--text-muted)', margin:'0.25rem 0 0.75rem 0', lineHeight:1.4}}>
                          El contexto creativo y el gancho viral. Ej: "Vamos a hacer un vídeo sobre cómo era la economía en los Peaky Blinders". 
                          Esto es lo que ATRAE al espectador y da el VALOR AÑADIDO al contenido puro.
                        </p>
                        <textarea rows="5" value={formData.aiInstructions} onChange={e => setFormData({...formData, aiInstructions: e.target.value})} placeholder="Ej: Vamos a hacer un vídeo sobre cómo era la economía en la era de los Peaky Blinders. El enfoque debe ser cómo las apuestas ilegales y el contrabando movían más dinero que los propios bancos de Birmingham..." style={{border:'2px solid var(--primary-color)', background:'rgba(255,107,0,0.03)', fontSize:'0.95rem'}}></textarea>
                      </div>
                      
                      <div className="form-group" style={{marginTop:'1.5rem'}}>
                        <label style={{fontSize:'0.95rem', fontWeight:'bold', color:'var(--blue-color)', display:'flex', alignItems:'center', gap:'0.5rem'}}>
                          <BookOpen size={16}/> GUIÓN LITERARIO (Contenido Factual / Investigación)
                        </label>
                        <p style={{fontSize:'0.75rem', color:'var(--text-muted)', margin:'0.25rem 0 0.75rem 0', lineHeight:1.4}}>
                          Toda la información pura y dura: datos históricos, económicos, contexto real. 
                          La IA fusionará esto con el Prompt General para crear un guion narrado por tu personaje.
                        </p>
                        <textarea rows="10" value={formData.script} onChange={e => setFormData({...formData, script: e.target.value})} placeholder="Ej: Tras la Primera Guerra Mundial, Birmingham era una ciudad industrial en decadencia. La tasa de desempleo superaba el 40%. Las fábricas de munición cerraron y miles de soldados regresaron a una ciudad sin trabajo. El mercado negro y las apuestas ilegales se convirtieron en la principal fuente de ingresos para las familias obreras de Small Heath..." style={{border:'2px solid var(--blue-color, #38bdf8)', background:'rgba(56,189,248,0.03)', fontSize:'0.95rem'}}></textarea>
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
                  <div className="animation-fade-in" style={{display:'grid', gridTemplateColumns: 'minmax(400px, 1fr)', gap:'1.5rem', width:'100%', maxWidth:'850px', margin:'0 auto'}}>

                    <div style={{background: 'rgba(56, 189, 248, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.2)'}}>
                      <h4 style={{color:'#38bdf8', margin:'0 0 1rem 0', display:'flex', alignItems:'center', gap:'0.5rem'}}><Wand2 size={16}/> Configuración del Motor de IA</h4>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem'}}>
                        <div className="form-group" style={{margin:0}}>
                          <label style={{fontSize:'0.8rem'}}>Proveedor de IA</label>
                          <select value={aiProvider} onChange={e => { saveAiSetting('ai_provider', e.target.value, setAiProvider); const prov = AI_PROVIDERS.find(p=>p.id===e.target.value); if(prov && prov.models.length) saveAiSetting('ai_model', prov.models[0], setAiModel); }}>
                            {AI_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="form-group" style={{margin:0}}>
                          <label style={{fontSize:'0.8rem'}}>Modelo</label>
                          {AI_PROVIDERS.find(p=>p.id===aiProvider)?.models.length > 0 ? (
                            <select value={aiModel} onChange={e => saveAiSetting('ai_model', e.target.value, setAiModel)}>
                              {AI_PROVIDERS.find(p=>p.id===aiProvider).models.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          ) : (
                            <input type="text" value={aiModel} onChange={e => saveAiSetting('ai_model', e.target.value, setAiModel)} placeholder="modelo-personalizado" />
                          )}
                        </div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns: aiProvider==='custom' ? '1fr 1fr' : '1fr', gap:'1rem'}}>
                        <div className="form-group" style={{margin:0}}>
                          <label style={{fontSize:'0.8rem'}}>API Key</label>
                          <input type="password" value={aiApiKey} onChange={e => saveAiSetting('ai_api_key', e.target.value, setAiApiKey)} placeholder="sk-... / tu-clave" style={{background:'var(--bg-elevated)', border:'1px solid var(--border-color)', color:'white', padding:'0.5rem', borderRadius:'6px'}}/>
                        </div>
                        {aiProvider === 'custom' && (
                          <div className="form-group" style={{margin:0}}>
                            <label style={{fontSize:'0.8rem'}}>Base URL (Endpoint)</label>
                            <input type="text" value={aiBaseUrl} onChange={e => saveAiSetting('ai_base_url', e.target.value, setAiBaseUrl)} placeholder="https://api.tu-servidor.com/v1/chat/completions" style={{background:'var(--bg-elevated)', border:'1px solid var(--border-color)', color:'white', padding:'0.5rem', borderRadius:'6px'}}/>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem'}}>
                        <label style={{color:'var(--gold-color)', display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:'bold', fontSize:'1.1rem'}}><FileText size={18}/> Cerebro Multiverso (Master Prompt)</label>
                        <button type="button" onClick={generateAI} disabled={isGeneratingAi || !aiApiKey} className="btn-primary" style={{background: 'var(--gold-color)', color:'black', fontWeight:'bold'}}>
                          {isGeneratingAi ? '⏳ Generando...' : `🧠 Generar con ${AI_PROVIDERS.find(p=>p.id===aiProvider)?.name || 'IA'}`}
                        </button>
                      </div>
                      <textarea rows="10" value={formData.master_prompt_ai || ''} onChange={e => setFormData({...formData, master_prompt_ai: e.target.value})} placeholder={!aiApiKey ? "Configura tu proveedor de IA arriba para habilitar la generación." : "Aquí aparecerá el prompt maestro masivo con todas las escenas..."} style={{fontFamily:'monospace', fontSize:'0.85rem', lineHeight:'1.6', background:'var(--bg-background)', minHeight:'250px'}}></textarea>
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

                {/* ---------- WIZARD STEP 4: REVISIÓN ---------- */}
                {wizardStep === 4 && (
                  <div className="animation-fade-in" style={{display:'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap:'2rem', width:'100%'}}>
                    <div className="form-column">
                      <h3 style={{color:'#38bdf8', marginBottom:'1rem'}}>Revisión y Feedback</h3>
                      
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

                {/* ---------- WIZARD STEP 5: FINALIZADO ---------- */}
                {wizardStep === 5 && (
                  <div className="animation-fade-in" style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'2rem', width:'100%', maxWidth:'600px', margin:'0 auto', padding:'2rem 0'}}>
                    <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'rgba(34,197,94,0.15)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <CheckCircle size={40} color="#22c55e"/>
                    </div>
                    <h2 style={{color:'#22c55e', margin:0}}>Proyecto Finalizado</h2>
                    <p style={{color:'var(--text-secondary)', textAlign:'center', maxWidth:'400px'}}>Este proyecto ha completado el pipeline completo de producción y está listo para publicación.</p>
                    <div style={{width:'100%', background:'var(--bg-elevated)', padding:'1.5rem', borderRadius:'12px', border:'1px solid var(--border-color)'}}>
                      <h4 style={{marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.5rem'}}><BarChart size={16} className="icon-blue"/> Métricas Finales</h4>
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
                )}

              </div>
              <div className="modal-footer" style={{marginTop:'1.5rem', display:'flex', justifyContent:'space-between', borderTop: '1px solid var(--border-color)', paddingTop:'1.5rem'}}>
                <div>
                  {formData.id && <button type="button" className="btn-secondary" style={{color: 'var(--text-secondary)', borderColor: 'transparent'}} onClick={(e) => handleDelete(formData.id, e)}>Eliminar Obra</button>}
                </div>
                <div style={{display:'flex', gap:'0.75rem', alignItems:'center'}}>
                  {wizardStep > 1 && (
                    <button type="button" className="btn-secondary" onClick={() => setWizardStep(wizardStep - 1)}>← Anterior</button>
                  )}
                  {wizardStep < 5 && (
                    <button type="button" className="btn-secondary" onClick={() => setWizardStep(wizardStep + 1)}>Siguiente Fase →</button>
                  )}
                  <button type="submit" className="btn-primary" disabled={isSubmitting} style={{fontWeight:'bold', padding:'0.65rem 1.5rem', background:'var(--green-color)', marginLeft: wizardStep < 5 ? '0.5rem' : '0'}}>{isSubmitting ? 'Guardando...' : '💾 Guardar'}</button>
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
