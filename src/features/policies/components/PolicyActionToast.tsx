import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import '../styles/policy-action-toast.css';

interface PolicyActionToastProps {
  message: string;
  tone?: 'success' | 'danger';
  actionLabel?: string;
  actionPending?: boolean;
  onAction?: () => void;
  onClose: () => void;
}

function PolicyActionToast({
  message,
  tone = 'success',
  actionLabel,
  actionPending = false,
  onAction,
  onClose,
}: PolicyActionToastProps) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (actionPending) return;
    const timer = window.setTimeout(() => onCloseRef.current(), 7000);
    return () => window.clearTimeout(timer);
  }, [actionPending, message]);

  const Icon = tone === 'danger' ? AlertCircle : CheckCircle2;

  return (
    <div
      className={`policy-action-toast policy-action-toast--${tone}`}
      role={tone === 'danger' ? 'alert' : 'status'}
      aria-live={tone === 'danger' ? 'assertive' : 'polite'}
    >
      <Icon size={20} aria-hidden="true" />
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button
          className="policy-action-toast__action"
          type="button"
          disabled={actionPending}
          onClick={onAction}
        >
          {actionPending ? '처리 중...' : actionLabel}
        </button>
      ) : null}
      <button
        className="policy-action-toast__close"
        type="button"
        aria-label="알림 닫기"
        onClick={onClose}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

export default PolicyActionToast;
