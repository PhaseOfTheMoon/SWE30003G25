"use client";

import { useState } from "react";

type Enquiry = {
  enquiryID: string;
  subject: string;
  message: string;
  status: "Pending" | "Responded";
  response: string;
};

export default function EnquiryPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [editingID, setEditingID] = useState<string | null>(null);

  const createEnquiry = () => {
    if (!subject || !message) {
      alert("Please fill in both subject and message.");
      return;
    }

    const newEnquiry: Enquiry = {
      enquiryID: "ENQ" + Date.now(),
      subject,
      message,
      status: "Pending",
      response: "No response yet.",
    };

    setEnquiries([...enquiries, newEnquiry]);
    setSubject("");
    setMessage("");
  };

  const updateEnquiry = () => {
    if (!editingID) return;

    const updatedEnquiries = enquiries.map((enquiry) =>
      enquiry.enquiryID === editingID
        ? {
            ...enquiry,
            subject,
            message,
          }
        : enquiry
    );

    setEnquiries(updatedEnquiries);
    setSubject("");
    setMessage("");
    setEditingID(null);
  };

  const deleteEnquiry = (enquiryID: string) => {
    const remainingEnquiries = enquiries.filter(
      (enquiry) => enquiry.enquiryID !== enquiryID
    );

    setEnquiries(remainingEnquiries);
  };

  const startEdit = (enquiry: Enquiry) => {
    setSubject(enquiry.subject);
    setMessage(enquiry.message);
    setEditingID(enquiry.enquiryID);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
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
          Submit your enquiry and wait for a response from the staff or veterinarian.
        </p>

        <div style={{ marginBottom: "24px" }}>
          <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>
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
          <label style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>
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
          onClick={editingID ? updateEnquiry : createEnquiry}
          style={{
            width: "100%",
            backgroundColor: editingID ? "#f59e0b" : "#2563eb",
            color: "white",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            fontWeight: "600",
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "34px",
          }}
        >
          {editingID ? "Update Enquiry" : "Submit Enquiry"}
        </button>

        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "18px",
            color: "#111827",
          }}
        >
          Submitted Enquiries
        </h2>

        {enquiries.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No enquiries submitted yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {enquiries.map((enquiry) => (
              <div
                key={enquiry.enquiryID}
                style={{
                  padding: "22px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#fafafa",
                }}
              >
                <p style={{ color: "#6b7280", marginBottom: "6px" }}>
                  Enquiry ID: {enquiry.enquiryID}
                </p>

                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    color: "#111827",
                  }}
                >
                  {enquiry.subject}
                </h3>

                <p style={{ marginBottom: "12px", color: "#374151" }}>
                  {enquiry.message}
                </p>

                <p style={{ marginBottom: "8px" }}>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: "#d97706", fontWeight: "600" }}>
                    {enquiry.status}
                  </span>
                </p>

                <p style={{ marginBottom: "18px" }}>
                  <strong>Response:</strong> {enquiry.response}
                </p>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => startEdit(enquiry)}
                    style={{
                      backgroundColor: "#f59e0b",
                      color: "white",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteEnquiry(enquiry.enquiryID)}
                    style={{
                      backgroundColor: "#dc2626",
                      color: "white",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}