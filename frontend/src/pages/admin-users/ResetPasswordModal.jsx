import React from 'react';
import { KeyRound } from 'lucide-react';
import Modal, { FieldLabel } from '../../components/ui/Modal';
import FormError from './FormError';

// Set a temporary password the member must change at next sign-in.
const ResetPasswordModal = ({ selectedUser, resetPasswordVal, setResetPasswordVal, error, onSubmit, onClose }) => (
  <Modal
    title="Reset password"
    subtitle={`@${selectedUser.username}`}
    icon="🔑"
    size="sm"
    onClose={onClose}
    footer={
      <>
        <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
        <button type="submit" form="reset-password-form" className="btn-primary text-sm">Set temporary password</button>
      </>
    }
  >
    <form id="reset-password-form" onSubmit={onSubmit} className="flex flex-col gap-4">
      <FormError message={error} />
      <div>
        <FieldLabel htmlFor="reset-password">New temporary password</FieldLabel>
        <input
          id="reset-password"
          type="text"
          required
          minLength={6}
          placeholder="At least 6 characters"
          value={resetPasswordVal}
          onChange={(e) => setResetPasswordVal(e.target.value)}
          className="input-field text-sm"
        />
      </div>
      <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2.5 text-xs text-gray-600">
        <KeyRound size={16} className="shrink-0 text-amber-400 mt-0.5" />
        <span>They'll have to choose a new password as soon as they sign in.</span>
      </div>
    </form>
  </Modal>
);

export default ResetPasswordModal;
