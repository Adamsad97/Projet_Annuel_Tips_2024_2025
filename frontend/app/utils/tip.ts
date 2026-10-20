import type { ApiTip, Tip } from '~/types';

// Les images uploadées sont stockées en chemin relatif à l'API (ex: /uploads/tips/xxx.jpg)
export const resolveUploadUrl = (path: string, apiBaseUrl: string): string =>
  path.startsWith('/uploads/') ? `${apiBaseUrl}${path}` : path;

export const getAuthorName = (user: ApiTip['user']): string => {
  if (!user) return 'Anonyme';
  const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ');
  return fullName || user.email || 'Anonyme';
};

export const mapApiTip = (apiTip: ApiTip, apiBaseUrl: string): Tip => ({
  id: apiTip.id,
  kind: apiTip.kind,
  title: apiTip.title,
  description: apiTip.content?.substring(0, 200) || apiTip.title,
  content: apiTip.content || '',
  tags: apiTip.categories?.map((c) => c.category.name) || [],
  difficulty: 0,
  author: {
    name: getAuthorName(apiTip.user),
    xp: 0,
    avatar: apiTip.user?.avatarProfile || '',
  },
  publishedAgo: new Date(apiTip.createdAt).toLocaleDateString('fr-FR'),
  views: apiTip._count?.views || 0,
  created_at: apiTip.createdAt,
  address: apiTip.address || undefined,
  lat: apiTip.latitude ?? undefined,
  lng: apiTip.longitude ?? undefined,
  images: (apiTip.images || []).map((image) => resolveUploadUrl(image, apiBaseUrl)),
  status: apiTip.status,
});
