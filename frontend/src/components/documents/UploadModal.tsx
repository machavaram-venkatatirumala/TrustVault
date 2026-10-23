import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { formatBytes } from '../../lib/formatters';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.documents.upload(file);
      success('Document Uploaded', `${res.original_filename} has been securely stored with SHA-256 digest.`);
      setFile(null);
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetSelection = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Confidential Document</DialogTitle>
          <DialogDescription>
            Files are stored in private storage with an authoritative SHA-256 digest calculated on the server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-medium p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary-soft/30'
                  : 'border-border hover:border-primary/50 hover:bg-surface-subtle/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.docx,.xlsx,.doc,.xls,.txt,.csv,.json,.png,.jpg"
              />
              <div className="w-12 h-12 rounded-full bg-surface-blue flex items-center justify-center text-primary mb-3">
                <UploadCloud className="w-6 h-6 stroke-[1.8]" />
              </div>
              <p className="text-sm font-semibold text-text-primary">
                Drag and drop your file here, or <span className="text-primary hover:underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Supported: PDF, DOCX, XLSX, TXT, CSV, Images (Max 25MB)
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-medium border border-border bg-surface-subtle/40 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-small bg-primary-soft flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-secondary">{formatBytes(file.size)}</p>
                </div>
              </div>
              <button
                onClick={resetSelection}
                disabled={uploading}
                className="p-1 rounded-small text-text-muted hover:text-danger hover:bg-danger-bg transition-colors"
                aria-label="Remove selected file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="rounded-small bg-surface-blue/50 border border-primary/20 p-3 text-xs text-text-secondary space-y-1">
            <p className="font-semibold text-accent-ink flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Server-Side Cryptographic Guarantee
            </p>
            <p className="text-[11px] leading-relaxed text-text-muted">
              At upload, the server generates an opaque storage key and streams bytes to compute the authoritative SHA-256 digest before recording an immutable audit event.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!file} loading={uploading}>
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
