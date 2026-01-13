export type IssueStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'
export type IssueCategory = 'pothole' | 'trash' | 'lighting' | 'safety' | 'water' | 'infrastructure' | 'other'
export type ModerationStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  googleId: string
  email: string
  name: string
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Entity {
  id: string
  name: string
  description: string | null
  keywords: string[] | null
  icon: string | null
  contactEmail: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Issue {
  id: string
  userId: string
  entityId: string | null
  category: IssueCategory
  moderationStatus: ModerationStatus
  title: string
  description: string
  imageUrl: string | null
  imagePublicId: string | null
  latitude: string | null
  longitude: string | null
  address: string | null
  status: IssueStatus
  aiConfidence: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IssueConfirmation {
  id: string
  issueId: string
  userId: string
  createdAt: Date
}
