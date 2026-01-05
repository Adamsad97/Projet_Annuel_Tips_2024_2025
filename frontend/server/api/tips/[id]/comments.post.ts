import seed from '../../../data/seed.json'

interface SeedComment {
  id: number
  tip_id: number
  user_id: number
  content: string
  created_at: string
  parent_id: number | null
}

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id || getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

  const body = await readBody(event)
  if (!body.content) throw createError({ statusCode: 400, statusMessage: 'Content required' })

  const tipId = Number(id)
  const commentsData = seed.comments as SeedComment[]
  
  // Mock adding to seed data (runtime only, won't persist to file)
  const newComment = {
    id: Math.max(...commentsData.map((c) => c.id)) + 1,
    tip_id: tipId,
    user_id: 1, // Mock current user (Sophie Jardins)
    content: body.content,
    created_at: new Date().toISOString(),
    parent_id: body.parent_id || null
  }

  seed.comments.push(newComment)

  // Return the formatted comment for the UI
  return {
    id: newComment.id,
    body: newComment.content,
    publishedAgo: "À l'instant",
    likes: 0,
    author: {
      name: "Sophie Jardins (Vous)",
      avatar: "https://i.pravatar.cc/150?u=25"
    },
    replies: []
  }
})
