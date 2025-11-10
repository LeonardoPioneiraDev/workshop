// apps/frontend/src/services/departments/legal/adapters.ts
export const fineAdapter = {
  normalize(backendFine: any): any {
    return {
      id: backendFine.id,
      numero_ait: backendFine.numero_ait,
      prefixo_veiculo: backendFine.prefixo_veiculo,
      placa_veiculo: backendFine.placa_veiculo,
      descricao_infracao: backendFine.descricao_infracao,
      gravidade_infracao: backendFine.gravidade_infracao,
      valor_multa: backendFine.valor_multa,
      status_multa: backendFine.status_multa,
      data_emissao: backendFine.data_emissao,
      data_vencimento: backendFine.data_vencimento,
      local_infracao: backendFine.local_infracao,
      nome_agente: backendFine.nome_agente,
      nome_garagem: backendFine.nome_garagem,
      
      // Aliases para compatibilidade com código existente
      codigoMulta: backendFine.id,
      numeroAIT: backendFine.numero_ait,
      dataEmissao: backendFine.data_emissao,
      dataVencimento: backendFine.data_vencimento,
      valorMulta: parseFloat(backendFine.valor_multa) || 0,
      statusMulta: backendFine.status_multa,
      gravidadeInfracao: backendFine.gravidade_infracao,
      prefixoVeiculo: backendFine.prefixo_veiculo,
      nomeAgente: backendFine.nome_agente,
      nomeGaragem: backendFine.nome_garagem,
      placaVeiculo: backendFine.placa_veiculo,
      localInfracao: backendFine.local_infracao,
      descricaoInfracao: backendFine.descricao_infracao,
    };
  },
  normalizeArray(backendFines: any[]): any[] {
    if (!Array.isArray(backendFines)) return [];
    return backendFines.map(this.normalize);
  }
};

export const processAdapter = {
  normalize(backendProcess: any): any {
    return {
      id: backendProcess.id,
      numeroProcesso: backendProcess.numeroProcesso,
      tipo: backendProcess.tipo,
      status: backendProcess.status,
      titulo: backendProcess.titulo,
      descricao: backendProcess.descricao,
      valorCausa: backendProcess.valorCausa,
      dataAbertura: backendProcess.dataAbertura,
      dataUltimaMovimentacao: backendProcess.dataUltimaMovimentacao,
      responsavel: backendProcess.responsavel,
      tribunal: backendProcess.tribunal,
      vara: backendProcess.vara,
      prioridade: backendProcess.prioridade,
      tags: backendProcess.tags,
      
      // Aliases para compatibilidade
      numeroSequencial: backendProcess.id,
      descricaoProcesso: backendProcess.descricao || backendProcess.titulo,
      statusProcesso: backendProcess.status,
      tipoProcesso: backendProcess.tipo,
      dataAberturaFormatada: backendProcess.dataAbertura ? 
        new Date(backendProcess.dataAbertura).toLocaleDateString('pt-BR') : '',
      responsavelAdvogado: backendProcess.responsavel,
    };
  },
  normalizeArray(backendProcesses: any[]): any[] {
    if (!Array.isArray(backendProcesses)) return [];
    return backendProcesses.map(this.normalize);
  }
};

export const contractAdapter = {
  normalize(backendContract: any): any {
    return {
      id: backendContract.id,
      numeroContrato: backendContract.numeroContrato,
      tipo: backendContract.tipo,
      status: backendContract.status,
      titulo: backendContract.titulo,
      descricao: backendContract.descricao,
      valorContrato: backendContract.valorContrato,
      dataInicio: backendContract.dataInicio,
      dataVencimento: backendContract.dataVencimento,
      dataAssinatura: backendContract.dataAssinatura,
      fornecedor: backendContract.fornecedor,
      responsavel: backendContract.responsavel,
      departamento: backendContract.departamento,
      renovacaoAutomatica: backendContract.renovacaoAutomatica,
      prazoRenovacao: backendContract.prazoRenovacao,
      observacoes: backendContract.observacoes,
      anexos: backendContract.anexos,
      
      // Aliases para compatibilidade
      codigoContrato: backendContract.numeroContrato,
      descricaoContrato: backendContract.descricao || backendContract.titulo,
      statusContrato: backendContract.status,
      dataInicioFormatada: backendContract.dataInicio ? 
        new Date(backendContract.dataInicio).toLocaleDateString('pt-BR') : '',
      dataVencimentoFormatada: backendContract.dataVencimento ? 
        new Date(backendContract.dataVencimento).toLocaleDateString('pt-BR') : '',
      valor: backendContract.valorContrato,
      valorTotal: backendContract.valorContrato,
      contratada: backendContract.fornecedor,
      objeto: backendContract.titulo || backendContract.descricao,
    };
  },
  normalizeArray(backendContracts: any[]): any[] {
    if (!Array.isArray(backendContracts)) return [];
    return backendContracts.map(this.normalize);
  }
};