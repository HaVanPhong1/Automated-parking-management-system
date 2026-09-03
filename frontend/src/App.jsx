import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import GuardView from './pages/GuardView';
import AdminView from './pages/AdminView';
import { ShieldCheck, LayoutDashboard } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-darker font-sans text-slate-200">
        {/* Navigation Bar */}
        <nav className="bg-dark/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center shadow-lg shadow-primary/20">
                  <ShieldCheck className="text-white w-6 h-6" />
                </div>
                <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  AutoPark AI
                </span>
              </div>
              <div className="flex gap-4">
                <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="font-medium">Bốt Bảo Vệ</span>
                </Link>
                <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium">Quản Trị</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<GuardView />} />
            <Route path="/admin" element={<AdminView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
