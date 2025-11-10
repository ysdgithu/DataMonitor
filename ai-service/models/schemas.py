"""
API 数据模型定义
"""
from typing import List, Dict, Optional
from pydantic import BaseModel

# 诊断相关模型
class DiagnosisRequest(BaseModel):
    """诊断请求模型"""
    anomaly_data: Dict  # 异常数据
    device_info: Dict   # 设备信息
    context_data: Optional[Dict] = None  # 上下文数据

class DiagnosisResponse(BaseModel):
    """诊断响应模型"""
    success: bool
    diagnosis: str  # 诊断结论
    possible_causes: List[str]  # 可能原因列表
    suggestions: List[str]  # 建议措施列表
    confidence: float  # 置信度

# 问答相关模型
class ChatRequest(BaseModel):
    """问答请求模型"""
    question: str  # 用户问题
    context: Optional[Dict] = None  # 上下文信息
    history: Optional[List[Dict]] = None  # 对话历史

class ChatResponse(BaseModel):
    """问答响应模型"""
    success: bool
    answer: str  # AI回答
    references: Optional[List[str]] = None  # 参考信息
    suggested_questions: Optional[List[str]] = None  # 建议问题
