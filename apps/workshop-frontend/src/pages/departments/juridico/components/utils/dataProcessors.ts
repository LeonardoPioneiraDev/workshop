// src/pages/departments/juridico/components/utils/dataProcessors.ts

export const processAllData = (multas, analytics, estatisticasPorSetor) => {
  return {
    resumoGeral: {
      totalMultas: multas.length,
      totalValor: multas.reduce((sum, m) => sum + (parseFloat(m.valorMulta) || 0), 0),
      totalPontos: multas.reduce((sum, m) => sum + (m.pontuacaoInfracao || 0), 0),
      agentesAtivos: new Set(multas.map(m => m.agenteCodigo).filter(Boolean)).size,
      veiculosUnicos: new Set(multas.map(m => m.prefixoVeic).filter(Boolean)).size
    },
    analytics,
    multasPorHorario: processMultasPorHorario(multas),
    multasPorDiaSemana: processMultasPorDiaSemana(multas),
    multasPorLocal: processMultasPorLocal(multas),
    multasPorSetor: processMultasPorSetor(multas, estatisticasPorSetor),
    evolucaoMensal: processEvolucaoMensal(multas),
    agentesRanking: processAgentesRanking(analytics?.topAgentes || [], multas),
    tiposInfracao: processTiposInfracao(multas),
    multasPorGravidade: processMultasPorGravidade(multas),
    statusMultas: processStatusMultas(multas),
    realMotivos: processRealMotivos(multas)
  };
};

export const processMultasPorHorario = (multas) => {
  const horarios = {};
  multas.forEach(multa => {
    if (multa.dataHoraMulta) {
      try {
        const hora = new Date(multa.dataHoraMulta).getHours();
        if (!isNaN(hora)) {
          horarios[hora] = (horarios[hora] || 0) + 1;
        }
      } catch (error) {
        // Ignorar datas inválidas
      }
    }
  });
  
  return Array.from({ length: 24 }, (_, i) => ({
    hora: i,
    horario: `${i.toString().padStart(2, '0')}h`,
    quantidade: horarios[i] || 0,
    percentual: multas.length > 0 ? ((horarios[i] || 0) / multas.length * 100).toFixed(1) : '0'
  })).filter(h => h.quantidade > 0);
};

export const processMultasPorDiaSemana = (multas) => {
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diasCount = {};
  
  multas.forEach(multa => {
    if (multa.dataHoraMulta) {
      try {
        const dia = new Date(multa.dataHoraMulta).getDay();
        if (!isNaN(dia)) {
          diasCount[dia] = (diasCount[dia] || 0) + 1;
        }
      } catch (error) {
        // Ignorar datas inválidas
      }
    }
  });
  
  return dias.map((dia, index) => ({
    dia,
    quantidade: diasCount[index] || 0,
    percentual: multas.length > 0 ? ((diasCount[index] || 0) / multas.length * 100).toFixed(1) : '0'
  }));
};

export const processMultasPorLocal = (multas) => {
  const locais = {};
  multas.forEach(multa => {
    if (multa.localMulta) {
      let local = multa.localMulta.trim();
      local = local.replace(/'/g, '').replace(/\s+/g, ' ');
      locais[local] = (locais[local] || 0) + 1;
    }
  });
  
  return Object.entries(locais)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15)
    .map(([local, quantidade]) => ({
      local: local.length > 25 ? local.substring(0, 22) + '...' : local,
      localCompleto: local,
      quantidade,
      percentual: multas.length > 0 ? ((quantidade / multas.length) * 100).toFixed(1) : '0'
    }));
};

export const processMultasPorSetor = (multas, estatisticasSetor) => {
  if (estatisticasSetor && estatisticasSetor.length > 0) {
    return estatisticasSetor.slice(0, 8).map(stat => ({
      setor: stat.setor.nome,
      codigo: stat.setor.codigo,
      quantidade: stat.totalMultas,
      valor: stat.valorTotal,
      percentual: stat.percentualDoTotal?.toFixed(1) || '0'
    }));
  }

  const setores = {};
  multas.forEach(multa => {
    let nomeSetor = 'Não Informado';
    
    if (multa.setorNaDataInfracao?.nomeGaragem) {
      nomeSetor = multa.setorNaDataInfracao.nomeGaragem;
    } else if (multa.setorAtual?.nomeGaragem) {
      nomeSetor = multa.setorAtual.nomeGaragem;
    }
    
    setores[nomeSetor] = (setores[nomeSetor] || 0) + 1;
  });
  
  return Object.entries(setores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([setor, quantidade]) => ({
      setor,
      quantidade,
      percentual: multas.length > 0 ? ((quantidade / multas.length) * 100).toFixed(1) : '0'
    }));
};

