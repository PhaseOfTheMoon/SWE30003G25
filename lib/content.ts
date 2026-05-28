import supabase from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FirstAidContent = {
  contentID:         string
  petType:           string
  emergencyCategory: string
  lastUpdateDate:    string
  staffID:           string
}

// Guide — maps to the Guide table in the UML (guideID, title, stepNumber, instruction, videoUrl)
export type Guide = {
  guideID:    string
  contentID:  string
  title:      string
  stepNumber: number
  instruction:string
  videoUrl?:  string | null
}

// EducationalVideo — maps to Video table in the UML (videoID, title, videoURL, duration)
export type EducationalVideo = {
  videoID: string
  contentID: string
  title: string
  videoUrl: string
  duration?: string | null
  description?:string | null
}

// QuizQuestion — embedded in the Quiz record's questionBank column
export type QuizQuestion = {
  question: string
  options:  string[]
  answer:   number       // index of correct option
}

// Quiz — maps to Quiz table in the UML (quizID, questionBank, question, totalMark, score)
export type Quiz = {
  quizID:      string
  contentID:   string
  title:       string
  questionBank:QuizQuestion[]
  totalMark:   number
  score?:      number | null
}

// ContentReview — maps to ContentReview in the UML (reviewID, contentID, VetID, status, comment, reviewedDate)
export type ContentReview = {
  reviewID:     string
  contentID:    string
  vetID:        string
  status:       'pending' | 'validated' | 'rejected' | 'published'
  comment?:     string | null
  reviewedDate?:string | null
}

// Composite types for joined queries
export type FirstAidGuideContent = FirstAidContent & {
  guide: Guide[]
  content_review?: ContentReview[]
}

export type FirstAidVideoContent = FirstAidContent & {
  educational_video: EducationalVideo[]
  content_review?: ContentReview[]
}

export type FirstAidContentBundle = FirstAidContent & {
  guide: Guide[]
  educational_video: EducationalVideo[]
  content_review?: Pick<ContentReview, 'status'>[]
}

// ─── FirstAidContent ──────────────────────────────────────────────────────────

