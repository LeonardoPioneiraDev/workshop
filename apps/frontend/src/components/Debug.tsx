// src/components/Debug.tsx
import React, { useState } from 'react';
import { apiClient as api } from '@/services/api/client';

export const DebugComponent: React.FC = () => {
  const [dia, setDia] = useState('2025-05-07');
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testarImportacao = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/cumprimentos/importar?dia=${dia}`);
      setResultado({
        tipo: 'Importação',
        status: response.status,
        tempoExecucao: response.data.tempoExecucao,
        total: response.data.total,
        primeiros3: response.data.dados?.slice(0, 3) || [],
        estrutura: Object.keys(response.data)
      });
    } catch (error) {
      setResultado({
        tipo: 'Erro na Importação',
        erro: error.message,
        detalhes: error.response?.data || 'Sem detalhes'
      });
    } finally {
      setLoading(false);
    }
  };

  const testarListagem = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/cumprimentos`);
      setResultado({
        tipo: 'Listagem',
        status: response.status,
        tempoExecucao: response.data.tempoExecucao,
        total: response.data.total,
        primeiros3: response.data.dados?.slice(0, 3) || [],
        estrutura: Object.keys(response.data)
      });
    } catch (error) {
      setResultado({
        tipo: 'Erro na Listagem',
        erro: error.message,
        detalhes: error.response?.data || 'Sem detalhes'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Ferramenta de Depuração</h2>
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          placeholder="Data (YYYY-MM-DD)" 
          value={dia} 
          onChange={e => setDia(e.target.value)} 
          style={{ padding: '8px', marginRight: '10px' }} 
        />
        <button 
          onClick={testarImportacao} 
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#1890ff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginRight: '10px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Carregando...' : 'Testar Importação'}
        </button>
        <button 
          onClick={testarListagem} 
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#52c41a', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Carregando...' : 'Testar Listagem'}
        </button>
      </div>
      
      {resultado && (
        <div>
          <hr style={{ margin: '20px 0' }} />
          <h3>{resultado.tipo}</h3>
          <pre style={{ 
            background: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '5px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {JSON.stringify(resultado, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};