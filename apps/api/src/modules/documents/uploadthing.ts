import { createUploadthing, type FileRouter } from 'uploadthing/fastify';

const f = createUploadthing();

export const uploadRouter: FileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: '32MB', maxFileCount: 10 },
    image: { maxFileSize: '16MB', maxFileCount: 10 },
    text: { maxFileSize: '8MB', maxFileCount: 10 },
    blob: { maxFileSize: '64MB', maxFileCount: 5 },
  }).onUploadComplete(({ file }) => {
    return { url: file.url, name: file.name, size: file.size };
  }),
};
