// apps/backend/src/common/enums/role.enum.ts

// ✅ ENUM EM PORTUGUÊS ALINHADO COM O BANCO DE DADOS
export enum Role {
  ADMIN = 'admin',
  DIRETOR = 'director',        // ✅ Português no código, inglês no banco
  GERENTE = 'gerente',
  ENCARREGADO = 'encarregado',
  COORDENADOR = 'coordenador',
  SUPERVISOR = 'supervisor',
  ANALISTA = 'analista',
  OPERADOR = 'operator',       // ✅ Português no código, inglês no banco
  USUARIO = 'user',            // ✅ Português no código, inglês no banco
}

// ✅ RÓTULOS EM PORTUGUÊS
export const RoleLabels: Record<Role, string> = {
  [Role.ADMIN]: 'Administrador',
  [Role.DIRETOR]: 'Diretor',
  [Role.GERENTE]: 'Gerente',
  [Role.ENCARREGADO]: 'Encarregado',
  [Role.COORDENADOR]: 'Coordenador',
  [Role.SUPERVISOR]: 'Supervisor',
  [Role.ANALISTA]: 'Analista',
  [Role.OPERADOR]: 'Operador',
  [Role.USUARIO]: 'Usuário',
};

// ✅ PERMISSÕES ESPECÍFICAS PARA CADA ROLE
export const RolePermissions: Record<Role, string[]> = {
  [Role.ADMIN]: [
    'usuarios:ler', 'usuarios:escrever', 'usuarios:deletar', 'usuarios:gerenciar_roles', 'usuarios:gerenciar_senhas',
    'sistema:admin', 'sistema:configuracoes', 'sistema:health_check',
    'oracle:ler', 'oracle:escrever', 'oracle:gerenciar_conexoes',
    'relatorios:ler', 'relatorios:escrever', 'relatorios:gerar',
    'dashboard:completo', 'dashboard:configurar',
    'configuracoes:ler', 'configuracoes:escrever',
    'logs:ler', 'logs:limpar',
    'seguranca:admin', 'seguranca:gerenciar_bloqueios', 'seguranca:visualizar_eventos',
    'juridico:acesso_completo', 'frota:acesso_completo', 'operacao:acesso_completo', 'financeiro:acesso_completo',
    'planejamento:acesso_completo', 'analytics:acesso_completo', 'auditoria:acesso_completo',
  ],
  [Role.DIRETOR]: [
    'usuarios:ler', 'usuarios:escrever_limitado', 'usuarios:gerenciar_status',
    'oracle:ler', 'oracle:exportar',
    'relatorios:ler', 'relatorios:gerar',
    'dashboard:ler', 'dashboard:analytics',
    'analytics:ler', 'analytics:estrategico',
    'planejamento:ler', 'planejamento:visao_geral',
    'financeiro:ler', 'financeiro:visao_geral',
    'logs:ler_resumo',
    'juridico:ler_visao_geral', 'frota:ler_visao_geral', 'operacao:ler_visao_geral', 'financeiro:ler_visao_geral',
    'estrategico:ler', 'estrategico:planejamento',
  ],
  [Role.GERENTE]: [
    'usuarios:ler', 'usuarios:escrever_equipe', 'usuarios:gerenciar_senhas_equipe',
    'oracle:ler', 'oracle:consultar',
    'relatorios:ler', 'relatorios:departamento',
    'dashboard:ler', 'dashboard:equipe',
    'analytics:ler_departamento',
    'equipe:gerenciar', 'equipe:integracao', 'equipe:performance',
    'departamento:gerenciar_configuracoes', 'departamento:recursos',
    'juridico:gerenciar_solicitacoes', 'frota:gerenciar_solicitacoes', 'operacao:gerenciar_tarefas', 'financeiro:aprovar_despesas',
  ],
  [Role.ENCARREGADO]: [
    'usuarios:ler_equipe', 'usuarios:atualizar_info_pessoal',
    'oracle:ler_limitado', 'oracle:visualizar_dados',
    'relatorios:ler_basico', 'relatorios:metricas_equipe',
    'dashboard:ler', 'dashboard:visao_geral_equipe',
    'monitoramento:ler_operacoes', 'monitoramento:progresso_equipe',
    'equipe:visualizar', 'equipe:atribuir_tarefas', 'equipe:acompanhar_progresso',
    'operacoes:executar', 'operacoes:supervisionar',
    'juridico:visualizar_casos', 'frota:visualizar_status', 'operacao:acompanhar_pedidos',
  ],
  [Role.COORDENADOR]: [
    'usuarios:ler_equipe', 'usuarios:atualizar_info_pessoal',
    'oracle:ler_limitado',
    'relatorios:ler_basico',
    'dashboard:ler',
    'monitoramento:ler', 'monitoramento:alertas',
    'operacoes:ler', 'operacoes:planejar',
    'equipe:gerenciar_tarefas', 'equipe:revisar_trabalho',
    'juridico:coordenar_tarefas', 'frota:coordenar_logistica', 'operacao:coordenar_fluxo_trabalho',
  ],
  [Role.SUPERVISOR]: [
    'usuarios:ler_equipe',
    'oracle:ler_limitado',
    'monitoramento:ler', 'monitoramento:status',
    'operacoes:ler_status', 'operacoes:aprovar_basico',
    'equipe:visualizar', 'equipe:reportar_problemas',
    'juridico:visualizar_status', 'frota:visualizar_manutencao', 'operacao:visualizar_despacho',
  ],
  [Role.ANALISTA]: [
    'oracle:ler',
    'dashboard:ler',
    'relatorios:ler', 'relatorios:analisar_dados',
    'analytics:ler', 'analytics:ciencia_dados',
    'dados:extrair', 'dados:transformar',
    'juridico:analisar_documentos', 'frota:analisar_custos', 'operacao:analisar_eficiencia', 'financeiro:analisar_mercado',
  ],
  [Role.OPERADOR]: [
    'oracle:ler_limitado',
    'dashboard:ler_basico',
    'monitoramento:visualizar_basico',
    'operacoes:executar', 'operacoes:inserir_dados',
    'juridico:inserir_dados', 'frota:rastrear_veiculos', 'operacao:processar_pedidos',
  ],
  [Role.USUARIO]: [
    'dashboard:ler_pessoal',
    'perfil:ler', 'perfil:escrever', 'perfil:alterar_senha',
    'basico:acesso', 'basico:notificacoes',
  ],
};

