import React from 'react';
import { AlertCircle } from 'lucide-react';

// Error shown inside an admin pop-up, so it isn't hidden behind the overlay.
const FormError = ({ message }) => (message ? (
  <div role="alert" className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
    <AlertCircle size={16} className="shrink-0" />
    <span>{message}</span>
  </div>
) : null);

export default FormError;
