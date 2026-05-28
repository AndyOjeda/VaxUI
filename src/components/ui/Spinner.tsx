import './Spinner.css';

interface SpinnerProps {
  label?: string;
  inline?: boolean;
}

export function Spinner({ label = 'Cargando…', inline = false }: SpinnerProps) {
  return (
    <div className={`spinner-wrap ${inline ? 'spinner-wrap--inline' : ''}`} role="status" aria-live="polite">
      <div className="spinner-ring" aria-hidden="true" />
      {label && <span className="spinner-label">{label}</span>}
    </div>
  );
}
