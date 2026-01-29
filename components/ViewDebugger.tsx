import { useView } from '../contexts/ViewContext';

export function ViewDebugger() {
  const { view } = useView();
  
  return (
    <div className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-[9999] font-mono text-sm">
      <div>Current View: <strong className="text-yellow-300">{view}</strong></div>
      <div>URL: <span className="text-blue-300">{window.location.href}</span></div>
    </div>
  );
}
