import request from './request'

export interface AlarmRule {
  id: number
  rule_name: string
  device_type: string
  params: string
  threshold_max: number | null
  threshold_min: number | null
  duration: number
  count: number
  alarm_level: number
  handle_suggest: string | null
  status: number
  create_user: number
  create_time: string
  update_time: string
  is_deleted: number
}

export interface UpdateAlarmRulePayload {
  rule_name: string
  device_type: string
  params: string
  threshold_max: number | null
  threshold_min: number | null
  duration: number
  count: number
  alarm_level: number
  handle_suggest?: string | null
  status?: number
}

export async function getAlarmRules() {
  return request.get('/alarm-rules')
}

export async function getAlarmRule(id: number) {
  return request.get(`/alarm-rules/${id}`)
}

export async function updateAlarmRule(id: number, payload: UpdateAlarmRulePayload) {
  return request.put(`/alarm-rules/${id}`, payload)
}
