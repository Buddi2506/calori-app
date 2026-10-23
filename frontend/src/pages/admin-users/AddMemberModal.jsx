import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Modal, { FieldLabel } from '../../components/ui/Modal';
import FormError from './FormError';

// Create a member account with a temporary password.
const AddMemberModal = ({ usersData, addForm, setAddForm, error, onSubmit, onClose }) => {
  const set = (key) => (e) => setAddForm({ ...addForm, [key]: e.target.value });

  return (
    <Modal
      title="Add member"
      subtitle={`Slot ${usersData.total_users + 1} of ${usersData.max_allowed || 10}`}
      icon="👤"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button type="submit" form="add-member-form" className="btn-primary text-sm">Create account</button>
        </>
      }
    >
      <form id="add-member-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormError message={error} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel htmlFor="add-full-name">Full name</FieldLabel>
            <input id="add-full-name" type="text" required placeholder="e.g. Ramesh Kumar"
              value={addForm.full_name} onChange={set('full_name')} className="input-field text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="add-username">Username</FieldLabel>
            <input id="add-username" type="text" required placeholder="e.g. ramesh"
              value={addForm.username} onChange={set('username')} className="input-field text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="add-email">Email</FieldLabel>
            <input id="add-email" type="email" required placeholder="ramesh@example.com"
              value={addForm.email} onChange={set('email')} className="input-field text-sm" />
          </div>
          <div>
            <FieldLabel htmlFor="add-target">Daily calorie target</FieldLabel>
            <input id="add-target" type="number" required min={800} max={6000} placeholder="2000"
              value={addForm.calorie_target} onChange={set('calorie_target')} className="input-field text-sm" />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="add-password">Temporary password</FieldLabel>
          <input id="add-password" type="text" required minLength={6} placeholder="At least 6 characters"
            value={addForm.password} onChange={set('password')} className="input-field text-sm" />
        </div>
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2.5 text-xs text-gray-600">
          <ShieldCheck size={16} className="shrink-0 text-amber-400 mt-0.5" />
          <span>They'll be asked to choose their own password the first time they sign in.</span>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal;
