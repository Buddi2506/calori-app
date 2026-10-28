import React from 'react';

// Standard page heading: small eyebrow label, big title, one-line subtitle, actions on the right.
const PageHeader = ({ eyebrow, title, subtitle, children }) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="flex flex-col gap-1 min-w-0">
      {eyebrow && <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{eyebrow}</span>}
      <h1 className="font-display italic text-[32px] leading-tight font-bold text-gray-900">{title}</h1>
      {subtitle && <span className="text-sm text-gray-600">{subtitle}</span>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
);

export default PageHeader;
