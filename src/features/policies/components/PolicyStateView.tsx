import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import '../styles/policy-state.css';

interface PolicyStateViewProps {
  title: string;
  description?: string;
  tone?: 'default' | 'danger';
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

function PolicyStateView({
  title,
  description,
  tone = 'default',
  loading = false,
  actionLabel,
  onAction,
}: PolicyStateViewProps) {
  const Icon = loading ? LoaderCircle : tone === 'danger' ? AlertCircle : Inbox;

  return (
    <section
      className={`policy-state policy-state--${tone}`}
      role={tone === 'danger' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <span className="policy-state__icon" aria-hidden="true">
        <Icon className={loading ? 'policy-state__spinner' : undefined} size={24} />
      </span>
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <button className="button button--secondary" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}

export default PolicyStateView;
