# 🔧 Módulo de Manutenção - API Documentation

## 📋 Visão Geral

O módulo de Manutenção gerencia Ordens de Serviço (OS) dos veículos, com sincronização automática do Oracle para PostgreSQL.

## 🚀 Endpoints

### 1. **GET** `/departamentos/manutencao/os-data`

Busca Ordens de Serviço com sincronização automática.

#### **Comportamento:**
1. Verifica se há dados sincronizados hoje
2. Se não houver → Busca do Oracle e salva no PostgreSQL
3. Se houver → Retorna dados locais (mais rápido)
4. Aplica todos os filtros solicitados
5. Retorna com estatísticas

---

## 🔍 Filtros Disponíveis

### **Filtros de Data**

| Parâmetro | Tipo | Formato | Descrição | Exemplo |
|-----------|------|---------|-----------|---------|
| `startDate` | string | YYYY-MM-DD | Data inicial | `2025-07-01` |
| `endDate` | string | YYYY-MM-DD | Data final | `2025-07-31` |
| `data_inicio` | string | YYYY-MM-DD | Data inicial (alias) | `2025-07-01` |
| `data_fim` | string | YYYY-MM-DD | Data final (alias) | `2025-07-31` |

### **Filtros de Localização**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `setor_codigo` | number | Código do setor/garagem | `31` |
| `setor` | string | Nome do setor (busca parcial) | `PARANOÁ` |
| `garagem` | string | Nome da garagem (busca parcial) | `SANTA MARIA` |
| `garagens` | string | Códigos separados por vírgula | `31,124,239,240` |

**Garagens disponíveis:**
- `31` - PARANOÁ
- `124` - SANTA MARIA
- `239` - SÃO SEBASTIÃO
- `240` - GAMA

### **Filtros de Veículo**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `prefixo` | string | Prefixo do veículo (busca parcial) | `10` |
| `placa` | string | Placa do veículo (busca parcial) | `ABC1234` |

### **Filtros de OS**

| Parâmetro | Tipo | Descrição | Valores | Exemplo |
|-----------|------|-----------|---------|---------|
| `numeroOS` | string | Número da OS (busca parcial) | - | `12345` |
| `numero_os` | string | Número da OS - alias | - | `12345` |
| `tipoOS` | string | Tipo de OS | `C`, `P` | `C` |
| `condicaoOS` | string | Condição da OS | `A`, `FC` | `A` |
| `tipoProblema` | string | Tipo de problema | `QUEBRA`, `DEFEITO` | `QUEBRA` |

**Valores de tipoOS:**
- `C` - Corretiva
- `P` - Preventiva

**Valores de condicaoOS:**
- `A` - Aberta
- `FC` - Fechada

**Valores de tipoProblema:**
- `QUEBRA` - Quebra do veículo
- `DEFEITO` - Defeito reportado

### **Filtros de Origem**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `origens` | string | Códigos de origem separados por vírgula | `23,24` |

**Origens disponíveis:**
- `23` - QUEBRA
- `24` - DEFEITO

### **Paginação e Limite**

| Parâmetro | Tipo | Padrão | Descrição | Exemplo |
|-----------|------|--------|-----------|---------|
| `page` | number | 1 | Número da página | `1` |
| `limit` | number | 100 | Registros por página | `50` |

### **Controle de Sincronização**

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `forcarSincronizacao` | boolean | false | Força busca no Oracle mesmo com dados locais |

---

## 📝 Exemplos de Uso

### 1. Busca Básica (Período)
```http
GET /departamentos/manutencao/os-data?startDate=2025-07-01&endDate=2025-07-31
```

### 2. Busca por Garagem Específica
```http
GET /departamentos/manutencao/os-data?startDate=2025-07-01&endDate=2025-07-31&setor=PARANOÁ
```

### 3. Busca por Prefixo de Veículo
```http
GET /departamentos/manutencao/os-data?startDate=2025-07-01&endDate=2025-07-31&prefixo=10
```

### 4. Busca por Número da OS
```http
GET /departamentos/manutencao/os-data?numeroOS=12345
```

### 5. Busca OS Abertas (apenas)
```http
GET /departamentos/manutencao/os-data?startDate=2025-07-01&endDate=2025-07-31&condicaoOS=A
```

### 6. Busca OS do Tipo Corretiva
```http
GET /departamentos/manutencao/os-data?startDate=2025-07-01&endDate=2025-07-31&tipoOS=C
```

### 7. Busca por Placa
```http
GET /departamentos/manutencao/os-data?placa=ABC1234
```

