"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateWorkspaceSettings(formData: FormData) {
  const workspaceName = formData.get("workspaceName") as string;
  const timezone = formData.get("timezone") as string;
  const language = formData.get("language") as string;
  const whatsappAlerts = formData.get("whatsappAlerts") === "on";
  const emailDigests = formData.get("emailDigests") === "on";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      workspace_name: workspaceName || "My Workspace",
      timezone: timezone || "UTC",
      language: language || "es",
      whatsapp_alerts: whatsappAlerts,
      email_digests: emailDigests,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/settings");
}
