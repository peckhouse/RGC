import {Platform} from 'react-native';

/**
 * Typography constants for RGC.
 * iOS uses Futura; Android falls back to Roboto (sans-serif).
 */
export const Fonts = {
  // Primary display font — used for taglines, headings, hero text
  display: Platform.select({ios: 'Futura', android: 'sans-serif'}) as string,

  // Standard UI font — labels, body, card titles (system default)
  ui: Platform.select({ios: 'System', android: 'sans-serif'}) as string,

  // Serif accent — for decorative/italic text if needed
  serif: Platform.select({ios: 'Georgia', android: 'serif'}) as string,
};
