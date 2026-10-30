import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import MuscleMap from './MuscleMap';
import ExerciseInfoModal from './ExerciseInfoModal';

const SIZES = {
  sm: { box: 'w-12 h-11', map: 'w-10 h-9' },
  md: { box: 'w-14 h-12', map: 'w-12 h-11' },
  lg: { box: 'w-20 h-[4.5rem]', map: 'w-[4.5rem] h-16' },
};

// An exercise's muscle-map picture as a button: tap it to see it large, with how-to steps.
// Keep it outside other buttons and links (it is one itself).
const ExerciseThumb = ({ exercise, size = 'sm', className = '' }) => {
  const [open, setOpen] = useState(false);
  const s = SIZES[size];
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        aria-label={`Show ${exercise.name} larger`}
        className={`relative ${s.box} rounded-xl bg-gray-50 border border-gray-100 hover:border-amber-400 flex items-center justify-center shrink-0 transition-colors group/thumb ${className}`}
      >
        <MuscleMap primary={exercise.primary_muscles} secondary={exercise.secondary_muscles} className={s.map} />
        <Maximize2 size={10} aria-hidden="true" className="absolute right-1 bottom-1 text-gray-500 group-hover/thumb:text-amber-400" />
      </button>
      {open && <ExerciseInfoModal exercise={exercise} onClose={() => setOpen(false)} />}
    </>
  );
};

export default ExerciseThumb;
