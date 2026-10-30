import tailwindColors from 'tailwindcss/colors.js';

// Copy without the deprecated aliases (lightBlue, warmGray...) that log warnings when read.
const deprecated = ['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray'];
const defaultColors = Object.fromEntries(
  Object.keys(tailwindColors).filter((k) => !deprecated.includes(k)).map((k) => [k, tailwindColors[k]])
);

/*
 * Dark theme: Midnight Black, Acid Lime and Electric Cobalt Blue.
 *
 * The UI was written with light-mode utility classes (bg-white, text-gray-900,
 * bg-amber-50 ...). Instead of rewriting every class, the palettes below remap
 * those names per utility type, so `bg-white` renders as a dark card surface
 * while `text-white` stays white, `text-gray-900` becomes near-white text, and
 * light tints like `bg-amber-50` become subtle translucent tints of the hue.
 */

// Base surfaces
const canvas = '#030407';   // page background (Midnight Black)
const surface = '#0B0D13';  // cards (bg-white)

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
  50: '#11141B', 100: '#161A23', 200: '#1F2430', 300: '#2A303D', 400: '#3E4452',
  500: '#626879', 600: '#8A90A0', 700: '#B4B9C6', 800: '#1F2430', 900: '#1F2430', 950: '#030407',
};
const textGray = {
  50: '#FAFBFC', 100: '#F2F4F8', 200: '#3B4150', 300: '#4E5466', 400: '#6B7183',
  500: '#8A90A0', 600: '#A3A9B8', 700: '#C5CAD6', 800: '#E2E6EE', 900: '#F2F4F8', 950: '#FFFFFF',
};
const borderGray = {
  50: '#14171F', 100: '#191D27', 200: '#222735', 300: '#2E3442', 400: '#434A5A',
  500: '#626879', 600: '#8A90A0', 700: '#2E3442', 800: '#222735', 900: '#191D27', 950: '#0B0D13',
};

// Acid Lime (#D4FF24) is the accent: it takes over the amber classes the UI uses for
// buttons and highlights, and the emerald / lime ones used for "on track" and success.
const acidLime = {
  50: '#F9FFE0', 100: '#F2FFBF', 200: '#E8FF8A', 300: '#DEFF55', 400: '#D4FF24', 500: '#BEE60F',
  600: '#9ABD08', 700: '#76900A', 800: '#5A6E0E', 900: '#4A5A10', 950: '#283303',
};
// Electric Cobalt Blue (#1558C9) for charts and selection; light shades keep text readable.
const cobalt = {
  50: '#EEF4FF', 100: '#DCE7FF', 200: '#B9CEFF', 300: '#93B4FF', 400: '#6F9BFF', 500: '#1558C9',
  600: '#1558C9', 700: '#1247A3', 800: '#103B85', 900: '#0F326C', 950: '#0A1F45',
};
const paletteOverrides = { amber: acidLime, emerald: acidLime, lime: acidLime, blue: cobalt };
Object.assign(defaultColors, paletteOverrides);

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
    dark: '#F2F4F8',
    gray: '#11141B',
    blue: '#1558C9',
    green: '#D4FF24',
    pink: '#E6E9F2',
    amber: '#D4FF24',
  },
  // Macro colours: protein lime, carbs cobalt, fat soft white
  protein: '#D4FF24',
  carbs: '#6F9BFF',
  fat: '#E6E9F2',
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
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: brand,
      backgroundColor: bgColors,
      gradientColorStops: bgColors,
      textColor: textColors,
      placeholderColor: textColors,
      accentColor: textColors,  // native checkboxes and radios
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