// Staff: create a first-aid content record (parent record for guide/video/quiz)
export async function createFirstAidContent(payload: {
  staffID:           string
  petType:           string
  emergencyCategory: string
}): Promise<FirstAidContent> {
  const { data, error } = await supabase
    .from('first_aid_content')
    .insert({
      staffID:           payload.staffID,
      petType:           payload.petType,
      emergencyCategory: payload.emergencyCategory,
      lastUpdateDate:    new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Guest / PetOwner: get all pet types with published content
export async function getPetTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('content_review')
    .select('first_aid_content(petType)')
    .eq('status', 'published')
  if (error) throw new Error(error.message)
  return [...new Set(
    (data ?? []).map((r: any) => r.first_aid_content?.petType).filter(Boolean)
  )]
}

// Guest / PetOwner: get emergency categories for a given pet type (published only)
export async function getEmergencyCategories(petType: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('content_review')
    .select('first_aid_content(emergencyCategory, petType)')
    .eq('status', 'published')
  if (error) throw new Error(error.message)
  return [...new Set(
    (data ?? [])
      .map((r: any) => r.first_aid_content)
      .filter((c: any) => c?.petType === petType)
      .map((c: any) => c.emergencyCategory)
  )]
}

// Guest / PetOwner: full validated content bundle — pet-type browse UI
export async function viewPublishedFirstAidContent(): Promise<FirstAidContentBundle[]> {
  // Query from content_review with status filter to correctly get only validated rows.
  // Using content_review as the root avoids the PostgREST !inner join filter limitation.
  const { data, error } = await supabase
    .from('content_review')
    .select('first_aid_content(*, guide(*), educational_video(*))')
    .eq('status', 'published')
  if (error) throw new Error(error.message)
  const rows = (data ?? [])
    .map((r: any) => r.first_aid_content)
    .filter(Boolean)
    .map((row: any) => ({
      ...row,
      guide: [...(row.guide ?? [])].sort((a: Guide, b: Guide) => a.stepNumber - b.stepNumber),
      educational_video: row.educational_video ?? [],
    }))
    .filter((row: any) => row.guide.length > 0 || row.educational_video.length > 0)
  // Sort by petType then emergencyCategory
  rows.sort((a: any, b: any) =>
    a.petType.localeCompare(b.petType) || a.emergencyCategory.localeCompare(b.emergencyCategory)
  )
  return rows
}

// ─── Guide ────────────────────────────────────────────────────────────────────

// Staff: create a single guide step under a content record
export async function createGuide(payload: {
  contentID: string
  title: string
  stepNumber: number
  instruction: string
  videoUrl?: string
}): Promise<Guide> {
  const { data, error } = await supabase
    .from('guide')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Staff: update a guide step
export async function updateGuide(
  guideID:     string,
  title:       string,
  instruction: string,
  videoUrl?:   string,
): Promise<Guide> {
  const { data, error } = await supabase
    .from('guide')
    .update({ title, instruction, videoUrl: videoUrl ?? null })
    .eq('guideID', guideID)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Staff: delete a guide step
export async function deleteGuide(guideID: string): Promise<void> {
  const { error } = await supabase
    .from('guide')
    .delete()
    .eq('guideID', guideID)
  if (error) throw new Error(error.message)
}

// PetOwner / Guest: view all steps for a given content record — UML: Guide.viewSteps()
export async function viewSteps(contentID: string): Promise<Guide[]> {
  const { data, error } = await supabase
    .from('guide')
    .select('*')
    .eq('contentID', contentID)
    .order('stepNumber', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── EducationalVideo ─────────────────────────────────────────────────────────

// Staff: create an educational video under a content record
export async function createEducationalVideo(payload: {
  contentID: string
  title: string
  videoUrl: string
  duration?: string
  description?: string
}): Promise<EducationalVideo> {
  const { data, error } = await supabase
    .from('educational_video')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Staff: update an educational video
export async function updateEducationalVideo(
  videoID: string,
  title: string,
  videoUrl: string,
  description?: string,
): Promise<EducationalVideo> {
  const { data, error } = await supabase
    .from('educational_video')
    .update({ title, videoUrl, description: description ?? null })
    .eq('videoID', videoID)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Staff: delete a video
export async function deleteVideo(videoID: string): Promise<void> {
  const { error } = await supabase
    .from('educational_video')
    .delete()
    .eq('videoID', videoID)
  if (error) throw new Error(error.message)
}

// PetOwner / Guest: view a video for a given content record — UML: Video.viewVideo()
export async function viewVideo(contentID: string): Promise<EducationalVideo | null> {
  const { data, error } = await supabase
    .from('educational_video')
    .select('*')
    .eq('contentID', contentID)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

// Staff: create a quiz under a content record
export async function createQuiz(payload: {
  contentID: string
  title: string
  questions: QuizQuestion[]
}): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quiz')
    .insert({
      contentID:   payload.contentID,
      title:       payload.title,
      questionBank:payload.questions,
      totalMark:   payload.questions.length,
      score:       null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Staff: update a quiz
export async function updateQuiz(
  quizID:    string,
  title:     string,
  questions: QuizQuestion[],
): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quiz')
    .update({ title, questionBank: questions, totalMark: questions.length })
    .eq('quizID', quizID)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Staff: delete a quiz
export async function deleteQuiz(quizID: string): Promise<void> {
  const { error } = await supabase
    .from('quiz')
    .delete()
    .eq('quizID', quizID)
  if (error) throw new Error(error.message)
}

// PetOwner: load quiz for a given content record — UML: Quiz.startQuiz()
export async function startQuiz(contentID: string): Promise<Quiz | null> {
  const { data, error } = await supabase
    .from('quiz')
    .select('*')
    .eq('contentID', contentID)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

// PetOwner: submit answers and persist score — UML: Quiz.submitQuiz()
export async function submitQuiz(
  quizID:  string,
  answers: number[],   // array of chosen option indices, same length as questionBank
): Promise<Quiz> {
  // Fetch the quiz to grade locally
  const { data: quiz, error: fetchErr } = await supabase
    .from('quiz')
    .select('*')
    .eq('quizID', quizID)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)

  const score = (quiz.questionBank as QuizQuestion[]).reduce(
    (acc: number, q: QuizQuestion, i: number) => acc + (answers[i] === q.answer ? 1 : 0),
    0,
  )

  const { data, error } = await supabase
    .from('quiz')
    .update({ score })
    .eq('quizID', quizID)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// PetOwner: retrieve latest score for a quiz — UML: Quiz.getScore()
export async function getScore(quizID: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('quiz')
    .select('score')
    .eq('quizID', quizID)
    .single()
  if (error) throw new Error(error.message)
  return data?.score ?? null
}

// ─── ContentReview ────────────────────────────────────────────────────────────

// Staff: request vet validation for a content record
export async function requestVetValidation(
  contentID: string,
  vetID: string,
): Promise<ContentReview> {
  const { data, error } = await supabase
    .from('content_review')
    .insert({ contentID, vetID, status: 'pending' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Staff / Vet: view the latest review record for a content record
export async function viewContentReview(contentID: string): Promise<ContentReview | null> {
  const { data, error } = await supabase
    .from('content_review')
    .select('*')
    .eq('contentID', contentID)
    .order('reviewedDate', { ascending: false })
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

// ─── Vet Actions ──────────────────────────────────────────────────────────────

// Vet: view all pending content reviews assigned to them
export async function viewAllVetContent(vetID: string): Promise<ContentReview[]> {
  const { data, error } = await supabase
    .from('content_review')
    .select(`
      *,
      first_aid_content (
        petType,
        emergencyCategory,
        lastUpdateDate,
        guide (*),
        quiz (*),
        educational_video  (*)
      )
    `)
    .eq('vetID', vetID)
    .order('reviewedDate', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

// Vet: approve a content review
export async function validateContent(
  reviewID: string,
  comment?: string,
): Promise<ContentReview> {
  const { data, error } = await supabase
    .from('content_review')
    .update({
      status: 'validated',
      comment: comment ?? null,
      reviewedDate: new Date().toISOString(),
    })
    .eq('reviewID', reviewID)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Staff: publish a validated content record — makes it publicly visible
export async function publishContent(
  reviewID: string,
): Promise<ContentReview> {
  const { data, error } = await supabase
    .from('content_review')
    .update({
      status: 'published',
      reviewedDate: new Date().toISOString(),
    })
    .eq('reviewID', reviewID)
    .eq('status', 'validated')   // safety: only allow publishing validated content
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Vet: reject a content review
export async function rejectContent(
  reviewID: string,
  comment?: string,
): Promise<ContentReview> {
  const { data, error } = await supabase
    .from('content_review')
    .update({
      status: 'rejected',
      comment: comment ?? null,
      reviewedDate: new Date().toISOString(),
    })
    .eq('reviewID', reviewID)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Staff: view all content reviews for content submitted by this staff member
// Returns content_review rows (with nested first_aid_content + guide/video/quiz)
// so the pending review page can read review.status, review.comment, review.reviewID etc.
export async function viewStaffContent(staffID: string): Promise<any[]> {
  // First get all contentIDs belonging to this staff member
  const { data: staffContent, error: contentErr } = await supabase
    .from('first_aid_content')
    .select('contentID')
    .eq('staffID', staffID)
  if (contentErr) throw new Error(contentErr.message)
  if (!staffContent || staffContent.length === 0) return []

  const contentIDs = staffContent.map((r: any) => r.contentID)

  // Then fetch all content_review rows for those contentIDs, with full nested data
  const { data, error } = await supabase
    .from('content_review')
    .select(`
      *,
      first_aid_content (
        contentID,
        petType,
        emergencyCategory,
        lastUpdateDate,
        guide (*),
        quiz (*),
        educational_video (*)
      )
    `)
    .in('contentID', contentIDs)
    .order('reviewedDate', { ascending: false })
  if (error) throw new Error(error.message)

  // Flatten so the page can access guide/video/quiz directly on the review object
  return (data ?? []).map((r: any) => ({
    ...r,
    guide: r.first_aid_content?.guide ?? [],
    quiz: r.first_aid_content?.quiz ?? [],
    educational_video: r.first_aid_content?.educational_video ?? [],
  }))
}

// Staff: edit guide steps on a validated content record, then send back for vet re-validation
export async function editGuideAndResubmit(
  reviewID: string,
  stepEdits: Array<{ guideID: string; title: string; instruction: string; videoUrl?: string }>,
): Promise<ContentReview> {
  for (const step of stepEdits) {
    await updateGuide(step.guideID, step.title, step.instruction, step.videoUrl)
  }
  const { data: original, error: fetchErr } = await supabase
    .from('content_review')
    .select('contentID, vetID')
    .eq('reviewID', reviewID)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)
  const { data, error } = await supabase
    .from('content_review')
    .insert({ contentID: original.contentID, vetID: original.vetID, status: 'pending' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Staff: delete a full content bundle (guide/video/quiz + review + parent record)
export async function deleteFullContent(contentID: string): Promise<void> {
  await supabase.from('guide').delete().eq('contentID', contentID)
  await supabase.from('educational_video').delete().eq('contentID', contentID)
  await supabase.from('quiz').delete().eq('contentID', contentID)
  await supabase.from('content_review').delete().eq('contentID', contentID)
  const { error } = await supabase.from('first_aid_content').delete().eq('contentID', contentID)
  if (error) throw new Error(error.message)
}

// Staff: resubmit a rejected content record for re-validation by inserting a new pending review
// Takes the reviewID of the rejected review to find the contentID and vetID, then creates a new pending review
export async function resubmitContent(
  reviewID: string,
  draft: { title: string; instruction: string },
): Promise<ContentReview> {
  // Look up the original review to get contentID and vetID
  const { data: original, error: fetchErr } = await supabase
    .from('content_review')
    .select('contentID, vetID')
    .eq('reviewID', reviewID)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)

  // Insert a new pending review for the same content + vet
  const { data, error } = await supabase
    .from('content_review')
    .insert({ contentID: original.contentID, vetID: original.vetID, status: 'pending' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}