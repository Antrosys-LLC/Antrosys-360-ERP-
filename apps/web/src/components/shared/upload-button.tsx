'use client';

import { generateUploadButton } from '@uploadthing/react';

const UPLOADTHING_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace('/api/v1', '');

export const UploadButton = generateUploadButton({
  url: `${UPLOADTHING_URL}/api/uploadthing`,
});
