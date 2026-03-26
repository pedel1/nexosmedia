import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { uploadFile } from '../supabaseHelpers';
import { Plus, Trash2, Map, MapPin, Edit, ChevronLeft, Flag, Camera, ThermometerSun, BookOpen, Fingerprint, Download } from 'lucide-react';
import './Characters.css'; 

const INITIAL_FORM_STATE = { 
  id: null, name: '', era: '', location: '', description: '', 
  visualPrompt: '', culturalContext: '', atmosphere: '', negativePrompt: '', 
  cover: null, gallery: [], existingCover: null, existingGallery: []
};

const Scenarios = () => {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { 
    fetchScenarios(); 
  }, []);

  const fetchScenarios = async () => {
    try {
      const { data, error } = await supabase.from('scenarios').select('*').order('name');
      if (error) throw error;
      setScenarios(data || []);
  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename || "nexosmedia_download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      window.open(url, "_blank");
    }
  };

      if (selectedScenario) {
        const updated = (data || []).find(s => s.id === selectedScenario.id);
        if (updated) setSelectedScenario(updated);
      }
    } catch (e) {
      console.error(e.message);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("¿Seguro que quieres borrar permanentemente este Escenario?")) return;
    try {
      await supabase.from('scenarios').delete().eq('id', id);
      if (selectedScenario && selectedScenario.id === id) setSelectedScenario(null);
      fetchScenarios();
    } catch (e) {
      alert("Error borrando el escenario: " + e.message);
    }
  };

  const openCreateModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setShowModal(true);
  };

  const openEditModal = (s, e) => {
    if (e) e.stopPropagation();
    setFormData({
      id: s.id,
      name: s.name || '',
      era: s.era || '',
      location: s.location || '',
      description: s.description || '',
      visualPrompt: s.visualPrompt || '',
      culturalContext: s.culturalContext || '',
      atmosphere: s.atmosphere || '',
      negativePrompt: s.negativePrompt || '',
      cover: null,
      gallery: [],
      existingCover: s.coverUrl || null,
      existingGallery: Array.isArray(s.galleryUrls) ? s.galleryUrls : (typeof s.galleryUrls === 'string' ? JSON.parse(s.galleryUrls) : [])
    });
    setShowModal(true);
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.existingGallery.length + formData.gallery.length > 10) {
      alert("Máximo 10 fotos.");
      return;
    }
    setFormData({...formData, gallery: [...formData.gallery, ...files]});
  };

  const removeExistingGalleryImage = (index) => {
    const updated = [...formData.existingGallery];
    updated.splice(index, 1);
    setFormData({...formData, existingGallery: updated});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("Nombre obligatorio");
    setIsSubmitting(true);

    try {
      let coverUrl = formData.existingCover;
      if (formData.cover instanceof File) {
        coverUrl = await uploadFile(formData.cover, 'scenarios');
      }

      const galUrls = [...formData.existingGallery];
      for (let file of formData.gallery) {
        if (file instanceof File) {
          const u = await uploadFile(file, 'scenarios');
          if (u) galUrls.push(u);
        }
      }

      const payload = {
        name: formData.name,
        era: formData.era,
        location: formData.location,
        description: formData.description,
        "visualPrompt": formData.visualPrompt,
        "culturalContext": formData.culturalContext,
        atmosphere: formData.atmosphere,
        "negativePrompt": formData.negativePrompt,
        "coverUrl": coverUrl,
        "galleryUrls": galUrls
      };

      if (formData.id) {
        await supabase.from('scenarios').update(payload).eq('id', formData.id);
      } else {
        await supabase.from('scenarios').insert([payload]);
      }
      
      setShowModal(false);
      fetchScenarios();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedScenario) {
    let gal = Array.isArray(selectedScenario.galleryUrls) ? selectedScenario.galleryUrls : (typeof selectedScenario.galleryUrls === 'string' ? JSON.parse(selectedScenario.galleryUrls) : []);
    
    return (
      <div className="character-detail-page animation-fade-in">
        <button className="btn-secondary back-btn" onClick={() => setSelectedScenario(null)}>
          <ChevronLeft size={16} /> Mapa de Escenarios
        </button>

        <div className="profile-header">
           <div className="profile-avatar-large" style={{borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', aspectRatio:'16/9', width:'250px', height:'140px'}}>
               {selectedScenario.coverUrl ? (
                 <img src={selectedScenario.coverUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="cover"/>
               ) : (
                 <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><Map size={32} color="var(--border-color)"/></div>
               )}
           </div>
           
           <div className="profile-header-info">
              <h1>{selectedScenario.name}</h1>
              <div className="profile-badges">
                <span className="badge badge-primary"><Flag size={14}/> {selectedScenario.era || 'Era Desconocida'}</span>
                <span className="badge badge-secondary" style={{display: 'flex', alignItems: 'center', gap: '0.2rem'}}><MapPin size={14}/> {selectedScenario.location || 'Ubicación Desconocida'}</span>
              </div>
              <div className="profile-actions">
                <button className="btn-secondary" onClick={(e) => openEditModal(selectedScenario, e)}>
                  <Edit size={16} /> Editar Registros
                </button>
                {selectedScenario.coverUrl && (
                  <button className="btn-secondary" onClick={() => downloadFile(selectedScenario.coverUrl, `${selectedScenario.name}_cover.jpg`)}>
                    <Download size={16} /> Descargar Cover
                  </button>
                )}
              </div>
           </div>
        </div>

        <div className="profile-grid-top">
           
           <div className="profile-section-card glass-panel" style={{borderLeft: '4px solid var(--primary-color)'}}>
               <h3><BookOpen size={18} className="icon-gold"/> Diseño e Historia (Identidad del lugar)</h3>
               <div style={{background:'var(--bg-background)', padding:'1rem', borderRadius:'8px', whiteSpace:'pre-wrap', lineHeight:'1.6'}}>
                  <strong style={{display:'block', color:'var(--text-muted)', fontSize:'0.8rem', marginBottom:'0.3rem'}}>DESCRIPCIÓN GENERAL</strong>
                  {selectedScenario.description || 'Sin descripción base de la época.'}
               </div>
               
               <div style={{marginTop:'1.5rem', background:'var(--bg-background)', padding:'1rem', borderRadius:'8px', borderLeft:'3px solid var(--primary-color)'}}>
                  <strong style={{display:'block', color:'var(--text-muted)', fontSize:'0.8rem', marginBottom:'0.3rem'}}>CONTEXTO SOCIOCULTURAL</strong>
                  <p style={{marginTop:'0.25rem', fontSize:'0.95rem', whiteSpace: 'pre-wrap'}}>{selectedScenario.culturalContext || 'Ninguno especificado.'}</p>
               </div>
           </div>

           <div className="profile-section-card glass-panel" style={{border: '1px solid var(--border-color)'}}>
               <h3><Camera size={18} className="icon-orange"/> Prompts Visuales e Iluminación</h3>
               <div style={{display:'grid', gridTemplateColumns:'1fr', gap:'1.5rem'}}>
                 
                 <div style={{background:'rgba(255,107,0,0.05)', padding:'1rem', borderRadius:'8px', border:'1px solid rgba(255,107,0,0.1)'}}>
                    <strong style={{color:'var(--primary-color)', fontSize:'0.85rem'}}>Visiual Prompt Base (Midjourney)</strong>
                    <p style={{marginTop:'0.25rem', fontFamily:'monospace', fontSize:'0.9rem', whiteSpace:'pre-wrap'}}>{selectedScenario.visualPrompt || 'Sin prompt de entorno.'}</p>
                 </div>

                 <div style={{background:'var(--bg-background)', padding:'1rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}>
                    <strong style={{display: 'flex', alignItems: 'center', gap: '0.3rem', color:'var(--text-primary)', fontSize:'0.85rem'}}><ThermometerSun size={14}/> Atmósfera y Clima</strong>
                    <p style={{marginTop:'0.25rem', fontSize:'0.9rem', whiteSpace:'pre-wrap'}}>{selectedScenario.atmosphere || 'Dejar a libre interpretación'}</p>
                 </div>

                 {selectedScenario.negativePrompt && (
                   <div style={{background:'rgba(239, 68, 68, 0.05)', padding:'1rem', borderRadius:'8px', border:'1px solid rgba(239, 68, 68, 0.2)'}}>
                      <strong style={{color:'var(--danger-color)', fontSize:'0.85rem'}}>Negative Prompt del Escenario</strong>
                      <p style={{marginTop:'0.25rem', fontFamily:'monospace', fontSize:'0.9rem', color:'var(--danger-color)'}}>{selectedScenario.negativePrompt}</p>
                   </div>
                 )}

               </div>
           </div>

        </div>

        <div className="profile-section-card glass-panel" style={{marginTop: '2rem'}}>
           <h3>Galería Visual de Referencia</h3>
           <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'1.5rem'}}>
             Útiles para alimentar Modelos de Imagen mediante --sref, ControlNet, etc.
           </p>
           {gal.length === 0 ? (
             <div className="panel" style={{textAlign: 'center', padding: '2rem'}}>Sin referencias.</div>
           ) : (
             <div className="image-gallery">
               {gal.map((url, i) => (
                 <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="gallery-item" style={{aspectRatio: '16/9'}}>
                   <img src={url} alt={`Scen Ref ${i}`} style={{objectFit: 'cover'}}/>
                 </a>
               ))}
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="characters-page">
      <header className="top-bar sticky-header">
        <div className="top-bar-content">
          <h1>Directorio de Escenarios (Entornos IA)</h1>
          <p className="subtitle">Mundos, épocas y localizaciones físicas clave de tus historias.</p>
        </div>
        <div className="top-bar-actions">
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Diseñar Escenario
          </button>
        </div>
      </header>

      <div className="characters-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'}}>
        {scenarios.map(s => (
          <div key={s.id} className="character-card glass-panel" onClick={() => setSelectedScenario(s)}>
             <div style={{width: '100%', height: '150px', overflow: 'hidden', borderBottom: '1px solid var(--border-color)', position: 'relative', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', margin: '-1.5rem -1.5rem 1rem -1.5rem', width: 'calc(100% + 3rem)'}}>
                {s.coverUrl ? (
                  <img src={s.coverUrl} alt={s.name} style={{width:'100%', height:'100%', objectFit:'cover', opacity: 0.9}}/>
                ) : (
                  <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-elevated)'}}><Map size={32} color="var(--border-color)"/></div>
                )}
             </div>
             <div className="character-info" style={{alignItems: 'flex-start'}}>
               <h3 style={{fontSize: '1.2rem', marginBottom: '0.3rem'}}>{s.name}</h3>
               <p className="character-role" style={{marginBottom: '0.2rem', color: 'var(--primary-color)'}}>{s.era || 'Época Universal'}</p>
               <span className="character-channel" style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}><MapPin size={12}/> {s.location || 'Localización libre'}</span>
             </div>
             <div className="character-footer">
               <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openEditModal(s, e); }}><Edit size={16}/></button>
               <button className="btn-icon" style={{color: 'var(--danger-color)'}} onClick={(e) => { handleDelete(s.id, e); }}><Trash2 size={16}/></button>
             </div>
          </div>
        ))}
      </div>

      {scenarios.length === 0 && (
        <div className="panel" style={{textAlign: 'center', padding: '4rem'}}>
          <Map size={60} style={{margin:'0 auto 1.5rem', color:'var(--text-muted)'}}/>
          <p>Tu universo aún no tiene ubicaciones físicas registradas.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal" style={{maxWidth: '900px'}}>
            <div className="modal-header">
              <h2>{formData.id ? 'Ajustar Localización' : 'Diseñar Nuevo Escenario'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="advanced-form">
              <div className="form-grid" style={{gridTemplateColumns: 'minmax(300px, 1fr) minmax(350px, 1fr)', gap:'2rem'}}>
                
                {/* COLUMNA 1: BASES */}
                <div className="form-column">
                  <h3><MapPin size={16} className="icon-gold"/> Datos Básicos</h3>
                  <div className="form-group">
                    <label>Título del Escenario *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Las Calles de Ámsterdam" />
                  </div>
                  
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                    <div className="form-group"><label>Época</label><input type="text" value={formData.era} onChange={e=>setFormData({...formData, era:e.target.value})} placeholder="Siglo XVII"/></div>
                    <div className="form-group"><label>Lugar Real</label><input type="text" value={formData.location} onChange={e=>setFormData({...formData, location:e.target.value})} placeholder="Países Bajos"/></div>
                  </div>
                  
                  <div className="form-group">
                    <label>Breve Descripción</label>
                    <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="La urbe naval más rica del siglo de oro..."></textarea>
                  </div>
                  <div className="form-group" style={{background:'var(--bg-background)', padding:'1rem', borderRadius:'8px', border:'1px dashed var(--border-color)'}}>
                    <label style={{display:'block', marginBottom:'0.5rem', fontWeight:'bold', fontSize:'0.85rem'}}>Imagen Principal (Cartel)</label>
                    {formData.existingCover && !formData.cover && <img src={formData.existingCover} style={{width:'100%', height:'80px', objectFit:'cover', borderRadius:'4px', marginBottom:'0.5rem'}} alt="o" />}
                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, cover: e.target.files[0]})} style={{width:'100%'}}/>
                  </div>
                </div>

                {/* COLUMNA 2: IA E IMAGINERÍA */}
                <div className="form-column">
                  <h3><Fingerprint size={16} className="icon-blue"/> ADN del Lugar (Instrucciones IA)</h3>
                  
                  <div className="form-group">
                    <label>Contexto Cultural (Para ChatGPT)</label>
                    <textarea rows="2" value={formData.culturalContext} onChange={e => setFormData({...formData, culturalContext: e.target.value})} placeholder="Mercaderes ostentosos, flores preciosas..."></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label style={{color:'var(--primary-color)'}}>Prompt Maestro de Entorno (Midjourney)</label>
                    <textarea rows="3" className="style-prompt" value={formData.visualPrompt} onChange={e => setFormData({...formData, visualPrompt: e.target.value})} placeholder="17th century dutch street, canals..."></textarea>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                    <div className="form-group">
                      <label>Atmósfera / Clima</label>
                      <input type="text" value={formData.atmosphere} onChange={e => setFormData({...formData, atmosphere: e.target.value})} placeholder="Niebla ligera, frío" />
                    </div>
                    <div className="form-group">
                      <label style={{color:'var(--danger-color)'}}>Negative Prompt</label>
                      <input type="text" className="style-negative" value={formData.negativePrompt} onChange={e => setFormData({...formData, negativePrompt: e.target.value})} placeholder="modern" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{display:'block', marginBottom:'0.5rem'}}>Galería Específica de Contexto (Opcional)</label>
                    <input type="file" multiple accept="image/*" onChange={handleGalleryChange} style={{width:'100%', padding:'0.5rem', border:'1px solid var(--border-color)', background:'var(--bg-background)', borderRadius:'4px'}}/>
                    {formData.existingGallery.length > 0 || formData.gallery.length > 0 ? (
                      <div style={{display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'10px'}}>
                        {formData.existingGallery.map((url, i) => (
                          <div key={i} style={{position:'relative', width:'40px', height:'40px'}}>
                            <img src={url} alt="g" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'4px'}}/>
                            <button type="button" onClick={()=>removeExistingGalleryImage(i)} style={{position:'absolute', top:'-5px', right:'-5px', background:'red', color:'white', border:'none', borderRadius:'50%', width:'16px', height:'16px', fontSize:'10px', cursor:'pointer'}}>x</button>
                          </div>
                        ))}
                        {formData.gallery.map((file, i) => (
                           <div key={`new-${i}`} style={{width:'40px', height:'40px', background:'var(--primary-color)', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'white'}}>+</div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                </div>

              </div>
              
              <div className="modal-footer" style={{marginTop:'2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{padding:'0.75rem 2.5rem', fontWeight:'bold'}}>
                  {isSubmitting ? 'Guardando...' : (formData.id ? 'Salvar Edición' : 'Crear Escenario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scenarios;
