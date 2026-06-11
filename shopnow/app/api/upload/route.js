import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/mongodb';
import StoreProfile from '@/models/StoreProfile';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB keeps uploads friendly for free media plans.

function sanitizeSegment(value = '') {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'file';
}

function getCloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  };
}

function signCloudinaryUpload(params, apiSecret) {
  // Cloudinary signatures are SHA-1 hashes of sorted params joined with the API secret.
  const signaturePayload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHash('sha1')
    .update(`${signaturePayload}${apiSecret}`)
    .digest('hex');
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const profile = await StoreProfile.findOne({ ownerId: session.user.id });
  if (!profile) {
    return NextResponse.json({ error: 'Create your store first.' }, { status: 400 });
  }

  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        error:
          'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables.'
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const folder = sanitizeSegment(formData.get('folder') || 'general');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  const mime = file.type || '';
  if (!mime.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json({ error: 'Image is too large. Please upload an image smaller than 8MB.' }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const storeFolder = `shopnow/${sanitizeSegment(profile.slug)}/${folder}`;
  const publicId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const signedParams = {
    folder: storeFolder,
    public_id: publicId,
    timestamp
  };

  const signature = signCloudinaryUpload(signedParams, apiSecret);

  const cloudinaryForm = new FormData();
  cloudinaryForm.append('file', file);
  cloudinaryForm.append('api_key', apiKey);
  cloudinaryForm.append('timestamp', String(timestamp));
  cloudinaryForm.append('folder', storeFolder);
  cloudinaryForm.append('public_id', publicId);
  cloudinaryForm.append('signature', signature);

  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: cloudinaryForm
  });

  const uploadResult = await uploadResponse.json();

  if (!uploadResponse.ok) {
    return NextResponse.json(
      { error: uploadResult?.error?.message || 'Cloudinary upload failed.' },
      { status: uploadResponse.status }
    );
  }

  return NextResponse.json({
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id
  });
}
