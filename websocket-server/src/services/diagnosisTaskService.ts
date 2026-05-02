// 诊断任务服务
// 用于自动创建诊断任务并调用AI分析

import { DataModel } from '../database/models';
import DatabaseConnection from '../database/connection';

// AI客户端导入（JavaScript模块）
const aiClient = require('./ai-client');

// 告警详情接口（匹配AlarmEngine的返回格式）
interface AlarmDetail {
  param: string;
  value: number;
  threshold_max: number | null;
  threshold_min: number | null;
  alarm_level: number;
  suggest: string;
}

// 诊断任务创建参数
interface CreateDiagnosisTaskParams {
  deviceId: number;
  deviceName: string;
  deviceType: string;
  alarmDetails: AlarmDetail[];
  monitorData: Record<string, any>;
  timestamp: number;
}

// 诊断任务服务类
export class DiagnosisTaskService {
  private dataModel: DataModel;
  private db: DatabaseConnection;

  constructor() {
    this.dataModel = new DataModel();
    this.db = DatabaseConnection.getInstance();
  }

  /**
   * 异常检测时自动创建诊断任务并调用AI分析
   */
  async createTaskForAnomaly(params: CreateDiagnosisTaskParams): Promise<number | null> {
    const { deviceId, deviceName, deviceType, alarmDetails, monitorData, timestamp } = params;

    try {
      console.log(`[DiagnosisTask] 检测到异常，设备: ${deviceName} (${deviceId})`);

      // 1. 生成任务名称和详情
      const alarmParams = alarmDetails.map(d => d.param).join('、');
      const taskName = `${deviceName} - ${alarmParams}异常`;
      const taskDetail = this.generateTaskDetail(alarmDetails);

      // 2. 创建诊断任务记录
      const taskId = await this.dataModel.createDiagnosisTask({
        name: taskName,
        deviceId: String(deviceId), // 转换为字符串
        priority: this.calculatePriority(alarmDetails),
        assignee: 'AI自动诊断',
        detail: taskDetail,
        status: 0 // 状态: 0=进行中（默认）
      });

      console.log(`[DiagnosisTask] 已创建诊断任务，ID: ${taskId}`);

      // 3. 异步调用AI进行诊断分析（不阻塞主流程）
      this.performAIDiagnosis(taskId, deviceId, deviceName, deviceType, alarmDetails, monitorData, timestamp)
        .catch(err => {
          console.error(`[DiagnosisTask] AI诊断失败，任务ID: ${taskId}`, err);
        });

      return taskId;
    } catch (error) {
      console.error('[DiagnosisTask] 创建任务失败:', error);
      return null;
    }
  }

  /**
   * 执行AI诊断分析（异步）
   */
  private async performAIDiagnosis(
    taskId: number,
    deviceId: number,
    deviceName: string,
    deviceType: string,
    alarmDetails: AlarmDetail[],
    monitorData: Record<string, any>,
    timestamp: number
  ): Promise<void> {
    try {
      console.log(`[DiagnosisTask] 开始AI诊断，任务ID: ${taskId}`);

      // 更新任务状态为"进行中"
      await this.dataModel.updateDiagnosisTask(taskId, {
        status: 0 // 0=进行中
      });

      // 构建AI诊断请求数据
      const anomalyEvent = {
        device: {
          id: deviceId,
          name: deviceName,
          type: deviceType
        },
        metrics: monitorData,
        context: {
          timestamp,
          alarms: alarmDetails
        }
      };

      // 调用AI服务
      console.log(`[DiagnosisTask] 调用AI服务...`);
      const aiResult = await aiClient.generateDiagnosis(anomalyEvent);

      if (aiResult && aiResult.success) {
        // AI诊断成功
        const diagnosisText = this.formatAIDiagnosis(aiResult);

        await this.dataModel.updateDiagnosisTask(taskId, {
          detail: diagnosisText,
          status: 1 // 1=已完成
        });

        console.log(`[DiagnosisTask] AI诊断完成，任务ID: ${taskId}`);
      } else {
        // AI诊断失败，使用降级方案
        throw new Error('AI服务返回失败');
      }
    } catch (error) {
      console.log(`[DiagnosisTask] AI服务不可用，使用降级方案，任务ID: ${taskId}`);

      // 使用基于规则的降级诊断
      const fallbackDiagnosis = this.generateFallbackDiagnosis(alarmDetails);
      await this.dataModel.updateDiagnosisTask(taskId, {
        detail: fallbackDiagnosis,
        status: 1 // 1=已完成（使用降级方案）
      });

      console.log(`[DiagnosisTask] 降级诊断完成，任务ID: ${taskId}`);
    }
  }

