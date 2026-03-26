// 角色模型
import {
    Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Unique, AllowNull, Default,
    CreatedAt, UpdatedAt, HasMany,
} from 'sequelize-typescript';
import SysUser from './SysUser';

@Table({ tableName: 'sys_role', timestamps: true, createdAt: 'create_time', updatedAt: 'update_time' })
export default class SysRole extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id!: number;

    @Unique
    @AllowNull(false)
    @Column({ type: DataType.STRING(30), field: 'role_code' })
    roleCode!: string;

    @AllowNull(false)
    @Column({ type: DataType.STRING(20), field: 'role_name' })
    roleName!: string;

    @Column({ type: DataType.STRING(200), field: 'role_desc' })
    roleDesc?: string;

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

    @HasMany(() => SysUser)
    users!: SysUser[];
}
