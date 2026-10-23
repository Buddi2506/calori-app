import React from 'react';
import Modal, { FieldLabel } from '../../components/ui/Modal';
import FormError from './FormError';

// Edit a member's name, email, calorie target and active status.
const EditMemberModal = ({ selectedUser, currentAdmin, editForm, setEditForm, error, onSubmit, onClose }) => {
  const set = (key) => (e) => setEditForm({ ...editForm, [key]: e.target.value });

  return (
    <Modal
      title="Edit member"
      subtitle={`@${selectedUser.username}`}
      icon="✏️"
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button type="submit" form="edit-member-form" className="btn-primary text-sm">Save changes</button>
        </>
      }
    >
      <form id="edit-member-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormError message={error} />
        <div>
          <FieldLabel htmlFor="edit-full-name">Full name</FieldLabel>
          <input id="edit-full-name" type="text" required value={editForm.full_name} onChange={set('full_name')} className="input-field text-sm" />
        </div>
        <div>
          <FieldLabel htmlFor="edit-email">Email</FieldLabel>
          <input id="edit-email" type="email" required value={editForm.email} onChange={set('email')} className="input-field text-sm" />
        </div>
        <div>
          <FieldLabel htmlFor="edit-target">Daily calorie target (kcal)</FieldLabel>
          <input id="edit-target" type="number" required min={800} max={6000} value={editForm.calorie_target} onChange={set('calorie_target')} className="input-field text-sm" />
        </div>
        {selectedUser.id !== currentAdmin?.id && (
          <label className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={editForm.is_active}
              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded accent-amber-400"
            />
            <span>
              <span className="block text-sm font-bold text-gray-900">Account active</span>
              <span className="block text-xs text-gray-500">Deactivated members can't sign in.</span>
            </span>
          </label>
        )}
      </form>
    </Modal>
  );
};

export default EditMemberModal;
