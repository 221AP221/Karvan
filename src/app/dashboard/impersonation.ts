"use server";

import { redirect } from "next/navigation";
import { stopImpersonation } from "@/lib/auth";

export async function stopImpersonationAction() {
  await stopImpersonation();
  redirect("/admin/users");
}
