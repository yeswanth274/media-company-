import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import SourceDetailModal from './SourceDetailModal';

export default function Layout() {
  const [activeModalSource, setActiveModalSource] = useState(null); // { chunkId, citationId }
  const navigate = useNavigate();

  const handleOpenSourceModal = (chunkId, citationId) => {
    setActiveModalSource({ chunkId, citationId });
  };

  const handleCloseSourceModal = () => {
    setActiveModalSource(null);
  };

  const handleNavigateDocument = (docId) => {
    navigate(`/documents?highlight=${docId}`);
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-zinc-950">
        <main className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-100">
          {/* Provide openSourceModal to child routes via Outlet context */}
          <Outlet context={{ onSelectCitation: handleOpenSourceModal }} />
        </main>
      </div>

      {/* Global Source Inspection Modal with surrounding context */}
      {activeModalSource && (
        <SourceDetailModal
          chunkId={activeModalSource.chunkId}
          citationId={activeModalSource.citationId}
          onClose={handleCloseSourceModal}
          onNavigateDocument={handleNavigateDocument}
        />
      )}
    </div>
  );
}
