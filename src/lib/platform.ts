import { getSetting, setSetting } from "./encryption";
export { iconUrl, DEFAULT_ICON } from "./platform-shared";

export interface PlatformInfo {
  name: string;
  icon: string;
}

export async function getPlatformInfo(): Promise<PlatformInfo> {
  const [name, icon] = await Promise.all([
    getSetting("platform_name"),
    getSetting("platform_icon"),
  ]);
  return {
    name: name || "Platform",
    icon: icon || "solar:layers-bold",
  };
}

export async function setPlatformInfo(info: Partial<PlatformInfo>) {
  await Promise.all([
    info.name !== undefined ? setSetting("platform_name", info.name) : Promise.resolve(),
    info.icon !== undefined ? setSetting("platform_icon", info.icon) : Promise.resolve(),
  ]);
}
