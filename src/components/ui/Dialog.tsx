import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import './Dialog.css';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}

export function Dialog({ open, onClose, title, subtitle, children, wide }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className={`dialog-panel ${wide ? 'dialog-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header className="dialog-header">
          <div>
            <h2 id="dialog-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="dialog-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}
