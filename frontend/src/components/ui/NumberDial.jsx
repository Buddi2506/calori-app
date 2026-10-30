import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Keyboard, Minus, Plus } from 'lucide-react';

const ITEM_H = 44; // px per row in a wheel
const VISIBLE = 5; // rows shown; the middle one is the selection

// True on phones and tablets (a finger, not a mouse), where a dial beats the keyboard.
export const useTouchDial = () => {
  const query = '(pointer: coarse)';
  const [touch, setTouch] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const update = () => setTouch(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return touch;
};

const decimals = (step) => (String(step).split('.')[1] || '').length;
const fmt = (v, step) => (decimals(step) ? Number(v).toFixed(decimals(step)).replace(/\.?0+$/, '') : String(v));

// One scrolling column of numbers that snaps to the middle row.
const Wheel = ({ label, unit, min, max, step, value, onChange }) => {
  const values = useMemo(() => {
    const n = Math.round((max - min) / step);
    return Array.from({ length: n + 1 }, (_, i) => +(min + i * step).toFixed(4));
  }, [min, max, step]);
  const indexOf = (v) => {
    if (v == null || Number.isNaN(v)) return 0;
    return Math.max(0, Math.min(values.length - 1, Math.round((v - min) / step)));
  };
  const ref = useRef(null);
  const timer = useRef(null);
  const index = indexOf(value);

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = index * ITEM_H;
    // Only on open: later scrolling is driven by the user.
  }, []);

  const settle = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const i = Math.round(ref.current.scrollTop / ITEM_H);
      const v = values[Math.max(0, Math.min(values.length - 1, i))];
      if (v !== value) onChange(v);
    }, 90);
  };
  const jump = (i) => {
    const clamped = Math.max(0, Math.min(values.length - 1, i));
    ref.current?.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
    onChange(values[clamped]);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <button type="button" onClick={() => jump(index - 1)} aria-label={`Less ${label}`} className="w-9 h-9 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center"><Minus size={16} /></button>
      <div className="relative w-full" style={{ height: ITEM_H * VISIBLE }}>
        <div className="pointer-events-none absolute inset-x-1 rounded-2xl bg-amber-400/15 border border-amber-400/60" style={{ top: ITEM_H * 2, height: ITEM_H }} />
        <div
          ref={ref}
          onScroll={settle}
          role="listbox"
          aria-label={label}
          className="relative h-full overflow-y-scroll snap-y snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2 }}
        >
          {values.map((v, i) => (
            <button
              type="button"
              key={v}
              role="option"
              aria-selected={i === index}
              onClick={() => jump(i)}
              className={`w-full snap-center flex items-center justify-center gap-1 tabular-nums transition-colors ${
                i === index ? 'text-2xl font-black text-gray-900' : Math.abs(i - index) === 1 ? 'text-lg font-bold text-gray-600' : 'text-base font-semibold text-gray-400'
              }`}
              style={{ height: ITEM_H }}
            >
              {fmt(v, step)}{i === index && unit && <span className="text-xs font-bold text-gray-500">{unit}</span>}
            </button>
          ))}
        </div>
      </div>
      <button type="button" onClick={() => jump(index + 1)} aria-label={`More ${label}`} className="w-9 h-9 rounded-full bg-gray-100 text-gray-900 flex items-center justify-center"><Plus size={16} /></button>
    </div>
  );
};

/*
 * Bottom sheet with one wheel per number, e.g. weight and reps side by side.
 * columns: [{ key, label, unit, min, max, step, value }] (value may be null: starts at `start` or min)
 * onDone receives { key: number }; onType switches back to typing with the keyboard.
 */
const NumberDial = ({ title, columns, onDone, onClose, onType }) => {
  const [values, setValues] = useState(() =>
    Object.fromEntries(columns.map((c) => [c.key, c.value ?? c.start ?? c.min])));
  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 flex justify-center">
        <Dialog.Panel className="w-full max-w-md bg-white rounded-t-[28px] border-t border-gray-100 shadow-2xl px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-200" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3 mb-3">
            <Dialog.Title className="text-base font-extrabold text-gray-900 truncate">{title}</Dialog.Title>
            {onType && (
              <button type="button" onClick={onType} className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 shrink-0">
                <Keyboard size={15} /> Type instead
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {columns.map((c) => (
              <Wheel key={c.key} {...c} value={values[c.key]} onChange={(v) => setValues((s) => ({ ...s, [c.key]: v }))} />
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 h-12">Cancel</button>
            <button type="button" onClick={() => onDone(values)} className="btn-primary flex-1 h-12">Done</button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default NumberDial;
