'use client'

import { useEffect, useState } from 'react'
import {
  viewEnquiry,
  assignEnquiryToVet,
  respondToEnquiry,
  type Enquiry,
} from '@/lib/enquiry'

// Hardcoded vet list — replace with a real fetch from your users table
const VETS = [
  { vetID: 'vet-uuid-1', name: 'Dr. Sarah Lim' },
  { vetID: 'vet-uuid-2', name: 'Dr. James Tan' },
]

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  assigned:  'bg-blue-100   text-blue-800',
  responded: 'bg-green-100  text-green-800',
}

export default function StaffEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Enquiry | null>(null)

  // Form state
  const [directReply, setDirectReply] = useState('')
  const [selectedVet, setSelectedVet] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [feedback, setFeedback]       = useState('')

  // ── load on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    loadEnquiries()
  }, [])

  async function loadEnquiries() {
    setLoading(true)
    try {
      const data = await viewEnquiry()  // Staff.viewEnquiry()
      setEnquiries(data)
    } catch (e: any) {
      console.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── assign enquiry to vet ──────────────────────────────────────────────
  async function handleAssignEnquiryToVet() {
    if (!selected || !selectedVet) return
    setSubmitting(true)
    try {
      const updated = await assignEnquiryToVet(selected.enquiryID, selectedVet) // Staff.assignEnquiryToVet()
      setEnquiries(prev => prev.map(e => e.enquiryID === updated.enquiryID ? updated : e))
      setSelected(updated)
      setFeedback('Enquiry assigned to veterinarian.')
    } catch (e: any) {
      setFeedback('Error: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── staff replies directly ─────────────────────────────────────────────
  async function handleRespondToEnquiry() {
    if (!selected || !directReply.trim()) return
    setSubmitting(true)
    try {
      const updated = await respondToEnquiry(selected.enquiryID, directReply) // Staff.respondToEnquiry()
      setEnquiries(prev => prev.map(e => e.enquiryID === updated.enquiryID ? updated : e))
      setSelected(updated)
      setDirectReply('')
      setFeedback('Response saved.')
    } catch (e: any) {
      setFeedback('Error: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Enquiries</h1>

      <div className="flex gap-6">
        {/* ── Left: enquiry list ── */}
        <div className="w-1/2 space-y-3">
          {loading && <p className="text-gray-500">Loading…</p>}

          {!loading && enquiries.length === 0 && (
            <p className="text-gray-400">No enquiries yet.</p>
          )}

          {enquiries.map(enq => (
            <button
              key={enq.enquiryID}
              onClick={() => { setSelected(enq); setFeedback('') }}
              className={`w-full text-left p-4 rounded-xl border transition-all
                ${selected?.enquiryID === enq.enquiryID
                  ? 'border-blue-500 bg-white shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300'}`}
            >
              <div className="flex items-start justify-between">
                <p className="font-semibold text-gray-800">{enq.subject}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[enq.status]}`}>
                  {enq.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{enq.message}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(enq.created_at).toLocaleString()}
              </p>
            </button>
          ))}
        </div>

        {/* ── Right: action panel ── */}
        {selected && (
          <div className="w-1/2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5 self-start">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selected.subject}</h2>
              <p className="text-gray-600 mt-2">{selected.message}</p>
            </div>

            {selected.response && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-green-700 mb-1">Response</p>
                <p className="text-sm text-green-900">{selected.response}</p>
              </div>
            )}

            {selected.status !== 'responded' && (
              <>
                {/* Assign to vet */}
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Assign to Veterinarian (if professional advice needed)
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={selectedVet}
                      onChange={e => setSelectedVet(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select a vet…</option>
                      {VETS.map(v => (
                        <option key={v.vetID} value={v.vetID}>{v.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignEnquiryToVet}
                      disabled={!selectedVet || submitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                        hover:bg-blue-700 disabled:opacity-40 transition-colors"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Direct reply */}
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Respond Directly (general enquiry)
                  </p>
                  <textarea
                    rows={4}
                    value={directReply}
                    onChange={e => setDirectReply(e.target.value)}
                    placeholder="Type your response…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
                      focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={handleRespondToEnquiry}
                    disabled={!directReply.trim() || submitting}
                    className="mt-2 w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-medium
                      hover:bg-gray-900 disabled:opacity-40 transition-colors"
                  >
                    Send Response
                  </button>
                </div>
              </>
            )}

            {feedback && (
              <p className={`text-sm font-medium ${feedback.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {feedback}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
