import request from './request'

export type ParseStatus = 0 | 1 | 2 | 3

export interface KnowledgeDocumentItem {
  id: number
  doc_name: string
  ragflow_doc_id: string
  upload_user_id: number
  upload_time: string
  parse_status: ParseStatus
  chunk_count: number
  create_time: string
  update_time: string
}

export interface KnowledgeListResponse {
  success: boolean
  data: KnowledgeDocumentItem[]
  total: number
  page: number
  page_size: number
  message?: string
}

export const knowledgeApi = {
  getList(params: { page?: number; page_size?: number; keywords?: string; parse_status?: number | '' }) {
    return request<KnowledgeListResponse>({
      url: '/knowledge/documents',
      method: 'get',
      params
    })
  },

  upload(files: File[]) {
    const formData = new FormData()
    files.forEach(file => formData.append('file', file))
    return request<{ success: boolean; message?: string; data?: unknown }>({
      url: '/knowledge/documents/upload',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  process(id: number) {
    return request<{ success: boolean; message?: string }>({
      url: `/knowledge/documents/${id}/process`,
      method: 'post'
    })
  },

  delete(id: number) {
    return request<{ success: boolean; message?: string }>({
      url: `/knowledge/documents/${id}`,
      method: 'delete'
    })
  }
}
