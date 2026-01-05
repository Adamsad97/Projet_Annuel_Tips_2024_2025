import seed from '../../data/seed.json'
import type { Tip, Author } from '../../../types'

export default defineEventHandler((event) => {
  const id = event.context.params?.id || getRouterParam(event, 'id')
  
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })
  
  const tipData = seed.tips.find((t) => t.id === Number(id))
  
  if (!tipData) {
    throw createError({ statusCode: 404, statusMessage: 'Tip not found' })
  }

  const user = seed.users.find((u) => u.id === tipData.user_id)
  
  const author: Author = {
    name: user ? user.user_name : 'Unknown',
    xp: user ? (user.trust_index * 10) + (user.grade_id * 100) : 0,
    avatar: user ? user.avatar_profile : '',
    role: 'Member'
  }

  const daysAgo = Math.floor((new Date().getTime() - new Date(tipData.created_at).getTime()) / (1000 * 3600 * 24))
  const publishedAgo = daysAgo === 0 ? "Aujourd'hui" : `il y a ${daysAgo} jours`

  return {
    id: tipData.id,
    title: tipData.title,
    description: tipData.description,
    content: tipData.content,
    tags: tipData.tags,
    difficulty: tipData.difficulty,
    author,
    publishedAgo,
    views: tipData.views,
    created_at: tipData.created_at,
    address: tipData.address,
    lat: tipData.lat,
    lng: tipData.lng,
    images: tipData.images,
    documents: tipData.documents
  } as Tip
})
