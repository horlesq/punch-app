import { supabase } from '@/src/lib/supabase';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';
import type { Tables } from '@/src/types/database';
import { validateAndFetchImage } from '@/src/utils/imageUpload';

export type BusinessSettings = Tables<'business_settings'>;

/**
 * Fetch the single business_settings row.
 * Every Supabase instance has exactly one row seeded by the Phase 2 migration.
 */
export async function getBusinessSettings(): Promise<{
  data: BusinessSettings | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

/**
 * Update branding fields only (business name, logo, colors).
 * Separate from rules so admin can save branding independently.
 */
export async function updateBranding(
  businessName: string,
  logoUrl: string | null,
  primaryColor: string,
  accentColor: string | null,
  themeMode: 'light' | 'dark' = 'light'
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('business_settings')
    .update({
      business_name: businessName,
      logo_url: logoUrl,
      primary_color: primaryColor,
      accent_color: accentColor,
      theme_mode: themeMode,
    })
    .not('id', 'is', null); // Updates the single row

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

/**
 * Update business rules fields only (break settings, correction approval mode).
 * Separate from branding so admin can save rules independently.
 */
export async function updateRules(
  breakThresholdHours: number,
  breakDurationMinutes: number,
  correctionApprovalMode: 'auto' | 'manual'
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('business_settings')
    .update({
      break_threshold_hours: breakThresholdHours,
      break_duration_minutes: breakDurationMinutes,
      correction_approval_mode: correctionApprovalMode,
    })
    .not('id', 'is', null);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}

/**
 * Upload a logo image to Supabase Storage `branding` bucket.
 *
 * Validates:
 * - File type: jpg/png only
 * - File size: max 2MB
 *
 * Returns the public URL of the uploaded image.
 */
export async function uploadLogo(
  imageUri: string,
  providedMimeType?: string,
  base64Data?: string,
): Promise<{ url: string | null; error: Error | null }> {
  // Use shared validation utility
  const { data: validated, error: validationError } = await validateAndFetchImage(
    imageUri,
    providedMimeType,
    base64Data,
  );

  if (validationError || !validated) {
    return { url: null, error: new Error(validationError?.code ?? 'Validation failed') };
  }

  const { arrayBuffer, ext, mimeType } = validated;

  // Generate a unique filename
  const filename = `logo_${Date.now()}.${ext}`;
  const filePath = filename;

  // Remove any existing logo files first (cleanup)
  try {
    const { data: existingFiles } = await supabase.storage
      .from('branding')
      .list('', { limit: 100 });

    if (existingFiles && existingFiles.length > 0) {
      const logoFiles = existingFiles
        .filter((f) => f.name.startsWith('logo_'))
        .map((f) => f.name);

      if (logoFiles.length > 0) {
        await supabase.storage.from('branding').remove(logoFiles);
      }
    }
  } catch {
    // Non-critical — old files may remain, but upload can proceed
  }

  // Upload the new logo
  let { error: uploadError } = await supabase.storage
    .from('branding')
    .upload(filePath, arrayBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    const { error: adminUploadError } = await supabaseAdmin.storage
      .from('branding')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (adminUploadError) {
      return { url: null, error: new Error(adminUploadError.message) };
    }
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('branding')
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl, error: null };
}
