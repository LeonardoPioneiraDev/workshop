// apps/backend/src/common/enums/department.enum.ts
export enum Department {
  RECURSOS_HUMANOS = 'recursos-humanos',
  DEPARTAMENTO_PESSOAL = 'departamento-pessoal',
  FINANCEIRO = 'financeiro',
  PLANEJAMENTO = 'planejamento',
  JURIDICO = 'juridico',
  CENTRO_CONTROLE_OPERACIONAL = 'centro-controle-operacional',
  OPERACAO = 'operacao',
  MANUTENCAO = 'manutencao',
  FROTA = 'frota',
}

export const DepartmentLabels: Record<Department, string> = {
  [Department.RECURSOS_HUMANOS]: 'Recursos Humanos',
  [Department.DEPARTAMENTO_PESSOAL]: 'Departamento Pessoal',
  [Department.FINANCEIRO]: 'Financeiro',
  [Department.PLANEJAMENTO]: 'Planejamento',
  [Department.JURIDICO]: 'Jurídico',
  [Department.CENTRO_CONTROLE_OPERACIONAL]: 'Centro de Controle Operacional',
  [Department.OPERACAO]: 'Operação',
  [Department.MANUTENCAO]: 'Manutenção',
  [Department.FROTA]: 'Frota',
};

export const DepartmentDescriptions: Record<Department, string> = {
  [Department.RECURSOS_HUMANOS]: 'Gestão de pessoas, recrutamento e desenvolvimento',
  [Department.DEPARTAMENTO_PESSOAL]: 'Folha de pagamento, benefícios e documentação',
  [Department.FINANCEIRO]: 'Controle financeiro, contabilidade e faturamento',
  [Department.PLANEJAMENTO]: 'Planejamento estratégico e análise de dados',
  [Department.JURIDICO]: 'Questões legais, contratos e regulamentações',
  [Department.CENTRO_CONTROLE_OPERACIONAL]: 'Monitoramento e controle das operações',
  [Department.OPERACAO]: 'Operações de transporte e logística',
  [Department.MANUTENCAO]: 'Manutenção preventiva e corretiva da frota',
  [Department.FROTA]: 'Gestão e controle da frota de veículos',
};