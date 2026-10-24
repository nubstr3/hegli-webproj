import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import AdminShell from "./AdminShell";

// Every page under app/m/admin is for the signed-in owner only. This is the real
// lock (checked against Supabase on each request); the proxy never decides access.
export default async function MobileAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/login");
  return <AdminShell>{children}</AdminShell>;
}