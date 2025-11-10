import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface RelatorioSalvo {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  formato: string;
  status: 'processando' | 'concluido' | 'erro';
  criadoEm: string;
  ultimaExecucao?: string;
  agendamento: string;
  tamanho?: string;
  registros?: number;
  criadoPor: string;
  downloads: number;
  dadosRelatorio?: any;
  caminhoArquivo?: string;
}

class ReportPersistenceService {
  private storageKey = 'juridico_relatorios_salvos';

  // Carregar relatórios salvos do localStorage
  carregarRelatorios(): RelatorioSalvo[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      return [];
    }
  }

  // Salvar relatórios no localStorage
  salvarRelatorios(relatorios: RelatorioSalvo[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(relatorios));
    } catch (error) {
      console.error('Erro ao salvar relatórios:', error);
    }
  }

  // Adicionar novo relatório
  adicionarRelatorio(relatorio: Omit<RelatorioSalvo, 'id' | 'criadoEm' | 'downloads'>): RelatorioSalvo {
    const novoRelatorio: RelatorioSalvo = {
      ...relatorio,
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      criadoEm: new Date().toISOString(),
      downloads: 0
    };

    const relatorios = this.carregarRelatorios();
    relatorios.unshift(novoRelatorio);
    this.salvarRelatorios(relatorios);

    return novoRelatorio;
  }

  // Atualizar relatório existente
  atualizarRelatorio(id: string, updates: Partial<RelatorioSalvo>): RelatorioSalvo | null {
    const relatorios = this.carregarRelatorios();
    const index = relatorios.findIndex(r => r.id === id);
    
    if (index === -1) return null;

    relatorios[index] = { ...relatorios[index], ...updates };
    this.salvarRelatorios(relatorios);

    return relatorios[index];
  }

  // Incrementar downloads
  incrementarDownload(id: string): void {
    const relatorios = this.carregarRelatorios();
    const relatorio = relatorios.find(r => r.id === id);
    
    if (relatorio) {
      relatorio.downloads += 1;
      this.salvarRelatorios(relatorios);
    }
  }

  // Remover relatório
  removerRelatorio(id: string): boolean {
    const relatorios = this.carregarRelatorios();
    const filteredRelatorios = relatorios.filter(r => r.id !== id);
    
    if (filteredRelatorios.length !== relatorios.length) {
      this.salvarRelatorios(filteredRelatorios);
      return true;
    }
    
    return false;
  }

  // Buscar relatório por ID
  buscarRelatorio(id: string): RelatorioSalvo | null {
    const relatorios = this.carregarRelatorios();
    return relatorios.find(r => r.id === id) || null;
  }
}

export const reportPersistenceService = new ReportPersistenceService();