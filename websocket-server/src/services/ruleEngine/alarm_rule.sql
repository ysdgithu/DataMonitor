/*
 Navicat Premium Dump SQL

 Source Server         : 可视化数据监控平台
 Source Server Type    : MySQL
 Source Server Version : 80037 (8.0.37)
 Source Host           : localhost:3306
 Source Schema         : monitor_db

 Target Server Type    : MySQL
 Target Server Version : 80037 (8.0.37)
 File Encoding         : 65001

 Date: 05/04/2026 17:32:49
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for alarm_rule
-- ----------------------------
DROP TABLE IF EXISTS `alarm_rule`;
CREATE TABLE `alarm_rule`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '规则唯一ID',
  `rule_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '规则名称',
  `device_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '设备类型(调配罐/灌装机/封盖机/贴标机/洗瓶机)',
  `params` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '监控参数(多个用逗号分隔)',
  `logic_type` tinyint NOT NULL DEFAULT 1 COMMENT '多参数逻辑:1-或 2-且',
  `threshold_max` decimal(10, 2) NULL DEFAULT NULL COMMENT '参数上限阈值',
  `threshold_min` decimal(10, 2) NULL DEFAULT NULL COMMENT '参数下限阈值',
  `duration` int NOT NULL DEFAULT 0 COMMENT '持续时间(秒) 0=不限制',
  `count` int NOT NULL DEFAULT 0 COMMENT '连续触发次数 0=不限制',
  `time_slot` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '业务时段',
  `alarm_level` tinyint NOT NULL COMMENT '告警等级:1-一般 2-重要 3-紧急',
  `handle_suggest` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '告警处置建议',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '规则状态:0-禁用 1-启用',
  `create_user` bigint NOT NULL COMMENT '创建人ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT 0 COMMENT '软删除:0-未删除 1-已删除',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_device_type`(`device_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = '设备告警规则配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of alarm_rule
-- ----------------------------
-- 业务时段说明（工厂不分星期几）：
-- - 全天除凌晨5点: 全天24小时中，除了凌晨5点（05:00-06:00）为应进料时段
-- - 应进料时段: 凌晨5点（05:00-06:00），此时段异常3有特殊处理规则（液位无变化+电流为0）

INSERT INTO `alarm_rule` VALUES (1, '调配罐温度持续异常', '调配罐', 'temp', 1, 67.00, 63.00, 30, 0, '全天除凌晨5点', 2, '检查温控系统、加热模块，确认温度传感器是否故障', 1, 1, '2026-04-03 22:27:06', '2026-04-05 17:05:25', 0);
INSERT INTO `alarm_rule` VALUES (2, '灌装机灌装量连续异常', '灌装机', 'fill_volume', 1, 505.00, 495.00, 0, 10, '全天除凌晨5点', 2, '检查灌装阀、流量计，校准灌装参数', 1, 1, '2026-04-03 22:27:06', '2026-04-03 22:27:06', 0);
-- 异常3：调配罐进料时段泵故障（特殊规则）
-- 在"应进料时段"（凌晨5点05:00-06:00）内，使用特殊判断：液位无变化 且 电流为0
INSERT INTO `alarm_rule` VALUES (3, '调配罐进料时段泵故障', '调配罐', 'level,current', 2, NULL, NULL, 60, 0, '应进料时段', 3, '立即检查进料泵、电路，确认泵体是否卡死/停机', 1, 1, '2026-04-03 22:27:06', '2026-04-03 22:27:06', 0);
INSERT INTO `alarm_rule` VALUES (7, '灌装机速度过低异常', '灌装机', 'speed', 1, NULL, 48.00, 60, 0, '全天除凌晨5点', 2, '检查传动系统、变频器，清理设备卡阻异物', 1, 1, '2026-04-03 22:27:06', '2026-04-05 17:06:19', 0);

SET FOREIGN_KEY_CHECKS = 1;
