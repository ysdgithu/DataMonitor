// 设备类型模型
import {
    Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Unique, AllowNull, Default,
    ForeignKey, BelongsTo, CreatedAt, UpdatedAt, HasMany,
} from 'sequelize-typescript';
import SysUser from './SysUser';
import KnowledgeBase from './KnowledgeBase';
import AlarmRule from './AlarmRule';

@Table({ tableName: 'device_type', timestamps: true, createdAt: 'create_time', updatedAt: 'update_time' })
export default class DeviceType extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id!: number;

    @Unique
    @AllowNull(false)
    @Column({ type: DataType.STRING(50), field: 'type_name' })
    typeName!: string;

    @Column({ type: DataType.STRING(200), field: 'type_desc' })
    typeDesc?: string;

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

    @BelongsTo(() => SysUser, { foreignKey: 'createUser', as: 'creator' })
    creator!: SysUser;

    @HasMany(() => KnowledgeBase)
    knowledgeBases!: KnowledgeBase[];

    @HasMany(() => AlarmRule)
    alarmRules!: AlarmRule[];
}
