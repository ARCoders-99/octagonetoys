import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin panel",
  robots: { index: false, follow: false },
};

export default async function AdminProtectedLayout({ children }) {
  const session = await requireAdmin();
  return <AdminShell session={session}>{children}</AdminShell>;
}
