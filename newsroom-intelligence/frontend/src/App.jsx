import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AskArchive from './pages/AskArchive';
import SearchArchive from './pages/SearchArchive';
import DevelopingStory from './pages/DevelopingStory';
import Documents from './pages/Documents';
import UploadDocument from './pages/UploadDocument';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ask" element={<AskArchive />} />
          <Route path="search" element={<SearchArchive />} />
          <Route path="stories" element={<DevelopingStory />} />
          <Route path="documents" element={<Documents />} />
          <Route path="documents/upload" element={<UploadDocument />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
