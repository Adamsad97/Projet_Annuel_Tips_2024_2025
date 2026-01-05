import seed from '../../../data/seed.json'

interface SeedComment {
  id: number
  tip_id: number
  user_id: number
  content: string
  created_at: string
  parent_id: number | null
}

interface SeedUser {
  id: number
  user_name: string
  avatar_profile: string
  trust_index: number
  grade_id: number
}

export default defineEventHandler((event) => {
  const id = event.context.params?.id || getRouterParam(event, 'id')
  
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })
  
  const tipId = Number(id)
  
  // Cast seed data
  const commentsData = seed.comments as SeedComment[]
  const usersData = seed.users as SeedUser[]

  // Filtrer les commentaires pour ce tip
  const tipComments = commentsData.filter((c) => c.tip_id === tipId)

  // Enrichir avec les infos de l'auteur et structurer
  const enrichedComments = tipComments.map((comment) => {
    const user = usersData.find((u) => u.id === comment.user_id)
    
    // Calculer le temps écoulé
    const daysAgo = Math.floor((new Date().getTime() - new Date(comment.created_at).getTime()) / (1000 * 3600 * 24))
    const publishedAgo = daysAgo === 0 ? "Aujourd'hui" : `il y a ${daysAgo} jours`
    
    return {
      id: comment.id,
      parent_id: comment.parent_id,
      body: comment.content,
      publishedAgo,
      likes: Math.floor(Math.random() * 20), // Mock likes
      author: {
        name: user ? user.user_name : 'Inconnu',
        avatar: user ? user.avatar_profile : ''
      }
    }
  })

  // Organiser en arbre (commentaires parents -> réponses)
  const rootComments = enrichedComments.filter((c) => !c.parent_id)
  const replies = enrichedComments.filter((c) => c.parent_id)

  const commentsTree = rootComments.map((root) => {
    return {
      ...root,
      replies: replies.filter((r) => r.parent_id === root.id)
    }
  })

  return commentsTree
})
