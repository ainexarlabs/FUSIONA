import { supabase, PROPERTY_PHOTOS_BUCKET } from './supabaseClient';

export function propertyPhotoUrl(storagePath: string) {
  const { data } = supabase.storage.from(PROPERTY_PHOTOS_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
