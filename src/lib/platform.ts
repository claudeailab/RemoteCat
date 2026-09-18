import { getSetting, setSetting } from "./encryption";

export interface PlatformInfo {
  name: string;
  icon: string;  // Iconify identifier, e.g. "solar:layers-bold"
}

export const DEFAULT_ICON = "solar:layers-bold";
const TEAL = "%230d9488";

export function iconUrl(icon: string, color = TEAL): string {
  const colon = icon.indexOf(":");
  if (colon === -1) return `https://api.iconify.design/${icon}.svg?color=${color}`;
  const prefix = icon.slice(0, colon);
  const name = icon.slice(colon + 1);
  return `https://api.iconify.design/${prefix}/${name}.svg?color=${color}`;
}

export async function getPlatformInfo(): Promise<PlatformInfo> {
  const [name, icon] = await Promise.all([
    getSetting("platform_name"),
    getSetting("platform_icon"),
  ]);
  return {
    name: name || "Platform",
    icon: icon || DEFAULT_ICON,
  };
}

export async function setPlatformInfo(info: Partial<PlatformInfo>) {
  await Promise.all([
    info.name !== undefined ? setSetting("platform_name", info.name) : Promise.resolve(),
    info.icon !== undefined ? setSetting("platform_icon", info.icon) : Promise.resolve(),
  ]);
}
