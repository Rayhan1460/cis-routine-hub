import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Clock, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import type { DayOfWeek, ClassSession } from '../types';
import { cn } from '../utils/cn';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const RoutineView = () => {
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Wednesday');
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const batch = localStorage.getItem('cis_batch') || '20';
  const section = localStorage.getItem('cis_section') || 'A';

  useEffect(() => {
    let isMounted = true;
    const fetchRoutine = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getRoutine(batch, section);
        if (isMounted) setClasses(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load routine");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRoutine();
    
    // Set active day to today
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
    if (DAYS.includes(today)) {
      setActiveDay(today);
    }
    
    return () => { isMounted = false; };
  }, [batch, section]);

  // Filter classes for the active day
  const dayClasses = classes.filter(c => c.day === activeDay).sort((a, b) => {
    const tA = new Date(`2000/01/01 ${a.startTime}`).getTime();
    const tB = new Date(`2000/01/01 ${b.startTime}`).getTime();
    return tA - tB;
  });

  return (
    <div className="space-y-6">
      
      <div className="flex items-center space-x-4">
        <Link to="/" className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Routine</h1>
          <p className="text-text-muted">Batch {batch} • Section {section}</p>
        </div>
      </div>

      {/* Day Navigation Tabs */}
      <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex space-x-2 min-w-max">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={cn(
                "px-5 py-2.5 rounded-xl font-medium transition-all",
                activeDay === day 
                  ? "bg-accent text-white shadow-lg shadow-accent/20" 
                  : "bg-surface hover:bg-surface-hover text-text-muted hover:text-text border border-white/5"
              )}
            >
              {day.slice(0, 3).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Classes List */}
      <div className="glass-panel p-2 sm:p-6 rounded-2xl min-h-[400px]">
        <h2 className="text-xl font-bold text-white mb-6 px-4 pt-4 sm:p-0">{activeDay}'s Schedule</h2>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
            <p className="text-text-muted">Loading routine...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
              <span className="text-red-400 font-bold text-xl">!</span>
            </div>
            <h3 className="text-lg font-medium text-red-400">Error Loading Routine</h3>
            <p className="text-red-300/70 mt-1">{error}</p>
          </div>
        ) : dayClasses.length > 0 ? (
          <div className="space-y-4 px-2 sm:px-0 pb-4">
            {dayClasses.map(session => (
              <div key={session.id} className="bg-surface/50 border border-white/5 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-white/10 transition-colors">
                
                <div className="w-full md:w-48 shrink-0 flex items-center space-x-2 text-accent font-medium bg-background px-4 py-2 rounded-lg border border-white/5">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{session.startTime}</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{session.courseName}</h3>
                  <p className="text-sm text-text-muted font-mono">{session.courseCode}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 sm:gap-6 shrink-0 pt-3 border-t border-white/5 md:border-t-0 md:pt-0">
                  <div className="flex items-center space-x-2 text-text-muted text-sm">
                    <User className="w-4 h-4" />
                    <span>{session.teacher}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white font-medium text-sm bg-surface-hover px-3 py-1 rounded-full">
                    <MapPin className="w-4 h-4 text-accent" />
                    <span>{session.room}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-text-muted/50" />
            </div>
            <h3 className="text-lg font-medium text-white">No Classes</h3>
            <p className="text-text-muted mt-1">There are no classes scheduled for {activeDay}.</p>
          </div>
        )}
      </div>

    </div>
  );
};
