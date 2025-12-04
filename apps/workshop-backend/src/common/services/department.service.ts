// apps/backend/src/common/services/department.service.ts
import { Injectable } from '@nestjs/common';
import { 
  Department, 
  DepartmentLabels, 
  DepartmentDescriptions 
} from '../enums/department.enum';
import { 
  Position, 
  PositionLabels, 
  PositionHierarchy 
} from '../enums/position.enum';
import { 
  Role, 
  RoleLabels, 
  RolePermissions 
} from '../enums/role.enum';

@Injectable()
export class DepartmentService {
  
  /**
   * Retorna todos os departamentos disponíveis
   */
  getAllDepartments() {
    return Object.values(Department).map(dept => ({
      value: dept,
      label: DepartmentLabels[dept],
      description: DepartmentDescriptions[dept],
    }));
  }

  /**
   * Retorna todas as posições disponíveis
   */
  getAllPositions() {
    return Object.values(Position).map(pos => ({
      value: pos,
      label: PositionLabels[pos],
      hierarchy: PositionHierarchy[pos],
    })).sort((a, b) => b.hierarchy - a.hierarchy);
  }

  /**
   * Retorna todos os roles disponíveis
   */
  getAllRoles() {
    return Object.values(Role).map(role => ({
      value: role,
      label: RoleLabels[role],
      permissions: RolePermissions[role],
    }));
  }

  /**
   * Retorna posições compatíveis com um departamento
   */
  getPositionsForDepartment(department: Department): Position[] {
    const departmentPositions: Record<Department, Position[]> = {
      [Department.RECURSOS_HUMANOS]: [
        Position.DIRETOR,
        Position.GERENTE,
        Position.COORDENADOR,
        Position.ANALISTA,
        Position.ESPECIALISTA,
        Position.ASSISTENTE,
      ],
      [Department.DEPARTAMENTO_PESSOAL]: [
        Position.GERENTE,
        Position.COORDENADOR,
        Position.ANALISTA,
        Position.ASSISTENTE,
        Position.AUXILIAR,
      ],
      [Department.FINANCEIRO]: [
        Position.DIRETOR,
        Position.GERENTE,
        Position.COORDENADOR,
        Position.ANALISTA,
        Position.ESPECIALISTA,
        Position.ASSISTENTE,
      ],
      [Department.PLANEJAMENTO]: [
        Position.DIRETOR,
        Position.GERENTE,
        Position.COORDENADOR,
        Position.ANALISTA,
        Position.ESPECIALISTA,
      ],
      [Department.JURIDICO]: [
        Position.DIRETOR,
        Position.GERENTE,
        Position.ESPECIALISTA,
        Position.ANALISTA,
        Position.ASSISTENTE,
      ],
      [Department.CENTRO_CONTROLE_OPERACIONAL]: [
        Position.GERENTE,
        Position.COORDENADOR,
        Position.SUPERVISOR,
        Position.ANALISTA,
        Position.OPERADOR,
        Position.TECNICO,
      ],
      [Department.OPERACAO]: [
        Position.GERENTE,
        Position.COORDENADOR,
        Position.SUPERVISOR,
        Position.OPERADOR,
        Position.TECNICO,
        Position.AUXILIAR,
      ],
      [Department.MANUTENCAO]: [
        Position.GERENTE,
        Position.COORDENADOR,
        Position.SUPERVISOR,
        Position.TECNICO,
        Position.ESPECIALISTA,
        Position.AUXILIAR,
      ],
      [Department.FROTA]: [
        Position.GERENTE,
        Position.COORDENADOR,
        Position.SUPERVISOR,
        Position.ANALISTA,
        Position.TECNICO,
        Position.AUXILIAR,
      ],
    };

    return departmentPositions[department] || Object.values(Position);
  }

  /**
   * ✅ CORRIGIDO: Sugere um role baseado na posição
   */
  suggestRoleForPosition(position: Position): Role {
    const positionRoleMap: Record<Position, Role> = {
      [Position.ADMINISTRADOR_SISTEMA]: Role.ADMIN,
      [Position.DIRETOR]: Role.DIRETOR,
      [Position.GERENTE]: Role.GERENTE,
      [Position.COORDENADOR]: Role.COORDENADOR,
      [Position.SUPERVISOR]: Role.SUPERVISOR,
      [Position.ANALISTA]: Role.ANALISTA,
      [Position.ESPECIALISTA]: Role.ANALISTA,
      [Position.TECNICO]: Role.USUARIO,        // ✅ MUDANÇA: Role.USER → Role.USUARIO
      [Position.ASSISTENTE]: Role.USUARIO,     // ✅ MUDANÇA: Role.USER → Role.USUARIO
      [Position.AUXILIAR]: Role.USUARIO,       // ✅ MUDANÇA: Role.USER → Role.USUARIO
      [Position.OPERADOR]: Role.OPERADOR,
    };

    return positionRoleMap[position] || Role.USUARIO; // ✅ MUDANÇA: Role.USER → Role.USUARIO
  }

