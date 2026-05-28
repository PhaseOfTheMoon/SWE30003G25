'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { submitEnquiry, viewEnquiry, type Enquiry } from '@/lib/enquiry'
import supabase from '@/lib/supabase'

type Tab = 'submit' | 'history'

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-50  text-amber-700  border border-amber-200',
  assigned:  'bg-blue-50   text-blue-700   border border-blue-200',
  responded: 'bg-green-50  text-green-700  border border-green-200',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   '⏳ Pending',
  assigned:  '👨‍⚕️ With Vet',
  responded: '✓ Responded',
}

export default function EnquiryPage() {
  const [tab, setTab] = useState<Tab>('submit')
  const [petOwnerID, setPetOwnerID] = useState<string | null>(null)

  // Submit form state
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // History state
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selected, setSelected] = useState<Enquiry | null>(null)

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setPetOwnerID(user.id)
    })
  }, [])

  // Load history when switching to history tab
  useEffect(() => {
    if (tab === 'history' && petOwnerID) {
      loadHistory()
    }
  }, [tab, petOwnerID])

  async function loadHistory() {
    if (!petOwnerID) return
    setHistoryLoading(true)
    setSelected(null)
    try {
      const { data, error } = await supabase
        .from('enquiry')
        .select('*')
        .eq('petOwnerID', petOwnerID)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      setEnquiries(data ?? [])
    } catch (e: any) {
      console.error(e.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function handleSubmit() {
    if (!subject.trim() || !message.trim() || !petOwnerID) return
    setSubmitting(true)
    setSubmitResult(null)
    try {
      await submitEnquiry({ subject, message, petOwnerID })
      setSubject('')
      setMessage('')
      setSubmitResult({ ok: true, msg: 'Your enquiry has been submitted! Our team will get back to you soon.' })
    } catch (e: any) {
      setSubmitResult({ ok: false, msg: 'Error: ' + e.message })
    } finally {
      setSubmitting(false)
    }
  }

  function timeAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 60)    return 'just now'
    if (s < 3600)  return `${Math.floor(s / 60)} min ago`
    if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  return (
    <main>
      <Navbar />

      <section style={{ minHeight: '80vh', backgroundColor: '#f9fafb', padding: '48px 16px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          {/* Back link */}
          <Link
            href="/dashboard"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}
          >
            ← Back to Dashboard
          </Link>

          {/* Page header */}
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#111827', marginBottom: '6px' }}>
              Pet Enquiries
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Submit a question or concern — our staff or a veterinarian will respond shortly.
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '10px', marginBottom: '24px', width: 'fit-content' }}>
            {(['submit', 'history'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  backgroundColor: tab === t ? 'white' : 'transparent',
                  color: tab === t ? '#111827' : '#6b7280',
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {t === 'submit' ? '✏️ New Enquiry' : '📋 My Enquiries'}
              </button>
            ))}
          </div>

          {/* ── Submit Tab ── */}
          {tab === 'submit' && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>

              {/* Success state */}
              {submitResult?.ok ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐾</div>
                  <h2 style={{ fontWeight: 'bold', fontSize: '18px', color: '#111827', marginBottom: '8px' }}>
                    Enquiry Submitted!
                  </h2>
                  <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                    {submitResult.msg}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={() => { setSubmitResult(null) }}
                      style={{ padding: '10px 20px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                    >
                      Submit Another
                    </button>
                    <button
                      onClick={() => setTab('history')}
                      style={{ padding: '10px 20px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                    >
                      View My Enquiries
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      disabled={submitting}
                      placeholder="e.g. My dog swallowed something, cat is limping…"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: submitting ? '#f9fafb' : 'white',
                        color: '#111827',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Message
                    </label>
                    <textarea
                      rows={6}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      disabled={submitting}
                      placeholder="Describe what happened, your pet's symptoms, how long it's been going on, and any relevant details…"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        backgroundColor: submitting ? '#f9fafb' : 'white',
                        color: '#111827',
                        lineHeight: '1.6',
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                      Be as detailed as possible — this helps our team respond more accurately.
                    </p>
                  </div>

                  {/* Error feedback */}
                  {submitResult && !submitResult.ok && (
                    <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '14px', color: '#dc2626' }}>
                      ✗ {submitResult.msg}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!subject.trim() || !message.trim() || submitting || !petOwnerID}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#111827',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: (!subject.trim() || !message.trim() || submitting || !petOwnerID) ? 'not-allowed' : 'pointer',
                      opacity: (!subject.trim() || !message.trim() || submitting || !petOwnerID) ? 0.4 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {submitting ? 'Submitting…' : 'Submit Enquiry'}
                  </button>

                  {!petOwnerID && (
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#ef4444', marginTop: '10px' }}>
                      You must be logged in to submit an enquiry.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── History Tab ── */}
          {tab === 'history' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  {enquiries.length > 0 ? `${enquiries.length} enquir${enquiries.length === 1 ? 'y' : 'ies'}` : ''}
                </p>
                <button
                  onClick={loadHistory}
                  style={{ fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}
                >
                  ↻ Refresh
                </button>
              </div>

              {historyLoading && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: '14px' }}>
                  Loading your enquiries…
                </div>
              )}

              {!historyLoading && enquiries.length === 0 && (
                <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>💬</div>
                  <p style={{ color: '#9ca3af', fontSize: '14px' }}>You haven't submitted any enquiries yet.</p>
                  <button
                    onClick={() => setTab('submit')}
                    style={{ marginTop: '16px', padding: '10px 20px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
                  >
                    Submit your first enquiry
                  </button>
                </div>
              )}

              {!historyLoading && enquiries.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {enquiries.map(enq => (
                    <div
                      key={enq.enquiryID}
                      onClick={() => setSelected(selected?.enquiryID === enq.enquiryID ? null : enq)}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: selected?.enquiryID === enq.enquiryID ? '1px solid #3b82f6' : '1px solid #e5e7eb',
                        boxShadow: selected?.enquiryID === enq.enquiryID ? '0 0 0 3px rgba(59,130,246,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Card header */}
                      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: '600', fontSize: '15px', color: '#111827', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {enq.subject}
                          </p>
                          <p style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {enq.message}
                          </p>
                          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>{timeAgo(enq.created_at)}</p>
                        </div>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '500', whiteSpace: 'nowrap', flexShrink: 0 }}
                          className={STATUS_BADGE[enq.status]}>
                          {STATUS_LABEL[enq.status]}
                        </span>
                      </div>

                      {/* Expanded response */}
                      {selected?.enquiryID === enq.enquiryID && (
                        <div style={{ borderTop: '1px solid #f3f4f6', padding: '16px 20px', backgroundColor: '#fafafa' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Your Message</p>
                            <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>{enq.message}</p>
                          </div>

                          {enq.status === 'responded' && enq.response ? (
                            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px' }}>
                              <p style={{ fontSize: '12px', fontWeight: '600', color: '#16a34a', marginBottom: '6px' }}>✓ Response from our team</p>
                              <p style={{ fontSize: '14px', color: '#166534', lineHeight: '1.6' }}>{enq.response}</p>
                            </div>
                          ) : enq.status === 'assigned' ? (
                            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px' }}>
                              <p style={{ fontSize: '13px', color: '#1d4ed8' }}>
                                👨‍⚕️ Your enquiry has been forwarded to a veterinarian. A professional response is on the way.
                              </p>
                            </div>
                          ) : (
                            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px' }}>
                              <p style={{ fontSize: '13px', color: '#92400e' }}>
                                ⏳ Your enquiry is in the queue. Our team will review it shortly.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      <Footer />
    </main>
  )
}
