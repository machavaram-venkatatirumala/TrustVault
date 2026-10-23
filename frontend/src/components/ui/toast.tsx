import { useToast, ToastItem } from '../../hooks/useToast';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItemComponent key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItemComponent({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-success shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-danger shrink-0" />,
    info: <Info className="w-5 h-5 text-info shrink-0" />,
  };

  const bgStyles = {
    success: 'border-success/30 bg-white shadow-dropdown',
    warning: 'border-warning/30 bg-white shadow-dropdown',
    error: 'border-danger/30 bg-white shadow-dropdown',
    info: 'border-info/30 bg-white shadow-dropdown',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-medium border ${bgStyles[toast.type]}`}
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-text-primary leading-tight">{toast.title}</h4>
        {toast.message && (
          <p className="mt-1 text-xs text-text-secondary leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="p-1 text-text-muted hover:text-text-primary rounded-small transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