// ✅ MAPEAMENTO DE DEPARTAMENTOS
export const DepartmentRoles: Record<string, Role[]> = {
  JURIDICO: [Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA, Role.ENCARREGADO],
  FROTA: [Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR, Role.ENCARREGADO],
  OPERACAO: [Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.OPERADOR, Role.ENCARREGADO],
  FINANCEIRO: [Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.ANALISTA],
  DIRETORIA: [Role.ADMIN, Role.DIRETOR],
  TECNOLOGIA: [Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.ANALISTA],
  RECURSOS_HUMANOS: [Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.ANALISTA, Role.COORDENADOR],
};

// ✅ TIPOS PARA DEPARTAMENTOS
export type DepartmentType = keyof typeof DepartmentRoles;

// ✅ FUNÇÕES AUXILIARES
export const temPermissao = (roleUsuario: Role, permissao: string): boolean => {
  return RolePermissions[roleUsuario]?.includes(permissao) || false;
};

export const podeAcessarDepartamento = (roleUsuario: Role, departamento: DepartmentType): boolean => {
  return (DepartmentRoles[departamento] as Role[])?.includes(roleUsuario) || roleUsuario === Role.ADMIN;
};

export const obterNivelRole = (role: Role): number => {
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
};

export const podeGerenciarRole = (roleGerente: Role, roleAlvo: Role): boolean => {
  return obterNivelRole(roleGerente) > obterNivelRole(roleAlvo);
};

// ✅ FUNÇÕES AUXILIARES ADICIONAIS

/**
 * 🔍 VERIFICAR SE UM ROLE PODE ACESSAR MÚLTIPLOS DEPARTAMENTOS
 */
export const podeAcessarMultiplosDepartamentos = (roleUsuario: Role, departamentos: DepartmentType[]): boolean => {
  return departamentos.every(dept => podeAcessarDepartamento(roleUsuario, dept));
};

