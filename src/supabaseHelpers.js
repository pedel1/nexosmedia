import { supabase } from './supabase';

export const uploadFile = async (file, folder = '') => {
  if (!file) return null;
  // Si ya es un string (una URL existente), no la resubimos.
  if (typeof file === 'string') return file;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;
  
  const { data, error } = await supabase.storage.from('uploads').upload(filePath, file);
  if (error) {
    console.error("Supabase Upload Error:", error);
    throw new Error(`Error en Storage: ${error.message}. ¿Aseguraste crear el bucket 'uploads' como Público?`);
  }
  
  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);
  return publicUrl;
};
