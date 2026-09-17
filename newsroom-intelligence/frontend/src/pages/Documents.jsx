import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileText, PlusCircle, RefreshCw, Trash2, Search, Filter, Eye, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { formatDate, formatSourceType } from '../utils/formatters';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  // Selected doc for viewing chunks
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docChunks, setDocChunks] = useState([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  const [searchParams] = useSearchParams();
  const highlightDocId = searchParams.get('highlight');
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await api.getDocuments({
        search: search || undefined,
        source_type: selectedType || undefined,
      });
      setDocuments(docs || []);
      if (highlightDocId) {
        const found = docs.find((d) => d.id === parseInt(highlightDocId));
        if (found) handleViewChunks(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, selectedType]);

  const handleViewChunks = async (doc) => {
    setSelectedDoc(doc);
    setLoadingChunks(true);
    try {
      const chunks = await api.getDocumentChunks(doc.id);
      setDocChunks(chunks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete '${title}'? This will remove all chunks and re-index FAISS.`)) {
      return;
    }
    try {
      await api.deleteDocument(id);
      setNotification({ type: 'success', text: `Document '${title}' successfully deleted.` });
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
        setDocChunks([]);
      }
      fetchDocuments();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to delete document.' });
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await api.reindexDocuments();
      setNotification({
        type: 'success',
        text: `FAISS Index successfully rebuilt with ${res.total_vectors} vectors.`
      });
      fetchDocuments();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to reindex archive.' });
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 bg-zinc-950 text-zinc-100 min-h-full">
      <Header
        title="Archive Documents"
        subtitle="Catalogue of indexed articles, interview recordings, transcripts, and footage logs."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleReindex}
              disabled={reindexing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-red-900/60 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin text-red-500' : ''}`} />
              <span>{reindexing ? 'Rebuilding Index...' : 'Rebuild FAISS Index'}</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {notification && (
          <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
              : 'bg-red-950/60 border-red-800 text-red-200'
          }`}>
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="text-zinc-400 hover:text-white">×</button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-zinc-900/90 p-4 rounded-lg border border-zinc-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-red-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search archive document catalogue..."
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-white placeholder-zinc-500 focus:bg-zinc-950 focus:outline-none focus:border-red-600"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-red-600"
            >
              <option value="">All Document Types</option>
              <option value="article">Articles</option>
              <option value="interview">Interviews</option>
              <option value="transcript">Transcripts</option>
              <option value="footage_note">Footage Notes</option>
            </select>
          </div>

          <button
            onClick={() => navigate('/documents/upload')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-red-950"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Upload New File</span>
          </button>
        </div>

        {/* Documents Table & Detail Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Documents Table */}
          <div className={`${selectedDoc ? 'lg:col-span-7' : 'lg:col-span-12'} bg-zinc-900/90 rounded-lg border border-zinc-800 shadow-xl overflow-hidden transition-all`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Publication</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-center">Chunks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 text-xs text-zinc-300">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        Loading documents...
                      </td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        No archive documents found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => {
                      const isSelected = selectedDoc?.id === doc.id;
                      return (
                        <tr
                          key={doc.id}
                          className={`hover:bg-zinc-800/60 transition-colors cursor-pointer ${
                            isSelected ? 'bg-red-950/30 border-l-2 border-red-600 font-medium' : ''
                          }`}
                          onClick={() => handleViewChunks(doc)}
                        >
                          <td className="py-3 px-4 max-w-[280px]">
                            <div className="font-semibold text-white line-clamp-1">{doc.title}</div>
                            {doc.author && (
                              <div className="text-[11px] text-zinc-400 truncate">By {doc.author}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800">
                              {formatSourceType(doc.source_type)}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-zinc-400">
                            {doc.publication || 'Archive'}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-zinc-400">
                            {formatDate(doc.publication_date)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-zinc-300">
                            {doc.chunk_count || 1}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleViewChunks(doc)}
                                className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Inspect Chunks"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(doc.id, doc.title)}
                                className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-red-950/50 transition-colors cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Chunks Inspector Panel */}
          {selectedDoc && (
            <div className="lg:col-span-5 bg-zinc-900 rounded-lg border border-zinc-800 shadow-xl p-5 space-y-4 max-h-[750px] overflow-y-auto text-zinc-100">
              <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                    Document Chunks ({docChunks.length})
                  </span>
                  <h4 className="text-sm font-bold text-white line-clamp-1">
                    {selectedDoc.title}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="text-zinc-400 hover:text-white text-sm font-mono"
                >
                  ×
                </button>
              </div>

              {loadingChunks ? (
                <div className="py-12 text-center text-xs text-zinc-400">
                  Loading chunks...
                </div>
              ) : (
                <div className="space-y-3">
                  {docChunks.map((chunk, idx) => (
                    <div
                      key={chunk.id}
                      className="p-3 bg-zinc-950 rounded border border-zinc-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                        <span className="font-bold text-red-400">Chunk #{chunk.chunk_index + 1}</span>
                        <span>ID: {chunk.id}</span>
                      </div>
                      <p className="font-serif text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {chunk.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
