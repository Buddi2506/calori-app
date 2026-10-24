import React, { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import Modal from '../ui/Modal';

const Section = ({ title, children }) => (
  <section className="flex flex-col gap-2">
    <h3 className="text-sm font-extrabold text-gray-900">{title}</h3>
    {children}
  </section>
);

const Terms = ({ items }) => (
  <dl className="flex flex-col gap-2.5">
    {items.map(([term, text]) => (
      <div key={term}>
        <dt className="text-sm font-bold text-gray-900">{term}</dt>
        <dd className="text-sm text-gray-600">{text}</dd>
      </div>
    ))}
  </dl>
);

// Dumbbell curl over a few weeks with a 3 × 8–12 plan: reps climb, then the weight goes up.
const EXAMPLE = [
  ['Week 1', '8 kg', '8, 8, 8', ''],
  ['Week 3', '8 kg', '10, 10, 9', ''],
  ['Week 5', '8 kg', '12, 12, 12', 'Top of the range on every set'],
  ['Week 6', '10 kg', '8, 8, 7', 'Heavier, so reps start low again'],
];

// "How it works" button and the guide it opens: what to enter, what each number means
// and how to keep getting stronger.
const ProgressGuide = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary h-10 px-4 text-sm flex items-center gap-2">
        <CircleHelp size={16} aria-hidden="true" /> How it works
      </button>
      {open && (
        <Modal title="How progress works" subtitle="What to enter, what the numbers mean, how to improve" icon="💡" size="lg" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-6">
            <Section title="1. Your plan">
              <p className="text-sm text-gray-600">
                In <span className="font-bold text-gray-900">Edit split</span>, each exercise has a target like{' '}
                <span className="font-bold text-gray-900">3 × 8–12</span>: do 3 sets of 8 to 12 reps. Pick a weight you can
                lift at least 8 times with good form. For a fixed number like 3 × 10, put 10 in both reps boxes.
              </p>
            </Section>

            <Section title="2. What you enter">
              <p className="text-sm text-gray-600">
                While training, enter the <span className="font-bold text-gray-900">weight (kg) and reps</span> you actually
                did for each set and tap ✓. The boxes are filled in with last time's numbers, so you only change what's different.
                For a warm-up, tap the set number so it shows <span className="font-bold text-gray-900">W</span>: warm-ups
                don't count toward your sets, records or volume.
              </p>
            </Section>

            <Section title="3. What the numbers mean">
              <Terms items={[
                ['🏆 Heaviest weight', 'The most weight you have used for this exercise in a working set.'],
                ['🏆 Best estimated max', 'The heaviest weight you could probably lift once, worked out from your sets: weight × (1 + reps ÷ 30). 10 kg × 12 reps → about 14 kg. It lets you compare a heavy set of 6 with a lighter set of 12. Only sets of 15 reps or fewer count.'],
                ['🏆 Best volume', 'The most work in one workout: weight × reps for every working set, added up. 10 kg × (12 + 12 + 11) = 350 kg.'],
                ['🏆 Most reps in a set', 'Your best single set by reps. Useful for bodyweight moves like pull-ups.'],
                ['🏆 Longest hold', 'For timed moves like the plank: your longest set.'],
                ['Cardio records', 'Longest session, longest distance, and best pace (minutes per km; lower is faster).'],
                ['Working sets per week', 'How many working sets you did each week. A steady number means you train consistently.'],
                ['Muscles worked', 'Working sets per muscle in the chosen weeks, so you can spot a muscle you are skipping.'],
                ['Trophy on a set', 'Shown when a set beats everything you have done before in that exercise.'],
              ]} />
            </Section>

            <Section title="4. How to get stronger (progressive overload)">
              <p className="text-sm text-gray-600">
                Use your reps range like a ladder: each workout, try to add a rep or two at the same weight. Once you reach the
                top of the range on <span className="font-bold text-gray-900">every</span> set, go up a weight step
                (about 1–2 kg for dumbbells, 2.5–5 kg for barbells and machines) and climb again from the bottom.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th scope="col" className="text-left font-bold px-3 py-2">When</th>
                      <th scope="col" className="text-left font-bold px-3 py-2">Weight</th>
                      <th scope="col" className="text-left font-bold px-3 py-2">Reps</th>
                      <th scope="col" className="text-left font-bold px-3 py-2"><span className="sr-only">Note</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {EXAMPLE.map(([when, kg, reps, note]) => (
                      <tr key={when} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-bold text-gray-900 whitespace-nowrap">{when}</td>
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{kg}</td>
                        <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{reps}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="5. Reading your charts">
              <Terms items={[
                ['Strength over time', 'On an exercise\'s page, the yellow line (estimated max) going up means you are getting stronger, even on weeks the weight stays the same. The blue line steps up each time you lift heavier.'],
                ['Volume per workout', 'Bars grow as you add reps. A dip right after you raise the weight is normal: fewer reps at a heavier weight.'],
                ['Stuck for 3 weeks or more?', 'Check sleep, protein and rest days, or drop the weight about 10% for a week and build back up.'],
              ]} />
            </Section>

            <Section title="6. Tips for fair comparisons">
              <ul className="list-disc pl-5 text-sm text-gray-600 flex flex-col gap-1">
                <li>Log every working set, not just the best one.</li>
                <li>Keep the same form and range of motion, so more weight really means stronger.</li>
                <li>Use the time ranges (3M, 6M, 1Y) to see the trend rather than one workout.</li>
              </ul>
            </Section>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ProgressGuide;
