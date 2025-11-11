import httpx
import json
import hashlib
import time
import base64
import hmac
from urllib.parse import urlencode
from typing import Dict, List, Optional

class SparkAIService:
    def __init__(self):
        self.app_id = "8a8a2e80"
        self.api_key = "e7b000c70b9007ac76e6a59337054f8a"
        self.api_secret = "MGRlZDllMWI2ODY4YjY1Y2M5OTY4Mzk5"
        self.base_url = "https://spark-api-open.xf-yun.com/v1/chat/completions"
        
    async def generate_diagnosis(self, anomaly_data: Dict, device_info: Dict, context_data: Dict, model: str = "lite"):
        """生成设备诊断报告"""
        # 构建提示词
        prompt = self._build_diagnosis_prompt(anomaly_data, device_info, context_data)

        # 准备请求数据
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "stream": False
        }

        # 准备请求头
        auth_value = f"{self.api_key}:{self.api_secret}"
        headers = {
            "Authorization": f"Bearer {auth_value}",
            "Content-Type": "application/json"
        }

        # 发送请求
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.base_url, json=payload, headers=headers, timeout=60.0)
            except Exception as e:
                raise Exception(f"请求失败: {str(e)}")

            # 检查响应状态
            if response.status_code != 200:
                error_text = response.text
                raise Exception(f"API 调用失败: {response.status_code} - {error_text}")

            # 解析响应
            try:
                response_data = response.json()
            except Exception:
                return {
                    "diagnosis": response.text,
                    "possible_causes": ["无法解析响应"],
                    "suggestions": ["请查看原始返回"],
                    "confidence": 0.5
                }

            # 提取诊断内容
            return self._parse_diagnosis_response(response_data)
    
    def _build_diagnosis_prompt(self, anomaly_data: Dict, device_info: Dict, context_data: Dict) -> str:
        """构建诊断提示词"""
        prompt = "你是一个专业的运维专家。请分析以下设备异常情况：\n\n"
        prompt += f"设备信息：{device_info}\n\n"
        prompt += f"异常数据：{anomaly_data}\n\n"
        prompt += f"上下文数据：{context_data}\n\n"
        prompt += "请生成诊断报告，包含：\n"
        prompt += "1. 可能的原因分析\n"
        prompt += "2. 处理建议\n"
        prompt += "3. 排查步骤\n"
        prompt += "4. 预防措施\n"
        prompt += "请尽量使用简洁精炼的语言回答"
        return prompt
    
    def _parse_diagnosis_response(self, response_data: Dict) -> Dict:
        """解析讯飞星火 API 的响应，提取诊断内容"""
        diagnosis_text = ""

        # 从 choices[0].message.content 提取内容
        if "choices" in response_data and len(response_data["choices"]) > 0:
            first_choice = response_data["choices"][0]
            if "message" in first_choice:
                content = first_choice["message"].get("content", "")
                diagnosis_text = content.strip()

        # 如果没有提取到内容，返回错误信息
        if not diagnosis_text:
            diagnosis_text = "AI 未返回诊断内容"

        # 简单拆分诊断内容为不同部分
        lines = diagnosis_text.split("\n")
        clean_lines = []
        for line in lines:
            line = line.strip()
            if line:
                clean_lines.append(line)

        # 提取可能原因和建议（简单处理）
        possible_causes = []
        suggestions = []

        if len(clean_lines) > 0:
            possible_causes = clean_lines[:2]  # 前2行作为可能原因
        if len(clean_lines) > 2:
            suggestions = clean_lines[2:5]  # 第3-5行作为建议

        return {
            "diagnosis": diagnosis_text,
            "possible_causes": possible_causes,
            "suggestions": suggestions,
            "confidence": 0.8
        }



