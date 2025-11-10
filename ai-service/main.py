"""
智能运维AI服务后端
用于提供AI诊断、智能问答等功能的FastAPI应用

主要功能：
1. 提供AI诊断接口，根据设备异常数据生成诊断报告
2. 提供智能问答接口，支持运维相关的对话交互
3. 集成讯飞星火大模型，提供AI能力支持

pip3 install fastapi uvicorn pydantic requests websockets httpx
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.spark_service import SparkAIService
from models.schemas import DiagnosisRequest, DiagnosisResponse, ChatRequest, ChatResponse
import uvicorn
import os

# 创建FastAPI应用实例
app = FastAPI(
    title="智能运维AI服务",
    version="1.0.0",
    description="提供AI诊断、智能问答等功能的REST API服务"
)

# CORS跨域配置
# 允许前端开发服务器(3000端口)和生产服务器(5173端口)的跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # 允许的源
    allow_credentials=True,  # 允许携带凭证
    allow_methods=["*"],    # 允许所有HTTP方法
    allow_headers=["*"],    # 允许所有请求头
)

# 初始化星火大模型服务实例
spark_service = SparkAIService()

# AI诊断接口
@app.post("/api/ai/diagnosis", response_model=DiagnosisResponse)
async def create_diagnosis(request: DiagnosisRequest):
    """生成智能诊断报告
    
    Args:
        request (DiagnosisRequest): 包含异常数据、设备信息和上下文数据的请求体
        
    Returns:
        DiagnosisResponse: 诊断结果，包含诊断报告、可能原因、建议措施和置信度
        
    Raises:
        HTTPException: 当诊断生成失败时抛出500错误
    """
    try:
        # 调用星火大模型生成诊断报告
        result = await spark_service.generate_diagnosis(
            anomaly_data=request.anomaly_data,    # 异常数据
            device_info=request.device_info,      # 设备信息
            context_data=request.context_data     # 上下文数据
        )
        # 封装诊断结果响应
        return DiagnosisResponse(
            success=True,
            diagnosis=result.diagnosis,           # 诊断结论
            possible_causes=result.possible_causes, # 可能原因
            suggestions=result.suggestions,       # 建议措施
            confidence=result.confidence          # 置信度
        )
    except Exception as e:
        # 诊断失败时返回500错误
        raise HTTPException(status_code=500, detail=f"诊断生成失败: {str(e)}")

# AI问答接口
@app.post("/api/ai/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """智能运维问答接口
    
    Args:
        request (ChatRequest): 包含问题、上下文和对话历史的请求体
        
    Returns:
        ChatResponse: 回答结果，包含答案、参考信息和建议问题
        
    Raises:
        HTTPException: 当问答失败时抛出500错误
    """
    try:
        # 调用星火大模型生成回答
        result = await spark_service.chat(
            question=request.question,              # 用户问题
            context=request.context,                # 上下文信息
            conversation_history=request.history    # 对话历史
        )
        # 封装回答结果响应
        return ChatResponse(
            success=True,
            answer=result.answer,                   # AI回答内容
            references=result.references,           # 参考信息
            suggested_questions=result.suggested_questions # 建议的后续问题
        )
    except Exception as e:
        # 问答失败时返回500错误
        raise HTTPException(status_code=500, detail=f"问答失败: {str(e)}")

# 健康检查接口
@app.get("/health")
async def health_check():
    """服务健康检查接口
    
    Returns:
        dict: 包含服务状态和服务名称的响应
    """
    return {
        "status": "healthy",    # 服务状态
        "service": "ai-service" # 服务名称
    }

# 主程序入口
if __name__ == "__main__":
    # 启动FastAPI应用服务器
    # host="0.0.0.0" 允许外部访问
    # port=8001 指定服务端口
    uvicorn.run(
        app,
        host="0.0.0.0",  # 监听所有可用网络接口
        port=8001        # 服务端口号
    )