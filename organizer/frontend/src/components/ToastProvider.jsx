import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, status = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, status }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Container de Toasts */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 min-w-[320px]">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`
              bg-[#0c0c0c] border border-white/10 p-5 rounded-none shadow-2xl flex items-start gap-4 
              animate-in slide-in-from-right-full duration-500 border-l-4
              ${toast.status === 'success' ? 'border-l-emerald-500' : ''}
              ${toast.status === 'error' ? 'border-l-rose-500' : ''}
              ${toast.status === 'warning' ? 'border-l-amber-500' : ''}
            `}
          >
            <div className="mt-0.5">
              {toast.status === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
              {toast.status === 'error' && <AlertCircle size={18} className="text-rose-500" />}
              {toast.status === 'warning' && <AlertCircle size={18} className="text-amber-500" />}
            </div>
            
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Notificação do Sistema</span>
              <p className="text-sm font-bold text-white tracking-tight leading-tight">{toast.message}</p>
            </div>

            <button 
              onClick={() => removeToast(toast.id)}
              className="text-white/20 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
