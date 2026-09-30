import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft, Settings, Upload, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminLayout = () => {
  return (
    <div className="min-h-screen flex bg-background">
      
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-white/10 hidden md:flex flex-col relative z-20">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <p className="text-xs text-accent mt-1">CIS Routine Hub</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin" className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/5 text-white font-medium border border-white/10 hover:bg-white/10 transition-colors">
            <LayoutDashboard className="w-5 h-5 text-accent" />
            <span>Dashboard</span>
          </Link>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-text-muted font-medium hover:bg-white/5 hover:text-white transition-colors text-left cursor-not-allowed opacity-50" title="Coming soon">
            <Upload className="w-5 h-5" />
            <span>Upload Routine</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-text-muted font-medium hover:bg-white/5 hover:text-white transition-colors text-left cursor-not-allowed opacity-50" title="Coming soon">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 rounded-lg text-text-muted hover:bg-white/5 hover:text-white transition-colors w-full text-left">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Portal</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Mobile Header */}
        <header className="md:hidden glass-panel border-b border-white/10 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Admin Panel</h2>
          <Link to="/" className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      
    </div>
  );
};
