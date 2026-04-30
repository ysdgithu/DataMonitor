// 独立测试脚本 - 只测试数据生成器
const DatabaseConnection = require('./dist/database/connection').default;
const { DataModel } = require('./dist/database/models');
const { DeviceSimulator } = require('./dist/services/deviceSimulator');

async function main() {
    console.log('=== 数据生成器独立测试 ===\n');

    try {
        // 1. 初始化数据库连接
        console.log('[1/3] 连接数据库...');
        const db = DatabaseConnection.getInstance();
        await db.connect();
        console.log('✓ 数据库连接成功\n');

        // 2. 初始化数据模型和模拟器
        console.log('[2/3] 初始化数据生成器...');
        const dataModel = new DataModel();
        const simulator = new DeviceSimulator();
        
        // 手动设置数据处理器（只用于数据库写入）
        const mockProcessor = {
            processAndPushBatch: async (deviceDataList) => {
                // 直接写入数据库
                await dataModel.batchInsertDeviceData(deviceDataList);
                console.log(`[${new Date().toLocaleTimeString()}] 写入 ${deviceDataList.length} 台设备数据`);
                
                // 打印第一台设备的数据示例
                const first = deviceDataList[0];
                console.log(`  示例: 设备${first.deviceId} (${first.deviceType})`);
                console.log(`  时间戳: ${first.timestamp}`);
                console.log(`  数据:`, JSON.stringify(first.payload, null, 2).substring(0, 200) + '...\n');
            }
        };
        
        simulator.setDataProcessor(mockProcessor);
        console.log('✓ 初始化完成\n');

        // 3. 启动数据生成
        console.log('[3/3] 启动数据生成（每2秒一次，共运行60秒）...\n');
        simulator.start();

        // 显示当前数据库状态
        const countBefore = await db.get('SELECT COUNT(*) as count FROM device_data');
        console.log(`当前 device_data 表数据量: ${countBefore.count} 条\n`);

        // 运行 60 秒后自动停止
        setTimeout(async () => {
            console.log('\n=== 测试结束，正在停止 ===');
            simulator.stop();
            
            const countAfter = await db.get('SELECT COUNT(*) as count FROM device_data');
            console.log(`\n最终 device_data 表数据量: ${countAfter.count} 条`);
            console.log(`本次新增: ${countAfter.count - countBefore.count} 条`);
            
            // 显示最新数据
            const latest = await db.all('SELECT * FROM device_data ORDER BY id DESC LIMIT 5');
            console.log('\n最新5条数据:');
            console.table(latest.map(row => ({
                id: row.id,
                device_id: row.device_id,
                data_type: row.data_type,
                timestamp: new Date(row.timestamp).toLocaleTimeString(),
                payload_preview: row.payload.substring(0, 60) + '...'
            })));
            
            process.exit(0);
        }, 60000); // 60秒

    } catch (error) {
        console.error('测试失败:', error);
        process.exit(1);
    }
}

main();
