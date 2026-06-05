import supabase from '@/lib/supabase'

// This file defines the core data types and API functions for managing first-aid content in the application. It includes types for the main content record (FirstAidContent), associated guides, educational videos, quizzes, and content reviews. 
// The file also contains functions for staff to create and manage content, for veterinarians to review and validate content, and for pet owners/guests to view published content. This serves as the central interface between the frontend components and the backend database for all content-related operations. (WC)
export type FirstAidContent = {
  contentID: string
  petType: string
  emergencyCategory: string
  lastUpdateDate: string
  staffID: string
}

// Guide: maps to the Guide table in the UML (guideID, title, stepNumber, instruction, videoUrl) (WC)
export type Guide = {
  guideID: string
  contentID: string
  title: string
  stepNumber: number
  instruction:string
  videoUrl?:  string | null
}

// EducationalVideo: maps to Video table in the UML (videoID, title, videoURL, duration) (WC)
export type EducationalVideo = {
  videoID: string
  contentID: string
  title: string
  videoUrl: string
  duration?: string | null
  description?:string | null
}

// QuizQuestion: stored in quiz_question table (WC)
export type QuizQuestion = {
  question: string
  options: string[]
  answer: string      
}

// Quiz: maps to Quiz table in the UML (quizID, questionBank, question, totalMark, score) (WC)
export type Quiz = {
  quizID: string
  contentID: string
  title: string
  questions: QuizQuestion[]
}

