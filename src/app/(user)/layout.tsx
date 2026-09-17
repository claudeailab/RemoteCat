import { requireSession } from "@/lib/auth";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
