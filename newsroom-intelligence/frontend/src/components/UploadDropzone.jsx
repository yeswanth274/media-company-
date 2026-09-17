import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const ALLOWED_TYPES = ['.pdf', '.docx', '.doc', '.txt', '.md', '.html', '.htm', '.csv', '.json'];

export default function UploadDropzone({ onFileSelected, processing = false, processingStep = '' }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const validateAndSetFile = (file) => {
    setError(null);
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      setError(`Unsupported file type '${ext}'. Supported: ${ALLOWED_TYPES.join(', ')}`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File exceeds the 50MB maximum size limit.');
      return;
    }

    setSelectedFile(file);
    if (onFileSelected) {
      onFileSelected(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !processing && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-red-500 bg-red-950/30'
            : selectedFile
            ? 'border-red-600/80 bg-red-950/20'
            : 'border-zinc-800 bg-zinc-950/90 hover:border-red-600/60 hover:bg-zinc-900/60'
        } ${processing ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={processing}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            {processing ? (
              <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
            ) : selectedFile ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <UploadCloud className="w-6 h-6 text-red-500" />
            )}
          </div>

          <div className="space-y-1">
            {selectedFile ? (
              <div>
                <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                <p className="text-xs font-mono text-zinc-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another to replace
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-zinc-200">
                  Drop newsroom files here, or <span className="text-red-400 underline">browse</span>
                </p>
                <p className="text-xs text-zinc-500">
                  Supports PDF, DOCX, TXT, Markdown, HTML, CSV (Up to 50MB)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800/80 rounded text-xs text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-time processing stepper */}
      {processing && (
        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-200 uppercase tracking-wider">
              Archival Processing Pipeline
            </span>
            <span className="font-mono text-red-400 font-semibold animate-pulse">
              {processingStep || 'Processing...'}
            </span>
          </div>

          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-red-600 h-full rounded-full w-2/3 animate-pulse shadow-red-glow" />
          </div>

          <div className="grid grid-cols-4 gap-2 text-[11px] text-zinc-400 text-center font-mono">
            <div className="text-red-400 font-bold">1. Extract</div>
            <div className="text-red-400 font-bold">2. Chunk</div>
            <div className="text-red-400 font-bold">3. Embed</div>
            <div className="text-red-400 font-bold">4. FAISS Index</div>
          </div>
        </div>
      )}
    </div>
  );
}
