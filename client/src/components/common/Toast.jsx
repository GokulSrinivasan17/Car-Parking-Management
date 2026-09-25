import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          bg: 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10',
          bar: 'bg-emerald-500'
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          bg: 'bg-white border-rose-200 text-slate-800 shadow-rose-500/10',
          bar: 'bg-rose-500'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          bg: 'bg-white border-amber-200 text-slate-800 shadow-amber-500/10',
          bar: 'bg-amber-500'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
          bg: 'bg-white border-indigo-200 text-slate-800 shadow-indigo-500/10',
          bar: 'bg-indigo-500'
        };
    }
  };

  const style = getToastStyle();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden flex items-center gap-3 p-4 rounded-xl border shadow-xl ${style.bg} min-w-[300px] max-w-md pointer-events-auto backdrop-blur-md`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl overflow-hidden">
        <div className={`w-full h-full ${style.bar}`} />
      </div>
      <div className="pl-1">{style.icon}</div>
      <div className="flex-1 text-sm font-medium leading-relaxed pr-2">
        {toast.message}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

const Toast = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
