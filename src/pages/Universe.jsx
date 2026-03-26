import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Globe, BookOpen, Camera, Volume2, Film, AlertTriangle, Plus, Trash2, ArrowLeft, Edit } from 'lucide-react';
import './Universe.css';

const INITIAL_STATE = {
  id: null,
  name: '',
  lore: '',
  visualStyle: '',
  narrativeTone: '',
  negativePrompt: '',
  directorPrompt: '',
  soundscape: '',
  editingPacing: ''
};

const Universe = () => {
  const [universes, setUniverses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [formData, setFormData] = useState(INITIAL_STATE);

  useEffect(() => {
    fetchUniverses();
  }, []);

  const fetchUniverses = async () => {
    try {
      const { data, error } = await supabase.from('universe').select('*').order('name');
      if (error) throw error;
      setUniverses(data || []);
      if (selectedUniverse) {
        const updated = (data || []).find(u => u.id === selectedUniverse.id);
        if (updated) setSelectedUniverse(updated);
      }
    } catch (e) {
      console.error("Error al cargar los universos:", e.message);
    }
  };

  const openCreateModal = () => {
    setFormData(INITIAL_STATE);
    setShowModal(true);
  };

  const openEditModal = (univ, e) => {
    if (e) e.stopPropagation();
    setFormData(univ);
    setShowModal(true);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("¿Seguro que quieres borrar la Biblia de este Universo? Los proyectos que la usen perderán estas directrices.")) return;
    try {
      const { error } = await supabase.from('universe').delete().eq('id', id);
      if (error) throw error;
      if (selectedUniverse && selectedUniverse.id === id) setSelectedUniverse(null);
      fetchUniverses();
    } catch (e) {
      alert("Error borrando el universo: " + e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return alert("El nombre del Universo es obligatorio.");

    try {
      const payload = {
        name: formData.name,
        lore: formData.lore,
        visualStyle: formData.visualStyle,
        narrativeTone: formData.narrativeTone,
        negativePrompt: formData.negativePrompt,
        directorPrompt: formData.directorPrompt,
        soundscape: formData.soundscape,
        editingPacing: formData.editingPacing
      };

      if (formData.id) {
        const { error } = await supabase.from('universe').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('universe').insert([payload]);
        if (error) throw error;
      }
      
      setShowModal(false);
      fetchUniverses();
    } catch (e) {
      alert("Error guardando universo: " + e.message);
    }
  };

  if (selectedUniverse) {
    return (
      <div className="universe-page animation-fade-in">
        <header className="top-bar">
          <div className="top-bar-content">
            <h1>Biblia del Universo: {selectedUniverse.name}</h1>
            <p className="subtitle" style={{color: 'var(--text-secondary)'}}>Directrices maestras heredadas por los Proyectos.</p>
          </div>
          <div className="top-bar-actions">
            <button className="btn-secondary" onClick={() => setSelectedUniverse(null)}>
              <ArrowLeft size={16} /> Volver al Multiverso
            </button>
            <button className="btn-primary" onClick={(e) => openEditModal(selectedUniverse, e)}>
              <Edit size={16} /> Editar Mandamientos
            </button>
            <button className="btn-secondary" onClick={(e) => handleDelete(selectedUniverse.id, e)} style={{color:'var(--danger-color)', borderColor:'var(--danger-color)'}}>
              <Trash2 size={16} /> Borrar
            </button>
          </div>
        </header>

        <div className="universe-grid">
          
          <div className="universe-col">
            <div className="universe-section glass-panel">
              <h2 className="section-title"><BookOpen size={20} className="icon-gold"/> Premisa Cero / Lore Absoluto</h2>
              <div className="text-box" style={{fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace:'pre-wrap'}}>
                {selectedUniverse.lore || 'Sin lore definido.'}
              </div>
            </div>
            <div className="universe-section glass-panel">
              <h2 className="section-title"><Volume2 size={20} className="icon-blue"/> Tono Narrativo Global (Voz de Marca)</h2>
              <div className="text-box" style={{fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace:'pre-wrap'}}>
                {selectedUniverse.narrativeTone || 'Tono estándar no especificado.'}
              </div>
            </div>
            <div className="universe-section glass-panel">
              <h2 className="section-title"><Film size={20} className="icon-orange"/> Ritmo y Estilo de Edición (Pacing)</h2>
              <div className="text-box" style={{fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace:'pre-wrap'}}>
                {selectedUniverse.editingPacing || 'Estilo de montaje estándar no especificado.'}
              </div>
            </div>
          </div>

          <div className="universe-col">
            <div className="universe-section glass-panel" style={{border: '1px solid var(--primary-color)'}}>
              <h2 className="section-title"><Camera size={20} className="icon-orange"/> Master Prompt Visual (Generación de Imagen)</h2>
              <div className="prompt-box" style={{background: 'rgba(255,107,0,0.05)'}}>
                <p style={{fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--text-primary)'}}>{selectedUniverse.visualStyle || 'Ningún prompt universal añadido.'}</p>
              </div>
            </div>
            <div className="universe-section glass-panel" style={{border: '1px solid #38bdf8'}}>
              <h2 className="section-title" style={{color: '#38bdf8'}}><Film size={20} /> Prompt Director (Cámara y Animación)</h2>
              <div className="prompt-box" style={{background: 'rgba(56, 189, 248, 0.05)'}}>
                <p style={{fontFamily: 'monospace', fontSize: '0.95rem', color: '#38bdf8', whiteSpace:'pre-wrap'}}>{selectedUniverse.directorPrompt || 'Ningún movimiento de cámara definido.'}</p>
              </div>
            </div>
            <div className="universe-section glass-panel" style={{borderLeft: '4px solid var(--danger-color)'}}>
              <h2 className="section-title" style={{color: 'var(--danger-color)'}}><AlertTriangle size={20} /> Negative Prompt Universal</h2>
              <div className="prompt-box" style={{background: 'rgba(239, 68, 68, 0.05)'}}>
                <p style={{fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--danger-color)'}}>{selectedUniverse.negativePrompt || 'Vacío.'}</p>
              </div>
            </div>
            <div className="universe-section glass-panel">
              <h2 className="section-title"><Volume2 size={20} className="icon-blue"/> Diseño Sonoro (Soundscape)</h2>
              <div className="text-box" style={{fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)'}}>
                {selectedUniverse.soundscape || 'Sin pautas musicales.'}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="universe-page">
      <header className="top-bar sticky-header">
        <div className="top-bar-content">
          <h1>Directrices del Multiverso</h1>
          <p className="subtitle">Crea diferentes Biblias Universales para aglutinar tus proyectos.</p>
        </div>
        <div className="top-bar-actions">
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Forjar Nuevo Universo
          </button>
        </div>
      </header>

      <div className="universes-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'2rem', marginTop:'1rem'}}>
        {universes.map(univ => (
          <div key={univ.id} className="universe-card glass-panel" onClick={() => setSelectedUniverse(univ)} style={{padding:'2rem', cursor:'pointer', border:'1px solid var(--border-color)', borderRadius:'12px', transition:'all 0.2s'}}>
            <Globe size={40} className="icon-blue" style={{marginBottom:'1rem'}}/>
            <h3 style={{fontSize:'1.3rem', color:'var(--text-primary)', marginBottom:'0.5rem'}}>{univ.name}</h3>
            <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', lineHeight:'1.5', WebkitLineClamp:3, display:'-webkit-box', WebkitBoxOrient:'vertical', overflow:'hidden'}}>{univ.lore || 'Un universo virgen sin historia...'}</p>
            <div style={{marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontSize:'0.75rem', color:'var(--primary-color)', textTransform:'uppercase', letterSpacing:'0.5px'}}>Bibliotecas de IA</span>
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); openEditModal(univ, e); }}><Edit size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      {universes.length === 0 && (
        <div className="panel" style={{textAlign: 'center', padding: '4rem'}}>
          <Globe size={60} style={{margin:'0 auto 1.5rem', color:'var(--border-color)', display:'block'}}/>
          <p>No tienes ningún universo creado en tu Multiverso. ¡Añade tu primera Biblia de lore!</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal" style={{maxWidth:'1000px'}}>
            <div className="modal-header">
              <h2>{formData.id ? 'Editar Biblia del Universo' : 'Forjar Nuevo Universo'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="advanced-form">
              <div className="form-grid" style={{gridTemplateColumns:'1fr 1fr', gap:'2.5rem'}}>
                <div className="form-column">
                  <h3>Fundamentos del Mundo</h3>
                  <div className="form-group">
                    <label>Nombre del Universo *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Premisa Cero / Lore Absoluto</label>
                    <textarea rows="5" value={formData.lore} onChange={e => setFormData({...formData, lore: e.target.value})}></textarea>
                  </div>
                  <div className="form-group">
                    <label>Tono Narrativo Universal</label>
                    <textarea rows="3" value={formData.narrativeTone} onChange={e => setFormData({...formData, narrativeTone: e.target.value})}></textarea>
                  </div>
                  <div className="form-group">
                    <label>Ritmo y Estilo de Edición</label>
                    <textarea rows="2" value={formData.editingPacing} onChange={e => setFormData({...formData, editingPacing: e.target.value})}></textarea>
                  </div>
                </div>

                <div className="form-column">
                  <h3 style={{color:'var(--primary-color)'}}>Master Prompts</h3>
                  <div className="form-group">
                    <label style={{color:'var(--primary-color)'}}>Master Prompt Visual Global (Midjourney)</label>
                    <textarea rows="4" className="style-prompt" value={formData.visualStyle} onChange={e => setFormData({...formData, visualStyle: e.target.value})}></textarea>
                  </div>
                  <div className="form-group">
                    <label style={{color:'#38bdf8'}}>Prompt Director (Luma/Kling: Acción y Animación)</label>
                    <textarea rows="3" style={{background:'rgba(56,189,248,0.05)', color:'#38bdf8', border:'1px solid rgba(56,189,248,0.2)'}} value={formData.directorPrompt} onChange={e => setFormData({...formData, directorPrompt: e.target.value})} placeholder="Ej: Slow zoom, depth of field..."></textarea>
                  </div>
                  <div className="form-group">
                    <label style={{color:'var(--danger-color)'}}>Negative Prompt Universal</label>
                    <textarea rows="3" className="style-negative" value={formData.negativePrompt} onChange={e => setFormData({...formData, negativePrompt: e.target.value})}></textarea>
                  </div>
                  <div className="form-group">
                    <label>Diseño Sonoro (Soundscape)</label>
                    <textarea rows="3" value={formData.soundscape} onChange={e => setFormData({...formData, soundscape: e.target.value})}></textarea>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{padding:'0.75rem 2rem'}}>{formData.id ? 'Guardar Cambios' : 'Añadir Universo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Universe;