export const processEvolucaoMensal = (multas) => {
  const meses = {};
  const valores = {};
  
  multas.forEach(multa => {
    if (multa.dataHoraMulta) {
      try {
        const data = new Date(multa.dataHoraMulta);
        const mesAno = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
        meses[mesAno] = (meses[mesAno] || 0) + 1;
        valores[mesAno] = (valores[mesAno] || 0) + (parseFloat(multa.valorMulta) || 0);
      } catch (error) {
        // Ignorar datas inválidas
      }
    }
  });
  
  return Object.entries(meses)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .slice(-12)
    .map(([mesAno, quantidade]) => {
      const [ano, mes] = mesAno.split('-');
      const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return {
        mes: `${nomesMeses[parseInt(mes) - 1]}/${ano.slice(-2)}`,
        quantidade,
        valor: valores[mesAno] || 0,
        valorFormatado: (valores[mesAno] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      };
    });
};

export const processAgentesRanking = (topAgentes, multas) => {
  if (topAgentes && topAgentes.length > 0) {
    return topAgentes.slice(0, 12).map((agente, index) => {
      const multasAgente = multas.filter(m => m.agenteCodigo === agente.codigo);
      const locaisAgente = {};
      
      multasAgente.forEach(multa => {
        if (multa.localMulta) {
          const local = multa.localMulta.trim();
          locaisAgente[local] = (locaisAgente[local] || 0) + 1;
        }
      });
      
      const localPrincipal = Object.entries(locaisAgente)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Diversos locais';

      return {
        posicao: index + 1,
        codigo: agente.codigo,
        nome: agente.nome || `Agente ${agente.codigo}`,
        nomeCompleto: agente.nome || `Agente ${agente.codigo}`,
        total: agente.total,
        valor: agente.valor,
        media: agente.total > 0 ? agente.valor / agente.total : 0,
        localPrincipal: localPrincipal.length > 25 ? localPrincipal.substring(0, 22) + '...' : localPrincipal,
        localCompleto: localPrincipal
      };
    });
  }
  return [];
};

export const processTiposInfracao = (multas) => {
  const tipos = { 'SEMOB': 0, 'Trânsito': 0 };
  multas.forEach(multa => {
    if (multa.agenteCodigo) {
      tipos['SEMOB']++;
    } else {
      tipos['Trânsito']++;
    }
  });
  
  return Object.entries(tipos).map(([tipo, quantidade]) => ({
    tipo,
    quantidade,
    percentual: multas.length > 0 ? ((quantidade / multas.length) * 100).toFixed(1) : '0'
  }));
};

export const processMultasPorGravidade = (multas) => {
  const gravidades = {};
  multas.forEach(multa => {
    if (multa.grupoInfracao) {
      gravidades[multa.grupoInfracao] = (gravidades[multa.grupoInfracao] || 0) + 1;
    }
  });
  
  const ordemGravidade = ['LEVE', 'MEDIA', 'GRAVE', 'GRAVISSIMA'];
  return ordemGravidade
    .filter(g => gravidades[g])
    .map(gravidade => ({
      gravidade,
      quantidade: gravidades[gravidade],
      percentual: multas.length > 0 ? ((gravidades[gravidade] / multas.length) * 100).toFixed(1) : '0'
    }));
};

export const processStatusMultas = (multas) => {
  const status = { 'Pagas': 0, 'Pendentes': 0, 'Vencidas': 0, 'Em Recurso': 0 };
  
  multas.forEach(multa => {
    if (multa.dataPagtoMulta) {
      status['Pagas']++;
    } else if (multa.numeroRecursoMulta) {
      status['Em Recurso']++;
    } else if (multa.dataVectoMulta && new Date(multa.dataVectoMulta) < new Date()) {
      status['Vencidas']++;
    } else {
      status['Pendentes']++;
    }
  });
  
  return Object.entries(status).map(([tipo, quantidade]) => ({
    status: tipo,
    quantidade,
    percentual: multas.length > 0 ? ((quantidade / multas.length) * 100).toFixed(1) : '0'
  }));
};

export const processRealMotivos = (multas) => {
  const motivos = {};
  multas.forEach(multa => {
    if (multa.observacaoRealMotivo && multa.observacaoRealMotivo.trim()) {
      const categoria = multa.realMotivoCategoria || 'OUTROS';
      motivos[categoria] = (motivos[categoria] || 0) + 1;
    }
  });
  
  return Object.entries(motivos)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6)
    .map(([categoria, quantidade]) => ({
      categoria,
      quantidade,
      percentual: multas.length > 0 ? ((quantidade / multas.length) * 100).toFixed(1) : '0'
    }));
};