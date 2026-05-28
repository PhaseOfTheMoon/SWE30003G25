import supabase from '@/lib/supabase'

// This file contains all content-related types and functions for both staff and vets, such as creating/updating first-aid guides, educational videos, quizzes, and handling vet reviews. 
// It serves as the main interface for the app's content management features, abstracting away the underlying database operations and providing a clear API for the frontend pages to interact with content data.
export type FirstAidContent = {
  contentID: string
  staffID: string | null  
  petType: string
  emergencyCategory: string
  lastUpdateDate: string
}

export type Guide = {
  guideID: string
  contentID: string
  title: string
  stepNumber: number
  instruction: string
  videoUrl: string | null   
}

export type EducationalVideo = {
  videoID: string
  contentID: string
  title: string
  videoUrl: string
  description: string | null
}

export type Quiz = {
  quizID: string
  contentID: string
  title: string
  questions: QuizQuestion[]   
}

export type QuizQuestion = {
  question: string
  options: string[]
  answer: number   
}

export type ContentReview = {
  reviewID: string
  contentID: string
  vetID: string | null
  status: 'pending' | 'validated' | 'rejected'
  comment: string | null
  reviewedDate: string | null
}

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

// staff create a first-aid content with basic info (pet type + emergency category). This generates a contentID which is used as the parent key for all related guides, videos, quizzes, and reviews. 
// The content starts with no guide steps until staff add them in subsequent calls.
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
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Staff create a guide step for a first-aid content. A content can have multiple guide steps, differentiated by stepNumber.
export async function createGuide(payload: {
  contentID: string
  title: string
  stepNumber: number
  instruction: string
  videoUrl?: string
}): Promise<Guide> {
  const { data, error } = await supabase
    .from('guide')
    .insert({
      contentID: payload.contentID,
      title: payload.title,
      stepNumber: payload.stepNumber,
      instruction: payload.instruction,
      videoUrl: payload.videoUrl ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Staff create an educational video
export async function createEducationalVideo(payload: {
  contentID: string
  title: string
  videoUrl: string
  description: string
}): Promise<EducationalVideo> {
  const { data, error } = await supabase
    .from('educational_video')
    .insert({
      contentID: payload.contentID,
      title: payload.title,
      videoUrl: payload.videoUrl,
      description: payload.description,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Staff create a quiz
export async function createQuiz(payload: {
  contentID: string
  title: string
  questions: QuizQuestion[]
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
  return data
}

// staff required vet validation before content goes live. This function creates a content_review row with status "pending" to enter the vet review queue.
export async function requestVetValidation(
  contentID: string,
  vetID: string
): Promise<ContentReview> {
  const { data, error } = await supabase
    .from('content_review')
    .insert({ contentID, vetID, status: 'pending' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Since vets may take time to review, staff can call this function to get the latest review status and comments for a contentID. Returns null if no review exists yet.
export async function viewContentReview(contentID: string): Promise<ContentReview | null> {
  const { data, error } = await supabase
    .from('content_review')
    .select('*')
    .eq('contentID', contentID)
    .order('reviewedDate', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

// Guest/PetOwner: view validated step-by-step guides.
export async function viewPublishedGuides(): Promise<FirstAidGuideContent[]> {
  const { data, error } = await supabase
    .from('first_aid_content')
    .select('*, guide(*), content_review!inner(status)')
    .eq('content_review.status', 'validated')
    .order('lastUpdateDate', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? [])
    .map((row) => ({
      ...row,
      guide: [...(row.guide ?? [])].sort((a, b) => a.stepNumber - b.stepNumber),
    }))
    .filter((row) => row.guide.length > 0)
}

// Guest/PetOwner: view validated educational videos.
export async function viewPublishedVideos(): Promise<FirstAidVideoContent[]> {
  const { data, error } = await supabase
    .from('first_aid_content')
    .select('*, educational_video(*), content_review!inner(status)')
    .eq('content_review.status', 'validated')
    .order('lastUpdateDate', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? [])
    .map((row) => ({
      ...row,
      educational_video: row.educational_video ?? [],
    }))
    .filter((row) => row.educational_video.length > 0)
}

// Guest/PetOwner: view the full FirstAidContent aggregate.
// The UI uses this to let users choose a pet type, then open emergency guide sections.
export async function viewPublishedFirstAidContent(): Promise<FirstAidContentBundle[]> {
  const { data, error } = await supabase
    .from('first_aid_content')
    .select('*, guide(*), educational_video(*), content_review!inner(status)')
    .eq('content_review.status', 'validated')
    .order('petType', { ascending: true })
    .order('emergencyCategory', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? [])
    .map((row) => ({
      ...row,
      guide: [...(row.guide ?? [])].sort((a, b) => a.stepNumber - b.stepNumber),
      educational_video: row.educational_video ?? [],
    }))
    .filter((row) => row.guide.length > 0 || row.educational_video.length > 0)
}

// staff update guide content and reset review to pending (if rejected) would be handled in a single function since they often happen together.
export async function updateGuide(
  guideID: string,
  title: string,
  instruction: string,
  videoUrl?: string
): Promise<Guide> {
  const { data: guide, error: ge } = await supabase
    .from('guide')
    .update({ title, instruction, videoUrl: videoUrl ?? null })
    .eq('guideID', guideID)
    .select()
    .single()

  if (ge) throw new Error(ge.message)

  await supabase
    .from('first_aid_content')
    .update({ lastUpdateDate: new Date().toISOString() })
    .eq('contentID', guide.contentID)

  return guide
}

// Staff update  for educational videos would be similar to updateGuide, updating their respective tables and refreshing lastUpdateDate on the parent content.
export async function updateEducationalVideo(
  videoID: string,
  title: string,
  videoUrl: string,
  description: string
): Promise<EducationalVideo> {
  const { data, error } = await supabase
    .from('educational_video')
    .update({ title, videoUrl, description })
    .eq('videoID', videoID)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase
    .from('first_aid_content')
    .update({ lastUpdateDate: new Date().toISOString() })
    .eq('contentID', data.contentID)

  return data
}

// Only guide has an update function since quiz content is unlikely to be edited after creation. 
// If needed, can add updateQuiz() similarly.
export async function updateQuiz(
  quizID: string,
  title: string,
  questions: QuizQuestion[]
): Promise<Quiz> {
  const { data, error } = await supabase
    .from('quiz')
    .update({ title, questions })
    .eq('quizID', quizID)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase
    .from('first_aid_content')
    .update({ lastUpdateDate: new Date().toISOString() })
    .eq('contentID', data.contentID)

  return data
}

// Staff: view all submitted content with review outcomes 
/**
 * Queries from first_aid_content (where staffID lives) and embeds
 * content_review + guide. PostgREST cannot filter on an embedded table's
 * column from the parent query, so we start from first_aid_content instead.
 *
 * Migration required (run once in Supabase SQL editor):
 *   alter table first_aid_content add column if not exists "staffID" uuid references auth.users;
 *
 * Also update createFirstAidContent() to pass staffID when inserting.
 */
export async function viewStaffContent(staffID: string): Promise<ContentReview[]> {
  const { data, error } = await supabase
    .from('first_aid_content')
    .select('*, guide(*), content_review(*)')
    .eq('staffID', staffID)
    .order('lastUpdateDate', { ascending: false })

  if (error) throw new Error(error.message)

  // Flatten into ContentReview shape so the page works without changes.
  // Each first_aid_content row may have multiple reviews; we take the latest.
  const rows: ContentReview[] = (data ?? []).map((fac: any) => {
    const reviews: ContentReview[] = fac.content_review ?? []
    const latest = reviews.sort(
      (a, b) => new Date(b.reviewedDate ?? 0).getTime() - new Date(a.reviewedDate ?? 0).getTime()
    )[0] ?? {
      reviewID: '',
      contentID: fac.contentID,
      vetID: null,
      status: 'pending' as const,
      comment: null,
      reviewedDate: null,
    }

    return {
      ...latest,
      // Attach first_aid_content + guide so the page can read them as before
      first_aid_content: fac,
      guide: fac.guide ?? [],
    } as any
  })

  return rows
}

// Staff: edit guide steps and reset review to pending 

/**
 * Called after a vet rejects a guide. Does two things atomically:
 *   1. Updates the guide row (title + instruction) via the existing updateGuide helper.
 *   2. Resets the content_review status back to 'pending' and clears the
 *      vet's previous comment and reviewedDate so it re-enters the vet queue.
 *
 * Returns the updated ContentReview (with joined first_aid_content + guide)
 * so the staff page can update its local state in one call.
 */
export async function resubmitContent(
  reviewID: string,
  draft: { title: string; instruction: string; videoUrl?: string }
): Promise<ContentReview> {
  // 1. Fetch the review to get contentID → guideID
  const { data: review, error: re } = await supabase
    .from('content_review')
    .select('*, first_aid_content(*, guide(*))')
    .eq('reviewID', reviewID)
    .single()

  if (re) throw new Error(re.message)
  if (review.status !== 'rejected') throw new Error('Only rejected content can be resubmitted.')

  const guides: Guide[] = (review as any).first_aid_content?.guide ?? []
  if (guides.length === 0) throw new Error('No guide steps found for this content.')

  // 2. Update the first guide step (extend to loop over all steps if needed)
  await updateGuide(guides[0].guideID, draft.title, draft.instruction, draft.videoUrl)

  // 3. Reset the review row back to pending, clearing prior vet decision
  const { data: updated, error: ue } = await supabase
    .from('content_review')
    .update({
      status: 'pending',
      comment: null,
      reviewedDate: null,
    })
    .eq('reviewID', reviewID)
    .select('*, first_aid_content(*, guide(*))')
    .single()

  if (ue) throw new Error(ue.message)
  return updated
}

// Vet-side functions (unchanged) 
async function resolveVetPK(authUID: string): Promise<string> {
  const { data: vetRow } = await supabase
    .from('veterinarian')
    .select('id')
    .eq('id', authUID)
    .single()

  let vetPK: string | null = vetRow?.id ?? null
  if (!vetPK) {
    const { data: vetByProfile } = await supabase
      .from('veterinarian')
      .select('id')
      .eq('vet_id', authUID)
      .single()
    vetPK = vetByProfile?.id ?? null
  }

  if (!vetPK) throw new Error('Veterinarian record not found for this user.')
  return vetPK
}

// Called on vet dashboard to show all content assigned to this vet for review, along with their current review status and any comments. Sorted by most recent review first.
export async function viewPendingContent(authUID: string): Promise<ContentReview[]> {
  const vetPK = await resolveVetPK(authUID)
  const { data, error } = await supabase
    .from('content_review')
    .select('*, first_aid_content(*, guide(*), quiz(*), educational_video(*))')  // 👈
    .eq('vetID', vetPK)
    .eq('status', 'pending')

  if (error) throw new Error(error.message)
  return data ?? []
}

// Vet can view all content assigned to them, not just pending ones, so they can also see previously reviewed content and their comments.
export async function viewAllVetContent(authUID: string): Promise<ContentReview[]> {
  const vetPK = await resolveVetPK(authUID)
  const { data, error } = await supabase
    .from('content_review')
    .select('*, first_aid_content(*, guide(*), quiz(*), educational_video(*))')
    .eq('vetID', vetPK)
    .order('reviewedDate', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

// Called when vet clicks "Validate" on a pending content item. Updates the review status to "validated" and saves any optional comment from the vet.
export async function validateContent(reviewID: string, comment: string): Promise<ContentReview> {
  const { error } = await supabase
    .from('content_review')
    .update({ status: 'validated', comment, reviewedDate: new Date().toISOString() })
    .eq('reviewID', reviewID)

  if (error) throw new Error(error.message)

  const { data, error: fe } = await supabase
    .from('content_review')
    .select('*, first_aid_content(*, guide(*), quiz(*), educational_video(*))')
    .eq('reviewID', reviewID)
    .single()

  if (fe) throw new Error(fe.message)
  return data
}

// Called when vet rejects content, which sends it back to staff for revision
export async function rejectContent(reviewID: string, comment: string): Promise<ContentReview> {
  const { error } = await supabase
    .from('content_review')
    .update({ status: 'rejected', comment, reviewedDate: new Date().toISOString() })
    .eq('reviewID', reviewID)

  if (error) throw new Error(error.message)

  const { data, error: fe } = await supabase
    .from('content_review')
    .select('*, first_aid_content(*, guide(*), quiz(*), educational_video(*))')
    .eq('reviewID', reviewID)
    .single()

  if (fe) throw new Error(fe.message)
  return data
}
