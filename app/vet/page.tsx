"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboardLayout";
import Link from "next/link";
import supabase from "@/lib/supabase";
import { VET_NAV } from '@/app/components/sidebar'

type StatCardProps = {
  icon: string;
  label: string;
  value: number;
  sub: string;
  href: string;
  accent?: boolean;
};

function StatCard({ icon, label, value, sub, href, accent }: StatCardProps) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "20px",
        border: accent ? "1px solid #dc2626" : "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        textDecoration: "none",
        color: "inherit",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(220,38,38,0.15)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <span style={{ fontSize: "28px" }}>{icon}</span>
        <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "999px", backgroundColor: accent ? "#fef2f2" : "#f3f4f6", color: accent ? "#dc2626" : "#6b7280" }}>
          View →
        </span>
      </div>
      <p style={{ fontSize: "28px", fontWeight: "bold", color: accent ? "#dc2626" : "#111827", margin: "0 0 4px 0" }}>
        {value}
      </p>
      <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: "0 0 2px 0" }}>{label}</p>
      <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>{sub}</p>
    </Link>
  );
}

type Enquiry = { subject: string; status: string; time: string };

export default function VetDashboardPage() {
  const [vetName, setVetName] = useState("Veterinarian");
  const [stats, setStats] = useState({
    assignedEnquiries:  0,
    respondedEnquiries: 0,
    pendingReviews:     0,
    validatedContent:   0,
    rejectedContent:    0,
  });
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch vet's profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      if (profile?.name) setVetName(profile.name);

      // Fetch vet's enquiry counts
      const { data: enquiries } = await supabase
        .from("enquiry")
        .select("enquiryID, subject, status, created_at")
        .eq("vetID", user.id)
        .order("created_at", { ascending: false });

      if (enquiries) {
        setStats(prev => ({
          ...prev,
          assignedEnquiries:  enquiries.filter(e => e.status === "assigned").length,
          respondedEnquiries: enquiries.filter(e => e.status === "responded").length,
        }));
        setRecentEnquiries(
          enquiries.slice(0, 3).map(e => ({
            subject: e.subject,
            status:  e.status,
            time:    new Date(e.created_at).toLocaleString(),
          }))
        );
      }

      // Fetch content review counts for this vet
      const { data: reviews } = await supabase
        .from("content_review")
        .select("status")
        .eq("vetID", user.id);

      if (reviews) {
        setStats(prev => ({
          ...prev,
          pendingReviews:   reviews.filter(r => r.status === "pending").length,
          validatedContent: reviews.filter(r => r.status === "validated").length,
          rejectedContent:  reviews.filter(r => r.status === "rejected").length,
        }));
      }

      setLoading(false);
    }
    init();
  }, []);

  const statusColor: Record<string, string> = {
    assigned:  "#dbeafe",
    responded: "#dcfce7",
  };
  const statusText: Record<string, string> = {
    assigned:  "#1e40af",
    responded: "#166534",
  };

  return (
    <DashboardLayout role="Veterinarian" name={vetName} navItems={VET_NAV}>

      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", margin: "0 0 4px 0" }}>Dashboard</h1>
        <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>
          {loading ? "Loading…" : `Welcome back, ${vetName}. Here's your current workload.`}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <StatCard icon="💬" label="Assigned Enquiries"  value={stats.assignedEnquiries}  sub="Awaiting your response"       href="/vet/assignedEnquiries" accent />
        <StatCard icon="✅" label="Enquiries Responded" value={stats.respondedEnquiries} sub="Replied to pet owners"         href="/vet/assignedEnquiries" />
        <StatCard icon="🔬" label="Pending Reviews"     value={stats.pendingReviews}     sub="Content awaiting validation"  href="/vet/validateContent?status=pending"   accent />
        <StatCard icon="✔️" label="Validated Content"   value={stats.validatedContent}   sub="Guides approved by you"       href="/vet/validateContent?status=validated" />
        <StatCard icon="✖️" label="Rejected Content"    value={stats.rejectedContent}    sub="Sent back for revision"       href="/vet/validateContent?status=rejected" />
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#111827", marginBottom: "12px" }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/vet/assignedEnquiries"
            style={{ padding: "10px 20px", backgroundColor: "#dc2626", color: "white", borderRadius: "4px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}
          >
            💬 View Assigned Enquiries
          </Link>
          <Link
            href="/vet/validateContent"
            style={{ padding: "10px 20px", backgroundColor: "white", border: "1px solid #e5e7eb", color: "#374151", borderRadius: "4px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}
          >
            🔬 Review Pending Content
          </Link>
        </div>
      </div>

      {/* Recent assigned enquiries */}
      <div>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#111827", marginBottom: "12px" }}>Recent Assigned Enquiries</h2>
        <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {recentEnquiries.length === 0 && !loading ? (
            <p style={{ padding: "20px", fontSize: "14px", color: "#9ca3af", margin: 0 }}>No recent enquiries.</p>
          ) : (
            recentEnquiries.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: i < recentEnquiries.length - 1 ? "1px solid #f3f4f6" : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", margin: "0 0 2px 0" }}>{item.subject}</p>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>{item.time}</p>
                </div>
                <span style={{ fontSize: "12px", fontWeight: "500", padding: "3px 10px", borderRadius: "999px", backgroundColor: statusColor[item.status] ?? "#f3f4f6", color: statusText[item.status] ?? "#374151" }}>
                  {item.status}
                </span>
              </div>
            ))
          )}
          <div style={{ padding: "10px 20px", borderTop: "1px solid #f3f4f6" }}>
            <Link href="/vet/assignedEnquiries" style={{ fontSize: "13px", color: "#dc2626", fontWeight: "600", textDecoration: "none" }}>
              View all assigned enquiries →
            </Link>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}
