#!/bin/bash

# 异常检测测试脚本

echo "==================================="
echo "   异常检测测试脚本"
echo "==================================="
echo ""
echo "请选择测试类型："
echo "1. CPU持续超限检测器单元测试"
echo "2. 温度突变检测器单元测试"
echo "3. 集成测试 - CPU持续超限"
echo "4. 集成测试 - 温度突变"
echo "5. 集成测试 - 全部"
echo "6. 实际场景测试 - CPU和温度同时测试（推荐）"
echo "7. 实际场景测试 - CPU和温度顺序测试"
echo ""
read -p "请输入选项 (1-7): " choice

case $choice in
    1)
        echo ""
        echo "运行CPU持续超限检测器单元测试..."
        npx ts-node src/tests/cpuDetector.test.ts
        ;;
    2)
        echo ""
        echo "运行温度突变检测器单元测试..."
        npx ts-node src/tests/tempDetector.test.ts
        ;;
    3)
        echo ""
        echo "运行集成测试 - CPU持续超限..."
        npx ts-node src/tests/integratedTest.ts cpu
        ;;
    4)
        echo ""
        echo "运行集成测试 - 温度突变..."
        npx ts-node src/tests/integratedTest.ts temp
        ;;
    5)
        echo ""
        echo "运行集成测试 - 全部..."
        npx ts-node src/tests/integratedTest.ts all
        ;;
    6)
        echo ""
        echo "运行实际场景测试 - CPU和温度同时测试..."
        echo "说明：使用两个独立的模拟器同时生成CPU超限和温度突变数据"
        echo "预计约60秒后触发CPU告警，约5分钟后触发温度告警"
        echo "按Ctrl+C停止测试"
        echo ""
        npx ts-node src/examples/dualTestMode.ts
        ;;
    7)
        echo ""
        echo "运行实际场景测试 - CPU和温度顺序测试..."
        echo "说明：先测试CPU超限（90秒），然后切换到温度突变测试"
        echo "按Ctrl+C停止测试"
        echo ""
        npx ts-node src/examples/testModeExample.ts 4
        ;;
    *)
        echo "无效的选项"
        exit 1
        ;;
esac

