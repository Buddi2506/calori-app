import React from 'react';

export const Spinner = () => (
  <div className="flex items-center justify-center h-40">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
  </div>
);

export const EmptyState = ({ message }) => (
  <div className="zentra-card text-center p-12 text-gray-400">
    <p className="text-5xl mb-4">📊</p>
    <p className="font-semibold text-gray-600">{message}</p>
  </div>
);
