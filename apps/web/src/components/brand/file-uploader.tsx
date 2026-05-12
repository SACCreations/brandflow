'use client';

import * as React from 'react';
import { Upload, X, File, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button, Progress, cn } from '@brandflow/ui';

interface FileUploaderProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
  onUpload?: (url: string, name: string) => void;
  className?: string;
}

export function FileUploader({ 
  label, 
  accept = "image/*,.pdf,.doc,.docx", 
  maxSize = 50, 
  onUpload,
  className 
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(null);

  const handleFile = (selectedFile: File) => {
    setError(null);
    
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit.`);
      return;
    }

    setFile(selectedFile);
    simulateUpload(selectedFile);
  };

  const simulateUpload = (file: File) => {
    setUploading(true);
    setProgress(0);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setProgress(100);
        setUploading(false);
        const mockUrl = URL.createObjectURL(file);
        setUploadedUrl(mockUrl);
        // Important: Call onUpload outside of any state update logic to avoid React warnings
        if (onUpload) {
          setTimeout(() => onUpload(mockUrl, file.name), 0);
        }
      } else {
        setProgress(currentProgress);
      }
    }, 200);
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setUploadedUrl(null);
    setProgress(0);
    setUploading(false);
    setError(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const droppedFile = e.dataTransfer.files[0];
          if (droppedFile) handleFile(droppedFile);
        }}
        onClick={() => document.getElementById(`file-input-${label}`)?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center group",
          isDragging ? "border-brand-500 bg-brand-50/50 dark:bg-brand-900/20" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30",
          uploadedUrl && "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-900/10"
        )}
      >
        <input
          id={`file-input-${label}`}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) handleFile(selectedFile);
          }}
        />

        {uploading ? (
          <div className="w-full max-w-[200px] space-y-4">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1" />
            </div>
          </div>
        ) : uploadedUrl ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                {file?.name}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Successfully Uploaded</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={reset}
              className="mt-2 h-7 px-2 text-gray-400 hover:text-red-500"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {accept.includes('image') ? 'PNG, JPG, SVG' : 'PDF, DOCX'} (max {maxSize}MB)
              </p>
            </div>
          </>
        )}

        {error && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full border border-red-100 dark:border-red-900/30">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
