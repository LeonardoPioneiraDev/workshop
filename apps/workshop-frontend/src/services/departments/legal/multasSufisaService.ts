// src/services/departments/legal/multasSufisaService.ts
import { api, getBaseUrl } from '@/services/api/client';

export interface MultaSufisa {
  numeroAiMulta: string;
  prefixoVeic: string;
  agenteCodigo: string;
  agenteDescricao?: string;
  dataHoraMulta: string;
  dataEmissaoMulta?: string;
  localMulta?: string;
  descricaoInfra?: string;
  codigoInfracao?: string;
  valorMulta: number;
  pontuacaoInfracao?: number;
  grupoInfracao?: string;
  cidadeMulta?: string;
  placaVeiculo?: string;
  categoriaVeiculo?: string;
  dataVectoMulta?: string;
  dataPagtoMulta?: string;
  valorPago?: number;
  condicaoRecursoMulta?: string;
  setorAtual?: string;
  setorPrincipalLinha?: string;
  codigoLinha?: string;
  nomeLinha?: string;
}

export interface MultasSufisaFilters {
  ano?: string;
  mes?: string;
  cidade?: string;
  agenteCodigo?: string;
  dataInicio?: string;
  dataFim?: string;
  numeroMulta?: string;
  prefixoVeiculo?: string;
  localMulta?: string;
  descricaoInfra?: string;
  codigoInfracao?: string;
  linha?: string;
  setor?: string;
  classificacao?: string;
  valorMin?: string;
  valorMax?: string;
}

export interface MultasSufisaResponse {
  success: boolean;
  data: MultaSufisa[];
  message?: string;
  total?: number;
}

export interface SufisaStats {
  totalMultas: number;
  totalValor: number;
  agentesUnicos: number;
  veiculosUnicos: number;
  locaisUnicos: number;
  valorMedio: number;
  multasPorMes: Record<string, number>;
  multasPorCidade: Record<string, number>;
  multasPorAgente: Record<string, { quantidade: number; valor: number; descricao: string }>;
}

class MultasSufisaService {
  // Função para identificar se é multa SUFISA (mesmo critério do SEMOB)
  private isMultaSufisa(multa: any): boolean {
    const temAgente = multa.agenteCodigo && multa.agenteCodigo.trim() !== '';
    const temPontos = multa.pontuacaoInfracao && multa.pontuacaoInfracao > 0;
    const temGrupo = multa.grupoInfracao && multa.grupoInfracao.trim() !== '';

    // Se tem agente E não tem pontos E não tem grupo, é SUFISA
    if (temAgente && !temPontos && !temGrupo) {
      return true;
    }

    // Se tem agente mas também tem pontos/grupo, é trânsito
    if (temAgente && (temPontos || temGrupo)) {
      return false;
    }

    // Default: se tem agente, considera SUFISA
    return temAgente;
  }

