import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProvidersClientPage from "./ProvidersClientPage";

export default async function X7ProvidersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch current settings
  const { data: settings } = await supabase
    .from("x7_user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch custom providers
  const { data: customProviders } = await supabase
    .from("x7_llm_providers")
    .select("*")
    .eq("user_id", user.id);

  return (
    <ProvidersClientPage
      initialSettings={settings || null}
      initialCustomProviders={customProviders || []}
    />
  );
}
