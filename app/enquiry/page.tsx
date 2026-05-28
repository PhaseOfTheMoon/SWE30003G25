"use client";

import { useState } from "react";
import supabase from "@/lib/supabase";

type Enquiry = {
  enquiryID: string;
  subject: string;
  message: string;
  status: string;
  response: string | null;
};

export default function EnquiryPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const createEnquiry = async () => {
    if (!subject || !message) {
      alert("Please fill in both subject and message.");
      return;
    }

    setLoading(true);

    const newEnquiry: Enquiry = {
      enquiryID: crypto.randomUUID(),
      subject: subject,
      message: message,
      status: "pending",
      response: null,
    };

    const { error } = await supabase.from("enquiry").insert([newEnquiry]);

    setLoading(false);

    if (error) {
      console.error("Insert error:", error.message);
      alert("Failed to submit enquiry.");
      return;
    }

    setSubject("");
    setMessage("");
    setShowPopup(true);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: "40px 20px",
      }}
    >
      {showPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: "90%",
              maxWidth: "430px",
              backgroundColor: "white",
              borderRadius: "18px",
              padding: "32px",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <h2
              style={{
                fontSize: "26px",
                fontWeight: "bold",
                marginBottom: "14px",
                color: "#111827",
              }}
            >
              Enquiry Submitted
            </h2>

            <p
              style={{
                fontSize: "16px",
                color: "#374151",
                lineHeight: "1.6",
                marginBottom: "24px",
              }}
            >
              Thank you for submitting your enquiry. We will get back with you as
              soon as possible.
            </p>

            <button
              onClick={() => setShowPopup(false)}
              style={{
                width: "100%",
                backgroundColor: "#2563eb",
                color: "white",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "bold",
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          Enquiry Form
        </h1>

        <p
          style={{
            marginBottom: "30px",
            color: "#6b7280",
            fontSize: "16px",
          }}
        >
          Submit your enquiry and wait for a response from staff or veterinarian.
        </p>

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              fontWeight: "600",
              display: "block",
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            Subject
          </label>

          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter enquiry subject"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "16px",
            }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              fontWeight: "600",
              display: "block",
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            Message
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your enquiry message here"
            rows={6}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #d1d5db",
              fontSize: "16px",
              resize: "vertical",
            }}
          />
        </div>

        <button
          onClick={createEnquiry}
          disabled={loading}
          style={{
            width: "100%",
            backgroundColor: loading ? "#93c5fd" : "#2563eb",
            color: "white",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            fontWeight: "600",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Submitting..." : "Submit Enquiry"}
        </button>
      </div>
    </div>
  );
}