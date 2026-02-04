import { createClient } from "@/lib/supabase/server";
import MainLayoutWithDrawer from "@/components/layout/MainLayoutWithDrawer";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <MainLayoutWithDrawer user={user} profile={profile}>
      {children}
    </MainLayoutWithDrawer>
  );
}
