import { MultaData } from '../types';

export class MultasService {
  static async fetchMultas(filters?: any): Promise<MultaData[]> {
    try {
      const response = await fetch('/api/legal/multas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar multas:', error);
      return [];
    }
  }

  static async getMultaById(id: string): Promise<MultaData | null> {
    try {
      const response = await fetch(`/api/legal/multas/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar multa:', error);
      return null;
    }
  }
}