import DatabaseConnection from './src/database/connection';

async function diagnose() {
    const db = DatabaseConnection.getInstance();
    
    // 1. 查规则1
    console.log('=== 规则1 ===');
    const rule = await db.get('SELECT * FROM alarm_rule WHERE id = 1');
    console.log('规则:', rule);
    
    // 2. 查设备1001的关键时间段数据
    console.log('\n=== 设备1001 关键时间段 (16:51:20 ~ 16:51:55) ===');
    const rows1 = await db.all("SELECT timestamp, payload FROM device_data WHERE device_id = '1001' ORDER BY timestamp ASC");
    for (const r of rows1) {
        const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
        const t = new Date(r.timestamp);
        const timeStr = t.toLocaleTimeString();
        const hour = t.getHours();
        const minute = t.getMinutes();
        // 只看16:51附近的数据
        if (hour === 16 && minute >= 51) {
            const temp = p.temp?.value;
            const isAbnormal = temp > 67 || temp < 63;
            console.log(timeStr, 'temp=', temp, isAbnormal ? '🔴异常' : '🟢正常');
        }
    }
    
    // 3. 查设备1006的数据
    console.log('\n=== 设备1006 最近10条 ===');
    const rows2 = await db.all("SELECT timestamp, payload FROM device_data WHERE device_id = '1006' ORDER BY timestamp DESC LIMIT 10");
    for (const r of rows2.reverse()) {
        const p = typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload;
        const t = new Date(r.timestamp).toLocaleTimeString();
        const temp = p.temp?.value;
        console.log(t, 'temp=', temp, temp > 67 || temp < 63 ? '🔴异常' : '');
    }
    
    process.exit(0);
}

diagnose().catch(console.error);
