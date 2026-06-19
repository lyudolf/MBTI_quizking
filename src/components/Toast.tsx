import { useState, useRef, useCallback } from 'react';

/** 간단한 토스트 메시지 훅 */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  return { message, showToast };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '92px',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        padding: '10px 18px',
        borderRadius: 'var(--radius-full, 999px)',
        fontSize: '14px',
        fontWeight: 600,
        zIndex: 1000,
        maxWidth: '90%',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      }}
    >
      {message}
    </div>
  );
}
