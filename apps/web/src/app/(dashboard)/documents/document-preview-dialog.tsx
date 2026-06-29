'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink, Calendar, User, Building2, Tag, Lock, FileType, HardDrive } from 'lucide-react';

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    title: string;
    fileName: string;
    fileType: string;
    fileSize: string;
    fileUrl: string;
    isConfidential: boolean;
    description: string | null;
    tags: string[];
    createdAt: string;
    folder: { name: string };
    employee: { firstName: string; lastName: string } | null;
    client: { name: string } | null;
    uploadedBy: { email: string };
  } | null;
}

export function DocumentPreviewDialog({ open, onOpenChange, document }: DocumentPreviewProps) {
  if (!document) return null;

  const fileExtension = document.fileType.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
  const isPdf = fileExtension === 'pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            {document.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {document.fileName} &middot; {document.fileSize}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="rounded-lg border bg-muted/30 overflow-hidden">
            {isImage ? (
              <img
                src={document.fileUrl}
                alt={document.title}
                className="w-full h-auto max-h-96 object-contain"
              />
            ) : isPdf ? (
              <iframe
                src={document.fileUrl}
                className="w-full h-96 border-0"
                title={document.title}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="h-16 w-16 mb-4" />
                <p className="text-sm font-medium">Preview not available</p>
                <p className="text-xs mt-1">Download the file to view its contents</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" asChild>
              <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Open
              </a>
            </Button>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                  <FileType className="h-3 w-3" />
                  File Type
                </span>
                <span className="font-medium uppercase">{document.fileType}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                  <HardDrive className="h-3 w-3" />
                  Size
                </span>
                <span className="font-medium">{document.fileSize}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                  <Calendar className="h-3 w-3" />
                  Created
                </span>
                <span className="font-medium">
                  {new Date(document.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                  <User className="h-3 w-3" />
                  Uploaded By
                </span>
                <span className="font-medium">{document.uploadedBy.email}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                  <Building2 className="h-3 w-3" />
                  Location
                </span>
                <span className="font-medium">{document.folder.name}</span>
              </div>
              {document.employee && (
                <div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                    <User className="h-3 w-3" />
                    Associated Employee
                  </span>
                  <span className="font-medium">
                    {document.employee.firstName} {document.employee.lastName}
                  </span>
                </div>
              )}
              {document.client && (
                <div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                    <Building2 className="h-3 w-3" />
                    Associated Client
                  </span>
                  <span className="font-medium">{document.client.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {document.description && (
            <div>
              <span className="text-xs text-muted-foreground font-medium mb-1 block">Description</span>
              <p className="text-sm text-foreground/80">{document.description}</p>
            </div>
          )}

          {/* Tags */}
          {document.tags.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <Tag className="h-3 w-3" />
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {document.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Confidential Badge */}
          {document.isConfidential && (
            <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold bg-destructive/5 px-3 py-2 rounded-md border border-destructive/20">
              <Lock className="h-3.5 w-3.5" />
              This document is marked as confidential
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
