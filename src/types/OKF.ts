export interface OKFConfig {
  name: string
  title: string
  description: string
  version: string
  resources: {
    name: string,
    path: string,
    format: string,
    mediatype: string,
    schema: any
  }[]
  licenses: { name: string, title: string, path: string }[]
  contributors: string[]
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