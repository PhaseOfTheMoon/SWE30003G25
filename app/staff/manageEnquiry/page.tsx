'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/app/components/dashboardLayout'
import {
  viewEnquiry,
  assignEnquiryToVet,
  respondToEnquiry,
  type Enquiry,
} from '@/lib/enquiry'
import supabase from '@/lib/supabase'
import { STAFF_NAV } from '@/app/components/sidebar'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50  text-amber-800  border border-amber-200',
  assigned: 'bg-blue-50   text-blue-800   border border-blue-200',
  responded: 'bg-green-50  text-green-800  border border-green-200',
}

export default function StaffEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [vets, setVets] = useState<{ vetID: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Enquiry | null>(null)

  // form state
  const [directReply, setDirectReply] = useState('')
  const [selectedVet, setSelectedVet] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null)

  useEffect(() => {
    loadEnquiries()
    loadVets()
  }, [])

  async function loadVets() {
    const { data } = await supabase
      .from('veterinarian')
      .select('id, profiles(name)')
    if (data) {
      setVets(data.map((v: any) => ({ vetID: v.id, name: v.profiles?.name ?? 'Unknown' })))
    }
  }

  // We want to be able to refresh the enquiries list after responding or assigning without having to refresh the whole page, 
  // so we will create a separate function for loading enquiries that can be called after those actions.
  async function loadEnquiries() {
    setLoading(true)
    try {
      const data = await viewEnquiry()
      setEnquiries(data)
    } catch (e: any) {
      console.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  // When an enquiry is selected from the list, we want to load the most up-to-date information for that enquiry in case it was updated by another staff member or vet. 
  // This ensures that we are always working with the latest data when responding or assigning.
  function selectEnquiry(enq: Enquiry) {
    setSelected(enq)
    setFeedback(null)
    setDirectReply('')
    setSelectedVet(enq.vetID ?? '')
  }

  //  assign to vet 
  async function handleAssign() {
    if (!selected || !selectedVet) return
    console.log('Assigning enquiryID:', selected.enquiryID, '→ vetID:', selectedVet)
    setSubmitting(true)
    setFeedback(null)
    try {
      const updated = await assignEnquiryToVet(selected.enquiryID, selectedVet)  // Staff.assignEnquiryToVet()
      syncEnquiry(updated)
      setSelectedVet(updated.vetID ?? '')
      setFeedback({ msg: 'Enquiry assigned to veterinarian.', ok: true })
    } catch (e: any) {
      setFeedback({ msg: 'Error: ' + e.message, ok: false })
    } finally {
      setSubmitting(false)
    }
  }

  // respond directly 
  async function handleRespond() {
    if (!selected || !directReply.trim()) return
    setSubmitting(true)
    setFeedback(null)
    try {
      const updated = await respondToEnquiry(selected.enquiryID, directReply)   // Staff.respondToEnquiry()
      syncEnquiry(updated)
      setDirectReply('')
      setFeedback({ msg: 'Response saved. The enquiry status is now "responded" in Supabase — the pet owner will see it when they view their enquiry.', ok: true })
    } catch (e: any) {
      setFeedback({ msg: 'Error: ' + e.message, ok: false })
    } finally {
      setSubmitting(false)
    }
  }

  // After responding or assigning, we want to update the enquiries list and the selected enquiry with the latest data returned from the API.
  function syncEnquiry(updated: Enquiry) {
    setEnquiries(prev => prev.map(e => e.enquiryID === updated.enquiryID ? updated : e))
    setSelected(updated)
    setSelectedVet(updated.vetID ?? '')
  }

  // helper function to get vet name by ID for display in the enquiry list and detail view. We look up the vet's name from the vets state which we loaded on component mount.
  function vetName(id: string | null) {
    return vets.find(v => v.vetID === id)?.name ?? ''
  }

  // helper function to display how long ago the enquiry was created in a human-readable format. This is just for better UX in the enquiry list.
  function timeAgo(iso: string) {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)} min ago`
    if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
    return `${Math.floor(s / 86400)} day ago`
  }

  return (
    <DashboardLayout role="Staff" navItems={STAFF_NAV}>
      <div style={{ maxWidth: '900px' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Enquiries</h1>
            <p className="text-sm text-gray-500 mt-0.5">Respond to or assign pet owner enquiries</p>
          </div>
          <button
            onClick={loadEnquiries}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        <div className="flex gap-5">
          {/* Left: list */}
          <div className="w-5/12 space-y-2 shrink-0">
            {loading && (
              <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
            )}
            {!loading && enquiries.length === 0 && (
              <div className="text-sm text-gray-400 py-8 text-center">No enquiries yet.</div>
            )}
            {enquiries.map(enq => (
              <button
                key={enq.enquiryID}
                onClick={() => selectEnquiry(enq)}
                className={`w-full text-left p-4 rounded-xl border bg-white transition-all
                  ${selected?.enquiryID === enq.enquiryID
                    ? 'border-blue-500 ring-1 ring-blue-200 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-800 text-sm leading-snug">{enq.subject}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${STATUS_BADGE[enq.status]}`}>
                    {enq.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{enq.message}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">{timeAgo(enq.created_at)}</p>
                  {enq.vetID && (
                    <p className="text-[11px] text-blue-600">→ {vetName(enq.vetID)}</p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Right: actions */}
          <div className="flex-1 min-w-0">
            {!selected ? (
              <div className="bg-white border border-gray-200 rounded-2xl h-64 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl opacity-20">💬</span>
                <p className="text-sm text-gray-400">Select an enquiry to view actions</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100">

                {/* Enquiry detail */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-base font-bold text-gray-900">{selected.subject}</h2>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[selected.status]}`}>
                      {selected.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{selected.message}</p>
                  {selected.vetID && (
                    <p className="text-xs text-blue-600 mt-2">Assigned to {vetName(selected.vetID)}</p>
                  )}
                </div>

                {/* Existing response */}
                {selected.response && (
                  <div className="p-5">
                    <p className="text-xs font-semibold text-green-700 mb-1.5">✓ Response sent</p>
                    <p className="text-sm text-gray-700 leading-relaxed bg-green-50 border border-green-100 rounded-lg p-3">
                      {selected.response}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      This is what the pet owner sees when they view their enquiry in Supabase.
                    </p>
                  </div>
                )}

                {selected.status !== 'responded' && (
                  <>
                    {/* Assign to vet */}
                    <div className="p-5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Assign to veterinarian
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        Use this when the enquiry needs professional advice. The vet will respond directly.
                      </p>
                      <div className="flex gap-2">
                        <select
                          value={selectedVet}
                          onChange={e => setSelectedVet(e.target.value)}
                          disabled={submitting}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                        >
                          <option value="">Select a vet…</option>
                          {vets.map(v => (
                            <option key={v.vetID} value={v.vetID}>{v.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={handleAssign}
                          disabled={!selectedVet || submitting}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                        >
                          {submitting ? 'Assigning…' : 'Assign'}
                        </button>
                      </div>
                      {selected.status === 'assigned' && (
                        <p className="text-xs text-blue-500 mt-2">⏳ Currently assigned — you can reassign below.</p>
                      )}
                    </div>

                    {/* Direct reply */}
                    <div className="p-5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Respond directly
                      </p>
                      <p className="text-xs text-gray-400 mb-3">
                        For general enquiries that don't need a vet. Your response is saved to the
                        <code className="mx-1 px-1 bg-gray-100 rounded text-[11px]">response</code>
                        column in Supabase and status flips to <strong>responded</strong>.
                      </p>
                      <textarea
                        rows={4}
                        value={directReply}
                        onChange={e => setDirectReply(e.target.value)}
                        disabled={submitting}
                        placeholder="Type your response…"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                      />
                      <button
                        onClick={handleRespond}
                        disabled={!directReply.trim() || submitting}
                        className="mt-2 w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-black disabled:opacity-40 transition-colors"
                      >
                        {submitting ? 'Sending…' : 'Send response'}
                      </button>
                    </div>
                  </>
                )}

                {/* Feedback */}
                {feedback && (
                  <div className={`px-5 py-3 text-sm font-medium rounded-b-2xl ${feedback.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {feedback.ok ? '✓' : '✗'} {feedback.msg}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