// ContentReview: maps to ContentReview in the UML (reviewID, contentID, VetID, status, comment, reviewedDate) (WC)
export type ContentReview = {
  reviewID: string
  contentID: string
  vetID: string
  status: 'pending' | 'validated' | 'rejected' | 'published'
  comment?: string | null
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

// Shared UI constants (WC) 
// Defined here (on FirstAidContent) per the UML — imported by guide, quiz, and video pages.
export const PET_EMOJI: Record<string, string> = {
  Dog: '🐕', Cat: '🐈', Bird: '🐦', Rabbit: '🐇', Other: '🐾',
}

export const CATEGORY_EMOJI: Record<string, string> = {
  Choking: '😮', Bleeding: '🩸', Burns: '🔥', Fracture: '🦴',
  Poisoning: '☠️', Seizure: '⚡', Heatstroke: '🌡️', Unconscious: '💤',
}

//  FirstAidContent 
// Staff: create a first-aid content record (parent record for guide/video/quiz) (WC)
export async function createFirstAidContent(payload: {
  staffID: string
  petType: string
  emergencyCategory: string
}): Promise<FirstAidContent> {
  const { data, error } = await supabase
    .from('first_aid_content')
    .insert({
      staffID: payload.staffID,
      petType: payload.petType,
      emergencyCategory: payload.emergencyCategory,
      lastUpdateDate:    new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Guest / PetOwner: get all pet types with published content (WC)
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

// Guest / PetOwner: get emergency categories for a given pet type (published only) (WC)
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

// Guest / PetOwner: full validated content bundle — pet-type browse UI (WC)
export async function viewPublishedFirstAidContent(): Promise<FirstAidContentBundle[]> {
  // Query from content_review with status filter to correctly get only validated rows.
  // Using content_review as the root avoids the PostgREST !inner join filter limitation. (WC)
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

// Guide 
// Staff: create a single guide step under a content record (WC)
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

// Staff: update a guide step (WC)
export async function updateGuide(
  guideID: string,
  title: string,
  instruction: string,
  videoUrl?: string,
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
 
// Staff: delete a guide step (WC)
export async function deleteGuide(guideID: string): Promise<void> {
  const { error } = await supabase
    .from('guide')
    .delete()
    .eq('guideID', guideID)
  if (error) throw new Error(error.message)
}

// PetOwner / Guest: view all steps for a given content record (WC)
export async function viewSteps(contentID: string): Promise<Guide[]> {
  const { data, error } = await supabase
    .from('guide')
    .select('*')
    .eq('contentID', contentID)
    .order('stepNumber', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

// EducationalVideo 
// Staff: create an educational video under a content record (WC)
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

// Staff: update an educational video (WC)
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

// Staff: delete a video (WC)
export async function deleteVideo(videoID: string): Promise<void> {
  const { error } = await supabase
    .from('educational_video')
    .delete()
    .eq('videoID', videoID)
  if (error) throw new Error(error.message)
}

//  Quiz  
// Staff: create a quiz under a content record (WC)
export async function createQuiz(payload: {
  contentID: string
  title: string
  questions: QuizQuestion[]
  petType: string
  emergencyCategory: string
}): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quiz')
    .insert({
      contentID: payload.contentID,
      title: payload.title,
      questions: payload.questions,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Also insert each question into quiz_question table (WC)
  const questionRows = payload.questions.map((q) => ({
    petType: payload.petType,
    emergencyCategory: payload.emergencyCategory,
    question: q.question,
    options: q.options,
    answer: q.answer,
  }))
  const { error: qErr } = await supabase.from('quiz_question').insert(questionRows)
  if (qErr) throw new Error(qErr.message)

  return data
}

// Staff: update a quiz title and questions (WC)
export async function updateQuiz(
  quizID: string,
  title: string,
  questions: QuizQuestion[],
  petType: string,
  emergencyCategory: string,
): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quiz')
    .update({ title, questions })
    .eq('quizID', quizID)
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Replace quiz_question rows for this pet/category (WC)
  await supabase
    .from('quiz_question')
    .delete()
    .eq('petType', petType)
    .eq('emergencyCategory', emergencyCategory)

  const questionRows = questions.map((q) => ({
    petType,
    emergencyCategory,
    question: q.question,
    options: q.options,
    answer: q.answer,
  }))
  const { error: qErr } = await supabase.from('quiz_question').insert(questionRows)
  if (qErr) throw new Error(qErr.message)

  return data
}

// PetOwner: submit answers and calculate score (WC)
// answers: array of selected option texts, one per question
export async function submitQuiz(
  quizID: string,
  answers: string[],
): Promise<Quiz> {
  // Fetch the quiz to grade locally (WC)
  const { data: quiz, error: fetchErr } = await supabase
    .from('quiz')
    .select('*')
    .eq('quizID', quizID)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)

  const score = (quiz.questions as QuizQuestion[]).reduce(
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

// PetOwner: retrieve latest score for a quiz (WC)
export async function getScore(quizID: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('quiz')
    .select('score')
    .eq('quizID', quizID)
    .single()
  if (error) throw new Error(error.message)
  return data?.score ?? null
}

// ContentReview (WC) 
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

// Staff / Vet: view the latest review record for a content record (WC)
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

// Vet Actions (WC) 
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
        quiz (quizID, contentID, title, questions),
        educational_video (*)
      )
    `)
    .eq('vetID', vetID)
    .order('reviewedDate', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

// Vet: approve a content review — sets status to 'validated' so staff can publish it (WC)
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

// Staff: publish a validated content record — makes it publicly visible (WC)
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
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// Vet: reject a content review (WC)
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

// Staff: view all content submitted by this staff member (WC)
// Queries first_aid_content directly so content with no review row still appears.
// Returns one entry per content record, with the latest review attached if it exists. 
export async function viewStaffContent(staffID: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('first_aid_content')
    .select(`
      *,
      guide (*),
      quiz (quizID, contentID, title, questions),
      educational_video (*),
      content_review (
        reviewID,
        vetID,
        status,
        comment,
        reviewedDate
      )
    `)
    .eq('staffID', staffID)
    .order('lastUpdateDate', { ascending: false })
  if (error) throw new Error(error.message)

  // For each content record, pick the latest review and flatten onto the object (WC)
  return (data ?? []).map((row: any) => {
    const reviews: any[] = row.content_review ?? []
    // Sort reviews by reviewedDate desc, nulls last — pick the most recent
    const latestReview = reviews.sort((a: any, b: any) => {
      if (!a.reviewedDate) return 1
      if (!b.reviewedDate) return -1
      return new Date(b.reviewedDate).getTime() - new Date(a.reviewedDate).getTime()
    })[0] ?? null

    return { 
      // Spread the review fields at top level so page can read review.status etc.(WC)
      reviewID: latestReview?.reviewID ?? null,
      vetID: latestReview?.vetID ?? null,
      status: latestReview?.status ?? 'draft',
      comment: latestReview?.comment ?? null,
      reviewedDate: latestReview?.reviewedDate ?? null,
      contentID: row.contentID,
      // Content fields
      first_aid_content: row,
      guide: row.guide ?? [],
      quiz: row.quiz ?? [],
      educational_video: row.educational_video ?? [],
    }
  })
}

// Staff: edit guide steps on a validated content record, then send back for vet re-validation (WC)
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

// Staff: delete a full content bundle (guide/video/quiz + review + parent record) (WC)
export async function deleteFullContent(contentID: string): Promise<void> {
  await supabase.from('guide').delete().eq('contentID', contentID)
  await supabase.from('educational_video').delete().eq('contentID', contentID)
  await supabase.from('quiz').delete().eq('contentID', contentID)
  await supabase.from('content_review').delete().eq('contentID', contentID)
  const { error } = await supabase.from('first_aid_content').delete().eq('contentID', contentID)
  if (error) throw new Error(error.message)
}

// Staff: resubmit a rejected content record for re-validation by inserting a new pending review (WC)
// Takes the reviewID of the rejected review to find the contentID and vetID, then creates a new pending review 
export async function resubmitContent(
  reviewID: string,
): Promise<ContentReview> {
  // Look up the original review to get contentID and vetID
  const { data: original, error: fetchErr } = await supabase
    .from('content_review')
    .select('contentID, vetID')
    .eq('reviewID', reviewID)
    .single()
  if (fetchErr) throw new Error(fetchErr.message)

  // Insert a new pending review for the same content + vet (WC)
  const { data, error } = await supabase
    .from('content_review')
    .insert({ contentID: original.contentID, vetID: original.vetID, status: 'pending' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}