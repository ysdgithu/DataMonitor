// 告警规则模型
import {
    Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Default,
    ForeignKey, BelongsTo, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import DeviceType from './DeviceType';
import SysUser from './SysUser';

@Table({ tableName: 'alarm_rule', timestamps: true, createdAt: 'create_time', updatedAt: 'update_time' })
export default class AlarmRule extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id!: number;

    @AllowNull(false)
    @Column({ type: DataType.STRING(100), field: 'rule_name' })
    ruleName!: string;

    @ForeignKey(() => DeviceType)
    @AllowNull(false)
    @Column({ type: DataType.BIGINT, field: 'device_type_id' })
    deviceTypeId!: number;

    @AllowNull(false)
    @Column({ type: DataType.STRING(50), field: 'param_name' })
    paramName!: string;

    @Column({ type: DataType.DECIMAL(10, 2), field: 'threshold_max' })
    thresholdMax?: number;

    @Column({ type: DataType.DECIMAL(10, 2), field: 'threshold_min' })
    thresholdMin?: number;

    @AllowNull(false)
    @Column({ type: DataType.TINYINT, field: 'alarm_level' })
    alarmLevel!: number;

    @Column({ type: DataType.TEXT, field: 'handle_suggest' })
    handleSuggest?: string;

    @Default(1)
    @AllowNull(false)
    @Column(DataType.TINYINT)
    status!: number;

    @ForeignKey(() => SysUser)
    @AllowNull(false)
    @Column({ type: DataType.BIGINT, field: 'create_user' })
    createUser!: number;

    @CreatedAt
    @Column({ field: 'create_time' })
    createTime!: Date;

    @UpdatedAt
    @Column({ field: 'update_time' })
    updateTime!: Date;

    @Default(0)
    @AllowNull(false)
    @Column({ type: DataType.TINYINT, field: 'is_deleted' })
    isDeleted!: number;

    @BelongsTo(() => DeviceType)
    deviceType!: DeviceType;

    @BelongsTo(() => SysUser, { foreignKey: 'createUser', as: 'creator' })
    creator!: SysUser;
}
