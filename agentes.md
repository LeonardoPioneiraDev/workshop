# 🤖 Guia para Agentes de IA - Projeto Workshop

Este documento contém instruções para agentes de IA ajudarem no desenvolvimento do projeto Workshop, incluindo criação automática de issues no Jira e boas práticas de programação.

---

## 📋 Informações do Projeto

### Jira
- **URL**: https://pioneirasuporte.atlassian.net
- **Projeto**: WV (Workshop)
- **Board**: https://pioneirasuporte.atlassian.net/jira/software/projects/WV/boards/42
- **Responsável**: Leonardo Lopes Borges (leonardolopes@vpioneira.com.br)

### 🔐 Credenciais Jira API (Para Agentes IA)

**⚠️ IMPORTANTE**: Use estas credenciais para criar issues automaticamente via API

```bash
JIRA_URL=https://pioneirasuporte.atlassian.net
JIRA_EMAIL=leonardolopes@vpioneira.com.br
JIRA_PROJECT_KEY=WV
JIRA_API_TOKEN=[SOLICITAR AO USUÁRIO NA PRIMEIRA VEZ]
```

**Como obter o API Token:**
1. Acesse: https://id.atlassian.com/manage-profile/security/api-tokens
2. Clique em "Create API token"
3. Copie o token gerado
4. Forneça ao agente quando solicitado

**Armazenamento Seguro:**
- Token deve ser armazenado em variável de ambiente
- Nunca commitar token no Git
- Usar `.env` local ou `scripts/.env` (gitignored)

### GitHub
- **Repositório**: https://github.com/LeonardoPioneiraDev/workshop
- **Branch principal**: main
- **Integração**: GitHub Actions + Jira (configurado)

---

## 🎯 Como Criar Issues no Jira (Para IA)

### Template de Issue

Quando o usuário pedir para criar uma issue, use este formato:

```markdown
**Título da Issue:**
[Tipo] Descrição curta e clara

**Descrição:**
## 📝 Contexto
[Explicar o problema ou necessidade]

## 🎯 Objetivo
[O que precisa ser feito]

## ✅ Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## 🔧 Implementação Sugerida
[Passos técnicos ou abordagem recomendada]

## 📚 Referências
[Links, documentação, exemplos]

**Labels:** [frontend/backend/bug/feature/refactor]
**Prioridade:** [Alta/Média/Baixa]
**Estimativa:** [1h/2h/4h/1d/2d]
```

### Tipos de Issue

- **[Feature]** - Nova funcionalidade
- **[Bug]** - Correção de erro
- **[Refactor]** - Melhoria de código
- **[Docs]** - Documentação
- **[Test]** - Testes
- **[Perf]** - Performance
- **[Style]** - UI/UX

### Exemplo Prático

```markdown
**Título:** [Feature] Implementar gráfico de afastados com cores condicionais

**Descrição:**
## 📝 Contexto
O dashboard de DEPES precisa mostrar visualmente quando o número de afastados está acima ou abaixo da meta.

## 🎯 Objetivo
Adicionar cores condicionais no gráfico de afastados:
- Verde: abaixo da meta (bom)
- Vermelho: acima da meta (ruim)

## ✅ Critérios de Aceitação
- [ ] Barras verdes quando valor <= meta
- [ ] Barras vermelhas quando valor > meta
- [ ] Legenda explicativa visível
- [ ] Linha da meta destacada
- [ ] Funciona em mobile e desktop

## 🔧 Implementação Sugerida
1. Modificar componente BarChart do Recharts
2. Adicionar função condicional para cores
3. Criar legenda com componente customizado
4. Melhorar ReferenceLine da meta

## 📚 Referências
- Recharts: https://recharts.org/
- Arquivo: `apps/workshop-frontend/src/pages/workshop/depes/DepesAfastadosSlide.tsx`

**Labels:** frontend, feature, dashboard
**Prioridade:** Média
**Estimativa:** 2h
```

### Estimativas de Prazos e Datas

**⚠️ IMPORTANTE: Toda issue DEVE incluir estimativa, start date e due date!**

#### Jornada de Trabalho
- **Horário**: 8h/dia (08:00 - 17:00 com 1h de almoço)
- **Dias úteis**: Segunda a Sexta
- **Feriados**: Considerar calendário brasileiro

#### Tabela de Complexidade e Estimativas

