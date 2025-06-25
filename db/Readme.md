json-server db.json
查询特定种类特定时间接口
http://localhost:3000/metrics?type=device_type&_page=1&_per_page=10
时间范围筛选：
http://localhost:3000/metrics?type=device_type&timestamp_gte=1620057600&timestamp_lte=1620086400
排序：
/metrics?_sort=-timestamp  # 按时间戳降序