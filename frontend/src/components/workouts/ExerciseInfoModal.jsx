import React from 'react';
import Modal from '../ui/Modal';
import MuscleMap from './MuscleMap';
import { CATEGORY_LABELS, KIND_LABELS } from '../../utils/workouts';

// What an exercise is: muscle map, how-to tip, muscles and equipment.
const ExerciseInfoModal = ({ exercise, onClose }) => (
  <Modal title={exercise.name} subtitle={`${CATEGORY_LABELS[exercise.category]} · ${KIND_LABELS[exercise.kind]}`} size="sm" onClose={onClose}>
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 flex justify-center">
        <MuscleMap primary={exercise.primary_muscles} secondary={exercise.secondary_muscles} className="w-56 h-52" />
      </div>
      {exercise.instructions?.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-1.5">How to do it</h3>
          <ul className="flex flex-col gap-1.5">
            {exercise.instructions.map((step, i) => (
              <li key={i} className="text-sm text-gray-800">{step}</li>
            ))}
          </ul>
        </div>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-gray-500">Main muscles</dt>
        <dd className="font-bold text-gray-900 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" aria-hidden="true" />
          {exercise.primary_muscles.join(', ') || '—'}
        </dd>
        {exercise.secondary_muscles.length > 0 && (
          <>
            <dt className="text-gray-500">Also works</dt>
            <dd className="text-gray-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/40" aria-hidden="true" />
              {exercise.secondary_muscles.join(', ')}
            </dd>
          </>
        )}
        {exercise.equipment && (
          <>
            <dt className="text-gray-500">Equipment</dt>
            <dd className="text-gray-800">{exercise.equipment}</dd>
          </>
        )}
      </dl>
    </div>
  </Modal>
);

export default ExerciseInfoModal;