/**
 * 📋 OBTER TODOS OS DEPARTAMENTOS QUE UM ROLE PODE ACESSAR
 */
export const obterDepartamentosAcessiveis = (roleUsuario: Role): DepartmentType[] => {
  return Object.keys(DepartmentRoles).filter(dept => 
    podeAcessarDepartamento(roleUsuario, dept as DepartmentType)
  ) as DepartmentType[];
};

/**
 * 🎯 VERIFICAR SE É UM ROLE DE GESTÃO
 */
export const eRoleGestao = (role: Role): boolean => {
  return [Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.ENCARREGADO, Role.COORDENADOR].includes(role);
};

/**
 * 🔧 VERIFICAR SE É UM ROLE OPERACIONAL
 */
export const eRoleOperacional = (role: Role): boolean => {
  return [Role.SUPERVISOR, Role.ANALISTA, Role.OPERADOR].includes(role);
};

/**
 * 📊 OBTER ROLES POR NÍVEL HIERÁRQUICO
 */
export const obterRolesPorNivel = (nivelMinimo: number = 0): Role[] => {
  return Object.values(Role).filter(role => obterNivelRole(role) >= nivelMinimo);
};

/**
 * 👥 OBTER ROLES SUBORDINADOS
 */
export const obterRolesSubordinados = (roleGerente: Role): Role[] => {
  const nivelGerente = obterNivelRole(roleGerente);
  return Object.values(Role).filter(role => obterNivelRole(role) < nivelGerente);
};

/**
 * 🏢 OBTER ROLES DE UM DEPARTAMENTO ESPECÍFICO
 */
export const obterRolesDepartamento = (departamento: DepartmentType): Role[] => {
  return DepartmentRoles[departamento] || [];
};

/**
 * ⚡ VERIFICAR PERMISSÕES MÚLTIPLAS
 */
export const temTodasPermissoes = (roleUsuario: Role, permissoes: string[]): boolean => {
  return permissoes.every(permissao => temPermissao(roleUsuario, permissao));
};

/**
 * 🔥 VERIFICAR SE TEM PELO MENOS UMA PERMISSÃO
 */
export const temAlgumaPermissao = (roleUsuario: Role, permissoes: string[]): boolean => {
  return permissoes.some(permissao => temPermissao(roleUsuario, permissao));
};

/**
 * 📈 OBTER ESTATÍSTICAS DE ROLES
 */
export const obterEstatisticasRoles = () => {
  const totalRoles = Object.keys(Role).length;
  const rolesGestao = Object.values(Role).filter(eRoleGestao).length;
  const rolesOperacionais = Object.values(Role).filter(eRoleOperacional).length;
  
  return {
    total: totalRoles,
    gestao: rolesGestao,
    operacionais: rolesOperacionais,
    departamentos: Object.keys(DepartmentRoles).length
  };
};

/**
 * 🎨 OBTER COR DO ROLE (PARA UI)
 */
export const obterCorRole = (role: Role): string => {
  const cores: Record<Role, string> = {
    [Role.ADMIN]: '#dc2626',      // red-600
    [Role.DIRETOR]: '#7c3aed',    // violet-600
    [Role.GERENTE]: '#2563eb',    // blue-600
    [Role.ENCARREGADO]: '#008b8b', // DarkCyan
    [Role.COORDENADOR]: '#059669', // emerald-600
    [Role.SUPERVISOR]: '#d97706', // amber-600
    [Role.ANALISTA]: '#7c2d12',   // orange-800
    [Role.OPERADOR]: '#374151',   // gray-700
    [Role.USUARIO]: '#6b7280',    // gray-500
  };
  return cores[role] || '#6b7280';
};

/**
 * 🏷️ OBTER BADGE DO ROLE (PARA UI)
 */
export const obterBadgeRole = (role: Role): { rotulo: string; cor: string; nivel: number } => {
  return {
    rotulo: RoleLabels[role],
    cor: obterCorRole(role),
    nivel: obterNivelRole(role)
  };
};

// ✅ CONSTANTES ÚTEIS EM PORTUGUÊS
export const ROLES_GESTAO: readonly Role[] = [
  Role.ADMIN, 
  Role.DIRETOR, 
  Role.GERENTE, 
  Role.ENCARREGADO,
  Role.COORDENADOR
];

