"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveUserSettings(data: {
  activeProvider: string;
  activeModel: string;
  openaiKey: string;
  anthropicKey: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const payload = {
    user_id: user.id,
    active_provider: data.activeProvider,
    active_model: data.activeModel,
    openai_api_key: data.openaiKey || null,
    anthropic_api_key: data.anthropicKey || null,
  };

  const { error } = await supabase
    .from("x7_user_settings")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings/x7-providers");
}

export async function addCustomProvider(data: {
  name: string;
  baseUrl: string;
  apiKey?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("x7_llm_providers").insert({
    user_id: user.id,
    name: data.name,
    base_url: data.baseUrl,
    api_key: data.apiKey || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings/x7-providers");
}

export async function deleteCustomProvider(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("x7_llm_providers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings/x7-providers");
}
