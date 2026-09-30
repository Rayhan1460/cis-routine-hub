import type { ClassSession } from '../../types';
import { Clock, MapPin, User } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ClassCardProps {
  session: ClassSession;
  isNext?: boolean;
}

export const ClassCard = ({ session, isNext = false }: ClassCardProps) => {
  return (
    <div className={cn(
      "glass-card p-5 group flex flex-col sm:flex-row sm:items-center justify-between gap-4",
      isNext && "ring-2 ring-accent bg-accent/5"
    )}>
      <div className="flex-1 space-y-3">
        
        <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
          <div className="flex items-center space-x-2 text-accent font-medium bg-accent/10 px-3 py-1 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            <span>{session.startTime} — {session.endTime}</span>
          </div>
          {isNext && (
            <span className="text-xs font-semibold uppercase tracking-wider text-accent animate-pulse">
              Next Class
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-accent transition-colors">
            {session.courseName}
          </h3>
          <p className="text-sm text-text-muted font-mono mt-1">{session.courseCode}</p>
        </div>

      </div>

      <div className="flex flex-row sm:flex-col justify-between sm:items-end gap-3 sm:gap-2 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-white/5 sm:border-t-0">
        <div className="flex items-center space-x-2 text-text-muted text-sm">
          <User className="w-4 h-4" />
          <span>{session.teacher}</span>
        </div>
        <div className="flex items-center space-x-2 text-white font-medium">
          <MapPin className="w-4 h-4 text-accent" />
          <span>{session.room}</span>
        </div>
      </div>
      
    </div>
  );
};
