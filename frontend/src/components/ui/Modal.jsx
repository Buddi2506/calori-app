import React from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

const WIDTHS = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-xl', xl: 'max-w-2xl' };

// Standard pop-up: header with title and close button, scrolling body, optional footer.
const Modal = ({ title, subtitle, icon, size = 'md', onClose, footer, children, bodyClassName = 'p-5 sm:p-6' }) => (
  <Dialog open onClose={onClose} className="relative z-50">
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
    <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
      <Dialog.Panel className={`mx-auto ${WIDTHS[size]} w-full bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]`}>
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100">
          {icon && (
            <span className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-xl shrink-0" aria-hidden="true">
              {icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <Dialog.Title className="text-base font-extrabold text-gray-900 truncate">{title}</Dialog.Title>
            {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 -mr-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-2">{footer}</div>}
      </Dialog.Panel>
    </div>
  </Dialog>
);

export const FieldLabel = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-xs font-bold text-gray-600 mb-1.5">{children}</label>
);

export default Modal;
