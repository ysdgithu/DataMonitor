const axios = require('axios');

class AIClient {
  constructor() {
    this.aiServiceBaseURL = 'http://localhost:8001';
    this.client = axios.create({
      baseURL: this.aiServiceBaseURL,
      timeout: 30000 // 30秒超时
    });
  }

  // 异常诊断
  async generateDiagnosis(anomalyEvent) {
    try {
      const response = await this.client.post('/api/ai/diagnosis', {
        anomaly_data: anomalyEvent.metrics,
        device_info: anomalyEvent.device,
        context_data: anomalyEvent.context
      });

      return response.data;
    } catch (error) {
      console.error('AI 服务调用失败:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
      throw error;
    }
  }

  // 智能问答
  async chatWithAI(question, context, history = []) {
    try {
      const response = await this.client.post('/api/ai/chat', {
        question,
        context,
        history
      });

      return response.data;
    } catch (error) {
      console.error('AI问答服务调用失败:', error.message);
      return {
        success: false,
        answer: 'AI服务暂时不可用，请稍后重试。',
        references: []
      };
    }
  }

//   getFallbackDiagnosis(anomalyEvent) {
//     // AI服务不可用时的降级方案
//     return {
//       success: false,
//       diagnosis: '基于规则的基础诊断',
//       possible_causes: ['系统负载过高', '硬件故障', '配置问题'],
//       suggestions: ['重启服务', '检查硬件状态', '查看系统日志'],
//       confidence: 0.3,
//       is_fallback: true
//     };
//   }
}

module.exports = new AIClient();