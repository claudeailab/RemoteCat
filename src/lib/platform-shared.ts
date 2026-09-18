// Browser-safe — no server imports. Used by client components.

export const DEFAULT_ICON = "solar:layers-bold";
export const DEFAULT_PRIMARY_COLOR = "#0d9488";
const TEAL = "%230d9488";

export function iconUrl(icon: string, color = TEAL): string {
  const colon = icon.indexOf(":");
  if (colon === -1) return `https://api.iconify.design/${icon}.svg?color=${color}`;
  const prefix = icon.slice(0, colon);
  const name = icon.slice(colon + 1);
  return `https://api.iconify.design/${prefix}/${name}.svg?color=${color}`;
}
