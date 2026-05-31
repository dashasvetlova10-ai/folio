"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) throw error;
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function saveEntry(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const mood = formData.get("mood") as string | null;
  const date = formData.get("date") as string;

  if (id) {
    await supabase
      .from("entries")
      .update({ title, content, mood, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
  } else {
    const { data: newEntry } = await supabase
      .from("entries")
      .insert({ user_id: user.id, title, content, mood, date })
      .select("id")
      .single();

    revalidatePath("/dashboard");
    if (newEntry) redirect(`/entry/${newEntry.id}`);
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/entry/${id}`);
}

export async function deleteEntry(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("entries").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
