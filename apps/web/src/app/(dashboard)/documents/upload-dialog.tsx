'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadButton } from '@/components/shared/upload-button';
import type { DocumentFolder } from '@/lib/documents-api';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: DocumentFolder[];
  currentFolderId: string;
  onUploadComplete: (result: {
    title: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    fileUrl: string;
    folderId: string;
    description?: string;
    tags?: string[];
    isConfidential?: boolean;
  }) => void;
}

export function UploadDialog({ open, onOpenChange, folders, currentFolderId, onUploadComplete }: UploadDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState(currentFolderId);
  const [isConfidential, setIsConfidential] = useState(false);
  const [tags, setTags] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: number } | null>(null);

  const handleSubmit = () => {
    if (!uploadedFile || !title.trim() || !folderId) return;

    const ext = uploadedFile.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
    const sizeLabels = ['Bytes', 'KB', 'MB', 'GB'];
    const sizeIndex = Math.min(Math.floor(Math.log(uploadedFile.size) / Math.log(1024)), 3);
    const formattedSize = `${(uploadedFile.size / Math.pow(1024, sizeIndex)).toFixed(1)} ${sizeLabels[sizeIndex]}`;

    onUploadComplete({
      title: title.trim(),
      fileName: uploadedFile.name,
      fileType: ext,
      fileSize: formattedSize,
      fileUrl: uploadedFile.url,
      folderId,
      description: description.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      isConfidential,
    });

    setTitle('');
    setDescription('');
    setTags('');
    setUploadedFile(null);
    setIsConfidential(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <UploadButton
              endpoint="documentUploader"
              onClientUploadComplete={(res) => {
                if (res?.[0]) {
                  setUploadedFile({ url: res[0].url, name: res[0].name, size: res[0].size });
                }
              }}
            />
            {uploadedFile && (
              <p className="text-xs text-emerald-600 font-medium mt-1">
                Uploaded: {uploadedFile.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Employment Contract - John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder">Folder *</Label>
            {folders.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                No folders available. Create a folder first from the sidebar.
              </p>
            ) : (
              <select
                id="folder"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the document..."
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. contract, legal, signed"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              className="rounded border-input"
            />
            <span className="text-sm font-medium">Mark as confidential</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!uploadedFile || !title.trim() || !folderId}>
            {folders.length === 0 ? 'No folder available' : 'Save Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
