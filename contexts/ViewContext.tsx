import { createContext, useContext, useState, ReactNode } from 'react';

type View = 'home' | 'browse' | 'pricing' | 'dashboard' | 'admin' | 'about' | 'privacy' | 'terms' | 'disclaimer' | 'cookies';

interface ViewContextType {
  view: View;
  setView: (view: View) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('home');

  return (
    <ViewContext.Provider value={{ view, setView }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within ViewProvider');
  }
  return context;
}
