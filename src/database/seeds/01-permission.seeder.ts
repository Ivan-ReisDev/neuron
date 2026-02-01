import { DataSource } from 'typeorm';
import { Permission } from '../../modules/permission/entities/permission.entity';
import { Resource } from '../../modules/permission/enums/resource.enum';
import { Action } from '../../modules/permission/enums/action.enum';

const PERMISSION_DESCRIPTIONS: Record<Resource, Record<Action, string>> = {
  [Resource.CONTACTS]: {
    [Action.CREATE]: 'Permite criar contatos',
    [Action.READ]: 'Permite visualizar contatos',
    [Action.UPDATE]: 'Permite atualizar contatos',
    [Action.DELETE]: 'Permite remover contatos',
  },
  [Resource.USERS]: {
    [Action.CREATE]: 'Permite criar usuários',
    [Action.READ]: 'Permite visualizar usuários',
    [Action.UPDATE]: 'Permite atualizar usuários',
    [Action.DELETE]: 'Permite remover usuários',
  },
  [Resource.ROLES]: {
    [Action.CREATE]: 'Permite criar roles',
    [Action.READ]: 'Permite visualizar roles',
    [Action.UPDATE]: 'Permite atualizar roles',
    [Action.DELETE]: 'Permite remover roles',
  },
  [Resource.PERMISSIONS]: {
    [Action.CREATE]: 'Permite criar permissões',
    [Action.READ]: 'Permite visualizar permissões',
    [Action.UPDATE]: 'Permite atualizar permissões',
    [Action.DELETE]: 'Permite remover permissões',
  },
};

export default class PermissionSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(Permission);

    const permissions: Partial<Permission>[] = [];

    for (const resource of Object.values(Resource)) {
      for (const action of Object.values(Action)) {
        permissions.push({
          resource,
          action,
          description: PERMISSION_DESCRIPTIONS[resource][action],
        });
      }
    }

    await repository.upsert(permissions, ['resource', 'action']);
  }
}
