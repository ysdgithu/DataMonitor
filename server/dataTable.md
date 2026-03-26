用户名	密码	角色
admin	admin123	超级管理员
operator1	admin123	普通运维


6.3.1 用户表（sys_user）
表格
字段名	数据类型	约束	字段说明
id	bigint	PRIMARY KEY、AUTO_INCREMENT	用户唯一 ID
username	varchar(50)	NOT NULL、UNIQUE	登录账号，全局唯一
password	varchar(100)	NOT NULL	加密后的用户密码
real_name	varchar(20)	NOT NULL	用户真实姓名
role_id	bigint	NOT NULL、FOREIGN KEY	关联角色 ID
phone	varchar(11)	DEFAULT NULL	联系电话
status	tinyint	NOT NULL、DEFAULT 1	账号状态：0 - 禁用 1 - 正常
create_time	datetime	NOT NULL、DEFAULT CURRENT_TIMESTAMP	创建时间
update_time	datetime	NOT NULL、DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
is_deleted	tinyint	NOT NULL、DEFAULT 0	软删除标记：0 - 未删除 1 - 已删除
6.3.2 角色表（sys_role）
表格
字段名	数据类型	约束	字段说明
id	bigint	PRIMARY KEY、AUTO_INCREMENT	角色唯一 ID
role_code	varchar(30)	NOT NULL、UNIQUE	角色编码：admin - 高级运维、operator - 普通运维、super - 超级管理员
role_name	varchar(20)	NOT NULL	角色名称
role_desc	varchar(200)	DEFAULT NULL	角色描述
create_time	datetime	NOT NULL、DEFAULT CURRENT_TIMESTAMP	创建时间
update_time	datetime	NOT NULL、DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
is_deleted	tinyint	NOT NULL、DEFAULT 0	软删除标记
6.3.3 设备类型表（device_type）
表格
字段名	数据类型	约束	字段说明
id	bigint	PRIMARY KEY、AUTO_INCREMENT	设备类型唯一 ID
type_name	varchar(50)	NOT NULL、UNIQUE	设备类型名称，如调配罐、灌装机
type_desc	varchar(200)	DEFAULT NULL	设备类型描述
create_user	bigint	NOT NULL、FOREIGN KEY	创建人 ID
create_time	datetime	NOT NULL、DEFAULT CURRENT_TIMESTAMP	创建时间
update_time	datetime	NOT NULL、DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
is_deleted	tinyint	NOT NULL、DEFAULT 0	软删除标记
6.3.4 知识库表（knowledge_base）
表格
字段名	数据类型	约束	字段说明
id	bigint	PRIMARY KEY、AUTO_INCREMENT	知识库内容唯一 ID
title	varchar(100)	NOT NULL	知识标题
device_type_id	bigint	NOT NULL、FOREIGN KEY	关联设备类型 ID
content	text	NOT NULL	纯文本知识内容
keywords	varchar(200)	DEFAULT NULL	核心关键词，逗号分隔，用于检索
create_user	bigint	NOT NULL、FOREIGN KEY	创建人 ID
create_time	datetime	NOT NULL、DEFAULT CURRENT_TIMESTAMP	创建时间
update_time	datetime	NOT NULL、DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
is_deleted	tinyint	NOT NULL、DEFAULT 0	软删除标记
6.3.5 告警规则表（alarm_rule）
表格
字段名	数据类型	约束	字段说明
id	bigint	PRIMARY KEY、AUTO_INCREMENT	告警规则唯一 ID
rule_name	varchar(100)	NOT NULL	规则名称
device_type_id	bigint	NOT NULL、FOREIGN KEY	关联设备类型 ID
param_name	varchar(50)	NOT NULL	监控参数名称，如温度、压力
threshold_max	decimal(10,2)	DEFAULT NULL	参数上限阈值
threshold_min	decimal(10,2)	DEFAULT NULL	参数下限阈值
alarm_level	tinyint	NOT NULL	告警级别：1 - 一般 2 - 重要 3 - 紧急
handle_suggest	text	DEFAULT NULL	告警处置建议
status	tinyint	NOT NULL、DEFAULT 1	规则状态：0 - 禁用 1 - 启用
create_user	bigint	NOT NULL、FOREIGN KEY	创建人 ID
create_time	datetime	NOT NULL、DEFAULT CURRENT_TIMESTAMP	创建时间
update_time	datetime	NOT NULL、DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP	更新时间
is_deleted	tinyint	NOT NULL、DEFAULT 0	软删除标记
6.3.6 其余核心表
其余告警记录表、监控数据表、诊断记录表、问答记录表，均遵循统一设计规范，覆盖业务全字段，适配系统功能需求，可直接基于业务逻辑扩展开发。