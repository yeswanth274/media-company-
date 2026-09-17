import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import UploadDropzone from '../components/UploadDropzone';
import api from '../services/api';

export default function UploadDocument() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState('article');
  const [publication, setPublication] = useState('');
  const [author, setAuthor] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [completedDoc, setCompletedDoc] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleFileSelected = (selected) => {
    setFile(selected);
    if (selected) {
      // Auto-populate title from filename
      const baseName = selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProcessingStep('Extracting text and metadata...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);
      if (sourceType) formData.append('source_type', sourceType);
      if (publication) formData.append('publication', publication);
      if (author) formData.append('author', author);
      if (publicationDate) formData.append('publication_date', publicationDate);
      if (location) formData.append('location', location);
      if (description) formData.append('description', description);

      setTimeout(() => setProcessingStep('Generating semantic chunks & embeddings...'), 600);
      setTimeout(() => setProcessingStep('Indexing vectors into FAISS & updating SQLite...'), 1200);

      const res = await api.uploadDocument(formData);
      setCompletedDoc(res);
    } catch (err) {
      setError(err.message || 'Failed to upload and index document.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 bg-zinc-950 text-zinc-100 min-h-full">
      <Header
        title="Ingest Archival Document"
        subtitle="Upload and index PDFs, DOCX, transcripts, HTML, or raw text into the FAISS vector database."
      />

      <div className="max-w-4xl mx-auto px-6 space-y-6">
        {completedDoc ? (
          /* Completion State */
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-950/80 text-red-400 border border-red-800 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                Document Successfully Indexed
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Assigned Database Record ID: #{completedDoc.id} • {completedDoc.chunk_count || 1} semantic chunks indexed
              </p>
            </div>

            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 text-left text-xs max-w-lg mx-auto space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Title:</span>
                <span className="font-bold text-white">{completedDoc.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Source Type:</span>
                <span className="font-semibold text-red-400 uppercase">{completedDoc.source_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Publication / Organization:</span>
                <span className="font-medium text-zinc-300">{completedDoc.publication || 'Archive'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Publication Date:</span>
                <span className="font-mono text-zinc-400">{completedDoc.publication_date || 'N/A'}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setCompletedDoc(null);
                  setFile(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-md border border-zinc-700 text-zinc-300 bg-zinc-800 hover:bg-zinc-750 cursor-pointer transition-colors"
              >
                Upload Another Document
              </button>
              <button
                onClick={() => navigate('/documents')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-500 cursor-pointer shadow-md shadow-red-950 transition-colors"
              >
                <span>View Archive Documents</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Upload Form */
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <UploadDropzone
              onFileSelected={handleFileSelected}
              processing={processing}
              processingStep={processingStep}
            />

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {file && !processing && (
              <form onSubmit={handleUploadSubmit} className="space-y-4 pt-4 border-t border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Archival Metadata Configuration
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Document Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Municipal Sensor Audit Report"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:bg-zinc-950 focus:outline-none focus:border-red-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Source Classification *
                    </label>
                    <select
                      value={sourceType}
                      onChange={(e) => setSourceType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-red-600"
                    >
                      <option value="article">News Article</option>
                      <option value="interview">Interview Transcript / Recording</option>
                      <option value="transcript">Official Meeting Transcript</option>
                      <option value="footage_note">Reporter Footage Log / Field Note</option>
                      <option value="court_filing">Court Filing / Regulatory Action</option>
                      <option value="memo">Confidential Memo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Publication / Issuing Body
                    </label>
                    <input
                      type="text"
                      value={publication}
                      onChange={(e) => setPublication(e.target.value)}
                      placeholder="e.g. Metro Daily or City Record"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 placeholder-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Author / Reporter / Producer
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 placeholder-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Historical Record Date
                    </label>
                    <input
                      type="date"
                      value={publicationDate}
                      onChange={(e) => setPublicationDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-red-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Location / Jurisdiction
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Metro City Hall"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 placeholder-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Editorial Summary / Context Notes
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief description of the document significance..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 font-serif placeholder-zinc-600"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer shadow-md shadow-red-950 transition-all"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Confirm & Ingest to Archive</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
