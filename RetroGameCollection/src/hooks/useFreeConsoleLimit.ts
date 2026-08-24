const FREE_CONSOLE_LIMIT = 5;

/**
 * Free-tier console cap. Additional consoles are unlocked only through
 * an In-App Purchase (RGC Pro) — never through codes or other mechanisms.
 */
export function useFreeConsoleLimit(): number {
  return FREE_CONSOLE_LIMIT;
}
