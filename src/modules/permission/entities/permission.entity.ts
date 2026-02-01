import { Entity, Column, Unique } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Resource } from '../enums/resource.enum';
import { Action } from '../enums/action.enum';

@Entity()
@Unique(['resource', 'action'])
export class Permission extends BaseEntity {
  @Column({ type: 'enum', enum: Resource })
  resource: Resource;

  @Column({ type: 'enum', enum: Action })
  action: Action;

  @Column()
  description: string;
}