  /**
   * 生成任务详情描述
   */
  private generateTaskDetail(alarmDetails: AlarmDetail[]): string {
    const details = alarmDetails.map(d => {
      let msg = `- ${d.param}: 当前值 ${d.value.toFixed(2)}`;
      if (d.threshold_max !== null && d.value > d.threshold_max) {
        msg += `, 超过最大阈值 ${d.threshold_max}`;
      } else if (d.threshold_min !== null && d.value < d.threshold_min) {
        msg += `, 低于最小阈值 ${d.threshold_min}`;
      }
      return msg;
    }).join('\n');

    return `检测到以下参数异常:\n${details}\n\n等待AI分析中...`;
  }

  /**
   * 计算任务优先级（基于异常数量和严重程度）
   */
  private calculatePriority(alarmDetails: AlarmDetail[]): number {
    // 异常数量越多，优先级越高
    if (alarmDetails.length >= 3) return 2; // 高优先级
    if (alarmDetails.length >= 2) return 1; // 中优先级
    return 0; // 低优先级
  }

  /**
   * 格式化AI诊断结果
   */
  private formatAIDiagnosis(aiResult: any): string {
    let text = '【AI诊断报告】\n\n';

    if (aiResult.diagnosis) {
      text += `诊断结论:\n${aiResult.diagnosis}\n\n`;
    }

    if (aiResult.possible_causes && aiResult.possible_causes.length > 0) {
      text += '可能原因:\n';
      aiResult.possible_causes.forEach((cause: string, idx: number) => {
        text += `${idx + 1}. ${cause}\n`;
      });
      text += '\n';
    }

    if (aiResult.suggestions && aiResult.suggestions.length > 0) {
      text += '建议措施:\n';
      aiResult.suggestions.forEach((suggestion: string, idx: number) => {
        text += `${idx + 1}. ${suggestion}\n`;
      });
      text += '\n';
    }

    if (aiResult.confidence !== undefined) {
      text += `置信度: ${(aiResult.confidence * 100).toFixed(1)}%\n`;
    }

    return text;
  }

  /**
   * 生成降级诊断（AI服务不可用时）
   */
  private generateFallbackDiagnosis(alarmDetails: AlarmDetail[]): string {
    let text = '【基础诊断报告】\n\n';
    text += 'AI服务暂时不可用，以下是基于规则的基础分析:\n\n';

    text += '异常参数:\n';
    alarmDetails.forEach((detail, idx) => {
      text += `${idx + 1}. ${detail.param}: 当前值 ${detail.value.toFixed(2)}, `;
      if (detail.threshold_max !== null && detail.value > detail.threshold_max) {
        text += `超过最大阈值 ${detail.threshold_max}`;
      } else if (detail.threshold_min !== null && detail.value < detail.threshold_min) {
        text += `低于最小阈值 ${detail.threshold_min}`;
      }
      if (detail.suggest) {
        text += `\n   建议: ${detail.suggest}`;
      }
      text += '\n';
    });

    text += '\n基础建议:\n';
    text += '1. 检查设备运行状态\n';
    text += '2. 查看设备日志\n';
    text += '3. 联系技术支持\n';

    text += '\n注: 这是基于规则的简单分析，建议稍后重试AI诊断以获得更详细的分析结果。';

    return text;
  }
}

// 导出单例
export default new DiagnosisTaskService();

