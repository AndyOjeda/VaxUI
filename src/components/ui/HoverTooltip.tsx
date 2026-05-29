import { useCallback, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './HoverTooltip.css';

interface HoverTooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'right' | 'bottom';
}

export function HoverTooltip({ content, children, placement = 'top' }: HoverTooltipProps) {
  const id = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;

    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const gap = 10;
    let top = 0;
    let left = 0;

    if (placement === 'right') {
      top = a.top + a.height / 2 - t.height / 2;
      left = a.right + gap;
    } else if (placement === 'bottom') {
      top = a.bottom + gap;
      left = a.left + a.width / 2 - t.width / 2;
    } else {
      top = a.top - t.height - gap;
      left = a.left + a.width / 2 - t.width / 2;
    }

    const pad = 12;
    left = Math.max(pad, Math.min(left, window.innerWidth - t.width - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - t.height - pad));
    setCoords({ top, left });
  }, [placement]);

  useLayoutEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    updatePosition();
    setReady(true);
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, updatePosition, content]);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  return (
    <>
      <div
        ref={anchorRef}
        className="hover-tooltip-anchor"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={open ? id : undefined}
      >
        {children}
      </div>
      {open &&
        createPortal(
          <div
            ref={tipRef}
            id={id}
            className={`hover-tooltip hover-tooltip--portal hover-tooltip--${placement}`}
            style={{ top: coords.top, left: coords.left, visibility: ready ? 'visible' : 'hidden' }}
            role="tooltip"
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}
