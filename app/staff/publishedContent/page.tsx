'use client'

import DashboardLayout from '@/app/components/dashboardLayout'
import { useEffect, useState } from 'react'
import {
  viewStaffContent,
  updateGuide,
  updateEducationalVideo,
  updateQuiz,
  deleteFullContent,
  type QuizQuestion,
} from '@/lib/content'
import supabase from '@/lib/supabase'
import { STAFF_NAV } from '@/app/components/sidebar'

const INPUT = {
  base: 'width:100%;fontSize:13px;padding:8px 10px;border:1px solid #d1d5db;borderRadius:4px;boxSizing:border-box;color:#111827;backgroundColor:white;outline:none' as const,
}

type Mode = 'view' | 'edit'

export default function PublishedContentPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [mode, setMode] = useState<Record<string, Mode>>({})
  const [drafts, setDrafts] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({})

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const all = await viewStaffContent(user.id)
      setItems(all.filter((r: any) => r.status === 'published'))
    } finally {
      setLoading(false)
    }
  }

  function startEdit(item: any) {
    const guides = item.guide ?? []
    const videos = item.educational_video ?? []
    const quizzes = item.quiz ?? []
    setDrafts(prev => ({
      ...prev,
      [item.reviewID]: {
        steps: guides.map((g: any) => ({ guideID: g.guideID, title: g.title ?? '', instruction: g.instruction ?? '', videoUrl: g.videoUrl ?? '' })),
        video: videos[0] ? { videoID: videos[0].videoID, title: videos[0].title ?? '', videoUrl: videos[0].videoUrl ?? '', description: videos[0].description ?? '' } : null,
        quiz: quizzes[0] ? { quizID: quizzes[0].quizID, title: quizzes[0].title ?? '', questions: quizzes[0].questionBank ?? [] } : null,
      },
    }))
    setMode(prev => ({ ...prev, [item.reviewID]: 'edit' }))
  }

  async function handleSave(item: any) {
    const draft = drafts[item.reviewID]
    if (!draft) return
    setSaving(item.reviewID)
    try {
      if (draft.steps?.length) {
        for (const s of draft.steps) {
          await updateGuide(s.guideID, s.title, s.instruction, s.videoUrl || undefined)
        }
      }
      if (draft.video) {
        await updateEducationalVideo(draft.video.videoID, draft.video.title, draft.video.videoUrl, draft.video.description)
      }
      if (draft.quiz) {
        await updateQuiz(draft.quiz.quizID, draft.quiz.title, draft.quiz.questions)
      }
      await load()
      setMode(prev => ({ ...prev, [item.reviewID]: 'view' }))
      setFeedback(prev => ({ ...prev, [item.reviewID]: { ok: true, msg: 'Content updated successfully.' } }))
    } catch (e: any) {
      setFeedback(prev => ({ ...prev, [item.reviewID]: { ok: false, msg: 'Update failed: ' + e.message } }))
    } finally {
      setSaving(null)
    }
  }

  async function handleDelete(item: any) {
    const contentID = item.first_aid_content?.contentID ?? item.contentID
    setDeleting(item.reviewID)
    try {
      await deleteFullContent(contentID)
      setItems(prev => prev.filter(r => r.reviewID !== item.reviewID))
      setConfirm(null)
    } catch (e: any) {
      setFeedback(prev => ({ ...prev, [item.reviewID]: { ok: false, msg: 'Delete failed: ' + e.message } }))
    } finally {
      setDeleting(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', fontSize: '13px', padding: '8px 10px',
    border: '1px solid #d1d5db', borderRadius: '4px',
    boxSizing: 'border-box', color: '#111827', backgroundColor: 'white',
    outline: 'none',
  }

  return (
    <DashboardLayout role="Staff" navItems={STAFF_NAV}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '22px' }}>📂</span>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Published Content</h1>
        </div>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
          View, edit or delete your published guides, videos and quizzes.
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading…</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#9ca3af' }}>
          <p style={{ fontSize: '28px', margin: '0 0 8px' }}>📭</p>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 2px' }}>No published content yet</p>
          <p style={{ fontSize: '13px', margin: 0 }}>Post validated content from the Pending Review page.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map((item, idx) => {
            const fc = item.first_aid_content
            const guides = item.guide ?? []
            const videos = item.educational_video ?? []
            const quizzes = item.quiz ?? []
            const type = guides.length ? 'Guide' : quizzes.length ? 'Quiz' : videos.length ? 'Video' : null
            const title = guides[0]?.title ?? videos[0]?.title ?? quizzes[0]?.title ?? '—'
            const isOpen = expanded === item.reviewID
            const isEdit = mode[item.reviewID] === 'edit'
            const draft = drafts[item.reviewID]
            const fb = feedback[item.reviewID]
            const isConf = confirm === item.reviewID

            const typeBadge: React.CSSProperties = {
              fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '999px',
              backgroundColor: type === 'Guide' ? '#dbeafe' : type === 'Quiz' ? '#ede9fe' : '#ffedd5',
              color: type === 'Guide' ? '#1d4ed8' : type === 'Quiz' ? '#6d28d9' : '#c2410c',
            }

            return (
              <div key={item.reviewID ?? idx} style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #bfdbfe', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

                {/* Card row */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{fc?.petType} — {fc?.emergencyCategory}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }} />
                        Published
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {type && <span style={typeBadge}>{type === 'Guide' ? '📋' : type === 'Quiz' ? '🧠' : '🎬'} {type}</span>}
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>{title}</p>
                    </div>
                    {item.reviewedDate && (
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
                        Published: {new Date(item.reviewedDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setExpanded(isOpen ? null : item.reviewID)}
                    style={{ flexShrink: 0, padding: '6px 14px', fontSize: '12px', fontWeight: '600', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', color: '#374151' }}
                  >
                    {isOpen ? 'Collapse ▲' : 'Details ▼'}
                  </button>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #f3f4f6' }}>

                    {/* Content preview / edit form */}
                    <div style={{ padding: '16px 20px', backgroundColor: '#fafafa' }}>
                      {!isEdit ? (
                        <>
                          {/* Guide preview */}
                          {guides.length > 0 && (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📋 Guide Steps</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {guides.map((g: any, gi: number) => (
                                  <div key={g.guideID ?? gi} style={{ display: 'flex', gap: '12px' }}>
                                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{g.stepNumber}</span>
                                    <div>
                                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: '0 0 2px' }}>{g.title}</p>
                                      <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>{g.instruction}</p>
                                      {g.videoUrl && <a href={g.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', display: 'inline-block', marginTop: '4px' }}>Watch demo ↗</a>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          {/* Video preview */}
                          {videos.length > 0 && (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎬 Educational Video</p>
                              {videos.map((v: any, vi: number) => (
                                <div key={v.videoID ?? vi} style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', padding: '12px' }}>
                                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>{v.title}</p>
                                  {v.description && <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px' }}>{v.description}</p>}
                                  {v.videoUrl && <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6' }}>Watch ↗</a>}
                                </div>
                              ))}
                            </>
                          )}
                          {/* Quiz preview */}
                          {quizzes.length > 0 && (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🧠 Quiz</p>
                              {quizzes.map((q: any, qi: number) => (
                                <div key={q.quizID ?? qi}>
                                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: '0 0 10px' }}>{q.title}</p>
                                  {(q.questionBank ?? []).map((ques: any, quesI: number) => (
                                    <div key={quesI} style={{ marginBottom: '12px' }}>
                                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 6px' }}>{quesI + 1}. {ques.question}</p>
                                      {(ques.options ?? []).map((opt: string, oi: number) => (
                                        <div key={oi} style={{ fontSize: '13px', padding: '5px 10px', borderRadius: '4px', marginBottom: '4px', backgroundColor: oi === ques.answer ? '#f0fdf4' : 'white', border: `1px solid ${oi === ques.answer ? '#86efac' : '#e5e7eb'}`, color: oi === ques.answer ? '#166534' : '#374151', fontWeight: oi === ques.answer ? '600' : '400' }}>
                                          {opt}{oi === ques.answer ? ' ✓' : ''}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </>
                          )}
                        </>
                      ) : (
                        /* Edit form */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Guide edit */}
                          {draft?.steps?.length > 0 && (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✏️ Edit Guide Steps</p>
                              {draft.steps.map((s: any, si: number) => (
                                <div key={s.guideID} style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px' }}>
                                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', margin: '0 0 10px' }}>Step {si + 1}</p>
                                  <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Title</label>
                                    <input type="text" value={s.title} style={inputStyle}
                                      onChange={e => setDrafts(prev => ({ ...prev, [item.reviewID]: { ...prev[item.reviewID], steps: prev[item.reviewID].steps.map((st: any, i: number) => i === si ? { ...st, title: e.target.value } : st) } }))} />
                                  </div>
                                  <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Instruction</label>
                                    <textarea rows={3} value={s.instruction} style={{ ...inputStyle, resize: 'vertical' }}
                                      onChange={e => setDrafts(prev => ({ ...prev, [item.reviewID]: { ...prev[item.reviewID], steps: prev[item.reviewID].steps.map((st: any, i: number) => i === si ? { ...st, instruction: e.target.value } : st) } }))} />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Demo Video URL (optional)</label>
                                    <input type="text" value={s.videoUrl} style={inputStyle}
                                      onChange={e => setDrafts(prev => ({ ...prev, [item.reviewID]: { ...prev[item.reviewID], steps: prev[item.reviewID].steps.map((st: any, i: number) => i === si ? { ...st, videoUrl: e.target.value } : st) } }))} />
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                          {/* Video edit */}
                          {draft?.video && (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✏️ Edit Video</p>
                              <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[['title', 'Title'], ['videoUrl', 'Video URL'], ['description', 'Description']].map(([field, label]) => (
                                  <div key={field}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{label}</label>
                                    {field === 'description'
                                      ? <textarea rows={3} value={draft.video[field]} style={{ ...inputStyle, resize: 'vertical' }} onChange={e => setDrafts(prev => ({ ...prev, [item.reviewID]: { ...prev[item.reviewID], video: { ...prev[item.reviewID].video, [field]: e.target.value } } }))} />
                                      : <input type="text" value={draft.video[field]} style={inputStyle} onChange={e => setDrafts(prev => ({ ...prev, [item.reviewID]: { ...prev[item.reviewID], video: { ...prev[item.reviewID].video, [field]: e.target.value } } }))} />
                                    }
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          {/* Quiz edit */}
                          {draft?.quiz && (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✏️ Edit Quiz</p>
                              <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px' }}>
                                <div style={{ marginBottom: '12px' }}>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Quiz Title</label>
                                  <input type="text" value={draft.quiz.title} style={inputStyle}
                                    onChange={e => setDrafts(prev => ({ ...prev, [item.reviewID]: { ...prev[item.reviewID], quiz: { ...prev[item.reviewID].quiz, title: e.target.value } } }))} />
                                </div>
                                {(draft.quiz.questions ?? []).map((q: QuizQuestion, qi: number) => (
                                  <div key={qi} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', marginBottom: '10px' }}>
                                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', margin: '0 0 8px' }}>Question {qi + 1}</p>
                                    <input type="text" value={q.question} placeholder="Question" style={{ ...inputStyle, marginBottom: '8px' }}
                                      onChange={e => setDrafts(prev => ({ ...prev, [item.reviewID]: { ...prev[item.reviewID], quiz: { ...prev[item.reviewID].quiz, questions: prev[item.reviewID].quiz.questions.map((qu: QuizQuestion, i: number) => i === qi ? { ...qu, question: e.target.value } : qu) } } }))} />
                                    {q.options.map((opt: string, oi: number) => (
                                      <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <input type="radio" name={`q-${item.reviewID}-${qi}`} checked={q.answer === oi}
                                          onChange={() => setDrafts(prev => ({ ...prev, [item.reviewID]: { ...prev[item.reviewID], quiz: { ...prev[item.reviewID].quiz, questions: prev[item.reviewID].quiz.questions.map((qu: QuizQuestion, i: number) => i === qi ? { ...qu, answer: oi } : qu) } } }))} />
                                        <input type="text" value={opt} placeholder={`Option ${oi + 1}`} style={{ ...inputStyle, flex: 1 }}
                                          onChange={e => setDrafts(prev => ({ ...prev, [item.reviewID]: { ...prev[item.reviewID], quiz: { ...prev[item.reviewID].quiz, questions: prev[item.reviewID].quiz.questions.map((qu: QuizQuestion, i: number) => i === qi ? { ...qu, options: qu.options.map((o, j) => j === oi ? e.target.value : o) } : qu) } } }))} />
                                      </div>
                                    ))}
                                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Select radio next to correct answer.</p>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action row */}
                    <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {!isEdit ? (
                        <>
                          <button onClick={() => startEdit(item)} style={{ padding: '8px 18px', backgroundColor: '#1d4ed8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            ✏️ Edit
                          </button>
                          {!isConf ? (
                            <button onClick={() => setConfirm(item.reviewID)} style={{ padding: '8px 18px', backgroundColor: 'white', color: '#dc2626', border: '1px solid #fecdd3', borderRadius: '4px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                              🗑 Delete
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600' }}>Delete this content?</span>
                              <button onClick={() => handleDelete(item)} disabled={deleting === item.reviewID} style={{ padding: '6px 14px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', opacity: deleting === item.reviewID ? 0.6 : 1 }}>
                                {deleting === item.reviewID ? 'Deleting…' : 'Yes, delete'}
                              </button>
                              <button onClick={() => setConfirm(null)} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleSave(item)} disabled={saving === item.reviewID} style={{ padding: '8px 18px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', opacity: saving === item.reviewID ? 0.6 : 1 }}>
                            {saving === item.reviewID ? 'Saving…' : '💾 Save Changes'}
                          </button>
                          <button onClick={() => setMode(prev => ({ ...prev, [item.reviewID]: 'view' }))} style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>

                    {/* Feedback */}
                    {fb && (
                      <div style={{ padding: '10px 20px', borderTop: '1px solid #f3f4f6', backgroundColor: fb.ok ? '#f0fdf4' : '#fff1f2' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: fb.ok ? '#16a34a' : '#dc2626' }}>{fb.msg}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