  /**
   * Valida se uma combinação departamento/posição é válida
   */
  isValidDepartmentPosition(department: Department, position: Position): boolean {
    const validPositions = this.getPositionsForDepartment(department);
    return validPositions.includes(position);
  }

  /**
   * Retorna estatísticas de usuários por departamento
   */
  getDepartmentStats(users: any[]) {
    const stats = {};
    
    Object.values(Department).forEach(dept => {
      const deptUsers = users.filter(user => user.department === dept);
      stats[dept] = {
        department: dept,
        label: DepartmentLabels[dept],
        totalUsers: deptUsers.length,
        activeUsers: deptUsers.filter(user => user.isActive).length,
        positions: this.getPositionStats(deptUsers),
      };
    });

    return stats;
  }

  /**
   * ✅ NOVA FUNÇÃO: Retorna sugestões de roles para um departamento
   */
  getSuggestedRolesForDepartment(department: Department): Role[] {
    const departmentRoles: Record<Department, Role[]> = {
      [Department.RECURSOS_HUMANOS]: [
        Role.DIRETOR,
        Role.GERENTE,
        Role.COORDENADOR,
        Role.ANALISTA,
        Role.USUARIO,
      ],
      [Department.DEPARTAMENTO_PESSOAL]: [
        Role.GERENTE,
        Role.COORDENADOR,
        Role.ANALISTA,
        Role.USUARIO,
      ],
      [Department.FINANCEIRO]: [
        Role.DIRETOR,
        Role.GERENTE,
        Role.COORDENADOR,
        Role.ANALISTA,
        Role.USUARIO,
      ],
      [Department.PLANEJAMENTO]: [
        Role.DIRETOR,
        Role.GERENTE,
        Role.COORDENADOR,
        Role.ANALISTA,
      ],
      [Department.JURIDICO]: [
        Role.DIRETOR,
        Role.GERENTE,
        Role.ENCARREGADO,
        Role.COORDENADOR,
        Role.SUPERVISOR,
        Role.ANALISTA,
        Role.USUARIO,
      ],
      [Department.CENTRO_CONTROLE_OPERACIONAL]: [
        Role.GERENTE,
        Role.COORDENADOR,
        Role.SUPERVISOR,
        Role.ANALISTA,
        Role.OPERADOR,
        Role.USUARIO,
      ],
      [Department.OPERACAO]: [
        Role.GERENTE,
        Role.ENCARREGADO,
        Role.COORDENADOR,
        Role.SUPERVISOR,
        Role.OPERADOR,
        Role.USUARIO,
      ],
      [Department.MANUTENCAO]: [
        Role.GERENTE,
        Role.COORDENADOR,
        Role.SUPERVISOR,
        Role.OPERADOR,
        Role.USUARIO,
      ],
      [Department.FROTA]: [
        Role.GERENTE,
        Role.ENCARREGADO,
        Role.COORDENADOR,
        Role.SUPERVISOR,
        Role.ANALISTA,
        Role.OPERADOR,
        Role.USUARIO,
      ],
    };

    return departmentRoles[department] || Object.values(Role);
  }

  /**
   * ✅ NOVA FUNÇÃO: Valida se um role é apropriado para um departamento
   */
  isValidDepartmentRole(department: Department, role: Role): boolean {
    const validRoles = this.getSuggestedRolesForDepartment(department);
    return validRoles.includes(role) || role === Role.ADMIN; // Admin sempre pode
  }

  /**
   * ✅ NOVA FUNÇÃO: Retorna a hierarquia de roles para um departamento
   */
  getDepartmentRoleHierarchy(department: Department): Array<{
    role: Role;
    label: string;
    level: number;
    isRecommended: boolean;
  }> {
    const suggestedRoles = this.getSuggestedRolesForDepartment(department);
    
    return Object.values(Role)
      .map(role => ({
        role,
        label: RoleLabels[role],
        level: this.getRoleLevel(role),
        isRecommended: suggestedRoles.includes(role),
      }))
      .sort((a, b) => b.level - a.level);
  }

