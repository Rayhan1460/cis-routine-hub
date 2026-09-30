import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, ChevronRight, Filter, Clock } from 'lucide-react';
import { ClassCard } from '../components/common/ClassCard';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import type { ClassSession } from '../types';

export const StudentDashboard = () => {
  const [batch, setBatch] = useState(() => localStorage.getItem('cis_batch') || '');
  const [section, setSection] = useState(() => localStorage.getItem('cis_section') || '');
  const [labGroup, setLabGroup] = useState(() => localStorage.getItem('cis_lab_group') || 'All');
  const [semester] = useState(() => localStorage.getItem('cis_semester') || 'Fall 2026');
  
  const [options, setOptions] = useState<{ batches: string[], sections: string[] }>({ batches: [], sections: [] });
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ClassSession[]>([]);
  
  const [currentDay, setCurrentDay] = useState('');

  // Fetch Options
  useEffect(() => {
    api.getOptions().then(data => setOptions(data)).catch(console.error);
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    setCurrentDay(today);
  }, []);

  // Persist selections and fetch routine
  useEffect(() => {
    if (batch) localStorage.setItem('cis_batch', batch);
    if (section) localStorage.setItem('cis_section', section);
    if (labGroup) localStorage.setItem('cis_lab_group', labGroup);
    if (semester) localStorage.setItem('cis_semester', semester);
    
    if (batch && section) {
      api.getRoutine(batch, section, labGroup).then(data => {
        setClasses(data);
      }).catch(console.error);
    }
  }, [batch, section, labGroup, semester]);
  
  const validLabGroups = options.sections.filter(s => {
    if (!section || s === section) return false;
    if (s.startsWith(section)) {
      const suffix = s.substring(section.length);
      return /^\d+$/.test(suffix);
    }
    return false;
  });

  // Search
  useEffect(() => {
    if (searchQuery.length > 2) {
      api.searchRoutine(searchQuery).then(data => setSearchResults(data)).catch(console.error);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const hasSelection = batch && section;
  
  // Determine today's classes
  const todayClasses = classes.filter(c => c.day === currentDay).sort((a, b) => {
    // Basic sorting assuming format like "08:30 AM"
    const tA = new Date(`2000/01/01 ${a.startTime}`).getTime();
    const tB = new Date(`2000/01/01 ${b.startTime}`).getTime();
    return tA - tB;
  });
  
  // Determine next class
  const nowTime = new Date().getTime();
  const nextClass = todayClasses.find(c => {
    // Create a Date object for today with the class start time
    const [time, modifier] = c.startTime.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12' && modifier === 'AM') hours = '00';
    if (modifier === 'PM' && hours !== '12') hours = (parseInt(hours, 10) + 12).toString();
    
    const classTime = new Date();
    classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return classTime.getTime() > nowTime;
  });



  return (
    <div className="space-y-8">
      
      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-muted" />
        </div>
        <input
          type="text"
          className="input-field pl-11 py-3 text-lg shadow-lg shadow-black/20"
          placeholder="Search course, teacher, room..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Selection & Full Routine */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 rounded-2xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Filter className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold">Find Your Routine</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Batch</label>
                <select 
                  className="input-field appearance-none"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                >
                  <option value="">Select Batch</option>
                  {options.batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Section</label>
                <select 
                  className="input-field appearance-none"
                  value={section}
                  onChange={(e) => {
                    setSection(e.target.value);
                    setLabGroup('All'); // Reset lab group when section changes
                  }}
                >
                  <option value="">Select Section</option>
                  {options.sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>

              {validLabGroups.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Lab Group</label>
                  <select 
                    className="input-field appearance-none"
                    value={labGroup}
                    onChange={(e) => setLabGroup(e.target.value)}
                  >
                    <option value="All">All Groups</option>
                    {validLabGroups.map(lg => <option key={lg} value={lg}>Group {lg}</option>)}
                  </select>
                </div>
              )}
            </div>
          </motion.div>

          {hasSelection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/full-routine" className="glass-card p-6 flex items-center justify-between group block">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Calendar className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-accent transition-colors">View Full Routine</h3>
                    <p className="text-sm text-text-muted">Weekly timetable view</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          )}
        </div>

        {/* Right Column - Today's Classes */}
        <div className="lg:col-span-2 space-y-6">
          {searchQuery.length > 2 ? (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl font-bold text-white mb-4">Search Results</h2>
                <div className="space-y-4">
                  {searchResults.length > 0 ? searchResults.map(session => (
                    <ClassCard key={session.id} session={session} />
                  )) : (
                    <div className="glass-card p-10 text-center">
                      <p className="text-lg font-medium text-white">No results found.</p>
                    </div>
                  )}
                </div>
             </motion.div>
          ) : !hasSelection ? (
            <div className="h-full min-h-[400px] glass-panel rounded-2xl flex flex-col items-center justify-center p-8 text-center border-dashed border-2 border-white/10">
              <Calendar className="w-16 h-16 text-text-muted/50 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Routine Selected</h3>
              <p className="text-text-muted max-w-md">
                Please select your batch and section from the left panel to view your classes for today.
              </p>
            </div>
          ) : (
            <>
              {nextClass && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Up Next
                  </h2>
                  <ClassCard session={nextClass} isNext={true} />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Today's Classes
                    <span className="text-sm font-normal text-text-muted bg-surface-hover px-2 py-0.5 rounded-full">
                      {todayClasses.length}
                    </span>
                  </h2>
                  <span className="text-sm text-text-muted font-medium">{currentDay}</span>
                </div>
                
                {todayClasses.length > 0 ? (
                  <div className="space-y-4">
                    {todayClasses.map((session, idx) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + (idx * 0.1) }}
                      >
                        <ClassCard session={session} />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-10 text-center">
                    <p className="text-lg font-medium text-white">No classes scheduled for today.</p>
                    <p className="text-sm text-text-muted mt-2">Enjoy your free time!</p>
                  </div>
                )}
                
                {todayClasses.length > 0 && !nextClass && (
                  <div className="mt-6 text-center text-sm text-text-muted">
                    No more classes today.
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
};
