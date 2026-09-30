import { Link } from 'react-router-dom';
import { BookOpen, LogIn } from 'lucide-react';
import { METADATA } from '../../data/mockData';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center shadow-lg shadow-accent/20">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">CIS Routine Hub</h1>
              <p className="text-xs text-text-muted hidden sm:block">Department of Computing and Information System</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-sm font-medium text-text">{METADATA.activeSemester}</span>
              <span className="text-xs text-accent flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                Updated
              </span>
            </div>
            
            <Link to="/admin" className="btn-secondary flex items-center space-x-2 text-sm">
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Admin Access</span>
            </Link>
          </div>
          
        </div>
      </div>
    </header>
  );
};
