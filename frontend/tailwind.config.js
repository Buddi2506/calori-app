import tailwindColors from 'tailwindcss/colors.js';

// Copy without the deprecated aliases (lightBlue, warmGray...) that log warnings when read.
const deprecated = ['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray'];
const defaultColors = Object.fromEntries(
  Object.keys(tailwindColors).filter((k) => !deprecated.includes(k)).map((k) => [k, tailwindColors[k]])
);

/*
 * Dark theme ("Zentra Night").
 *
 * The UI was written with light-mode utility classes (bg-white, text-gray-900,
 * bg-amber-50 ...). Instead of rewriting every class, the palettes below remap
 * those names per utility type, so `bg-white` renders as a dark card surface
 * while `text-white` stays white, `text-gray-900` becomes near-white text, and
 * light tints like `bg-amber-50` become subtle translucent tints of the hue.
 */

// Base surfaces
const canvas = '#0B0C10';   // page background
const surface = '#15161B';  // cards (bg-white)

// Mix `hex` into `base` by `amount` (0..1) and return a solid hex.
const mix = (hex, amount, base = surface) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(base);
  const [r2, g2, b2] = p(hex);
  const c = (a, b) => Math.round(a + (b - a) * amount).toString(16).padStart(2, '0');
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
};

// Neutral scales: backgrounds go darker -> lighter, text goes light -> dim.
const bgGray = {
  50: '#1A1B21', 100: '#202229', 200: '#2A2C34', 300: '#363944', 400: '#4A4E5A',
  500: '#6B6F7B', 600: '#8B8F9A', 700: '#B4B7C0', 800: '#2A2C34', 900: '#2A2C34', 950: '#0B0C10',
};
const textGray = {
  50: '#FAFAFA', 100: '#F4F4F5', 200: '#3F3F46', 300: '#52525B', 400: '#71717A',
  500: '#8E8E98', 600: '#A1A1AA', 700: '#C4C4CC', 800: '#E4E4E7', 900: '#F4F4F5', 950: '#FFFFFF',
};
const borderGray = {
  50: '#1D1F25', 100: '#22242B', 200: '#2A2C34', 300: '#363944', 400: '#4A4E5A',
  500: '#6B6F7B', 600: '#8B8F9A', 700: '#363944', 800: '#2A2C34', 900: '#202229', 950: '#15161B',
};

const hues = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

// Light tints (50-300) become deep tints of the hue on the dark surface.
const bgHue = (name) => {
  const c = defaultColors[name];
  return { ...c, 50: mix(c[500], 0.1), 100: mix(c[500], 0.16), 200: mix(c[500], 0.28), 300: mix(c[500], 0.42) };
};
// Dark text shades (600-950) become light shades so they stay readable.
const textHue = (name) => {
  const c = defaultColors[name];
  return { ...c, 600: c[400], 700: c[300], 800: c[200], 900: c[100], 950: c[50] };
};
const borderHue = (name) => {
  const c = defaultColors[name];
  return { ...c, 50: mix(c[500], 0.12), 100: mix(c[500], 0.18), 200: mix(c[500], 0.28), 300: mix(c[500], 0.4) };
};

const build = (gray, hueFn, white) => ({
  ...defaultColors,
  white,
  gray,
  ...Object.fromEntries(hues.map((h) => [h, hueFn(h)])),
});

const brand = {
  primary: { DEFAULT: '#22c55e', dark: '#16a34a' },
  accent: { DEFAULT: '#f97316', dark: '#ea580c' },
  zentra: {
    canvas,
    surface,
    dark: '#F4F4F5',
    gray: '#1A1B21',
    blue: '#3B82F6',
    green: '#10B981',
    pink: '#EC4899',
    amber: '#F59E0B',
  },
};

const bgColors = { ...build(bgGray, bgHue, surface), ...brand };
const textColors = { ...build(textGray, textHue, '#FFFFFF'), ...brand };
const borderColors = { ...build(borderGray, borderHue, '#FFFFFF'), ...brand };

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: brand,
      backgroundColor: bgColors,
      gradientColorStops: bgColors,
      textColor: textColors,
      placeholderColor: textColors,
      borderColor: borderColors,
      divideColor: borderColors,
      ringColor: { ...borderColors, white: surface },
      ringOffsetColor: { white: surface },
      boxShadowColor: { gray: { 200: '#000000' } },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
        'zentra': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3)',
        'zentra-hover': '0 16px 36px -6px rgba(0, 0, 0, 0.6), 0 4px 10px -2px rgba(0, 0, 0, 0.35)',
      }
    },
  },
  plugins: [],
}
