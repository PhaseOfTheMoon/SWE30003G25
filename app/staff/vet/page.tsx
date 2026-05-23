"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import supabase from "../../../lib/supabase";

type ContentReview = {
  reviewID: string;
  contentID: string;
  status: string;
  comment: string | null;
  first_aid_content: {
    petType: string;
    emergencyCategory: string;
    lastUpdateDate: string;
  } | null;
};

type Enquiry = {
  enquiryID: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  created_at: string;
};

export default function VetDashboardPage() {
  const [tab, setTab] = useState<"content" | "enquiry">("content");
  const [reviews, setReviews] = useState<ContentReview[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [vetId, setVetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setVetId(user.id);
      await Promise.all([fetchReviews(), fetchEnquiries()]);
      setLoading(false);
    }
    init();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchReviews() {
    const { data } = await supabase
      .from("content_review")
      .select("reviewID, contentID, status, comment, first_aid_content(petType, emergencyCategory, lastUpdateDate)")
      .eq("status", "pending");
    setReviews((data as ContentReview[]) ?? []);
  }

  async function fetchEnquiries() {
    const { data } = await supabase
      .from("enquiry")
      .select("enquiryID, subject, message, status, response, created_at")
      .in("status", ["pending", "assigned"])
      .order("created_at", { ascending: true });
    setEnquiries((data as Enquiry[]) ?? []);
  }

  async function handleReview(reviewID: string, decision: "validated" | "rejected") {
    setSubmitting(reviewID + decision);
    const { error } = await supabase
      .from("content_review")
      .update({
        status: decision,
        comment: comments[reviewID]?.trim() || null,
        vetID: vetId,
        reviewedDate: new Date().toISOString(),
      })
      .eq("reviewID", reviewID);
    setSubmitting(null);
    if (!error) {
      showToast(decision === "validated" ? "Content validated." : "Content rejected.");
      await fetchReviews();
    }
  }

  async function handleReply(enquiryID: string) {
    const reply = responses[enquiryID]?.trim();
    if (!reply) return;
    setSubmitting(enquiryID);
    const { error } = await supabase
      .from("enquiry")
      .update({ response: reply, status: "responded", vetID: vetId })
      .eq("enquiryID", enquiryID);
    setSubmitting(null);
    if (!error) {
      showToast("Reply sent.");
      setResponses((prev) => ({ ...prev, [enquiryID]: "" }));
      await fetchEnquiries();
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "10px 24px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    border: "none",
    borderBottom: active ? "3px solid #dc2626" : "3px solid transparent",
    backgroundColor: "transparent",
    color: active ? "#dc2626" : "#6b7280",
  });

  return (
    <main>
      <Navbar />

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", top: "80px", right: "24px", zIndex: 999,
          backgroundColor: "#16a34a", color: "white",
          padding: "12px 20px", borderRadius: "6px",
          fontSize: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {toast}
        </div>
      )}

      <section style={{ minHeight: "80vh", backgroundColor: "#f9fafb", padding: "40px 16px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>

          <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "4px" }}>Veterinarian Dashboard</h1>
          <p style={{ color: "#6b7280", marginBottom: "28px", fontSize: "14px" }}>
            Validate submitted content and reply to pet owner enquiries.
          </p>

          {/* Tabs */}
          <div style={{ borderBottom: "1px solid #e5e7eb", marginBottom: "28px", display: "flex", gap: "4px" }}>
            <button style={tabStyle(tab === "content")} onClick={() => setTab("content")}>
              Content Validation
              {reviews.length > 0 && (
                <span style={{ marginLeft: "8px", backgroundColor: "#dc2626", color: "white", borderRadius: "9999px", fontSize: "11px", padding: "1px 7px" }}>
                  {reviews.length}
                </span>
              )}
            </button>
            <button style={tabStyle(tab === "enquiry")} onClick={() => setTab("enquiry")}>
              Enquiry Reply
              {enquiries.length > 0 && (
                <span style={{ marginLeft: "8px", backgroundColor: "#dc2626", color: "white", borderRadius: "9999px", fontSize: "11px", padding: "1px 7px" }}>
                  {enquiries.length}
                </span>
              )}
            </button>
          </div>

          {loading ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "40px" }}>Loading...</p>
          ) : (
            <>
              {/* Content Validation Tab */}
              {tab === "content" && (
                <div>
                  {reviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 16px", color: "#9ca3af" }}>
                      <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
                      <p style={{ fontWeight: "600" }}>No pending content to review.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {reviews.map((r) => (
                        <div key={r.reviewID} style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                            <div>
                              <p style={{ fontWeight: "700", fontSize: "15px", marginBottom: "4px" }}>
                                {r.first_aid_content?.emergencyCategory ?? "Unknown"}
                              </p>
                              <p style={{ fontSize: "13px", color: "#6b7280" }}>
                                Pet type: <strong>{r.first_aid_content?.petType ?? "—"}</strong>
                              </p>
                              {r.first_aid_content?.lastUpdateDate && (
                                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                                  Submitted: {new Date(r.first_aid_content.lastUpdateDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <span style={{ fontSize: "12px", backgroundColor: "#fef9c3", color: "#854d0e", padding: "3px 10px", borderRadius: "9999px", fontWeight: "600" }}>
                              Pending Review
                            </span>
                          </div>

                          <textarea
                            placeholder="Add a comment (optional for validation, required for rejection)"
                            value={comments[r.reviewID] ?? ""}
                            onChange={(e) => setComments((prev) => ({ ...prev, [r.reviewID]: e.target.value }))}
                            rows={2}
                            style={{
                              width: "100%", padding: "8px 12px", fontSize: "13px",
                              border: "1px solid #d1d5db", borderRadius: "6px",
                              resize: "vertical", marginBottom: "12px", boxSizing: "border-box",
                              fontFamily: "inherit",
                            }}
                          />

                          <div style={{ display: "flex", gap: "10px" }}>
                            <button
                              onClick={() => handleReview(r.reviewID, "validated")}
                              disabled={submitting === r.reviewID + "validated"}
                              style={{
                                padding: "8px 18px", backgroundColor: "#16a34a", color: "white",
                                border: "none", borderRadius: "5px", fontWeight: "600",
                                fontSize: "13px", cursor: "pointer", opacity: submitting ? 0.7 : 1,
                              }}
                            >
                              {submitting === r.reviewID + "validated" ? "Saving..." : "Validate"}
                            </button>
                            <button
                              onClick={() => handleReview(r.reviewID, "rejected")}
                              disabled={submitting === r.reviewID + "rejected"}
                              style={{
                                padding: "8px 18px", backgroundColor: "white", color: "#dc2626",
                                border: "1px solid #dc2626", borderRadius: "5px", fontWeight: "600",
                                fontSize: "13px", cursor: "pointer", opacity: submitting ? 0.7 : 1,
                              }}
                            >
                              {submitting === r.reviewID + "rejected" ? "Saving..." : "Reject"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Enquiry Reply Tab */}
              {tab === "enquiry" && (
                <div>
                  {enquiries.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 16px", color: "#9ca3af" }}>
                      <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
                      <p style={{ fontWeight: "600" }}>No pending enquiries.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {enquiries.map((e) => (
                        <div key={e.enquiryID} style={{ backgroundColor: "white", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #f3f4f6" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                            <p style={{ fontWeight: "700", fontSize: "15px" }}>{e.subject}</p>
                            <span style={{
                              fontSize: "12px", padding: "3px 10px", borderRadius: "9999px", fontWeight: "600",
                              backgroundColor: e.status === "assigned" ? "#dbeafe" : "#fef9c3",
                              color: e.status === "assigned" ? "#1d4ed8" : "#854d0e",
                            }}>
                              {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                            </span>
                          </div>

                          <p style={{ fontSize: "13px", color: "#374151", backgroundColor: "#f9fafb", padding: "10px 12px", borderRadius: "6px", marginBottom: "12px", lineHeight: "1.6" }}>
                            {e.message}
                          </p>

                          <p style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "10px" }}>
                            Received: {new Date(e.created_at).toLocaleString()}
                          </p>

                          <textarea
                            placeholder="Write your reply here..."
                            value={responses[e.enquiryID] ?? ""}
                            onChange={(ev) => setResponses((prev) => ({ ...prev, [e.enquiryID]: ev.target.value }))}
                            rows={3}
                            style={{
                              width: "100%", padding: "8px 12px", fontSize: "13px",
                              border: "1px solid #d1d5db", borderRadius: "6px",
                              resize: "vertical", marginBottom: "12px", boxSizing: "border-box",
                              fontFamily: "inherit",
                            }}
                          />

                          <button
                            onClick={() => handleReply(e.enquiryID)}
                            disabled={!responses[e.enquiryID]?.trim() || submitting === e.enquiryID}
                            style={{
                              padding: "8px 20px", backgroundColor: "#dc2626", color: "white",
                              border: "none", borderRadius: "5px", fontWeight: "600",
                              fontSize: "13px", cursor: "pointer",
                              opacity: (!responses[e.enquiryID]?.trim() || submitting === e.enquiryID) ? 0.5 : 1,
                            }}
                          >
                            {submitting === e.enquiryID ? "Sending..." : "Send Reply"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
