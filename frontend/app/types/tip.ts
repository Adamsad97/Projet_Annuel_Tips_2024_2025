export interface TipFormData {
  title: string;
  description: string;
  content: string;
  tags: string[];
  difficulty: number;
  address?: string;
  lat?: number;
  lng?: number;
  images: File[];
  documents: File[];
}

// Forme d'un tip renvoyé par l'API (GET /tips, GET /tips/:id)
export interface ApiTip {
  id: number;
  title: string;
  content: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
  userId: number;
  user?: {
    id: number;
    firstname: string | null;
    lastname: string | null;
    email?: string;
    avatarProfile: string | null;
  };
  categories?: Array<{ category: { id: number; name: string } }>;
  comments?: Array<{
    id: number;
    content: string;
    createdAt: string;
    user: {
      id: number;
      firstname: string | null;
      lastname: string | null;
      avatarProfile: string | null;
    };
  }>;
  _count?: { comments: number; votes: number; views: number };
}
