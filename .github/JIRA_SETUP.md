# 🔧 Configuração Jira - Instruções Finais

## ✅ Arquivos Criados

- ✅ `.github/workflows/jira-integration.yml` - GitHub Actions
- ✅ `.github/PULL_REQUEST_TEMPLATE.md` - Template de PR
- ✅ `.github/COMMIT_CONVENTION.md` - Convenções de commit

## 🔑 Próximos Passos (VOCÊ PRECISA FAZER)

### 1. Configurar Secrets no GitHub

Vá em: `https://github.com/LeonardoPioneiraDev/workshop/settings/secrets/actions`

Adicione os seguintes secrets:

| Nome | Valor | Como Obter |
|------|-------|------------|
| `JIRA_BASE_URL` | `https://[seu-dominio].atlassian.net` | URL do seu Jira |
| `JIRA_USER_EMAIL` | `seu-email@exemplo.com` | Email da sua conta Jira |
| `JIRA_API_TOKEN` | `seu-token-aqui` | [Criar token](https://id.atlassian.com/manage-profile/security/api-tokens) |

### 2. Criar API Token no Jira

1. Acesse: https://id.atlassian.com/manage-profile/security/api-tokens
2. Clique em **Create API token**
3. Dê um nome: "GitHub Integration"
4. Copie o token (você só verá uma vez!)
5. Cole no secret `JIRA_API_TOKEN` do GitHub

### 3. Verificar Transições do Jira

As transições padrão configuradas são:
- `In Progress` - Quando faz push
- `In Review` - Quando cria PR
- `Done` - Quando faz merge do PR

**Se seu Jira usa nomes diferentes**, edite o arquivo:
`.github/workflows/jira-integration.yml`

E altere as linhas:
```yaml
transition: "In Progress"  # Mude para o nome correto
transition: "In Review"    # Mude para o nome correto
transition: "Done"         # Mude para o nome correto
```

### 4. Testar a Integração

```bash
# 1. Crie uma issue no Jira (ex: PROJ-123)

# 2. Crie um branch com o código da issue
git checkout -b PROJ-123-teste-integracao

# 3. Faça um commit
git commit -m "PROJ-123 #comment Testando integração Jira + GitHub"

# 4. Faça push
git push origin PROJ-123-teste-integracao

# 5. Verifique no Jira se:
#    - A issue moveu para "In Progress"
#    - Apareceu um comentário com o link do commit
```

## 🎯 Como Usar no Dia a Dia

### Workflow Completo

```bash
# 1. Pegar uma issue do Jira (ex: PROJ-456)
git checkout -b PROJ-456-nova-feature

# 2. Desenvolver e fazer commits
git commit -m "PROJ-456 #comment Iniciado desenvolvimento"
git commit -m "PROJ-456 #time 1h Implementado componente"

# 3. Push (issue move para "In Progress" automaticamente)
git push origin PROJ-456-nova-feature

# 4. Criar PR no GitHub
# (issue move para "In Review" automaticamente)

# 5. Após aprovação e merge
# (issue move para "Done" automaticamente)
```

## 🆘 Troubleshooting

### GitHub Actions não está rodando

1. Verifique se os secrets estão configurados
2. Vá em `Actions` no GitHub e veja os logs
3. Confirme que o workflow está habilitado

### Issue não está sendo atualizada

1. Verifique se o código da issue está correto (MAIÚSCULAS)
2. Confirme que você tem permissões na issue
3. Verifique se as transições existem no seu workflow do Jira

### Erro de autenticação

1. Verifique se o API token está correto
2. Confirme que o email está correto
3. Teste o token manualmente:
```bash
curl -u seu-email@exemplo.com:seu-token https://seu-dominio.atlassian.net/rest/api/3/myself
```

## 📚 Documentação Adicional

- [GitHub Actions - Jira](https://github.com/marketplace?type=actions&query=jira)
- [Smart Commits](https://support.atlassian.com/jira-software-cloud/docs/process-issues-with-smart-commits/)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

## ✨ Recursos Configurados

✅ Transições automáticas de status
✅ Comentários automáticos com links de commits
✅ Comentários automáticos em PRs
✅ Template de PR padronizado
✅ Convenções de commit documentadas
✅ Extração automática do código da issue

---

**Pronto!** Agora você tem integração completa Jira + GitHub! 🎉
