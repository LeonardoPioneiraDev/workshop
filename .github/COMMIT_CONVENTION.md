# 📝 Convenção de Commits - Integração Jira

## 🎯 Formato Básico

```
PROJ-123 Descrição curta do commit
```

## 🔧 Smart Commits

Use comandos especiais para interagir com o Jira:

### Adicionar Comentário
```bash
git commit -m "PROJ-123 #comment Implementado gráfico de afastados"
```

### Registrar Tempo
```bash
git commit -m "PROJ-123 #time 2h Desenvolvido dashboard"
git commit -m "PROJ-123 #time 1h30m Ajustes de layout"
```

### Mover para Concluído
```bash
git commit -m "PROJ-123 #done Finalizado desenvolvimento"
```

### Combinar Comandos
```bash
git commit -m "PROJ-123 #time 1h #comment Adicionado cores condicionais #done"
```

## 🌿 Convenção de Branches

```bash
# Formato: PROJ-123-descricao-curta
git checkout -b PROJ-456-dashboard-pessoal
git checkout -b PROJ-789-fix-grafico-mobile
git checkout -b PROJ-101-refactor-api-calls
```

## 📋 Exemplos Práticos

### Feature Completa
```bash
git checkout -b PROJ-456-dashboard-pessoal
git commit -m "PROJ-456 #comment Criado estrutura do dashboard"
git commit -m "PROJ-456 #time 1h Implementado gráficos"
git commit -m "PROJ-456 #comment Adicionado filtros de data"
git commit -m "PROJ-456 #done Dashboard finalizado"
```

### Bugfix
```bash
git checkout -b PROJ-789-fix-grafico-mobile
git commit -m "PROJ-789 #comment Corrigido altura do gráfico no mobile"
git commit -m "PROJ-789 #time 30m #done Bugfix aplicado e testado"
```

### Refatoração
```bash
git checkout -b PROJ-101-refactor-api-calls
git commit -m "PROJ-101 #comment Extraído lógica de API para hooks"
git commit -m "PROJ-101 #time 2h Refatorado componentes"
git commit -m "PROJ-101 #done Refatoração concluída"
```

## ⚠️ Importante

- Sempre use MAIÚSCULAS para o código da issue: `PROJ-123`
- O número da issue deve estar no início do commit
- Use comandos Smart Commits para automação
- Nomeie branches com o código da issue

## 🔄 Transições Automáticas

Com GitHub Actions configurado:

1. **Push no branch** → Issue move para "In Progress"
2. **PR criado** → Issue move para "In Review"
3. **PR merged** → Issue move para "Done"

## 📚 Referências

- [Smart Commits Documentation](https://support.atlassian.com/jira-software-cloud/docs/process-issues-with-smart-commits/)
- [Conventional Commits](https://www.conventionalcommits.org/)
