-- ============================================
-- 工业设备智能运维平台 - MySQL 8.x 数据库初始化脚本
-- ============================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库
DROP DATABASE IF EXISTS `industrial_iomp`;
CREATE DATABASE `industrial_iomp` 
    DEFAULT CHARACTER SET utf8mb4 
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `industrial_iomp`;

-- ============================================
-- 1. 角色表（sys_role）
-- 说明：系统角色定义，包括超级管理员、高级运维、普通运维
-- ============================================
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '角色唯一 ID',
    `role_code` varchar(30) NOT NULL COMMENT '角色编码：admin - 高级运维、operator - 普通运维、super - 超级管理员',
    `role_name` varchar(20) NOT NULL COMMENT '角色名称',
    `role_desc` varchar(200) DEFAULT NULL COMMENT '角色描述',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '软删除标记：0 - 未删除 1 - 已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_code` (`role_code`),
    KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统角色表';

-- ============================================
-- 2. 用户表（sys_user）
-- 说明：系统用户账号信息
-- ============================================
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户唯一 ID',
    `username` varchar(50) NOT NULL COMMENT '登录账号，全局唯一',
    `password` varchar(100) NOT NULL COMMENT '加密后的用户密码',
    `real_name` varchar(20) NOT NULL COMMENT '用户真实姓名',
    `role_id` bigint NOT NULL COMMENT '关联角色 ID',
    `phone` varchar(11) DEFAULT NULL COMMENT '联系电话',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '账号状态：0 - 禁用 1 - 正常',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '软删除标记：0 - 未删除 1 - 已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_role_id` (`role_id`),
    KEY `idx_status` (`status`),
    KEY `idx_is_deleted` (`is_deleted`),
    KEY `idx_create_time` (`create_time`),
    CONSTRAINT `fk_user_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- ============================================
-- 3. 设备类型表（device_type）
-- 说明：定义工业设备的各种类型
-- ============================================
DROP TABLE IF EXISTS `device_type`;
CREATE TABLE `device_type` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '设备类型唯一 ID',
    `type_name` varchar(50) NOT NULL COMMENT '设备类型名称，如调配罐、灌装机',
    `type_desc` varchar(200) DEFAULT NULL COMMENT '设备类型描述',
    `create_user` bigint NOT NULL COMMENT '创建人 ID',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '软删除标记：0 - 未删除 1 - 已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_type_name` (`type_name`),
    KEY `idx_create_user` (`create_user`),
    KEY `idx_is_deleted` (`is_deleted`),
    CONSTRAINT `fk_device_type_create_user` FOREIGN KEY (`create_user`) REFERENCES `sys_user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备类型表';

-- ============================================
-- 4. 设备表（device）
-- 说明：具体的工业设备信息
-- ============================================
DROP TABLE IF EXISTS `device`;
CREATE TABLE `device` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '设备唯一 ID',
    `device_code` varchar(50) NOT NULL COMMENT '设备编码，全局唯一',
    `device_name` varchar(100) NOT NULL COMMENT '设备名称',
    `device_type_id` bigint NOT NULL COMMENT '关联设备类型 ID',
    `location` varchar(200) DEFAULT NULL COMMENT '设备安装位置',
    `manufacturer` varchar(100) DEFAULT NULL COMMENT '制造商',
    `model` varchar(50) DEFAULT NULL COMMENT '设备型号',
    `serial_number` varchar(100) DEFAULT NULL COMMENT '序列号',
    `install_date` date DEFAULT NULL COMMENT '安装日期',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '设备状态：0 - 停机 1 - 运行中 2 - 维护中 3 - 故障',
    `create_user` bigint NOT NULL COMMENT '创建人 ID',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '软删除标记：0 - 未删除 1 - 已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_device_code` (`device_code`),
    KEY `idx_device_type_id` (`device_type_id`),
    KEY `idx_status` (`status`),
    KEY `idx_is_deleted` (`is_deleted`),
    CONSTRAINT `fk_device_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_type` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_device_create_user` FOREIGN KEY (`create_user`) REFERENCES `sys_user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备表';

