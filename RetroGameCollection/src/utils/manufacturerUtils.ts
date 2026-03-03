import type {Console} from '../types/database';
import type {ManufacturerKey} from '../constants/manufacturers';

/**
 * Maps a console to a ManufacturerKey.
 * Uses the manufacturer field (populated from IGDB platform_family after re-sync)
 * with a name-based fallback for consoles that have no platform_family in IGDB.
 */
export function getManufacturerKey(console: Console): ManufacturerKey | null {
  // Primary: use the stored manufacturer field (IGDB platform_family.name or override)
  if (console.manufacturer) {
    const m = console.manufacturer.toLowerCase();
    if (m.includes('nintendo')) return 'Nintendo';
    if (m.includes('playstation') || m.includes('sony')) return 'Sony';
    if (m.includes('sega')) return 'Sega';
    if (m.includes('xbox') || m.includes('microsoft')) return 'Xbox';
    if (m.includes('atari')) return 'Atari';
    if (m.includes('nec')) return 'NEC';
    if (m.includes('snk')) return 'SNK';
    if (m.includes('bandai')) return 'Bandai';
  }

  // Fallback: detect from console name
  const n = console.name.toLowerCase();

  if (
    n.includes('nintendo') ||
    n.includes(' nes') || n.startsWith('nes') ||
    n.includes('snes') ||
    n.includes('game boy') || n.includes('gameboy') ||
    n.includes('game cube') || n.includes('gamecube') ||
    n.includes('wii') ||
    n.includes('switch') ||
    n.includes('n64') || n.includes('nintendo 64') ||
    n.includes('3ds') ||
    n.includes('nintendo ds') || n.includes(' ds ') ||
    n.includes('virtual boy') ||
    n.includes('famicom') ||
    n.includes('entertainment system')
  ) return 'Nintendo';

  if (
    n.includes('playstation') ||
    n.includes('ps vita') ||
    n.includes('psp')
  ) return 'Sony';

  if (
    n.includes('sega') ||
    n.includes('mega drive') ||
    n.includes('genesis') ||
    n.includes('master system') ||
    n.includes('mark iii') ||
    n.includes('saturn') ||
    n.includes('dreamcast') ||
    n.includes('game gear') ||
    n.includes('sg-1000')
  ) return 'Sega';

  if (n.includes('xbox')) return 'Xbox';

  if (n.includes('atari') || n.includes('lynx') || n.includes('jaguar')) return 'Atari';

  if (
    n.includes('turbografx') ||
    n.includes('pc engine') ||
    n.includes('tg-16') ||
    n.includes('pc-fx')
  ) return 'NEC';

  if (n.includes('neo geo')) return 'SNK';

  if (n.includes('wonderswan')) return 'Bandai';

  return null;
}