  /**
   * ✅ NOVA FUNÇÃO: Obter nível do role (copiado do role.enum.ts para evitar dependência circular)
   */
  private getRoleLevel(role: Role): number {
    const niveis: Record<Role, number> = {
      [Role.ADMIN]: 100,
      [Role.DIRETOR]: 90,
      [Role.GERENTE]: 80,
      [Role.ENCARREGADO]: 75,
      [Role.COORDENADOR]: 70,
      [Role.SUPERVISOR]: 60,
      [Role.ANALISTA]: 50,
      [Role.OPERADOR]: 40,
      [Role.USUARIO]: 10,
    };
    return niveis[role] || 0;
  }

  /**
   * ✅ MELHORADA: Estatísticas de posições com mais detalhes
   */
  private getPositionStats(users: any[]) {
    const positions = {};
    
    users.forEach(user => {
      if (!positions[user.position]) {
        positions[user.position] = {
          count: 0,
          active: 0,
          inactive: 0,
          label: PositionLabels[user.position] || user.position,
          hierarchy: PositionHierarchy[user.position] || 0,
        };
      }
      
      positions[user.position].count++;
      
      if (user.isActive) {
        positions[user.position].active++;
      } else {
        positions[user.position].inactive++;
      }
    });

    return positions;
  }

  /**
   * ✅ NOVA FUNÇÃO: Obter combinações válidas de departamento/posição/role
   */
  getValidCombinations() {
    const combinations = [];
    
    Object.values(Department).forEach(department => {
      const positions = this.getPositionsForDepartment(department);
      const roles = this.getSuggestedRolesForDepartment(department);
      
      positions.forEach(position => {
        const suggestedRole = this.suggestRoleForPosition(position);
        
        combinations.push({
          department,
          departmentLabel: DepartmentLabels[department],
          position,
          positionLabel: PositionLabels[position],
          suggestedRole,
          suggestedRoleLabel: RoleLabels[suggestedRole],
          validRoles: roles,
          isOptimalCombination: roles.includes(suggestedRole),
        });
      });
    });

    return combinations;
  }

  /**
   * ✅ NOVA FUNÇÃO: Buscar usuários por critérios de departamento
   */
  searchUsersByCriteria(users: any[], criteria: {
    department?: Department;
    position?: Position;
    role?: Role;
    isActive?: boolean;
  }) {
    return users.filter(user => {
      if (criteria.department && user.department !== criteria.department) {
        return false;
      }
      
      if (criteria.position && user.position !== criteria.position) {
        return false;
      }
      
      if (criteria.role && user.role !== criteria.role) {
        return false;
      }
      
      if (criteria.isActive !== undefined && user.isActive !== criteria.isActive) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * ✅ NOVA FUNÇÃO: Obter recomendações para otimização organizacional
   */
  getOrganizationalRecommendations(users: any[]) {
    const recommendations = [];
    
    // Verificar usuários com combinações não ideais
    users.forEach(user => {
      if (!user.department || !user.position || !user.role) {
        recommendations.push({
          type: 'incomplete_profile',
          userId: user.id,
          username: user.username,
          message: 'Perfil incompleto: departamento, posição ou role não definidos',
          severity: 'high',
        });
        return;
      }

      // Verificar se a posição é válida para o departamento
      if (!this.isValidDepartmentPosition(user.department, user.position)) {
        recommendations.push({
          type: 'invalid_position',
          userId: user.id,
          username: user.username,
          message: `Posição ${user.position} não é comum no departamento ${user.department}`,
          severity: 'medium',
          suggestion: `Considere uma das posições: ${this.getPositionsForDepartment(user.department).join(', ')}`,
        });
      }

      // Verificar se o role é apropriado para o departamento
      if (!this.isValidDepartmentRole(user.department, user.role)) {
        recommendations.push({
          type: 'suboptimal_role',
          userId: user.id,
          username: user.username,
          message: `Role ${user.role} pode não ser ideal para o departamento ${user.department}`,
          severity: 'low',
          suggestion: `Roles recomendados: ${this.getSuggestedRolesForDepartment(user.department).join(', ')}`,
        });
      }

      // Verificar se o role corresponde à posição
      const suggestedRole = this.suggestRoleForPosition(user.position);
      if (user.role !== suggestedRole && this.getRoleLevel(user.role) < this.getRoleLevel(suggestedRole)) {
        recommendations.push({
          type: 'role_position_mismatch',
          userId: user.id,
          username: user.username,
          message: `Role ${user.role} pode ser inferior ao esperado para a posição ${user.position}`,
          severity: 'medium',
          suggestion: `Role sugerido: ${suggestedRole}`,
        });
      }
    });

    return recommendations;
  }
}