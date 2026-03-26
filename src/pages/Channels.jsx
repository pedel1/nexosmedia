import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { uploadFile } from '../supabaseHelpers';
import { Tv, Activity, Plus, Trash2, Edit, AlertTriangle } from 'lucide-react';
import './Channels.css';

const INITIAL_FORM_STATE = { id: null, title: '', topic: '', cover: null, existingCover: null, metrics: { subs: 0, views: 0, videos: 0 } };

const safeMetrics = (m) => {
  let def = { subs: 0, views: 0, videos: 0 };
  if (!m) return def;
  if (typeof m === 'object') return { ...def, ...m };
  if (typeof m === 'string') {
    try { return { ...def, ...JSON.parse(m) }; } catch (e) { return def; }
  }
  return def;
};

const Channels = () => {
  const [channels, setChannels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase.from('channels').select('*').order('title');
      if (error) throw error;
      setChannels(data || []);
    } catch (e) {
      console.error("Error al cargar canales:", e.message);
    }
  };

  const openCreateModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setShowModal(true);
  };

  const openEditModal = (ch) => {
    let mt = safeMetrics(ch.metrics);
    setFormData({ id: ch.id, title: ch.title, topic: ch.topic, cover: null, existingCover: ch.coverUrl, metrics: mt });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este canal y desenlazar sus avatares y proyectos?')) return;
    try {
      const { error } = await supabase.from('channels').delete().eq('id', id);
      if (error) throw error;
      fetchChannels();
    } catch (e) {
      alert("Error eliminando: " + e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalCoverUrl = formData.existingCover;
      if (formData.cover instanceof File) {
        finalCoverUrl = await uploadFile(formData.cover, 'channels');
      }

      const payload = {
        title: formData.title,
        topic: formData.topic,
        coverUrl: finalCoverUrl,
        metrics: formData.metrics
      };

      if (formData.id) {
        const { error } = await supabase.from('channels').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('channels').insert([payload]);
        if (error) throw error;
      }
      
      setShowModal(false);
      fetchChannels();
    } catch (e) {
      alert("Error guardando el canal: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="channels-page animation-fade-in">
      <header className="top-bar sticky-header">
        <div className="top-bar-content">
          <h1>Red de Canales (Cuentas)</h1>
          <p className="subtitle">Explora las distintas divisiones de NexosMedia.</p>
        </div>
        <div className="top-bar-actions">
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Agregar Nueva Cuenta
          </button>
        </div>
      </header>

      <div className="channels-grid">
        {channels.map((ch) => {
          let mt = safeMetrics(ch.metrics);
          return (
            <div key={ch.id} className="channel-card glass-panel" style={{overflow: 'hidden'}}>
              <div style={{height: '100px', background: 'var(--bg-background)', position: 'relative', borderBottom: '1px solid var(--border-color)'}}>
                 {ch.coverUrl ? (
                   <img src={ch.coverUrl} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6}} alt="cover"/>
                 ) : (
                   <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--border-color)'}}>
                     <Tv size={40} />
                   </div>
                 )}
                 <div style={{position: 'absolute', bottom: '-20px', left: '20px', width: '60px', height: '60px', background: 'var(--bg-surface)', borderRadius: '50%', border: '2px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Tv size={24} className="icon-orange" />
                 </div>
              </div>
              <div className="card-content" style={{padding: '2rem 1.5rem 1.5rem', marginTop: '10px'}}>
                <h3 className="card-title" style={{fontSize: '1.25rem', marginBottom: '0.2rem'}}>{ch.title}</h3>
                <p className="card-topic" style={{color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.2rem'}}>
                  <AlertTriangle size={14} /> {ch.topic || 'Sin temática'}
                </p>
                
                <div style={{display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px', margin: '1rem 0', border: '1px solid var(--border-color)'}}>
                  <div style={{textAlign: 'center'}}><strong style={{color: 'white', display: 'block'}}>{mt.subs}</strong><span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Seguidores</span></div>
                  <div style={{textAlign: 'center'}}><strong style={{color: 'white', display: 'block'}}>{mt.views}</strong><span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Visualizaciones</span></div>
                  <div style={{textAlign: 'center'}}><strong style={{color: 'white', display: 'block'}}>{mt.videos}</strong><span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Obras</span></div>
                </div>

                <div className="card-actions" style={{display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem'}}>
                  <button className="btn-icon" onClick={() => openEditModal(ch)}><Edit size={16} /></button>
                  <button className="btn-icon" style={{color: 'var(--danger-color)'}} onClick={() => handleDelete(ch.id)}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {channels.length === 0 && (
        <div className="panel" style={{textAlign: 'center', padding: '3rem'}}>
           <Tv size={48} style={{margin:'0 auto 1rem', color:'var(--text-muted)'}} />
           <p>Aún no hay canales registrados en tu red.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{formData.id ? 'Editar Canal' : 'Nuevo Canal'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="standard-form">
              <div className="form-group">
                <label>Nombre del Canal</label>
                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ej: Nexos Economy / Nexos History" />
              </div>
              <div className="form-group">
                <label>Temática Principal</label>
                <input type="text" value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} placeholder="Ej: Historia Económica, Cripto..." />
              </div>
              
              <div className="form-group" style={{background: 'var(--bg-background)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Activity size={16}/> Métricas (Manuales)</label>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '0.5rem'}}>
                  <div><span style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>Subs</span><input type="number" value={formData.metrics.subs} onChange={e => setFormData({...formData, metrics: {...formData.metrics, subs: parseInt(e.target.value)||0}})} /></div>
                  <div><span style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>Visitas</span><input type="number" value={formData.metrics.views} onChange={e => setFormData({...formData, metrics: {...formData.metrics, views: parseInt(e.target.value)||0}})} /></div>
                  <div><span style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>Vídeos</span><input type="number" value={formData.metrics.videos} onChange={e => setFormData({...formData, metrics: {...formData.metrics, videos: parseInt(e.target.value)||0}})} /></div>
                </div>
              </div>

              <div className="form-group">
                <label>Subir Banner Ppal (JPG/PNG)</label>
                <input type="file" accept="image/*" onChange={e => setFormData({...formData, cover: e.target.files[0]})} style={{padding: '0.5rem', border: '1px dashed var(--border-color)', width: '100%', background: 'transparent'}}/>
                {formData.existingCover && !formData.cover && <p style={{fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'0.5rem'}}>El canal ya tiene un banner guardado.</p>}
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Canal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channels;