export const ROLES_OPERACIONAIS: readonly Role[] = [
  Role.SUPERVISOR, 
  Role.ANALISTA, 
  Role.OPERADOR
];

export const TODOS_ROLES: readonly Role[] = [
  Role.ADMIN,
  Role.DIRETOR,
  Role.GERENTE,
  Role.ENCARREGADO,
  Role.COORDENADOR,
  Role.SUPERVISOR,
  Role.ANALISTA,
  Role.OPERADOR,
  Role.USUARIO
];

// ✅ CONSTANTES PARA DEPARTAMENTOS
export const NOMES_DEPARTAMENTOS: readonly string[] = [
  'JURIDICO',
  'FROTA', 
  'OPERACAO',
  'FINANCEIRO',
  'DIRETORIA',
  'TECNOLOGIA',
  'RECURSOS_HUMANOS'
];

// ✅ VALIDADORES
export const eRoleValido = (role: string): role is Role => {
  return Object.values(Role).includes(role as Role);
};

export const eDepartamentoValido = (departamento: string): departamento is DepartmentType => {
  return Object.keys(DepartmentRoles).includes(departamento);
};

// ✅ FUNÇÕES UTILITÁRIAS PARA ARRAYS DE ROLES
export const obterTodosRoles = (): Role[] => {
  return Object.values(Role);
};

export const obterRolesGestao = (): Role[] => {
  return [...ROLES_GESTAO];
};

export const obterRolesOperacionais = (): Role[] => {
  return [...ROLES_OPERACIONAIS];
};

// ✅ FUNÇÃO PARA OBTER ROLES COMO ARRAY TIPADO
export const obterArrayRoles = (): Role[] => {
  return [
    Role.ADMIN,
    Role.DIRETOR,
    Role.GERENTE,
    Role.ENCARREGADO,
    Role.COORDENADOR,
    Role.SUPERVISOR,
    Role.ANALISTA,
    Role.OPERADOR,
    Role.USUARIO
  ];
};

// ✅ MAPA DE ROLES PARA FÁCIL ACESSO
export const MAPA_ROLES = {
  ADMIN: Role.ADMIN,
  DIRETOR: Role.DIRETOR,
  GERENTE: Role.GERENTE,
  ENCARREGADO: Role.ENCARREGADO,
  COORDENADOR: Role.COORDENADOR,
  SUPERVISOR: Role.SUPERVISOR,
  ANALISTA: Role.ANALISTA,
  OPERADOR: Role.OPERADOR,
  USUARIO: Role.USUARIO
} as const;

// ✅ FUNÇÃO PARA VERIFICAR SE UM VALOR É UM ROLE VÁLIDO
export const validarRole = (valor: unknown): Role => {
  if (typeof valor === 'string' && eRoleValido(valor)) {
    return valor;
  }
  throw new Error(`Role inválido: ${valor}`);
};

// ✅ FUNÇÃO PARA OBTER ROLE PADRÃO
export const obterRolePadrao = (): Role => {
  return Role.USUARIO;
};

// ✅ FUNÇÕES UTILITÁRIAS ADICIONAIS

/**
 * 🔄 MIGRAÇÃO: Converter roles antigos para novos
 */
export const migrarRole = (roleAntigo: string): Role => {
  const migracao: Record<string, Role> = {
    'director': Role.DIRETOR,
    'operator': Role.OPERADOR,
    'admin': Role.ADMIN,
    'user': Role.USUARIO,
    'gerente': Role.GERENTE,
    'encarregado': Role.ENCARREGADO,
    'coordenador': Role.COORDENADOR,
    'supervisor': Role.SUPERVISOR,
    'analista': Role.ANALISTA,
  };
  
  return migracao[roleAntigo] || Role.USUARIO;
};

/**
 * 🔍 BUSCAR ROLE POR RÓTULO
 */
export const encontrarRolePorRotulo = (rotulo: string): Role | undefined => {
  return Object.entries(RoleLabels).find(([_, roleRotulo]) => 
    roleRotulo.toLowerCase() === rotulo.toLowerCase()
  )?.[0] as Role;
};

