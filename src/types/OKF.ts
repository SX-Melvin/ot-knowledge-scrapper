export interface OKFConfig {
  name: string
  profile: string
  title: string
  description: string
}

export interface ThreadFormat {
  author: string
  time: string
  type: string
  comments: string[]
  threadNumber: number
}

export interface TicketSectionFormat {
  section: string
  text: string
}