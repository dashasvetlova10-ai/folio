import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const subscription = await req.json();

  // Upsert — replace any existing subscription for this user
  await supabase.from("push_subscriptions")
    .delete()
    .eq("user_id", user.id);

  await supabase.from("push_subscriptions")
    .insert({ user_id: user.id, subscription });

  return new Response("ok");
}