  async buscarMultasSufisa(filters: MultasSufisaFilters = {}): Promise<MultasSufisaResponse> {
    try {
      // Chamada à rota protegida do backend usando GET com force=true
      let base = getBaseUrl();
      if (base.startsWith('http:') && !base.startsWith('http://')) base = 'http://' + base.slice(5);
      if (base.startsWith('https:') && !base.startsWith('https://')) base = 'https://' + base.slice(6);
      if (base.startsWith('http:/') && !base.startsWith('http://')) base = base.replace(/^http:\//, 'http://');
      if (base.startsWith('https:/') && !base.startsWith('https://')) base = base.replace(/^https:\//, 'https://');
      const absoluteUrl = new URL('/juridico/semob-fines', /\/$/.test(base) ? base : `${base}/`).toString();

      // Normalizar ano/mês para envio ao backend
      const normalize = (s?: string) => {
        if (!s) return '';
        try { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch { return s; }
      };
      const mesParamMap: Record<string, string> = {
        Janeiro: '01', Fevereiro: '02', Marco: '03', Abril: '04', Maio: '05', Junho: '06',
        Julho: '07', Agosto: '08', Setembro: '09', Outubro: '10', Novembro: '11', Dezembro: '12',
      };
      const mesParam = (() => {
        const raw = (filters.mes || '').toString();
        if (!raw || raw.toLowerCase() === 'todos') return undefined;
        if (/^\d{1,2}$/.test(raw)) return String(parseInt(raw, 10));
        const norm = normalize(raw);
        const key = norm.charAt(0).toUpperCase() + norm.slice(1).toLowerCase();
        const mm = mesParamMap[key];
        return mm ? String(parseInt(mm, 10)) : undefined;
      })();
      const anoParam = (() => {
        const raw = (filters.ano || '').toString();
        return raw && raw.toLowerCase() !== 'todos' ? raw : undefined;
      })();

      const params: any = {
        agenteCodigo: filters.agenteCodigo || undefined,
        prefixoVeiculo: filters.prefixoVeiculo || undefined,
        cidade: filters.cidade || undefined,
        localMulta: filters.localMulta || undefined,
        descricaoInfra: (filters as any).descricaoInfra || undefined,
        codigoInfracao: (filters as any).codigoInfracao || undefined,
        dataInicio: filters.dataInicio || undefined,
        dataFim: filters.dataFim || undefined,
        codigoLinha: (filters as any).linha || undefined,
        setorPrincipalLinha: (filters as any).setor || undefined,
        ano: anoParam,
        mes: mesParam,
        classificacao: (filters as any).classificacao || undefined,
      };
      try { console.log('[LEGAL][SUFISA][REQ]', { base, endpoint: absoluteUrl, params }); } catch {}
      const apiResponse: any = await api.get<any>(absoluteUrl, params);

      const rawList: any[] = Array.isArray(apiResponse)
        ? apiResponse
        : (Array.isArray(apiResponse?.data) ? apiResponse.data : []);
      try { console.log('[LEGAL][SUFISA][RESP]', { rawType: Array.isArray(apiResponse) ? 'array' : typeof apiResponse, rawLength: rawList.length }); } catch {}

      // Mapear do modelo Multa (backend) para MultaSufisa
      let mapped: MultaSufisa[] = rawList.map((m: any) => ({
        numeroAiMulta: m.codigoMulta ?? m.numeroAiMulta ?? m.codigo_multa,
        prefixoVeic: m.prefixoVeiculo ?? m.prefixo_veic ?? m.prefixoVeic,
        agenteCodigo: String(m.codigoAgente ?? m.agenteCodigo ?? ''),
        agenteDescricao: m.descricaoAgente ?? m.agenteDescricao,
        // Preferir dataHoraMulta; se ausente, usar dataEmissaoMulta; por fim, dataEmissao
        dataHoraMulta: m.dataHoraMulta ?? m.dataEmissaoMulta ?? m.dataEmissao,
        dataEmissaoMulta: m.dataEmissaoMulta ?? m.dataEmissao ?? m.dataHoraMulta,
        localMulta: m.localInfracao ?? m.localMulta,
        descricaoInfra: m.descricaoInfracao ?? m.descricaoInfra,
        codigoInfracao: String(m.codigoInfracao ?? m.codigo_infracao ?? ''),
        valorMulta: Number(m.valorMulta ?? 0),
        pontuacaoInfracao: Number(m.pontuacaoInfracao ?? 0),
        grupoInfracao: m.grupoInfracao,
        cidadeMulta: m.cidadeMulta,
        placaVeiculo: m.placaVeiculo ?? m.placa_veiculo,
        setorPrincipalLinha: m.setorPrincipalLinha ?? m.setor_principal_linha,
        codigoLinha: m.codigoLinha ?? m.codigolinha,
        nomeLinha: m.nomeLinha ?? m.nomelinha,
      }));
      try { console.log('[LEGAL][SUFISA][MAP]', { mapped: mapped.length }); } catch {}

      // Filtrar apenas multas SUFISA
      let multasSufisa = mapped.filter(this.isMultaSufisa);
      try { console.log('[LEGAL][SUFISA][FILTER] after isSufisa:', multasSufisa.length); } catch {}

      // Normalizar filtros básicos (mes pode vir como nome ou número)
      const mesMap: Record<string, string> = {
        Janeiro: '01', Fevereiro: '02', Março: '03', Abril: '04', Maio: '05', Junho: '06',
        Julho: '07', Agosto: '08', Setembro: '09', Outubro: '10', Novembro: '11', Dezembro: '12',
        'Marco': '03', // casos com encoding antigo
      };
      const mesSanitizado = (() => {
        const raw = (filters.mes || '').toString();
        if (!raw || raw.toLowerCase() === 'todos') return undefined;
        if (/^\d{1,2}$/.test(raw)) return raw.padStart(2, '0');
        const tryNormalize = (s: string) => {
          try {
            return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          } catch {
            return s;
          }
        };
        const normalized = tryNormalize(raw);
        const mapNormalized: Record<string, string> = {
          Janeiro: '01', Fevereiro: '02', Marco: '03', Abril: '04', Maio: '05', Junho: '06',
          Julho: '07', Agosto: '08', Setembro: '09', Outubro: '10', Novembro: '11', Dezembro: '12',
        };
        return mesMap[raw] || mapNormalized[tryNormalize(raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase())] || undefined;
      })();
      const anoSanitizado = (() => {
        const raw = (filters.ano || '').toString();
        return raw && raw.toLowerCase() !== 'todos' ? raw : undefined;
      })();
      const cidadeSanitizada = (() => {
        const raw = (filters.cidade || '').toString();
        return raw && raw.toLowerCase() !== 'todos' ? raw : undefined;
      })();

      // Aplicar filtros localmente
      if (filters.dataInicio) {
        const dataInicio = new Date(filters.dataInicio);
        multasSufisa = multasSufisa.filter(m => new Date(m.dataHoraMulta) >= dataInicio);
        try { console.log('[LEGAL][SUFISA][FILTER] after dataInicio:', multasSufisa.length, filters.dataInicio); } catch {}
      }

      if (filters.dataFim) {
        const dataFim = new Date(filters.dataFim);
        dataFim.setHours(23, 59, 59, 999);
        multasSufisa = multasSufisa.filter(m => new Date(m.dataHoraMulta) <= dataFim);
        try { console.log('[LEGAL][SUFISA][FILTER] after dataFim:', multasSufisa.length, filters.dataFim); } catch {}
      }

      if (anoSanitizado) {
        multasSufisa = multasSufisa.filter(m =>
          new Date(m.dataHoraMulta).getFullYear().toString() === anoSanitizado
        );
        try { console.log('[LEGAL][SUFISA][FILTER] after ano:', multasSufisa.length, anoSanitizado); } catch {}
      }

      if (mesSanitizado) {
        multasSufisa = multasSufisa.filter(m =>
          (new Date(m.dataHoraMulta).getMonth() + 1).toString().padStart(2, '0') === mesSanitizado
        );
        try { console.log('[LEGAL][SUFISA][FILTER] after mes:', multasSufisa.length, mesSanitizado); } catch {}
      }

      if (cidadeSanitizada) {
        const norm = (s?: string) => {
          if (!s) return '';
          try { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); } catch { return s.toUpperCase(); }
        };
        const alvo = norm(cidadeSanitizada);
        multasSufisa = multasSufisa.filter(m => norm(m.cidadeMulta) === alvo || norm(m.setorPrincipalLinha) === alvo || norm(m.localMulta).includes(alvo));
        try { console.log('[LEGAL][SUFISA][FILTER] after cidade (normalized EQ):', multasSufisa.length, cidadeSanitizada); } catch {}
      }

      if (filters.valorMin) {
        multasSufisa = multasSufisa.filter(m =>
          parseFloat(String(m.valorMulta || 0)) >= parseFloat(filters.valorMin!)
        );
        try { console.log('[LEGAL][SUFISA][FILTER] after valorMin:', multasSufisa.length, filters.valorMin); } catch {}
      }

      if (filters.valorMax) {
        multasSufisa = multasSufisa.filter(m =>
          parseFloat(String(m.valorMulta || 0)) <= parseFloat(filters.valorMax!)
        );
        try { console.log('[LEGAL][SUFISA][FILTER] after valorMax:', multasSufisa.length, filters.valorMax); } catch {}
      }
      try { console.log('[LEGAL][SUFISA][FILTER] final count:', multasSufisa.length); } catch {}
      return {
        success: true,
        data: multasSufisa,
        total: multasSufisa.length
      };

    } catch (error: any) {
      console.error('Erro no serviço de multas SUFISA:', error);

      // Se for erro 404, retornar array vazio ao invés de lançar erro
      if (error?.response?.status === 404) {
        console.warn('⚠️ Endpoint não encontrado. Retornando dados vazios.');
        console.warn('💡 Dica: Reinicie o backend para registrar as rotas do JuridicoController');
        return {
          success: false,
          data: [],
          total: 0,
          message: 'Endpoint não disponível. Por favor, reinicie o backend.'
        };
      }

      throw error;
    }
  }

  async obterEstatisticasSufisa(filters: MultasSufisaFilters = {}): Promise<SufisaStats> {
    try {
      const response = await this.buscarMultasSufisa(filters);
      const multas = response.data;

      const totalValor = multas.reduce((sum, multa) => sum + parseFloat(String(multa.valorMulta || 0)), 0);
      const agentesUnicos = new Set(multas.map(m => m.agenteCodigo)).size;
      const veiculosUnicos = new Set(multas.map(m => m.prefixoVeic)).size;
      const locaisUnicos = new Set(multas.map(m => m.localMulta)).size;

      // Multas por mês
      const multasPorMes: Record<string, number> = {};
      multas.forEach(multa => {
        const data = new Date(multa.dataHoraMulta);
        const mesAno = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
        multasPorMes[mesAno] = (multasPorMes[mesAno] || 0) + 1;
      });

      // Multas por cidade
      const multasPorCidade: Record<string, number> = {};
      multas.forEach(multa => {
        const cidade = multa.cidadeMulta || 'Não Informado';
        multasPorCidade[cidade] = (multasPorCidade[cidade] || 0) + 1;
      });

      // Multas por agente
      const multasPorAgente: Record<string, { quantidade: number; valor: number; descricao: string }> = {};
      multas.forEach(multa => {
        const agente = multa.agenteCodigo || 'Não Informado';
        if (!multasPorAgente[agente]) {
          multasPorAgente[agente] = {
            quantidade: 0,
            valor: 0,
            descricao: multa.agenteDescricao || 'Sem descrição'
          };
        }
        multasPorAgente[agente].quantidade += 1;
        multasPorAgente[agente].valor += parseFloat(String(multa.valorMulta || 0));
      });

      return {
        totalMultas: multas.length,
        totalValor,
        agentesUnicos,
        veiculosUnicos,
        locaisUnicos,
        valorMedio: multas.length > 0 ? totalValor / multas.length : 0,
        multasPorMes,
        multasPorCidade,
        multasPorAgente
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas SUFISA:', error);
      throw error;
    }
  }

  async buscarAgentesSufisa(): Promise<Array<{ codigo: string; descricao: string; total: number; valorTotal: number }>> {
    try {
      const response = await this.buscarMultasSufisa();
      const multas = response.data;

      const agentesMap: Record<string, { codigo: string; descricao: string; total: number; valorTotal: number }> = {};

      multas.forEach(multa => {
        const codigo = multa.agenteCodigo || 'Não Informado';
        if (!agentesMap[codigo]) {
          agentesMap[codigo] = {
            codigo,
            descricao: multa.agenteDescricao || 'Sem descrição',
            total: 0,
            valorTotal: 0
          };
        }
        agentesMap[codigo].total += 1;
        agentesMap[codigo].valorTotal += parseFloat(String(multa.valorMulta || 0));
      });

      return Object.values(agentesMap).sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Erro ao buscar agentes SUFISA:', error);
      throw error;
    }
  }

  async exportarDadosSufisa(filters: MultasSufisaFilters = {}, formato: 'excel' | 'csv' | 'pdf' = 'excel'): Promise<Blob> {
    try {
      const response = await this.buscarMultasSufisa(filters);
      const multas = response.data;

      if (formato === 'excel') {
        // Implementar exportação Excel específica para SUFISA
        const XLSX = await import('xlsx');

        const dadosExcel = multas.map(multa => ({
          'Número da Multa': multa.numeroAiMulta,
          'Prefixo do Veículo': multa.prefixoVeic,
          'Agente SUFISA': multa.agenteCodigo,
          'Descrição do Agente': multa.agenteDescricao || 'Não informado',
          'Data/Hora da Infração': new Date(multa.dataHoraMulta).toLocaleString('pt-BR'),
          'Local da Multa': multa.localMulta || 'Não informado',
          'Descrição da Infração': multa.descricaoInfra || 'Não informado',
          'Código da Infração': multa.codigoInfracao || 'Não informado',
          'Valor da Multa (R$)': parseFloat(String(multa.valorMulta || 0)),
          'Cidade': multa.cidadeMulta || 'Não informado',
          'Status': multa.dataPagtoMulta ? 'Pago' : 'Pendente',
          'Tipo': 'Multa SUFISA'
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Multas SUFISA');

        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      }

      throw new Error(`Formato ${formato} não implementado`);
    } catch (error) {
      console.error('Erro ao exportar dados SUFISA:', error);
      throw error;
    }
  }
}

export const multasSufisaService = new MultasSufisaService();
export default multasSufisaService;





