// 知识库模型
import {
    Table, Column, Model, DataType, PrimaryKey, AutoIncrement, AllowNull, Default,
    ForeignKey, BelongsTo, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import DeviceType from './DeviceType';
import SysUser from './SysUser';

@Table({ tableName: 'knowledge_base', timestamps: true, createdAt: 'create_time', updatedAt: 'update_time' })
export default class KnowledgeBase extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id!: number;

    @AllowNull(false)
    @Column(DataType.STRING(100))
    title!: string;

    @ForeignKey(() => DeviceType)
    @AllowNull(false)
    @Column({ type: DataType.BIGINT, field: 'device_type_id' })
    deviceTypeId!: number;

    @AllowNull(false)
    @Column(DataType.TEXT)
    content!: string;

    @Column(DataType.STRING(200))
    keywords?: string;

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