| Complexidade | Horas | Dias Úteis | Tipo de Tarefa | Exemplo |
|--------------|-------|------------|----------------|---------|
| **Trivial** | 1-2h | 0.25 dia | Ajustes simples, correções de texto | Alterar cor de botão, corrigir typo |
| **Pequena** | 2-4h | 0.5 dia | Componente simples, ajuste de layout | Criar card, ajustar responsividade |
| **Média** | 4-8h | 1 dia | Feature simples, refatoração | Implementar filtro, ajustar múltiplos slides |
| **Grande** | 1-2 dias | 1-2 dias | Feature complexa, integração | Dashboard completo, integração API |
| **Muito Grande** | 3-5 dias | 3-5 dias | Sistema completo, múltiplas features | Módulo inteiro, migração de banco |

#### Cálculo Automático de Datas

**Regras:**
1. **Start Date**: Data atual (quando a issue é criada) ou próximo dia útil
2. **Due Date**: Start Date + dias úteis estimados
3. **Pular fins de semana**: Sábado e domingo não contam
4. **Considerar feriados**: Adicionar dias extras se houver feriados

**Exemplos de Cálculo:**

```python
# Exemplo 1: Tarefa de 1 dia criada na segunda-feira
Start Date: 05/12/2024 (Segunda)
Estimativa: 1 dia (8h)
Due Date: 05/12/2024 (Segunda) - mesma data

# Exemplo 2: Tarefa de 2 dias criada na quinta-feira
Start Date: 05/12/2024 (Quinta)
Estimativa: 2 dias (16h)
Due Date: 06/12/2024 (Sexta) - pula fim de semana se necessário

# Exemplo 3: Tarefa de 3 dias criada na sexta-feira
Start Date: 06/12/2024 (Sexta)
Estimativa: 3 dias (24h)
Due Date: 10/12/2024 (Terça) - pula sábado e domingo
```

#### Formato no Jira

Ao criar issue, incluir:

```python
"duedate": "2024-12-10",  # Formato: YYYY-MM-DD
"customfield_10015": "2024-12-05",  # Start Date (se disponível)
```

#### Guia Rápido de Estimativa

**Pergunte-se:**
1. Quantos arquivos serão modificados? (1-2 = Pequena, 3-5 = Média, 6+ = Grande)
2. Precisa de pesquisa/aprendizado? (+50% tempo)
3. Precisa de testes complexos? (+25% tempo)
4. Tem dependências externas? (+50% tempo)
5. É código crítico que precisa revisão extra? (+25% tempo)

**Fórmula:**
```
Tempo Base × (1 + % Pesquisa + % Testes + % Dependências + % Revisão)
```

**Exemplo:**
```
Tarefa: Implementar gráfico com cores condicionais
- Arquivos: 1 (DepesAfastadosSlide.tsx)
- Pesquisa: Não (já conhece Recharts)
- Testes: Sim, simples (+25%)
- Dependências: Não
- Revisão: Não

Tempo Base: 2h
Tempo Total: 2h × 1.25 = 2.5h ≈ 3h (arredondar para cima)
Estimativa: 0.5 dia (4h)
```

---

## 💻 Boas Práticas de Programação

### 1. Estrutura de Código

#### ✅ Faça
```typescript
// Componentes pequenos e focados
const UserCard = ({ user }: { user: User }) => (
  <Card>
    <h3>{user.name}</h3>
    <p>{user.email}</p>
  </Card>
);

// Hooks customizados para lógica reutilizável
const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  return { user, loading };
};
```

#### ❌ Evite
```typescript
// Componentes gigantes com múltiplas responsabilidades
const Dashboard = () => {
  // 500 linhas de código aqui...
  // Lógica de API, estado, UI tudo misturado
};
```

### 2. Nomenclatura

#### ✅ Faça
```typescript
// Nomes descritivos e claros
const fetchUserById = async (userId: string) => { };
const isUserAuthenticated = () => boolean;
const handleSubmitForm = () => { };

// Constantes em UPPER_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
```

#### ❌ Evite
```typescript
// Nomes genéricos ou confusos
const getData = () => { };
const x = true;
const temp = [];
```

### 3. TypeScript

#### ✅ Faça
```typescript
// Tipos explícitos e interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const getUser = async (id: string): Promise<User> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};
```

#### ❌ Evite
```typescript
// Uso excessivo de 'any'
const getUser = async (id: any): Promise<any> => {
  // ...
};
```

### 4. Estado e Efeitos

#### ✅ Faça
```typescript
// Estado derivado com useMemo
const filteredUsers = useMemo(
  () => users.filter(u => u.active),
  [users]
);

// Efeitos com dependências corretas
useEffect(() => {
  fetchData(userId);
}, [userId]); // Dependência explícita
```

#### ❌ Evite
```typescript
// Recalcular a cada render
const filteredUsers = users.filter(u => u.active);

// Efeitos sem dependências
useEffect(() => {
  fetchData(userId);
}, []); // userId muda mas não refetch
```