-- ============================================
-- 5. 知识库表（knowledge_base）
-- 说明：存储设备运维知识库内容
-- ============================================
DROP TABLE IF EXISTS `knowledge_base`;
CREATE TABLE `knowledge_base` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '知识库内容唯一 ID',
    `title` varchar(100) NOT NULL COMMENT '知识标题',
    `device_type_id` bigint NOT NULL COMMENT '关联设备类型 ID',
    `content` text NOT NULL COMMENT '纯文本知识内容',
    `keywords` varchar(200) DEFAULT NULL COMMENT '核心关键词，逗号分隔，用于检索',
    `create_user` bigint NOT NULL COMMENT '创建人 ID',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '软删除标记：0 - 未删除 1 - 已删除',
    PRIMARY KEY (`id`),
    KEY `idx_device_type_id` (`device_type_id`),
    KEY `idx_create_user` (`create_user`),
    KEY `idx_is_deleted` (`is_deleted`),
    FULLTEXT KEY `ft_title_content` (`title`, `content`),
    FULLTEXT KEY `ft_keywords` (`keywords`),
    CONSTRAINT `fk_kb_device_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_type` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_kb_create_user` FOREIGN KEY (`create_user`) REFERENCES `sys_user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库表';

-- ============================================
-- 6. 告警规则表（alarm_rule）
-- 说明：定义设备监控参数的告警阈值规则
-- ============================================
DROP TABLE IF EXISTS `alarm_rule`;
CREATE TABLE `alarm_rule` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '告警规则唯一 ID',
    `rule_name` varchar(100) NOT NULL COMMENT '规则名称',
    `device_type_id` bigint NOT NULL COMMENT '关联设备类型 ID',
    `param_name` varchar(50) NOT NULL COMMENT '监控参数名称，如温度、压力',
    `threshold_max` decimal(10,2) DEFAULT NULL COMMENT '参数上限阈值',
    `threshold_min` decimal(10,2) DEFAULT NULL COMMENT '参数下限阈值',
    `alarm_level` tinyint NOT NULL COMMENT '告警级别：1 - 一般 2 - 重要 3 - 紧急',
    `handle_suggest` text DEFAULT NULL COMMENT '告警处置建议',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '规则状态：0 - 禁用 1 - 启用',
    `create_user` bigint NOT NULL COMMENT '创建人 ID',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '软删除标记：0 - 未删除 1 - 已删除',
    PRIMARY KEY (`id`),
    KEY `idx_device_type_id` (`device_type_id`),
    KEY `idx_param_name` (`param_name`),
    KEY `idx_alarm_level` (`alarm_level`),
    KEY `idx_status` (`status`),
    KEY `idx_is_deleted` (`is_deleted`),
    CONSTRAINT `fk_alarm_rule_device_type` FOREIGN KEY (`device_type_id`) REFERENCES `device_type` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_alarm_rule_create_user` FOREIGN KEY (`create_user`) REFERENCES `sys_user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警规则表';

