import { getSetting, setSetting } from "./encryption";

export interface PlatformInfo {
  name: string;
  logoUrl: string;
}

const DEFAULT_LOGO = "https://api.iconify.design/solar:layers-bold.svg?color=%230d9488";

export async function getPlatformInfo(): Promise<PlatformInfo> {
  const [name, logoUrl] = await Promise.all([
    getSetting("platform_name"),
    getSetting("platform_logo_url"),
  ]);
  return {
    name: name || "Platform",
    logoUrl: logoUrl || DEFAULT_LOGO,
  };
}

export async function setPlatformInfo(info: Partial<PlatformInfo>) {
  await Promise.all([
    info.name !== undefined ? setSetting("platform_name", info.name) : Promise.resolve(),
    info.logoUrl !== undefined ? setSetting("platform_logo_url", info.logoUrl) : Promise.resolve(),
  ]);
}
