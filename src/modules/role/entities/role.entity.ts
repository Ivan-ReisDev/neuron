import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Permission } from '../../permission/entities/permission.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Role extends BaseEntity {
  @Column({ unique: true, length: 50 })
  name: string;

  @Column({ length: 255 })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable({ name: 'role_permissions' })
  permissions: Permission[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
