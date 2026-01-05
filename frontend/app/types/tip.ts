export interface TipFormData {
  title: string
  description: string
  content: string
  tags: string[]
  difficulty: number
  address?: string
  images: File[]
  documents: File[]
}
