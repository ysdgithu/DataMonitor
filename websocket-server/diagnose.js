const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// 1. 先查规则1
console.log('=== 规则1 ===');
db.get('SELECT * FROM alarm_rule WHERE id = 1', (err, row) => {
    if (err) { console.error(err); return; }
    console.log('规则:', row);
    
    // 2. 查设备1001的数据
    console.log('\n=== 设备1001 最近10条 ===');
    db.all("SELECT timestamp, payload FROM device_data WHERE device_id = '1001' ORDER BY timestamp DESC LIMIT 10", (err, rows) => {
        if (rows) {
            rows.reverse().forEach(r => {
                const p = JSON.parse(r.payload);
                const t = new Date(r.timestamp).toLocaleTimeString();
                const temp = p.temp?.value;
                console.log(t, 'temp=', temp, temp > 67 || temp < 63 ? '🔴异常' : '');
            });
        }
        
        // 3. 查设备1006的数据
        console.log('\n=== 设备1006 最近10条 ===');
        db.all("SELECT timestamp, payload FROM device_data WHERE device_id = '1006' ORDER BY timestamp DESC LIMIT 10", (err, rows) => {
            if (rows) {
                rows.reverse().forEach(r => {
                    const p = JSON.parse(r.payload);
                    const t = new Date(r.timestamp).toLocaleTimeString();
                    const temp = p.temp?.value;
                    console.log(t, 'temp=', temp, temp > 67 || temp < 63 ? '🔴异常' : '');
                });
            }
            db.close();
        });
    });
});
