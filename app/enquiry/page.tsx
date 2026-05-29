'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import supabase from '@/lib/supabase'

type Enquiry = {
  enquiryID: string
  subject: string
  message: string
  status: 'pending' | 'assigned' | 'responded'
  response: string | null
  created_at: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
  assigned: { bg: '#dbeafe', color: '#1e40af', label: '👨‍⚕️ With Vet' },
  responded: { bg: '#dcfce7', color: '#166534', label: '✓ Responded' },
}

export default function EnquiryPage() {
  const [petOwnerID, setPetOwnerID] = useState<string | null>(null)
  const [tab, setTab] = useState<'submit' | 'history'>('submit')
  const [unreadIDs, setUnreadIDs] = useState<string[]>([])

  // Form state
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [editingID, setEditingID] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // History state
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState('')

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setPetOwnerID(user.id)
    })
  }, [])

  // Load history when switching to history tab
  useEffect(() => {
    if (tab === 'history' && petOwnerID) loadHistory()
  }, [tab, petOwnerID])

  async function loadHistory() {
    if (!petOwnerID) return
    setHistoryLoading(true)
    setHistoryError('')
    setSelected(null)
    try {
      const { data, error } = await supabase
        .from('enquiry')
        .select('*')
        .eq('petOwnerID', petOwnerID)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      const rows = data ?? []
      setEnquiries(rows)

      // Compute which responded enquiries haven't been seen yet
      const seenRaw = localStorage.getItem(`seen_responses_${petOwnerID}`)
      const seen: string[] = seenRaw ? JSON.parse(seenRaw) : []
      const unread = rows
        .filter(e => e.status === 'responded' && !seen.includes(e.enquiryID))
        .map(e => e.enquiryID)
      setUnreadIDs(unread)
    } catch (e: any) {
      setHistoryError(e.message)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function handleSubmit() {
    if (!subject.trim() || !message.trim() || !petOwnerID) return
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const { error } = await supabase
        .from('enquiry')
        .insert({ subject: subject.trim(), message: message.trim(), petOwnerID })
      if (error) throw new Error(error.message)
      setSubject('')
      setMessage('')
      setSubmitResult({ ok: true, msg: 'Your enquiry has been submitted! Our team will get back to you soon.' })
    } catch (e: any) {
      setSubmitResult({ ok: false, msg: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate() {
    if (!editingID || !subject.trim() || !message.trim()) return
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const { error } = await supabase
        .from('enquiry')
        .update({ subject: subject.trim(), message: message.trim() })
        .eq('enquiryID', editingID)
        .eq('petOwnerID', petOwnerID)
        .eq('status', 'pending')
      if (error) throw new Error(error.message)
      setSubject('')
      setMessage('')
      setEditingID(null)
      setSubmitResult({ ok: true, msg: 'Enquiry updated successfully.' })
      loadHistory()
    } catch (e: any) {
      setSubmitResult({ ok: false, msg: e.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(enquiryID: string) {
    if (!confirm('Delete this enquiry?')) return
    try {
      const { error } = await supabase
        .from('enquiry')
        .delete()
        .eq('enquiryID', enquiryID)
        .eq('petOwnerID', petOwnerID)
        .eq('status', 'pending')
      if (error) throw new Error(error.message)
      setEnquiries(prev => prev.filter(e => e.enquiryID !== enquiryID))
      if (selected === enquiryID) setSelected(null)
    } catch (e: any) {
      alert('Failed to delete: ' + e.message)
    }
  }

  function startEdit(enq: Enquiry) {
    setSubject(enq.subject)
    setMessage(enq.message)
    setEditingID(enq.enquiryID)
    setSubmitResult(null)
    setTab('submit')
  }

  function cancelEdit() {
    setSubject('')
    setMessage('')
    setEditingID(null)
    setSubmitResult(null)
  }

  function timeAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 60) 
      return 'just now'
    if (s < 3600) 
      return `${Math.floor(s / 60)}m ago`
    if (s < 86400) 
      return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  return (
    <main>
      <Navbar />

      <section style={{ minHeight: '80vh', backgroundColor: '#f9fafb', padding: '40px 16px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>

          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>

        {/* Unread response banner */}
        {unreadIDs.length > 0 && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🔔</span>
              <div>
                <p style={{ fontWeight: '700', fontSize: '14px', color: '#dc2626', margin: '0 0 2px 0' }}>
                  {unreadIDs.length} new repl{unreadIDs.length === 1 ? 'y' : 'ies'} from our team!
                </p>
                <p style={{ fontSize: '13px', color: '#b91c1c', margin: 0 }}>
                  Check your enquiries below to read the response.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setTab('history'); setUnreadIDs([]) }}
              style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              View Replies
            </button>
          </div>
        )}

        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px', color: '#111827' }}>
          Enquiry Form
        </h1>
        <p style={{ marginBottom: '30px', color: '#6b7280', fontSize: '16px' }}>
          Submit your enquiry and wait for a response from the staff or veterinarian.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', padding: '4px', borderRadius: '10px', marginBottom: '28px', width: 'fit-content' }}>
          {(['submit', 'history'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setSubmitResult(null) }}
              style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'all 0.15s', backgroundColor: tab === t ? 'white' : 'transparent', color: tab === t ? '#111827' : '#6b7280', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
              {t === 'submit' ? '✏️ New Enquiry' : '📋 My Enquiries'}
            </button>
          ))}
        </div>

        {/* ── Submit / Edit Tab ── */}
        {tab === 'submit' && (
          <>
            {editingID && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '14px', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>✏️ Editing enquiry — only <strong>pending</strong> enquiries can be updated.</span>
                <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>✕ Cancel</button>
              </div>
            )}

            {submitResult?.ok ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🐾</div>
                <h2 style={{ fontWeight: 'bold', fontSize: '18px', color: '#111827', marginBottom: '8px' }}>
                  {editingID ? 'Enquiry Updated!' : 'Enquiry Submitted!'}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>{submitResult.msg}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => setSubmitResult(null)}
                    style={{ padding: '10px 20px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                    Submit Another
                  </button>
                  <button onClick={() => { setTab('history'); setSubmitResult(null) }}
                    style={{ padding: '10px 20px', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                    View My Enquiries
                  </button>
                </div>
              </div>
            ) : (
              <>
                {submitResult && !submitResult.ok && (
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', fontSize: '14px', color: '#dc2626' }}>
                    ✗ {submitResult.msg}
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="Enter enquiry subject" disabled={submitting}
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', boxSizing: 'border-box', backgroundColor: submitting ? '#f9fafb' : 'white' }} />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Message</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Write your enquiry message here" rows={6} disabled={submitting}
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '16px', resize: 'vertical', boxSizing: 'border-box', backgroundColor: submitting ? '#f9fafb' : 'white' }} />
                </div>

                <button
                  onClick={editingID ? handleUpdate : handleSubmit}
                  disabled={!subject.trim() || !message.trim() || submitting || !petOwnerID}
                  style={{ width: '100%', backgroundColor: editingID ? '#f59e0b' : '#2563eb', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '600', fontSize: '16px', cursor: (!subject.trim() || !message.trim() || submitting || !petOwnerID) ? 'not-allowed' : 'pointer', opacity: (!subject.trim() || !message.trim() || submitting || !petOwnerID) ? 0.5 : 1, transition: 'opacity 0.15s', marginBottom: '8px' }}>
                  {submitting ? 'Saving…' : editingID ? 'Update Enquiry' : 'Submit Enquiry'}
                </button>

                {!petOwnerID && (
                  <p style={{ textAlign: 'center', fontSize: '13px', color: '#ef4444', marginTop: '8px' }}>
                    You must be logged in to submit an enquiry.
                  </p>
                )}
              </>
            )}
          </>
        )}

        {/* ── History Tab ── */}
        {tab === 'history' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                {enquiries.length > 0 ? `${enquiries.length} enquir${enquiries.length === 1 ? 'y' : 'ies'}` : ''}
              </p>
              <button onClick={loadHistory}
                style={{ fontSize: '13px', color: '#6b7280', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}>
                ↻ Refresh
              </button>
            </div>

            {historyError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '14px', color: '#dc2626' }}>
                ✗ {historyError}
              </div>
            )}

            {historyLoading && (
              <p style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: '14px' }}>Loading your enquiries…</p>
            )}

            {!historyLoading && enquiries.length === 0 && (
              <div style={{ borderRadius: '16px', border: '1px solid #e5e7eb', padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.3 }}>💬</div>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>You haven't submitted any enquiries yet.</p>
                <button onClick={() => setTab('submit')}
                  style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                  Submit your first enquiry
                </button>
              </div>
            )}

            {!historyLoading && enquiries.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {enquiries.map(enq => {
                  const s = STATUS_STYLE[enq.status] ?? STATUS_STYLE.pending
                  const isOpen = selected === enq.enquiryID
                  return (
                    <div key={enq.enquiryID}
                      style={{ borderRadius: '12px', border: isOpen ? '1px solid #3b82f6' : unreadIDs.includes(enq.enquiryID) ? '1px solid #fca5a5' : '1px solid #e5e7eb', boxShadow: isOpen ? '0 0 0 3px rgba(59,130,246,0.1)' : unreadIDs.includes(enq.enquiryID) ? '0 0 0 3px rgba(220,38,38,0.08)' : '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden', transition: 'all 0.15s' }}>

                      {/* Card header — clickable to expand */}
                      <div onClick={() => {
                        const next = isOpen ? null : enq.enquiryID
                        setSelected(next)
                        // Mark as seen in localStorage when opened
                        if (next && enq.status === 'responded' && petOwnerID) {
                          const key = `seen_responses_${petOwnerID}`
                          const seenRaw = localStorage.getItem(key)
                          const seen: string[] = seenRaw ? JSON.parse(seenRaw) : []
                          if (!seen.includes(next)) {
                            localStorage.setItem(key, JSON.stringify([...seen, next]))
                            setUnreadIDs(prev => prev.filter(id => id !== next))
                          }
                        }
                      }}
                        style={{ padding: '18px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', cursor: 'pointer', backgroundColor: 'white' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: '600', fontSize: '15px', color: '#111827', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{enq.subject}</p>
                          <p style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{enq.message}</p>
                          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>{timeAgo(enq.created_at)}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px', fontWeight: '500', backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div style={{ borderTop: '1px solid #f3f4f6', padding: '18px 22px', backgroundColor: '#fafafa' }}>
                          <div style={{ marginBottom: '14px' }}>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Your Message</p>
                            <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.6' }}>{enq.message}</p>
                          </div>

                          {enq.status === 'responded' && enq.response ? (
                            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                              <p style={{ fontSize: '12px', fontWeight: '600', color: '#16a34a', marginBottom: '6px' }}>✓ Response from our team</p>
                              <p style={{ fontSize: '14px', color: '#166534', lineHeight: '1.6' }}>{enq.response}</p>
                            </div>
                          ) : enq.status === 'assigned' ? (
                            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                              <p style={{ fontSize: '13px', color: '#1d4ed8' }}>👨‍⚕️ Your enquiry has been forwarded to a veterinarian. A response is on the way.</p>
                            </div>
                          ) : (
                            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                              <p style={{ fontSize: '13px', color: '#92400e' }}>⏳ Your enquiry is in the queue. Our team will review it shortly.</p>
                            </div>
                          )}

                          {/* Edit / Delete — only for pending */}
                          {enq.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button onClick={() => startEdit(enq)}
                                style={{ backgroundColor: '#f59e0b', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                ✏️ Edit
                              </button>
                              <button onClick={() => handleDelete(enq.enquiryID)}
                                style={{ backgroundColor: '#dc2626', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                                🗑 Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
