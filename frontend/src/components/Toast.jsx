import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const Toast = ({ message }) => {
  if (!message) return null;
  return (
    <div role="status" className="fixed top-5 right-5 z-50 bg-[#191D27] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-gray-300 text-sm">
      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default Toast;
