import request from './request'

export interface DeviceItem {
  id: number
  device_code: string
  device_name: string
  device_type: '灌装机' | '调配罐'
  create_time: string
  update_time: string
}

export interface DevicePayload {
  device_code: string
  device_name: string
  device_type: '灌装机' | '调配罐'
}

export const deviceApi = {
  getList() {
    return request<{ success: boolean; data: DeviceItem[]; message?: string }>('/devices')
  },
  create(data: DevicePayload) {
    return request<{ success: boolean; message: string }>({
      url: '/devices',
      method: 'post',
      data
    })
  },
  update(id: number, data: DevicePayload) {
    return request<{ success: boolean; message: string }>({
      url: `/devices/${id}`,
      method: 'put',
      data
    })
  },
  remove(id: number) {
    return request<{ success: boolean; message: string }>({
      url: `/devices/${id}`,
      method: 'delete'
    })
  }
}
