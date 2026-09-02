import { CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';

interface AdminToastProps {
  message: string | null;
  onClose: () => void;
}

export default function AdminToast({ message, onClose }: AdminToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="admin-toast" role="status" aria-live="polite">
      <CheckCircle2 size={20} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="알림 닫기">
        <X size={16} />
      </button>
    </div>
  );
}
