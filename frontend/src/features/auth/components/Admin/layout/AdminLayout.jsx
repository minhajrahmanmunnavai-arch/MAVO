import React from 'react';
import { useAdmin } from '../../contex/AdminContext.jsx';
import Sidebar from '../Sitebar/Sidebar.jsx';
import Header from '../Header/Header.jsx';
// import ToastContainer from '../common/ToastContainer.jsx';
// import SearchModal from '../common/SearchModal.jsx';

export default function AdminLayout({ children }) {
  const { isSidebarCollapsed } = useAdmin();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/60 px-6 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-300">MOX E-Commerce Administration Console</strong> · Production React Frontend
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Node: Production-Primary · All timestamps UTC
          </div>
        </footer>
      </div>

      {/* Global Interactive Overlays */}
      <ToastContainer />
      <SearchModal />
    </div>
  );
}
