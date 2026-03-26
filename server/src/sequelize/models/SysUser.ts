// 用户模型
import {
    Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Unique, AllowNull, Default,
    ForeignKey, BelongsTo, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import SysRole from './SysRole';

@Table({ tableName: 'sys_user', timestamps: true, createdAt: 'create_time', updatedAt: 'update_time' })
export default class SysUser extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id!: number;

    @Unique
    @AllowNull(false)
    @Column(DataType.STRING(50))
    username!: string;

    @AllowNull(false)
    @Column(DataType.STRING(100))
    password!: string;

    @AllowNull(false)
    @Column({ type: DataType.STRING(20), field: 'real_name' })
    realName!: string;

    @ForeignKey(() => SysRole)
    @AllowNull(false)
    @Column({ type: DataType.BIGINT, field: 'role_id' })
    roleId!: number;

    @Column(DataType.STRING(11))
    phone?: string;

    @Default(1)
    @AllowNull(false)
    @Column(DataType.TINYINT)
    status!: number;

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

    @BelongsTo(() => SysRole)
    role!: SysRole;

    toJSON(): object {
        const values = { ...this.get() };
        delete (values as any).password;
        return values;
    }
}