/**
 * 📊 OBTER HIERARQUIA COMPLETA
 */
export const obterHierarquiaCompleta = (): Array<{ role: Role; rotulo: string; nivel: number; cor: string }> => {
  return Object.values(Role)
    .map(role => ({
      role,
      rotulo: RoleLabels[role],
      nivel: obterNivelRole(role),
      cor: obterCorRole(role)
    }))
    .sort((a, b) => b.nivel - a.nivel);
};

/**
 * 🎯 VERIFICAR SE PODE PROMOVER/REBAIXAR
 */
export const podePromoverRole = (roleAtual: Role, roleAlvo: Role): boolean => {
  return obterNivelRole(roleAlvo) > obterNivelRole(roleAtual);
};

export const podeRebaixarRole = (roleAtual: Role, roleAlvo: Role): boolean => {
  return obterNivelRole(roleAlvo) < obterNivelRole(roleAtual);
};

/**
 * 🏆 OBTER PRÓXIMO ROLE NA HIERARQUIA
 */
export const obterProximoRoleAcima = (roleAtual: Role): Role | null => {
  const nivelAtual = obterNivelRole(roleAtual);
  const rolesAcima = Object.values(Role)
    .filter(role => obterNivelRole(role) > nivelAtual)
    .sort((a, b) => obterNivelRole(a) - obterNivelRole(b));
  
  return rolesAcima[0] || null;
};

export const obterProximoRoleAbaixo = (roleAtual: Role): Role | null => {
  const nivelAtual = obterNivelRole(roleAtual);
  const rolesAbaixo = Object.values(Role)
    .filter(role => obterNivelRole(role) < nivelAtual)
    .sort((a, b) => obterNivelRole(b) - obterNivelRole(a));
  
  return rolesAbaixo[0] || null;
};

/**
 * 📋 OBTER PERMISSÕES ÚNICAS DE UM ROLE
 */
export const obterPermissoesUnicas = (role: Role): string[] => {
  const permissoesRole = RolePermissions[role] || [];
  const rolesInferiores = Object.values(Role).filter(r => obterNivelRole(r) < obterNivelRole(role));
  const permissoesInferiores = new Set(
    rolesInferiores.flatMap(r => RolePermissions[r] || [])
  );
  
  return permissoesRole.filter(permissao => !permissoesInferiores.has(permissao));
};

/**
 * 🔐 VERIFICAR SE ROLE TEM ACESSO ADMINISTRATIVO
 */
export const temAcessoAdmin = (role: Role): boolean => {
  return temPermissao(role, 'sistema:admin');
};

/**
 * 👑 VERIFICAR SE É ROLE EXECUTIVO
 */
export const eRoleExecutivo = (role: Role): boolean => {
  return [Role.ADMIN, Role.DIRETOR].includes(role);
};

/**
 * 🎖️ VERIFICAR SE É ROLE DE LIDERANÇA
 */
export const eRoleLideranca = (role: Role): boolean => {
  return [Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.ENCARREGADO].includes(role);
};

// ✅ COMPATIBILIDADE COM VERSÕES ANTIGAS (ALIASES)
export const hasPermission = temPermissao;
export const canAccessDepartment = podeAcessarDepartamento;
export const getRoleLevel = obterNivelRole;
export const canManageRole = podeGerenciarRole;
export const isManagementRole = eRoleGestao;
export const isOperationalRole = eRoleOperacional;
export const getRoleColor = obterCorRole;
export const getRoleBadge = obterBadgeRole;
export const isValidRole = eRoleValido;
export const assertRole = validarRole;
export const getDefaultRole = obterRolePadrao;
export const getAllRoles = obterTodosRoles;
export const getManagementRoles = obterRolesGestao;
export const getOperationalRoles = obterRolesOperacionais;
export const getRolesArray = obterArrayRoles;

// ✅ CONSTANTES DE COMPATIBILIDADE
export const MANAGEMENT_ROLES = ROLES_GESTAO;
export const OPERATIONAL_ROLES = ROLES_OPERACIONAIS;
export const ALL_ROLES = TODOS_ROLES;
export const DEPARTMENT_NAMES = NOMES_DEPARTAMENTOS;
export const ROLE_MAP = MAPA_ROLES;