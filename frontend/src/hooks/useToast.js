import { useState, useRef, useEffect, useCallback } from 'react';

// A short status message that clears itself; a new message restarts the timer.
export function useToast(duration = 3500) {
  const [message, setMessage] = useState('');
  const timer = useRef(null);

  const show = useCallback((msg) => {
    clearTimeout(timer.current);
    setMessage(msg);
    timer.current = setTimeout(() => setMessage(''), duration);
  }, [duration]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return [message, show];
}
