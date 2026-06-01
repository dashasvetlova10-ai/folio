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
  const images = formData.getAll("images") as string[];

  if (id) {
    await supabase
      .from("entries")
      .update({ title, content, mood, images, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
  } else {
    const { data: newEntry } = await supabase
      .from("entries")
      .insert({ user_id: user.id, title, content, mood, date, images })
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

export async function createCollection(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const type = formData.get("type") as string;
  const cover_color = formData.get("cover_color") as string;

  let title: string;
  let start_date: string;
  let end_date: string;

  if (type === "monthly") {
    const month = parseInt(formData.get("month") as string);
    const year = parseInt(formData.get("year") as string);
    title = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" }) + " " + year;
    start_date = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    end_date = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  } else {
    title = formData.get("title") as string;
    start_date = formData.get("start_date") as string;
    end_date = formData.get("end_date") as string;
  }

  const { data: collection } = await supabase
    .from("collections")
    .insert({ user_id: user.id, title, type, start_date, end_date, cover_color })
    .select("id")
    .single();

  revalidatePath("/dashboard");
  if (collection) redirect(`/collections/${collection.id}`);
}

export async function deleteCollection(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("collections").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
