import { decode } from 'base64-arraybuffer';

/**
 * Shared image upload validation utility.
 * Used by both logo upload (businessSettings.ts) and avatar upload (profiles.ts)
 * to avoid duplicating validation logic.
 */

export interface ValidatedImage {
  arrayBuffer: ArrayBuffer;
  ext: string;
  mimeType: string;
}

export interface ImageValidationError {
  code: 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'FETCH_FAILED';
  message: string;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

/**
 * Fetches/decodes an image from URI or base64, validates its size and type, and returns an ArrayBuffer.
 * Works seamlessly across Web, iOS, and Android.
 */
export async function validateAndFetchImage(
  imageUri: string,
  providedMimeType?: string,
  base64Data?: string,
): Promise<{ data: ValidatedImage | null; error: ImageValidationError | null }> {
  // Determine file extension from providedMimeType or URI
  const uriLower = imageUri.toLowerCase();
  const lowerMime = (providedMimeType || '').toLowerCase();
  let ext = 'png';
  let mimeType = providedMimeType || 'image/png';

  if (lowerMime.includes('jpeg') || lowerMime.includes('jpg')) {
    ext = 'jpg';
    mimeType = 'image/jpeg';
  } else if (lowerMime.includes('png')) {
    ext = 'png';
    mimeType = 'image/png';
  } else if (uriLower.includes('.jpg') || uriLower.includes('.jpeg')) {
    ext = 'jpg';
    mimeType = 'image/jpeg';
  } else if (uriLower.includes('.png')) {
    ext = 'png';
    mimeType = 'image/png';
  }

  let arrayBuffer: ArrayBuffer;
  let fileSize: number;

  if (base64Data) {
    try {
      arrayBuffer = decode(base64Data);
      fileSize = arrayBuffer.byteLength;
    } catch {
      return {
        data: null,
        error: { code: 'FETCH_FAILED', message: 'Failed to decode image data.' },
      };
    }
  } else {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      arrayBuffer = await response.arrayBuffer();
      fileSize = blob.size;
    } catch {
      return {
        data: null,
        error: { code: 'FETCH_FAILED', message: 'Failed to read image file.' },
      };
    }
  }

  // Validate file size (max 2MB)
  if (fileSize > MAX_SIZE) {
    return {
      data: null,
      error: { code: 'FILE_TOO_LARGE', message: 'Image must be under 2MB.' },
    };
  }

  return { data: { arrayBuffer, ext, mimeType }, error: null };
}
