// apps/backend/src/common/enums/position.enum.ts
export enum Position {
  ADMINISTRADOR_SISTEMA = 'administrador-sistema',
  DIRETOR = 'diretor',
  GERENTE = 'gerente',
  COORDENADOR = 'coordenador',
  SUPERVISOR = 'supervisor',
  ANALISTA = 'analista',
  ESPECIALISTA = 'especialista',
  TECNICO = 'tecnico',
  OPERADOR = 'operador',
  ASSISTENTE = 'assistente',
  AUXILIAR = 'auxiliar',
}

export const PositionLabels: Record<Position, string> = {
  [Position.ADMINISTRADOR_SISTEMA]: 'Administrador de Sistema',
  [Position.DIRETOR]: 'Diretor',
  [Position.GERENTE]: 'Gerente',
  [Position.COORDENADOR]: 'Coordenador',
  [Position.SUPERVISOR]: 'Supervisor',
  [Position.ANALISTA]: 'Analista',
  [Position.ESPECIALISTA]: 'Especialista',
  [Position.TECNICO]: 'Técnico',
  [Position.OPERADOR]: 'Operador',
  [Position.ASSISTENTE]: 'Assistente',
  [Position.AUXILIAR]: 'Auxiliar',
};

export const PositionHierarchy: Record<Position, number> = {
  [Position.ADMINISTRADOR_SISTEMA]: 100,
  [Position.DIRETOR]: 90,
  [Position.GERENTE]: 80,
  [Position.COORDENADOR]: 70,
  [Position.SUPERVISOR]: 60,
  [Position.ANALISTA]: 50,
  [Position.ESPECIALISTA]: 45,
  [Position.TECNICO]: 40,
  [Position.OPERADOR]: 30,
  [Position.ASSISTENTE]: 20,
  [Position.AUXILIAR]: 10,
};