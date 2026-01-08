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
