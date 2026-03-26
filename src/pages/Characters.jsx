import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { uploadFile } from '../supabaseHelpers';
import { Users, MapPin, Tv, Edit, ChevronLeft, Plus, MessageSquare, Briefcase, Trash2, Camera, Smile, Video, Flame, Star, PlayCircle } from 'lucide-react';
import './Characters.css';

const INITIAL_FORM_STATE = { 
  id: null, name: '', channel_id: '', role: '', birthdate: '', expertise: '', 
  personality: '', catchphrases: '', history: '', clothing: '', visualPrompt: '', 
  bodyLanguage: '', renderingStyle: '', voicePrompt: '', negativePrompt: '', 
  profileImage: null, gallery: [], existingProfileImage: null, existingGallery: []
};

const Characters = () => {
  const [avatars, setAvatars] = useState([]);
  const [channels, setChannels] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { 
    fetchAvatars(); 
    fetchChannels(); 
    fetchProjects();
  }, []);

  const fetchAvatars = async () => {
    try {
      const { data, error } = await supabase.from('avatars').select('*').order('name');
      if (error) throw error;
      setAvatars(data || []);
      if (selectedAvatar) {
        const updated = (data || []).find(a => a.id === selectedAvatar.id);
        if (updated) setSelectedAvatar(updated);
      }
    } catch (e) {
      console.error(e.message);
    }
  };

  const fetchChannels = async () => {
    const { data } = await supabase.from('channels').select('id, title');
    setChannels(data || []);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*');
    setProjects(data || []);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("¿Seguro que quieres borrar a este viajero de la historia?")) return;
    try {
      await supabase.from('avatars').delete().eq('id', id);
      if (selectedAvatar && selectedAvatar.id === id) setSelectedAvatar(null);
      fetchAvatars();
    } catch (e) {
      alert("Error borrando viajero: " + e.message);
    }
  };

  const openCreateModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setShowModal(true);
  };

  const openEditModal = (av, e) => {
    if (e) e.stopPropagation();
    setFormData({
      id: av.id,
      name: av.name || '',
      channel_id: av.channel_id || '',
      role: av.role || '',
      birthdate: av.birthdate || '',
      expertise: av.expertise || '',
      personality: av.personality || '',
      catchphrases: av.catchphrases || '',
      history: av.history || '',
      clothing: av.clothing || '',
      visualPrompt: av.visualPrompt || '',
      bodyLanguage: av.bodyLanguage || '',
      renderingStyle: av.renderingStyle || '',
      voicePrompt: av.voicePrompt || '',
      negativePrompt: av.negativePrompt || '',
      profileImage: null,
      gallery: [],
      existingProfileImage: av.profileImage || null,
      existingGallery: Array.isArray(av.galleryUrls) ? av.galleryUrls : (typeof av.galleryUrls === 'string' ? JSON.parse(av.galleryUrls) : [])
    });
    setShowModal(true);
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.existingGallery.length + formData.gallery.length > 10) {
      alert("Máximo 10 fotos por galería.");
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
      let profileUrl = formData.existingProfileImage;
      if (formData.profileImage instanceof File) {
        profileUrl = await uploadFile(formData.profileImage, 'avatars');
      }

      const galUrls = [...formData.existingGallery];
      for (let file of formData.gallery) {
        if (file instanceof File) {
          const u = await uploadFile(file, 'avatars');
          if (u) galUrls.push(u);
        }
      }

      const payload = {
        name: formData.name,
        channel_id: formData.channel_id || null,
        role: formData.role,
        birthdate: formData.birthdate,
        expertise: formData.expertise,
        personality: formData.personality,
        catchphrases: formData.catchphrases,
        history: formData.history,
        clothing: formData.clothing,
        visualPrompt: formData.visualPrompt,
        bodyLanguage: formData.bodyLanguage,
        renderingStyle: formData.renderingStyle,
        voicePrompt: formData.voicePrompt,
        negativePrompt: formData.negativePrompt,
        profileImage: profileUrl,
        galleryUrls: galUrls
      };

      if (formData.id) {
        await supabase.from('avatars').update(payload).eq('id', formData.id);
      } else {
        await supabase.from('avatars').insert([payload]);
      }
      
      setShowModal(false);
      fetchAvatars();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChannelName = (channelId) => {
    const ch = channels.find(c => c.id === channelId);
    return ch ? ch.title : "Viajero Libre";
  };

  if (selectedAvatar) {
    let gal = Array.isArray(selectedAvatar.galleryUrls) ? selectedAvatar.galleryUrls : (typeof selectedAvatar.galleryUrls === 'string' ? JSON.parse(selectedAvatar.galleryUrls) : []);
    
    // Calcular Filmografía y Métricas
    const charProjects = projects.filter(p => {
      let ids = Array.isArray(p.character_ids) ? p.character_ids : (typeof p.character_ids==='string'?JSON.parse(p.character_ids||'[]'):[]);
      return ids.includes(selectedAvatar.id);
    });
    
    const totalAvatarViews = charProjects.reduce((acc, p) => {
      let metrics = typeof p.metrics === 'string' ? JSON.parse(p.metrics) : (p.metrics || {views:0});
      return acc + (metrics.views || 0);
    }, 0);
    
    const totalAvatarLikes = charProjects.reduce((acc, p) => {
      let metrics = typeof p.metrics === 'string' ? JSON.parse(p.metrics) : (p.metrics || {likes:0});
      return acc + (metrics.likes || 0);
    }, 0);

    const isStar = totalAvatarViews > 10000;

    return (
      <div className="character-detail-page animation-fade-in">
        <button className="btn-secondary back-btn" onClick={() => setSelectedAvatar(null)}>
          <ChevronLeft size={16} /> Fichas de Reparto
        </button>

        <div className="profile-header">
           <img className="profile-avatar-large" src={selectedAvatar.profileImage || '/placeholder.jpg'} alt={selectedAvatar.name}/>
           <div className="profile-header-info">
              <h1>{selectedAvatar.name} {isStar && <Star size={24} fill="var(--gold-color)" color="var(--gold-color)" style={{marginLeft:'0.5rem', display:'inline'}} title="Estrella del Multiverso"/>}</h1>
              <div className="profile-badges">
                <span className="badge badge-primary"><Briefcase size={14}/> {selectedAvatar.role || 'Explorador'}</span>
                <span className="badge badge-secondary"><Tv size={14}/> {getChannelName(selectedAvatar.channel_id)}</span>
                <span className="badge" style={{background:'rgba(255, 107, 0, 0.2)', color:'var(--primary-color)'}}><PlayCircle size={14}/> {charProjects.length} Proyectos</span>
              </div>
              <div className="profile-actions">
                <button className="btn-secondary" onClick={(e) => openEditModal(selectedAvatar, e)}>
                  <Edit size={16} /> Editar Perfil & Prompts
                </button>
              </div>
           </div>
        </div>

        {/* CINE / METRICAS AÑADIDO EN LA FASE 17 */}
        <div className="profile-section-card glass-panel" style={{marginTop: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--primary-color)', background: 'linear-gradient(90deg, rgba(20,20,25,0.9) 0%, rgba(255,107,0,0.05) 100%)'}}>
          <h3 style={{color:'var(--primary-color)'}}><Video size={18} className="icon-orange"/> Filmografía y Popularidad</h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 3fr', gap:'2rem', marginTop:'1rem'}}>
             <div style={{background:'var(--bg-background)', padding:'1.5rem', borderRadius:'8px', textAlign:'center', border:'1px solid var(--border-color)'}}>
                <h4 style={{fontSize:'2.5rem', color:'var(--primary-color)', margin:0, textShadow:'0 0 10px rgba(255,107,0,0.3)'}}>{(totalAvatarViews/1000).toFixed(1)}k</h4>
                <p style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>Vistas Acumuladas</p>
                <div style={{margin:'1rem 0', height:'1px', background:'var(--border-color)'}}></div>
                <h4 style={{fontSize:'1.5rem', color:'var(--green-color)', margin:0}}>{(totalAvatarLikes/1000).toFixed(1)}k</h4>
                <p style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>Likes Totales</p>
             </div>
             <div>
                {charProjects.length === 0 ? (
                   <p className="no-data">Este viajero aún no ha debutado en ninguna película o proyecto.</p>
                ) : (
                   <div style={{display:'flex', flexDirection:'column', gap:'0.75rem', maxHeight:'200px', overflowY:'auto', paddingRight:'10px'}}>
                     {charProjects.map(p => {
                       let pMet = typeof p.metrics === 'string' ? JSON.parse(p.metrics) : (p.metrics || {views:0});
                       return (
                         <div key={p.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-background)', padding:'0.75rem 1rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}>
                            <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                              <img src={p.coverUrl || '/placeholder.jpg'} alt="c" style={{width:'40px', height:'40px', borderRadius:'4px', objectFit:'cover'}}/>
                              <div>
                                <strong style={{display:'block', fontSize:'0.9rem', color:'var(--text-primary)'}}>{p.title}</strong>
                                <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{p.status}</span>
                              </div>
                            </div>
                            <div style={{textAlign:'right'}}>
                               <span style={{display:'block', fontSize:'0.9rem', color:'var(--green-color)', fontWeight:'bold'}}>{(pMet.views/1000).toFixed(1)}k <Eye size={12} style={{display:'inline'}}/></span>
                            </div>
                         </div>
                       )
                     })}
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* LA PARTE PRINCIPAL LORE E IA */}
        <div className="profile-grid-top">
           <div className="profile-section-card glass-panel" style={{borderLeft: '4px solid var(--primary-color)'}}>
               <h3><MessageSquare size={18} className="icon-blue"/> Comportamiento e Identidad</h3>
               <p style={{fontSize:'0.95rem', color:'var(--text-secondary)', marginBottom:'1rem'}}>Instrucciones para ChatGPT / ElevenLabs.</p>
               <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                 <div style={{background:'var(--bg-background)', padding:'1rem', borderRadius:'8px'}}>
                    <strong style={{color:'var(--text-primary)', fontSize:'0.85rem'}}>Background / Especialidad</strong>
                    <p style={{marginTop:'0.25rem', fontSize:'0.95rem'}}>{selectedAvatar.expertise || 'Generalista'}</p>
                 </div>
                 <div style={{background:'var(--bg-background)', padding:'1rem', borderRadius:'8px'}}>
                    <strong style={{color:'var(--primary-color)', fontSize:'0.85rem'}}>Voz Base / Clon de Audio (ElevenLabs)</strong>
                    <p style={{marginTop:'0.25rem', fontFamily:'monospace', fontSize:'0.9rem'}}>{selectedAvatar.voicePrompt || 'Sin asignación de voz.'}</p>
                 </div>
                 <div style={{background:'var(--bg-background)', padding:'1rem', borderRadius:'8px'}}>
                    <strong style={{color:'var(--primary-color)', fontSize:'0.85rem'}}>Personalidad (ChatGPT)</strong>
                    <p style={{marginTop:'0.25rem', fontSize:'0.95rem'}}>{selectedAvatar.personality || 'Neutral'}</p>
                 </div>
                 <div style={{background:'rgba(56, 189, 248, 0.05)', padding:'1rem', borderRadius:'8px', borderLeft:'3px solid #38bdf8'}}>
                    <strong style={{color:'#38bdf8', fontSize:'0.85rem'}}>Muletillas, Gestos y Forma de Hablar</strong>
                    <p style={{marginTop:'0.25rem', fontStyle:'italic'}}>"{selectedAvatar.catchphrases || '...'}"</p>
                 </div>
               </div>
           </div>

           <div className="profile-section-card glass-panel" style={{gridColumn: '1 / -1', border: '1px solid var(--border-color)'}}>
               <h3><Camera size={18} className="icon-orange"/> Guía de Generación Visual (Midjourney / Runway)</h3>
               <p style={{fontSize:'0.95rem', color:'var(--text-secondary)', marginBottom:'1rem'}}>Esta sección es <strong>crítica</strong> para mantener la consistencia al renderizar al actor.</p>
               <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1.5rem'}}>
                 <div style={{background:'rgba(255,107,0,0.05)', padding:'1rem', borderRadius:'8px', border:'1px solid rgba(255,107,0,0.2)'}}>
                    <strong style={{color:'var(--primary-color)', fontSize:'0.85rem'}}>Prompt Visual (Cara, Ropa y Cuerpo)</strong>
                    <p style={{marginTop:'0.25rem', fontFamily:'monospace', fontSize:'0.9rem', whiteSpace:'pre-wrap'}}>{selectedAvatar.visualPrompt || 'Sin prompt base.'}</p>
                 </div>
                 <div style={{background:'var(--bg-background)', padding:'1rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}>
                    <strong style={{color:'var(--text-primary)', fontSize:'0.85rem'}}>Estilo de Render Específico (Opcional)</strong>
                    <p style={{marginTop:'0.25rem', fontSize:'0.9rem', whiteSpace:'pre-wrap'}}>{selectedAvatar.renderingStyle || 'Ninguno (Dejar heredar Universo)'}</p>
                 </div>
               </div>
           </div>
        </div>

        <div className="profile-section-card glass-panel" style={{marginTop: '2rem'}}>
           <h3>Galería de Referencias Visuales (Seed Images)</h3>
           <p style={{fontSize:'0.95rem', color:'var(--text-secondary)', marginBottom:'1.5rem'}}>
             Usa estas imágenes en Midjourney con <code>--cref</code> o como inputs para mantener su cara idéntica en cualquier disfraz de época.
           </p>
           {gal.length === 0 ? (
             <div className="panel" style={{textAlign: 'center', padding: '2rem'}}>Sin imágenes de referencia. Sube fotos desde varios ángulos.</div>
           ) : (
             <div className="image-gallery">
               {gal.map((url, i) => (
                 <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="gallery-item">
                   <img src={url} alt={`Ref ${i}`}/>
                   <div className="gallery-overlay"><span style={{fontSize:'0.75rem', background:'black', padding:'2px 4px', borderRadius:'4px'}}>Copiar URL</span></div>
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
          <h1>Sala de Casting (Bases de Datos AI)</h1>
          <p className="subtitle">Explora y edita las personalidades maestras y los comandos visuales de tu plantilla.</p>
        </div>
        <div className="top-bar-actions">
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Crear Viajero / Actor
          </button>
        </div>
      </header>

      <div className="characters-grid">
        {avatars.map(av => {
          // Compute character impact for highlight
          const charProjects = projects.filter(p => {
             let ids = Array.isArray(p.character_ids) ? p.character_ids : (typeof p.character_ids==='string'?JSON.parse(p.character_ids||'[]'):[]);
             return ids.includes(av.id);
          });
          const totalViews = charProjects.reduce((acc, p) => {
             let m = typeof p.metrics === 'string' ? JSON.parse(p.metrics) : (p.metrics || {views:0});
             return acc + (m.views || 0);
          }, 0);
          const isStar = totalViews > 10000;

          return (
            <div key={av.id} className={`character-card glass-panel ${isStar ? 'star-border' : ''}`} onClick={() => setSelectedAvatar(av)} style={{borderColor: isStar ? 'var(--gold-color)' : 'var(--border-color)'}}>
               {isStar && <div style={{position:'absolute', top:'10px', right:'10px', background:'var(--bg-elevated)', borderRadius:'50%', padding:'5px', zIndex:10}}><Star size={16} fill="var(--gold-color)" color="var(--gold-color)"/></div>}
               <img className="character-avatar" src={av.profileImage || '/placeholder.jpg'} alt={av.name} />
               <div className="character-info">
                 <h3>{av.name}</h3>
                 <p className="character-role">{av.role || 'Explorador'}</p>
                 <span className="character-channel"><Tv size={12}/> {getChannelName(av.channel_id)}</span>
               </div>
               <div className="character-footer">
                 <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openEditModal(av, e); }}><Edit size={16}/></button>
                 <button className="btn-icon" style={{color: 'var(--danger-color)'}} onClick={(e) => { handleDelete(av.id, e); }}><Trash2 size={16}/></button>
               </div>
            </div>
          )
        })}
      </div>

      {avatars.length === 0 && (
        <div className="panel" style={{textAlign: 'center', padding: '4rem'}}>
          <Users size={60} style={{margin:'0 auto 1.5rem', color:'var(--text-muted)'}}/>
          <p>No tienes viajeros en el tiempo registrados.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal" style={{maxWidth: '1200px'}}>
            <div className="modal-header">
              <h2>{formData.id ? 'Editar Ficha del Actor' : 'Contratar Nuevo Actor (Creación IA)'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="advanced-form">
              <div className="form-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '3rem'}}>
                
                <div className="form-column">
                  <h3 style={{borderBottom:'1px solid var(--border-color)', paddingBottom:'0.5rem', marginBottom:'1.5rem'}}><Smile size={18} className="icon-gold"/> Datos Maestros y Comportamiento</h3>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                     <div className="form-group">
                       <label>Nombre del Viajero / Actor *</label>
                       <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Dr. Kronos" />
                     </div>
                     <div className="form-group">
                       <label>Canal Principal</label>
                       <select value={formData.channel_id} onChange={e => setFormData({...formData, channel_id: e.target.value || null})}>
                         <option value="">-- Multicanal (Libre) --</option>
                         {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
                       </select>
                     </div>
                  </div>
                  
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                    <div className="form-group"><label>Rol</label><input type="text" value={formData.role} onChange={e=>setFormData({...formData, role:e.target.value})} placeholder="Host/Villano"/></div>
                    <div className="form-group"><label>Especialidad</label><input type="text" value={formData.expertise} onChange={e=>setFormData({...formData, expertise:e.target.value})} placeholder="Historia Romana..."/></div>
                  </div>

                  <div className="form-group" style={{marginTop:'1.5rem'}}>
                    <label style={{color:'var(--blue-color)'}}>Personalidad General (Prompt ChatGPT)</label>
                    <textarea rows="2" value={formData.personality} onChange={e => setFormData({...formData, personality: e.target.value})} placeholder="Sarcástico, inteligente, pero despistado..."></textarea>
                  </div>
                  <div className="form-group">
                    <label style={{color:'var(--primary-color)'}}>Muletillas, Gestos y Forma de hablar *CRUCIAL ALGORTÍMICO*</label>
                    <textarea rows="3" value={formData.catchphrases} onChange={e => setFormData({...formData, catchphrases: e.target.value})} placeholder='Fuma en pipa, camina nervioso. Frases: "Como siempre digo...", "Ah, la historia..."'></textarea>
                  </div>
                  <div className="form-group">
                    <label>Voz (Prompt ElevenLabs o Base de voz)</label>
                    <input type="text" value={formData.voicePrompt} onChange={e => setFormData({...formData, voicePrompt: e.target.value})} placeholder="Voz profunda de investigador..." />
                  </div>
                </div>

                <div className="form-column">
                  <h3 style={{borderBottom:'1px solid var(--border-color)', paddingBottom:'0.5rem', marginBottom:'1.5rem'}}><Camera size={18} className="icon-orange"/> Guía de IA Visual (Midjourney)</h3>
                  
                  <div style={{background:'var(--bg-elevated)', padding:'1rem', borderRadius:'12px', marginBottom:'1.5rem'}}>
                    <label style={{display:'block', marginBottom:'0.5rem', fontWeight:'bold', fontSize:'0.9rem', color:'var(--text-primary)'}}>Foto de Perfil Ppal (Rostro Claro)</label>
                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, profileImage: e.target.files[0]})} style={{width:'100%'}}/>
                  </div>

                  <div className="form-group">
                    <label style={{color:'var(--gold-color)'}}>Prompt Visual Base (Cara, Cuerpo y Ropa habitual)</label>
                    <textarea rows="5" className="style-prompt" value={formData.visualPrompt} onChange={e => setFormData({...formData, visualPrompt: e.target.value})} placeholder="35yo male, sharp jawline, short brown hair, piercing blue eyes, realistic. Wearing a Victorian era dirty suit, silver pocket watch."></textarea>
                  </div>

                  <div className="form-group">
                    <label style={{display:'block', marginBottom:'0.5rem'}}>Galería Reference (Seed Images para --cref)</label>
                    <input type="file" multiple accept="image/*" onChange={handleGalleryChange} style={{width:'100%', padding:'0.5rem', border:'1px dashed var(--border-color)', background:'var(--bg-background)', borderRadius:'8px'}}/>
                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'15px'}}>
                      {formData.existingGallery.map((url, i) => (
                        <div key={i} style={{position:'relative', width:'60px', height:'60px'}}>
                          <img src={url} alt="g" style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'8px'}}/>
                          <button type="button" onClick={()=>removeExistingGalleryImage(i)} style={{position:'absolute', top:'-6px', right:'-6px', background:'var(--danger-color)', color:'white', border:'none', borderRadius:'50%', width:'18px', height:'18px', fontSize:'12px', cursor:'pointer'}}>x</button>
                        </div>
                      ))}
                      {formData.gallery.map((file, i) => (
                         <div key={`new-${i}`} style={{width:'60px', height:'60px', background:'var(--primary-color)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:'white', fontWeight:'bold'}}>Nuevo</div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
              <div className="modal-footer" style={{marginTop:'2rem'}}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Atrás</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting} style={{padding:'0.75rem 2.5rem'}}>{isSubmitting ? 'Codificando IA...' : (formData.id ? 'Guardar Cambios' : 'Contratar Viajero')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Characters;
