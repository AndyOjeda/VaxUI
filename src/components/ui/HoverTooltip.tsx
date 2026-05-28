import type { ReactNode } from 'react';
import './HoverTooltip.css';

interface HoverTooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'right' | 'bottom';
}

export function HoverTooltip({ content, children, placement = 'right' }: HoverTooltipProps) {
  return (
    <div className={`hover-tooltip-wrap hover-tooltip-wrap--${placement}`}>
      {children}
      <div className="hover-tooltip" role="tooltip">
        {content}
      </div>
    </div>
  );
}
