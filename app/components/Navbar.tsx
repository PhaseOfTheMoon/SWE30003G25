"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabase";

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function getUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const userId = sessionData.session.user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email, role")
          .eq("id", userId)
          .single();
        if (profile) {
          setUser({ id: userId, name: profile.name, email: profile.email, role: profile.role ?? "" });
          fetchUnread(userId);
        }
      }
    }

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email, role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUser({ id: session.user.id, name: profile.name, email: profile.email, role: profile.role ?? "" });
          fetchUnread(session.user.id);
        }
      } else {
        setUser(null);
        setUnreadCount(0);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch responded enquiries and compare against seen IDs in localStorage
  async function fetchUnread(userId: string) {
    const { data } = await supabase
      .from("enquiry")
      .select("enquiryID")
      .eq("petOwnerID", userId)
      .eq("status", "responded");

    if (!data) return;

    const seenRaw = localStorage.getItem(`seen_responses_${userId}`);
    const seen: string[] = seenRaw ? JSON.parse(seenRaw) : [];
    const unread = data.filter(e => !seen.includes(e.enquiryID));
    setUnreadCount(unread.length);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setUnreadCount(0);
    router.push("/");
  }

  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : "";

  return (
    <nav style={{ backgroundColor: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "22px", fontWeight: "bold", color: "#dc2626" }}>
          🐾 PetFirstAid
        </div>

        {user?.role === "staff" || user?.role === "veterinarian" ? (
          <div style={{ padding: "6px 18px", border: "1px solid #d1d5db", borderRadius: "999px", fontSize: "14px", color: "#374151", backgroundColor: "#f9fafb" }}>
            {user.role === "staff" ? "Staff Portal" : "Vet Portal"}
          </div>
        ) : (
          <div style={{ display: "flex", gap: "24px", fontSize: "15px" }}>
            <Link href="/" style={{ color: "#374151", textDecoration: "none" }}>Home</Link>
            <Link href="/about" style={{ color: "#374151", textDecoration: "none" }}>About</Link>
            <Link href="/guide" style={{ color: "#374151", textDecoration: "none" }}>First-Aid Guide</Link>
            <Link href="/emergency" style={{ color: "#374151", textDecoration: "none" }}>Emergency</Link>
            <Link href="/contact" style={{ color: "#374151", textDecoration: "none" }}>Contact</Link>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {user ? (
            <>
              {/* Bell notification icon — only shown when logged in */}
              <Link
                href="/enquiry"
                title="View enquiry replies"
                style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: unreadCount > 0 ? "#fef2f2" : "#f9fafb", border: unreadCount > 0 ? "1px solid #fecaca" : "1px solid #e5e7eb", textDecoration: "none", transition: "all 0.15s" }}
              >
                <span style={{ fontSize: "16px" }}>🔔</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: "-4px", right: "-4px",
                    backgroundColor: "#dc2626", color: "white",
                    fontSize: "10px", fontWeight: "700",
                    borderRadius: "999px", minWidth: "16px", height: "16px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px", lineHeight: 1,
                    boxShadow: "0 0 0 2px white",
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link href="/profile" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#374151", fontSize: "14px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#dc2626", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
                  {avatarLetter}
                </div>
                {user.name}
              </Link>
              <button
                onClick={handleLogout}
                style={{ padding: "8px 16px", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "4px", fontSize: "14px", cursor: "pointer", backgroundColor: "white" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ padding: "8px 16px", border: "1px solid #dc2626", color: "#dc2626", borderRadius: "4px", textDecoration: "none", fontSize: "14px" }}>
                Login
              </Link>
              <Link href="/register" style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "white", borderRadius: "4px", textDecoration: "none", fontSize: "14px" }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
