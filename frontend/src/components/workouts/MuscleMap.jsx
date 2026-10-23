import React from 'react';

// Front body on the left (centre x=25), back body on the right (centre x=75), viewBox 100 × 92.
// Shapes: ['e', cx, cy, rx, ry, rotateDeg?] ellipse · ['r', x, y, w, h, radius] rect · ['p', d] path.
const mirror = (shapes, axis) =>
  shapes.flatMap((s) => {
    if (s[0] !== 'e') return [s];
    const [, cx, cy, rx, ry, rot = 0] = s;
    return [s, ['e', 2 * axis - cx, cy, rx, ry, -rot]];
  });
const front = (shapes) => mirror(shapes, 25);
const back = (shapes) => mirror(shapes.map((s) => (s[0] === 'e' ? ['e', s[1] + 50, ...s.slice(2)] : s)), 75);

const BODY_PARTS = [
  ['e', 12, 27, 3.2, 8.5, 10], ['e', 9.6, 41.5, 2.6, 7.2, 12], // arm, forearm
  ['e', 20.5, 57, 4.6, 11.5], ['e', 20.3, 78, 3.1, 9.5], // thigh, lower leg
];
const BASE = [
  ['e', 25, 7, 5, 5.4], ['e', 75, 7, 5, 5.4], // heads
  ['r', 22.8, 11, 4.4, 4, 1], ['r', 72.8, 11, 4.4, 4, 1], // necks
  ['p', 'M14.5 15.5 Q25 12.5 35.5 15.5 L33.4 45 Q25 48.5 16.6 45 Z'], // front torso
  ['p', 'M64.5 15.5 Q75 12.5 85.5 15.5 L83.4 45 Q75 48.5 66.6 45 Z'], // back torso
  ...front(BODY_PARTS),
  ...back(BODY_PARTS),
];

const REGIONS = {
  chest: front([['e', 20.6, 22.6, 4.7, 3.7]]),
  shoulders: [...front([['e', 15.4, 18.6, 3.4, 3.1]]), ...back([['e', 15.4, 18.6, 3.4, 3.1]])],
  biceps: front([['e', 12.4, 27.5, 2.2, 5, 10]]),
  forearms: [...front([['e', 9.7, 41.5, 2, 5.6, 12]]), ...back([['e', 9.7, 41.5, 2, 5.6, 12]])],
  abdominals: [['r', 21, 28, 8, 14.5, 2.6]],
  quadriceps: front([['e', 20.4, 57.5, 3.6, 9.2]]),
  adductors: front([['e', 23.6, 52.5, 1.3, 4.2]]),
  abductors: [...front([['e', 16.2, 49, 1.3, 3.6]]), ...back([['e', 16.2, 47, 1.3, 3.6]])],
  neck: [['r', 23.4, 11.5, 3.2, 3, 1], ['r', 73.4, 11.5, 3.2, 3, 1]],
  traps: [['p', 'M69.5 15.4 L80.5 15.4 L75 25.5 Z'], ...front([['e', 21, 15.6, 2.6, 1.2]])],
  lats: back([['e', 19.2, 31, 3.4, 7.8, -14]]),
  'middle back': [['r', 72.6, 21.5, 4.8, 10, 1.6]],
  'lower back': [['r', 71.6, 35, 6.8, 7, 2.2]],
  triceps: back([['e', 12.4, 27.5, 2.2, 5, 10]]),
  glutes: back([['e', 21, 47.8, 4.3, 4.1]]),
  hamstrings: back([['e', 20.6, 60.5, 3.5, 7.6]]),
  calves: back([['e', 20.2, 77.5, 2.7, 6.6]]),
};

const COLORS = { body: '#2A2C34', muscle: '#33363F', primary: '#FBBF24' };

const Shape = ({ s, fill, opacity }) => {
  if (s[0] === 'e') {
    const [, cx, cy, rx, ry, rot = 0] = s;
    return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} opacity={opacity} transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined} />;
  }
  if (s[0] === 'r') {
    const [, x, y, w, h, r] = s;
    return <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} opacity={opacity} />;
  }
  return <path d={s[1]} fill={fill} opacity={opacity} />;
};

const describe = (primary, secondary) =>
  primary.length
    ? `Works ${primary.join(', ')}${secondary.length ? `; also ${secondary.join(', ')}` : ''}`
    : 'Muscles worked';

// Front-and-back body outline with the worked muscles filled in amber (secondary ones fainter).
// With `intensity` ({ muscle: 0–1 }) it becomes a heat map instead: stronger amber = more work.
const MuscleMap = ({ primary = [], secondary = [], intensity, label, className = 'w-12 h-11' }) => (
  <svg viewBox="0 0 100 92" className={className} role="img" aria-label={label || describe(primary, secondary)}>
    {BASE.map((s, i) => <Shape key={`b${i}`} s={s} fill={COLORS.body} />)}
    {Object.entries(REGIONS).map(([muscle, shapes]) =>
      shapes.map((s, i) => {
        let opacity = 1;
        let lit;
        if (intensity) {
          const v = intensity[muscle] || 0;
          lit = v > 0;
          opacity = lit ? 0.25 + 0.75 * v : 1;
        } else {
          const isPrimary = primary.includes(muscle);
          lit = isPrimary || secondary.includes(muscle);
          opacity = lit && !isPrimary ? 0.4 : 1;
        }
        return <Shape key={`${muscle}${i}`} s={s} fill={lit ? COLORS.primary : COLORS.muscle} opacity={opacity} />;
      })
    )}
  </svg>
);

export default MuscleMap;
