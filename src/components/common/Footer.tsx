export const Footer = () => {
  return (
    <footer className="mt-auto py-8 border-t border-white/10 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center space-y-2">
        <h3 className="text-base font-semibold text-white">CIS Routine Hub</h3>
        <p className="text-sm text-text-muted text-center">
          Department of Computing and Information System<br />
          Daffodil International University
        </p>
        <div className="mt-4 pt-4 border-t border-white/10 w-full max-w-xs text-center">
          <p className="text-xs text-text-muted">
            Made by <span className="text-accent font-medium">Rayhan Parvaz</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
