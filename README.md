# 📊 Dashboard de Análise de Cumprimento de Serviço

## 1. Introdução

Este sistema foi desenvolvido para automatizar a **visualização e análise dos dados de cumprimento de serviço (CCO)**, integrando informações da API **Transdata** e do ERP **Globus**. A aplicação oferece:

- Filtros avançados (data, linha, empresa, prefixo, status)
- Gráficos dinâmicos com **Chart.js**
- Exportação de relatórios em **Excel** e **PDF**

O projeto é estruturado em **monorepo**, utilizando **Turbo** e **PNPM**, com backend em **NestJS** e frontend em **React + Vite**.

---

## 2. Tecnologias Utilizadas

### 🔹 Frontend

- React + Vite com TypeScript
- Axios para chamadas HTTP
- Chart.js e Recharts para visualização gráfica
- React Router DOM
- Tailwind CSS com PostCSS
- jsPDF, xlsx, file-saver (para exportações)

### 🔹 Backend

- NestJS (Node.js + Express)
- Axios (integração com API Transdata)
- TypeORM com SQLite
- Armazenamento simulado (mock)
- Exportações em Excel e PDF

### 🔹 Ferramentas de Desenvolvimento

- Turbo (monorepo)
- PNPM (gerenciador de pacotes)
- ESLint, Prettier, TypeScript, Tailwind CSS

---

## 3. Estrutura do Projeto

```bash
Dashboard/
├── apps/
│   ├── backend/       → NestJS
│   └── frontend/      → React + Vite
├── package.json       → Gerencia os workspaces
├── turbo.json         → Orquestra os builds/dev
└── pnpm-workspace.yaml

🔸 Frontend (src/)
bash

components/
  ├── charts/          → BarChartCumprimento.tsx
  └── filters/         → FiltrosDashboard.tsx
pages/                 → DashboardPage.tsx, HomePage.tsx
routes/                → AppRoutes.tsx
services/              → api.ts
types/                 → cumprimento.ts
styles/                → global.css
App.tsx, main.tsx

4. Funcionalidades do Sistema
Filtros avançados: Data, empresa, linha, prefixo e status

Importação de dados: Integração com a API Transdata

Indicadores de performance: Furos, atrasos, colisões, quebras, defeitos

Visualização gráfica: Gráficos dinâmicos com barras, linhas, etc.

Exportação de dados: Excel e PDF

Cache em memória com invalidação inteligente

5. Endpoints Disponíveis (Backend)
📥 Importar Dados
Método: GET

Rota: /cumprimentos/importar

Parâmetros:

dia (obrigatório): YYYY-MM-DD

idempresa, idservico, numerolinha, prefixoprevisto, prefixorealizado, statusini, statusfim

📄 Listar Dados Importados
Método: GET

Rota: /cumprimentos

Parâmetros opcionais: motorista, linha, sentido, setor, page, limit

✅ Verificação de Saúde
Método: GET

Rota: /cumprimentos/health

6. Exemplos de Requisição
📥 Importar dados de um dia específico
GET http://localhost:3021/cumprimentos/importar?dia=2025-05-07

Resposta esperada:

json
{
  "mensagem": "Importado com regras",
  "total": 6576,
  "totais": {
    "atrasos": 423,
    "adiantados": 156,
    "furos": 78,
    "linhasErradas": 12
  },
  "tempoExecucao": "15130ms"
}

📄 Listar dados com filtros
bash

GET http://localhost:3021/cumprimentos?numerolinha=163.1&page=1&limit=10

Resposta esperada:

json

{
  "total": 36,
  "tempoExecucao": "434ms",
  "page": 1,
  "limit": 10,
  "totalPages": 4,
  "dados": [
    {
      "IdLinha": "163.1",
      "NomeMotorista": "João Silva",
      "PrefixoPrevisto": "ABC123",
      "PrefixoRealizado": "ABC123",
      "InicioPrevisto": "2025-05-07T10:00:00",
      "InicioRealizado": "2025-05-07T10:05:00",
      "regras": {
        "atraso": true,
        "adiantado": false,
        "furoHorario": false,
        "linhaErrada": false
      }
    }
  ]
}
7. Instalação e Configuração
✅ Pré-requisitos
Node.js 18+

PNPM 8+

Docker e Docker Compose (opcional)

🚀 Instalação
bash

# Clone o repositório
git clone https://github.com/seu-usuario/dashboard-cumprimento.git
cd dashboard-cumprimento

# Instale as dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Inicie o desenvolvimento
pnpm dev
🐳 Usando Docker
bash

# Construir e iniciar os contêineres
docker-compose up --build -d

# Verificar logs
docker-compose logs -f

# Parar os contêineres
docker-compose down
8. Otimizações de Performance
Cache inteligente: Armazenamento em memória com invalidação por tempo

Processamento em lotes: Evita travamentos no event loop

Paginação eficiente: Reduz o tráfego de dados

Retry com backoff: Recupera falhas temporárias

Timeout configurável: Requisições seguras e rápidas

9. Tratamento de Erros
Logging detalhado para depuração

Mensagens amigáveis para o usuário

Recuperação automática de falhas de rede

Validação de dados rigorosa

10. Considerações Finais
Este sistema adota uma arquitetura moderna com separação clara de responsabilidades, utilizando NestJS no backend, monorepo com Turbo e um frontend robusto com React + Vite. A análise visual com gráficos e exportações facilita a tomada de decisão baseada em dados.

📝 Licença
Distribuído sob a licença MIT. Veja LICENSE para mais informações.

🤝 Contribuição
Contribuições são bem-vindas!

Faça um Fork

Crie sua branch: git checkout -b feature/AmazingFeature

Commit suas mudanças: git commit -m 'Add some AmazingFeature'

Push para a branch: git push origin feature/AmazingFeature

Abra um Pull Request

Desenvolvido com ❤️ pela Equipe de Desenvolvimento, deixando tudo bonito, organizado e funcional!