### 8. Busca com Múltiplos Filtros
```http
GET /departamentos/manutencao/os-data?startDate=2025-07-01&endDate=2025-07-31&setor=PARANOÁ&tipoOS=C&condicaoOS=A&prefixo=10
```

### 9. Busca com Paginação
```http
GET /departamentos/manutencao/os-data?startDate=2025-07-01&endDate=2025-07-31&page=1&limit=50
```

### 10. Forçar Sincronização
```http
GET /departamentos/manutencao/os-data?startDate=2025-07-01&endDate=2025-07-31&forcarSincronizacao=true
```

---

## 📊 Resposta JSON

```json
{
  "success": true,
  "timestamp": "2025-10-21T16:00:00.000Z",
  "message": "Dados de OS extraídos com sucesso",
  "filters": {
    "startDate": "2025-07-01",
    "endDate": "2025-07-31",
    "setor": "PARANOÁ",
    "tipoOS": "C"
  },
  "data": [
    {
      "codigoInternoOS": 123456,
      "numeroOS": "OS-2025-001",
      "codigoVeiculo": 1001,
      "codigoGaragem": 31,
      "prefixoVeiculo": "1001",
      "placaVeiculo": "ABC1234",
      "condicaoVeiculo": "Ativo",
      "dataAbertura": "01/07/2025",
      "dataFechamento": null,
      "horaAbertura": "08:30",
      "tipoOSDescricao": "Corretiva",
      "tipoOS": "C",
      "condicaoOSDescricao": "Aberta",
      "condicaoOS": "A",
      "codigoOrigemOS": 23,
      "usuarioAbertura": "JOAO.SILVA",
      "descricaoOrigem": "QUEBRA",
      "descricaoServico": "Problema no motor",
      "codigoSetor": 10,
      "codigoGrupoServico": 5,
      "grupoServico": "MECÂNICA",
      "garagem": "PARANOÁ",
      "tipoProblema": "QUEBRA",
      "diasEmAndamento": 5,
      "kmExecucao": 45000,
      "valorMaoObraTerceiros": 0,
      "valorPecasTerceiros": 0,
      "ehSocorro": "Não",
      "dataSincronizacao": "2025-10-21",
      "createdAt": "2025-10-21T10:00:00.000Z"
    }
  ],
  "count": 1,
  "totalRegistros": 150,
  "totalCount": 150,
  "page": 1,
  "limit": 100,
  "totalPages": 2,
  "statistics": {
    "resumo": {
      "totalRegistros": 150,
      "osAbertas": 75,
      "osFechadas": 75,
      "quebras": 60,
      "defeitos": 90,
      "socorros": 15
    },
    "distribuicoes": {
      "tiposOS": {
        "Corretiva": 100,
        "Preventiva": 50
      },
      "statusOS": {
        "Aberta": 75,
        "Fechada": 75
      },
      "garagens": {
        "PARANOÁ": 150
      },
      "tiposProblema": {
        "QUEBRA": 60,
        "DEFEITO": 90
      }
    },
    "indicadores": {
      "totalValorTerceiros": "12500.50",
      "percentualAbertas": "50.0%",
      "percentualFechadas": "50.0%"
    }
  },
  "fonte": "PostgreSQL (Local)"
}
```

---

## 🔄 Endpoint de Sincronização Manual

### **GET** `/departamentos/manutencao/sincronizar`

Força sincronização do Oracle (mesmo que já tenha dados).

**Parâmetros:** Mesmos da rota `/os-data` (exceto `forcarSincronizacao`)

**Resposta:**
```json
{
  "success": true,
  "timestamp": "2025-10-21T16:00:00.000Z",
  "message": "Sincronização concluída com sucesso",
  "executionTime": "2500ms",
  "total": 150,
  "sincronizados": 50,
  "atualizados": 100
}
```

---

## 💡 Dicas de Uso

1. **Performance:** Use paginação para grandes volumes (`page` e `limit`)
2. **Cache:** A primeira busca do dia sincroniza, as demais são instantâneas
3. **Busca Parcial:** Filtros de texto (prefixo, placa, numeroOS) aceitam busca parcial
4. **Combinação:** Combine múltiplos filtros para buscas precisas
5. **Sincronização:** Use `forcarSincronizacao=true` apenas quando necessário

---

## 🔐 Autenticação

Todas as rotas requerem autenticação JWT via Bearer token:

```http
Authorization: Bearer <seu_token_jwt>
```

---

## 📌 Status

### **GET** `/departamentos/manutencao/status`

Retorna status do departamento.

**Resposta:**
```json
{
  "departamento": "Manutenção",
  "status": "Operacional",
  "timestamp": "2025-10-21T16:00:00.000Z"
}
```