### 5. Tratamento de Erros

#### ✅ Faça
```typescript
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  console.error('Erro ao buscar dados:', error);
  setError(error instanceof Error ? error.message : 'Erro desconhecido');
  // Mostrar mensagem para o usuário
}
```

#### ❌ Evite
```typescript
// Ignorar erros
const data = await fetchData(); // Sem try/catch
```

### 6. Responsividade

#### ✅ Faça
```typescript
// Classes Tailwind responsivas
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <Card />
</div>

// Breakpoints consistentes
const isMobile = window.innerWidth < 768;
```

#### ❌ Evite
```typescript
// Valores fixos sem responsividade
<div style={{ width: '1200px' }}>
```

### 7. Performance

#### ✅ Faça
```typescript
// Lazy loading de componentes
const Dashboard = lazy(() => import('./Dashboard'));

// Memoização de componentes pesados
const ExpensiveChart = memo(({ data }) => {
  return <ComplexChart data={data} />;
});
```

#### ❌ Evite
```typescript
// Renderizar tudo de uma vez
import Dashboard from './Dashboard';
import Reports from './Reports';
import Analytics from './Analytics';
```

### 8. Comentários

#### ✅ Faça
```typescript
// Explicar o "porquê", não o "o quê"
// Usamos debounce aqui para evitar chamadas excessivas à API
// durante a digitação do usuário
const debouncedSearch = debounce(search, 300);
```

#### ❌ Evite
```typescript
// Comentários óbvios
// Incrementa o contador
setCounter(counter + 1);
```

---

## 🔄 Workflow de Desenvolvimento

### 1. Receber Tarefa
```bash
# Issue criada no Jira: WV-10
```

### 2. Criar Branch
```bash
git checkout -b WV-10-implementar-dashboard
```

### 3. Desenvolver com Commits Frequentes
```bash
git commit -m "WV-10 #comment Criado estrutura do componente"
git commit -m "WV-10 #time 1h Implementado lógica de dados"
git commit -m "WV-10 #comment Adicionado testes"
```

### 4. Push e PR
```bash
git push origin WV-10-implementar-dashboard
# Criar PR no GitHub
```

### 5. Code Review e Merge
```bash
# Após aprovação, merge do PR
# Issue move automaticamente para "Done"
```

---

## 📦 Estrutura de Pastas

```
workshop/
├── apps/
│   ├── workshop-backend/     # API Node.js
│   └── workshop-frontend/    # React + TypeScript
│       ├── src/
│       │   ├── components/   # Componentes reutilizáveis
│       │   ├── pages/        # Páginas/rotas
│       │   ├── hooks/        # Custom hooks
│       │   ├── services/     # APIs e serviços
│       │   ├── types/        # TypeScript types
│       │   └── utils/        # Funções utilitárias
├── .github/                  # GitHub Actions e templates
└── docs/                     # Documentação
```

---

## 🎨 Padrões de UI/UX

### Cores do Projeto
```typescript
// Tema principal: Slate + Amber
const colors = {
  primary: '#f59e0b',      // Amber-500
  secondary: '#64748b',    // Slate-500
  success: '#10b981',      // Green-500
  error: '#ef4444',        // Red-500
  warning: '#f59e0b',      // Amber-500
  info: '#3b82f6',         // Blue-500
};
```

### Componentes Padrão
- **Cards**: `bg-slate-800/50 border-slate-700`
- **Botões**: `bg-amber-600 hover:bg-amber-700`
- **Inputs**: `bg-slate-900 border-slate-600`

---

## 🧪 Testes

### Estrutura de Teste
```typescript
describe('UserCard', () => {
  it('deve renderizar nome do usuário', () => {
    const user = { name: 'João', email: 'joao@example.com' };
    render(<UserCard user={user} />);
    expect(screen.getByText('João')).toBeInTheDocument();
  });
  
  it('deve chamar onEdit ao clicar no botão', () => {
    const onEdit = jest.fn();
    render(<UserCard user={user} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Editar'));
    expect(onEdit).toHaveBeenCalledWith(user);
  });
});
```

---

## 📝 Checklist de PR

Antes de criar um Pull Request:

