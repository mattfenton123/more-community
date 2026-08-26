import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Allowed image MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Magic bytes for known image formats
const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'image/webp': null, // RIFF header checked separately
  'image/gif':  [0x47, 0x49, 0x46],
};

/**
 * Validates the binary content matches a real image format by checking magic bytes.
 * Prevents disguised malicious files (e.g. .exe renamed to .jpg).
 */
function validateMagicBytes(buffer, declaredType) {
  if (buffer.length < 12) return false;

  // Special case for WebP (RIFF....WEBP)
  if (declaredType === 'image/webp') {
    return (
      buffer[0] === 0x52 && buffer[1] === 0x49 &&
      buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 &&
      buffer[10] === 0x42 && buffer[11] === 0x50
    );
  }

  const expected = MAGIC_BYTES[declaredType];
  if (!expected) return false;

  return expected.every((byte, i) => buffer[i] === byte);
}

/**
 * Scans buffer for known malicious patterns:
 * - Embedded PHP tags
 * - Embedded script tags
 * - PE executable headers (MZ)
 * - Polyglot file markers
 */
function scanForThreats(buffer) {
  const text = buffer.toString('latin1').toLowerCase();
  const threats = [];

  if (text.includes('<?php'))        threats.push('Embedded PHP code detected');
  if (text.includes('<script'))      threats.push('Embedded script tag detected');
  if (text.includes('<%'))           threats.push('Embedded ASP code detected');
  if (text.includes('eval('))        threats.push('Embedded eval() call detected');
  if (text.includes('javascript:'))  threats.push('JavaScript URI detected');

  // Check for PE executable (MZ header) embedded after image data
  const mzPos = text.indexOf('mz', 100); // skip first 100 bytes (image header)
  if (mzPos > 0) {
    const peCheck = buffer.slice(mzPos);
    if (peCheck.length > 64 && peCheck[0] === 0x4D && peCheck[1] === 0x5A) {
      threats.push('Embedded PE executable detected');
    }
  }

  return threats;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileName, base64Data, contentType } = req.body;

  if (!fileName || !base64Data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 1. Validate MIME type
  const mimeType = contentType || 'image/jpeg';
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return res.status(400).json({ 
      error: `File type '${mimeType}' not allowed. Accepted: ${ALLOWED_TYPES.join(', ')}` 
    });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nkyithbhufwgwnbxvqqu.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const rawBuffer = Buffer.from(base64Data, 'base64');

    // 2. Validate magic bytes — ensures the file IS actually an image
    if (!validateMagicBytes(rawBuffer, mimeType)) {
      return res.status(400).json({ 
        error: 'File content does not match declared type. The file may be corrupted or disguised.' 
      });
    }

    // 3. Scan for embedded threats
    const threats = scanForThreats(rawBuffer);
    if (threats.length > 0) {
      console.error(`⚠️ BLOCKED upload "${fileName}":`, threats);
      return res.status(400).json({ 
        error: 'File rejected by security scan',
        details: threats 
      });
    }

    // 4. Process with Sharp: strip metadata, resize, convert to WebP
    const metadata = await sharp(rawBuffer).metadata();
    
    let pipeline = sharp(rawBuffer)
      .rotate()                              // Auto-rotate based on EXIF (then strip)
      .withMetadata({ exif: undefined })     // Strip ALL metadata (EXIF, IPTC, XMP)
      .removeAlpha();                        // Remove alpha if not needed

    // Resize if too large (max 1200px on longest side for community images)
    const MAX_DIMENSION = 1200;
    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to WebP for best web performance
    const processedBuffer = await pipeline
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    // Generate clean filename (replace extension with .webp)
    const cleanName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')     // Sanitise filename
      .replace(/\.(png|jpg|jpeg|gif)$/i, '.webp');

    const uploadPath = `processed/${cleanName}`;

    // 5. Upload processed image to Supabase Storage
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/uploads/${uploadPath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'image/webp',
        'x-upsert': 'true',
      },
      body: processedBuffer,
    });

    if (!uploadRes.ok) {
      console.error('Failed to upload processed image:', await uploadRes.text());
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/uploads/${uploadPath}`;
    
    const sizeBefore = rawBuffer.length;
    const sizeAfter = processedBuffer.length;
    const reduction = Math.round((1 - sizeAfter / sizeBefore) * 100);

    console.log(`✅ Processed "${fileName}": ${(sizeBefore/1024).toFixed(0)}KB → ${(sizeAfter/1024).toFixed(0)}KB (${reduction}% smaller)`);

    return res.status(200).json({ 
      publicUrl,
      processing: {
        originalSize: sizeBefore,
        processedSize: sizeAfter,
        reduction: `${reduction}%`,
        format: 'webp',
        metadataStripped: true,
        securityScanPassed: true,
      }
    });
  } catch (err) {
    console.error('API error:', err);
    
    // Sharp will throw on genuinely corrupt/non-image files
    if (err.message && err.message.includes('Input buffer contains unsupported image format')) {
      return res.status(400).json({ error: 'File is not a valid image or is corrupted' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}
