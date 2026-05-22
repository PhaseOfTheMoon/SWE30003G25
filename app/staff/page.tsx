"use client";

import DashboardLayout from "@/components/dashboardLayout";
import Link from "next/link";

const STAFF_NAV = [
  { label: "Dashboard", href: "/staff",icon: "🏠" },
  { label: "Manage Enquiries", href: "/staff/manageEnquiry", icon: "💬" },
  { label: "Manage Content", href: "/staff/manageContent",   icon: "📋" },
];

type StatCardProps = {
  icon:    string;
  label:   string;
  value:   number;
  sub:     string;
  href:    string;
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
        transition: "box-shadow 0.2s",
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

export default function StaffDashboardPage() {
  // Replace with real Supabase counts
  const stats = {
    pendingEnquiries:   5,
    assignedEnquiries:  3,
    respondedEnquiries: 12,
    pendingReviews:     2,
    publishedContent:   18,
  };

  const recentEnquiries = [
    { subject: "My dog is choking", status: "pending",   time: "10 mins ago" },
    { subject: "Cat not eating", status: "assigned",  time: "1 hour ago"  },
    { subject: "Rabbit leg injury", status: "responded", time: "3 hours ago" },
  ];

  const statusColor: Record<string, string> = {
    pending: "#fef3c7",
    assigned: "#dbeafe",
    responded: "#dcfce7",
  };
  const statusText: Record<string, string> = {
    pending:   "#92400e",
    assigned:  "#1e40af",
    responded: "#166534",
  };

  return (
    <DashboardLayout role="Staff" name="Alex Wong" navItems={STAFF_NAV}>

      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", margin: "0 0 4px 0" }}>Dashboard</h1>
        <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>
          Welcome back, Alex. Here's what needs your attention today.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <StatCard icon="📨" label="Pending Enquiries" value={stats.pendingEnquiries} sub="Awaiting assignment or reply" href="/staff/manageEnquiry" accent />
        <StatCard icon="🔗" label="Assigned to Vet" value={stats.assignedEnquiries} sub="Waiting on vet response" href="/staff/manageEnquiry" />
        <StatCard icon="✅" label="Responded" value={stats.respondedEnquiries} sub="Enquiries closed" href="/staff/manageEnquiry" />
        <StatCard icon="🕐" label="Pending Reviews" value={stats.pendingReviews} sub="Awaiting vet validation" href="/staff/pendingReview" accent />
        <StatCard icon="📚" label="Published Content" value={stats.publishedContent} sub="Guides live for pet owners" href="/staff/manageContent" />
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#111827", marginBottom: "12px" }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/staff/manageEnquiry"
            style={{ padding: "10px 20px", backgroundColor: "#dc2626", color: "white", borderRadius: "4px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}
          >
            💬 View Enquiries
          </Link>
          <Link
            href="/staff/manageContent"
            style={{ padding: "10px 20px", backgroundColor: "white", border: "1px solid #e5e7eb", color: "#374151", borderRadius: "4px", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}
          >
            📋 Create Guide
          </Link>
        </div>
      </div>

      {/* Recent enquiries */}
      <div>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", color: "#111827", marginBottom: "12px" }}>Recent Enquiries</h2>
        <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {recentEnquiries.map((item, i) => (
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
              <span style={{ fontSize: "12px", fontWeight: "500", padding: "3px 10px", borderRadius: "999px", backgroundColor: statusColor[item.status], color: statusText[item.status] }}>
                {item.status}
              </span>
            </div>
          ))}
          <div style={{ padding: "10px 20px", borderTop: "1px solid #f3f4f6" }}>
            <Link href="/staff/manageEnquiry" style={{ fontSize: "13px", color: "#dc2626", fontWeight: "600", textDecoration: "none" }}>
              View all enquiries →
            </Link>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}