-- ============================================
-- 7. 监控数据表（monitor_data）
-- 说明：存储设备的实时/历史监控数据
-- 注意：分区表不支持外键，通过应用程序保证数据一致性
-- ============================================
DROP TABLE IF EXISTS `monitor_data`;
CREATE TABLE `monitor_data` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '数据记录唯一 ID',
    `device_id` bigint NOT NULL COMMENT '关联设备 ID',
    `param_name` varchar(50) NOT NULL COMMENT '监控参数名称，如温度、压力',
    `param_value` decimal(10,2) NOT NULL COMMENT '参数数值',
    `unit` varchar(20) DEFAULT NULL COMMENT '参数单位，如°C、MPa',
    `collect_time` datetime NOT NULL COMMENT '数据采集时间',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    PRIMARY KEY (`id`, `collect_time`),
    KEY `idx_device_id` (`device_id`),
    KEY `idx_param_name` (`param_name`),
    KEY `idx_collect_time` (`collect_time`),
    KEY `idx_device_collect` (`device_id`, `collect_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='监控数据表'
PARTITION BY RANGE (YEAR(`collect_time`)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION pfuture VALUES LESS THAN MAXVALUE
);

-- ============================================
-- 8. 告警记录表（alarm_record）
-- 说明：存储触发的告警记录
-- ============================================
DROP TABLE IF EXISTS `alarm_record`;
CREATE TABLE `alarm_record` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '告警记录唯一 ID',
    `device_id` bigint NOT NULL COMMENT '关联设备 ID',
    `alarm_rule_id` bigint NOT NULL COMMENT '关联告警规则 ID',
    `param_name` varchar(50) NOT NULL COMMENT '触发告警的参数名称',
    `param_value` decimal(10,2) NOT NULL COMMENT '触发告警时的参数值',
    `threshold_value` decimal(10,2) NOT NULL COMMENT '触发阈值（上限或下限值）',
    `alarm_level` tinyint NOT NULL COMMENT '告警级别：1 - 一般 2 - 重要 3 - 紧急',
    `alarm_desc` varchar(500) DEFAULT NULL COMMENT '告警描述',
    `status` tinyint NOT NULL DEFAULT 0 COMMENT '处理状态：0 - 未处理 1 - 处理中 2 - 已处理',
    `handle_user` bigint DEFAULT NULL COMMENT '处理人 ID',
    `handle_time` datetime DEFAULT NULL COMMENT '处理时间',
    `handle_result` text DEFAULT NULL COMMENT '处理结果说明',
    `trigger_time` datetime NOT NULL COMMENT '告警触发时间',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录创建时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_device_id` (`device_id`),
    KEY `idx_alarm_rule_id` (`alarm_rule_id`),
    KEY `idx_alarm_level` (`alarm_level`),
    KEY `idx_status` (`status`),
    KEY `idx_handle_user` (`handle_user`),
    KEY `idx_trigger_time` (`trigger_time`),
    CONSTRAINT `fk_alarm_device` FOREIGN KEY (`device_id`) REFERENCES `device` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_alarm_rule` FOREIGN KEY (`alarm_rule_id`) REFERENCES `alarm_rule` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_alarm_handle_user` FOREIGN KEY (`handle_user`) REFERENCES `sys_user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警记录表';

-- ============================================
-- 9. 诊断记录表（diagnosis_record）
-- 说明：AI 智能诊断记录
-- ============================================
DROP TABLE IF EXISTS `diagnosis_record`;
CREATE TABLE `diagnosis_record` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '诊断记录唯一 ID',
    `device_id` bigint NOT NULL COMMENT '关联设备 ID',
    `diagnosis_type` tinyint NOT NULL COMMENT '诊断类型：1 - 故障诊断 2 - 预测性维护 3 - 性能分析',
    `input_data` json DEFAULT NULL COMMENT '输入数据（JSON格式，包含设备参数等）',
    `diagnosis_result` text NOT NULL COMMENT '诊断结果',
    `confidence` decimal(5,2) DEFAULT NULL COMMENT '诊断置信度（0-100）',
    `suggestions` text DEFAULT NULL COMMENT '处理建议',
    `related_alarm_id` bigint DEFAULT NULL COMMENT '关联告警记录 ID',
    `status` tinyint NOT NULL DEFAULT 1 COMMENT '诊断状态：0 - 失效 1 - 有效',
    `create_user` bigint NOT NULL COMMENT '创建人 ID（发起诊断的用户）',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_device_id` (`device_id`),
    KEY `idx_diagnosis_type` (`diagnosis_type`),
    KEY `idx_related_alarm_id` (`related_alarm_id`),
    KEY `idx_status` (`status`),
    KEY `idx_create_user` (`create_user`),
    KEY `idx_create_time` (`create_time`),
    CONSTRAINT `fk_diagnosis_device` FOREIGN KEY (`device_id`) REFERENCES `device` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_diagnosis_alarm` FOREIGN KEY (`related_alarm_id`) REFERENCES `alarm_record` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_diagnosis_create_user` FOREIGN KEY (`create_user`) REFERENCES `sys_user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='诊断记录表';

-- ============================================
-- 10. 问答记录表（qa_record）
-- 说明：AI 智能问答对话记录
-- ============================================
DROP TABLE IF EXISTS `qa_record`;
CREATE TABLE `qa_record` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '问答记录唯一 ID',
    `session_id` varchar(64) NOT NULL COMMENT '会话 ID（用于区分同一用户的连续对话）',
    `question` text NOT NULL COMMENT '用户问题',
    `answer` text NOT NULL COMMENT 'AI 回答',
    `context` json DEFAULT NULL COMMENT '对话上下文（JSON格式）',
    `referenced_kb_ids` varchar(200) DEFAULT NULL COMMENT '引用的知识库 ID，逗号分隔',
    `referenced_device_id` bigint DEFAULT NULL COMMENT '关联设备 ID（如有）',
    `create_user` bigint NOT NULL COMMENT '提问用户 ID',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `feedback_score` tinyint DEFAULT NULL COMMENT '用户反馈评分：1 - 不满意 2 - 一般 3 - 满意',
    `feedback_comment` varchar(500) DEFAULT NULL COMMENT '用户反馈内容',
    PRIMARY KEY (`id`),
    KEY `idx_session_id` (`session_id`),
    KEY `idx_create_user` (`create_user`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_referenced_device_id` (`referenced_device_id`),
    CONSTRAINT `fk_qa_create_user` FOREIGN KEY (`create_user`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_qa_device` FOREIGN KEY (`referenced_device_id`) REFERENCES `device` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='问答记录表';

-- ============================================
-- 11. 操作日志表（operation_log）
-- 说明：系统操作审计日志
-- ============================================
DROP TABLE IF EXISTS `operation_log`;
CREATE TABLE `operation_log` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志唯一 ID',
    `user_id` bigint DEFAULT NULL COMMENT '操作用户 ID',
    `username` varchar(50) DEFAULT NULL COMMENT '操作用户名',
    `operation_type` varchar(50) NOT NULL COMMENT '操作类型：CREATE/UPDATE/DELETE/LOGIN/LOGOUT 等',
    `operation_module` varchar(50) NOT NULL COMMENT '操作模块：USER/DEVICE/ALARM/KB 等',
    `operation_desc` varchar(500) DEFAULT NULL COMMENT '操作描述',
    `request_method` varchar(10) DEFAULT NULL COMMENT '请求方法：GET/POST/PUT/DELETE',
    `request_url` varchar(500) DEFAULT NULL COMMENT '请求 URL',
    `request_params` text DEFAULT NULL COMMENT '请求参数（JSON格式）',
    `response_code` int DEFAULT NULL COMMENT '响应状态码',
    `ip_address` varchar(50) DEFAULT NULL COMMENT '操作人 IP 地址',
    `user_agent` varchar(500) DEFAULT NULL COMMENT '浏览器 User-Agent',
    `execution_time` int DEFAULT NULL COMMENT '执行时间（毫秒）',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_operation_type` (`operation_type`),
    KEY `idx_operation_module` (`operation_module`),
    KEY `idx_create_time` (`create_time`),
    KEY `idx_user_time` (`user_id`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ============================================
-- 初始化数据
-- ============================================

-- 初始化角色数据
INSERT INTO `sys_role` (`id`, `role_code`, `role_name`, `role_desc`) VALUES
(1, 'super', '超级管理员', '拥有系统所有权限，可管理用户和系统配置'),
(2, 'admin', '高级运维', '可管理设备、告警规则和知识库，处理告警'),
(3, 'operator', '普通运维', '可查看设备状态、监控数据，处理告警记录');

-- 初始化用户数据（密码默认为：admin123，使用 bcrypt 加密后的值）
-- 注意：生产环境请修改默认密码
INSERT INTO `sys_user` (`id`, `username`, `password`, `real_name`, `role_id`, `phone`, `status`) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '系统管理员', 1, '13800000000', 1),
(2, 'operator1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EO', '运维人员1', 3, '13800000001', 1);

-- 初始化设备类型数据
INSERT INTO `device_type` (`id`, `type_name`, `type_desc`, `create_user`) VALUES
(1, '调配罐', '用于物料混合调配的罐体设备', 1),
(2, '灌装机', '用于液体/膏体自动灌装的生产设备', 1),
(3, '输送带', '用于物料运输的传送带设备', 1),
(4, '反应釜', '用于化学反应的压力容器设备', 1);

-- 初始化示例设备数据
INSERT INTO `device` (`id`, `device_code`, `device_name`, `device_type_id`, `location`, `manufacturer`, `model`, `status`, `create_user`) VALUES
(1, 'DEV001', '1号调配罐', 1, 'A车间-01号位', '某某机械厂', 'TM-1000', 1, 1),
(2, 'DEV002', '2号灌装机', 2, 'B车间-05号位', '某某自动化', 'GZ-200', 1, 1);

-- ============================================
-- 设置外键检查
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 数据库创建完成
-- ============================================
SELECT '工业设备智能运维平台数据库初始化完成！' AS 'Message';
