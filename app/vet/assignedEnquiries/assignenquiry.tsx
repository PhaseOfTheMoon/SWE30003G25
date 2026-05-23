'use client'

import { useEffect, useState } from 'react'
import {
  viewAssignedEnquiry,
  respondAssignedEnquiry,
  type Enquiry,
} from '@/lib/enquiry'
import supabase from '@/lib/supabase'

export default function AssignedEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Enquiry | null>(null)
  const [response, setResponse]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback]   = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) loadEnquiries(data.user.id)
    })
  }, [])

  async function loadEnquiries(vetID: string) {
    setLoading(true)
    try {
      const data = await viewAssignedEnquiry(vetID)  // Veterinarian.viewAssignedEnquiry()
      setEnquiries(data)
    } catch (e: any) {
      console.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRespondAssignedEnquiry() {
    if (!selected || !response.trim()) return
    setSubmitting(true)
    setFeedback('')
    try {
      const updated = await respondAssignedEnquiry(selected.enquiryID, response)  // Veterinarian.respondAssignedEnquiry()
      setEnquiries(prev => prev.map(e => e.enquiryID === updated.enquiryID ? updated : e))
      setSelected(updated)
      setResponse('')
      setFeedback('Response saved. Pet owner can now view your reply.')
    } catch (e: any) {
      setFeedback('Error: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Assigned Enquiries</h1>

      <div className="flex gap-6">
        {/* ── Left: enquiry list ── */}
        <div className="w-1/2 space-y-3">
          {loading && <p className="text-gray-500">Loading…</p>}

          {!loading && enquiries.length === 0 && (
            <p className="text-gray-400">No enquiries assigned to you yet.</p>
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${enq.status === 'responded'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'}`}>
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

        {/* ── Right: response panel ── */}
        {selected && (
          <div className="w-1/2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5 self-start">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selected.subject}</h2>
              <p className="text-gray-600 mt-2">{selected.message}</p>
            </div>

            {/* Already responded */}
            {selected.status === 'responded' && selected.response && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-green-700 mb-1">Your Response</p>
                <p className="text-sm text-green-900">{selected.response}</p>
              </div>
            )}

            {/* Reply form */}
            {selected.status !== 'responded' && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Your Professional Response</p>
                <textarea
                  rows={5}
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  placeholder="Provide your veterinary advice…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none
                    focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleRespondAssignedEnquiry}
                  disabled={!response.trim() || submitting}
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium
                    hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  {submitting ? 'Saving…' : 'Submit Response'}
                </button>
              </div>
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
