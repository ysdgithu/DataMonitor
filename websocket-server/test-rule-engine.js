// 规则引擎独立测试 - 检测异常并写入诊断任务
const DatabaseConnection = require('./dist/database/connection').default;
const { RuleEngine } = require('./dist/services/ruleEngine');

async function main() {
    console.log('=== 规则引擎独立测试（带诊断任务写入）===\n');

    try {
        // 1. 连接数据库
        console.log('[1/4] 连接数据库...');
        const db = DatabaseConnection.getInstance();
        await db.connect();
        console.log('✓ 数据库连接成功\n');

        // 2. 检查现有数据
        const count = await db.get('SELECT COUNT(*) as count FROM device_data');
        console.log(`[2/4] 当前 device_data 表数据量: ${count.count} 条`);
        
        const taskCountBefore = await db.get('SELECT COUNT(*) as count FROM diagnosis_tasks');
        console.log(`[3/4] 当前 diagnosis_tasks 表数据量: ${taskCountBefore.count} 条\n`);

        if (count.count === 0) {
            console.log('⚠ 数据库为空，请先运行 test-simulator.js 生成数据\n');
            process.exit(1);
        }

        // 4. 启动规则引擎（增大历史缓冲到1小时）
        console.log('[4/4] 启动规则引擎（运行30秒）...\n');
        const ruleEngine = new RuleEngine({
            checkInterval: 5000,
            historyBuffer: 3600000  // 1小时
        });

        // 设置告警回调
        ruleEngine.onAlarm((event) => {
            console.log('\n✅ 告警回调触发:', event.ruleName);
        });

        await ruleEngine.start();

        // 显示加载的规则
        const rules = ruleEngine.getRules();
        console.log('\n已加载的规则:');
        rules.forEach(rule => {
            console.log(`  - [${rule.id}] ${rule.name} (${rule.deviceType})`);
        });

        console.log('\n开始检查...每5秒检查一次\n');

        // 运行30秒后停止
        setTimeout(async () => {
            console.log('\n=== 测试结束 ===');
            ruleEngine.stop();
            
            // 检查新增的任务
            const taskCountAfter = await db.get('SELECT COUNT(*) as count FROM diagnosis_tasks');
            console.log(`\n诊断任务统计:`);
            console.log(`  测试前: ${taskCountBefore.count} 条`);
            console.log(`  测试后: ${taskCountAfter.count} 条`);
            console.log(`  新增: ${taskCountAfter.count - taskCountBefore.count} 条`);
            
            // 显示最新的诊断任务
            const latestTasks = await db.all(`
                SELECT id, name, device_id, status, priority, create_time 
                FROM diagnosis_tasks 
                ORDER BY id DESC 
                LIMIT 5
            `);
            if (latestTasks.length > 0) {
                console.log('\n最新5条诊断任务:');
                console.table(latestTasks);
            }
            
            process.exit(0);
        }, 30000);

    } catch (error) {
        console.error('测试失败:', error);
        process.exit(1);
    }
}

main();