- [ ] Código testado localmente
- [ ] Sem erros de lint (`npm run lint`)
- [ ] Sem erros de TypeScript (`npm run type-check`)
- [ ] Testes passando (`npm test`)
- [ ] Código formatado (`npm run format`)
- [ ] Commits seguem convenção (WV-X #comment)
- [ ] Branch atualizado com main
- [ ] Descrição clara no PR
- [ ] Screenshots adicionados (se UI)

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar dev server
npm run build            # Build de produção
npm run lint             # Verificar lint
npm run format           # Formatar código
npm test                 # Rodar testes

# Git + Jira
git checkout -b WV-X-descricao
git commit -m "WV-X #comment Mensagem"
git commit -m "WV-X #time 2h #done Finalizado"
git push origin WV-X-descricao
```

---

## 🤖 Instruções para IA

Quando o usuário pedir:

### "Crie uma issue para..." ou "Crie um quadro no Jira para..."

**⚠️ IMPORTANTE: SEMPRE CRIAR DIRETAMENTE NO JIRA!**

1. **Use o script Python** `scripts/create-jira-issue.py`
2. **Edite o script** com os dados da nova issue
3. **Calcule as datas automaticamente:**
   - **Start Date**: Data atual (ou próximo dia útil se for fim de semana)
   - **Due Date**: Start Date + dias úteis estimados (pulando fins de semana)
4. **Execute o script** para criar automaticamente no Jira
5. **Status padrão:** A issue será criada com status "A Fazer" (To Do)
6. **Confirme a criação** mostrando:
   - URL da issue (ex: WV-25)
   - Estimativa (ex: 1 dia / 8h)
   - Start Date (ex: 05/12/2024)
   - Due Date (ex: 05/12/2024)

**Formato do script:**
```python
from datetime import datetime, timedelta

def calcular_due_date(start_date, dias_uteis):
    """Calcula due date pulando fins de semana"""
    current = start_date
    dias_adicionados = 0
    
    while dias_adicionados < dias_uteis:
        current += timedelta(days=1)
        # Pula fins de semana (5=Sábado, 6=Domingo)
        if current.weekday() < 5:
            dias_adicionados += 1
    
    return current

# Data atual ou próximo dia útil
hoje = datetime.now()
if hoje.weekday() >= 5:  # Se for fim de semana
    dias_ate_segunda = 7 - hoje.weekday()
    start_date = hoje + timedelta(days=dias_ate_segunda)
else:
    start_date = hoje

# Calcular due date baseado na estimativa
estimativa_dias = 1  # Ajustar conforme complexidade
due_date = calcular_due_date(start_date, estimativa_dias)

issue_data = {
    "fields": {
        "project": {"key": "WV"},
        "summary": "[Tipo] Título da issue",
        "description": { ... },
        "issuetype": {"name": "Task"},
        "labels": ["frontend", "backend", "bug", "feature"],
        "duedate": due_date.strftime("%Y-%m-%d"),  # OBRIGATÓRIO
        # "customfield_10015": start_date.strftime("%Y-%m-%d"),  # Start Date (se disponível)
    }
}
```

**Tabela de Estimativas (use como referência):**
| Complexidade | Horas | Dias | Exemplo |
|--------------|-------|------|---------|
| Trivial | 1-2h | 0.25 | Ajuste de cor, typo |
| Pequena | 2-4h | 0.5 | Card simples, layout |
| Média | 4-8h | 1 | Feature simples, filtro |
| Grande | 1-2 dias | 1-2 | Dashboard, integração |
| Muito Grande | 3-5 dias | 3-5 | Módulo completo |

**NÃO faça:**
- ❌ Apenas gerar o conteúdo da issue sem criar
- ❌ Pedir para o usuário criar manualmente
- ❌ Criar arquivo markdown sem executar o script
- ❌ Esquecer de calcular e incluir as datas
- ❌ Incluir fins de semana no cálculo de prazo

**SEMPRE faça:**
- ✅ Criar diretamente no Jira via script
- ✅ Calcular start date e due date automaticamente
- ✅ Pular fins de semana no cálculo
- ✅ Confirmar com URL, estimativa e datas
- ✅ Usar template completo com todos os campos
- ✅ Informar claramente: "Issue WV-X criada! Estimativa: X dias. Prazo: DD/MM/YYYY"


### "Implemente..."
1. Siga as boas práticas deste documento
2. Use TypeScript com tipos explícitos
3. Componentes pequenos e focados
4. Adicione comentários quando necessário
5. Faça commits seguindo convenção WV-X

### "Refatore..."
1. Mantenha funcionalidade existente
2. Melhore legibilidade
3. Adicione tipos se faltando
4. Extraia lógica duplicada
5. Documente mudanças significativas

### "Corrija o bug..."
1. Identifique a causa raiz
2. Adicione teste que reproduz o bug
3. Implemente correção
4. Verifique se teste passa
5. Documente a correção

---

## 📚 Recursos Adicionais

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org/)
- [Jira Smart Commits](https://support.atlassian.com/jira-software-cloud/docs/process-issues-with-smart-commits/)

---

**Última atualização**: 04/12/2024
**Versão**: 1.0
