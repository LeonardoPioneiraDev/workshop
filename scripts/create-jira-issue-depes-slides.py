#!/usr/bin/env python3
"""
Script para criar issue no Jira sobre melhorias nos slides DEPES
"""

import requests
import json
from datetime import datetime, timedelta
import base64

# Credenciais Jira
JIRA_URL = "https://pioneirasuporte.atlassian.net"
JIRA_EMAIL = "leonardolopes@vpioneira.com.br"
JIRA_PROJECT_KEY = "WV"
JIRA_API_TOKEN = "ATATT3xFfGF0e7_xsrQi9vd5Xi_uCy7CZ-UYzLjoCumwmtx6far9YtdpXzpje4xYdMLX3VVT6q-9wXhuRn5lCwd9a9KND6qo7n167lNKQRRMvFvz0h-Nf5mR8f6rAEO8mv9xa_47DFTMf3hIp5PtYOAJZH1Wvj7XsKe8n9Ecld2txUSWTAWMrdk=5D23D654"

# Calcular datas (considerando que hoje é quinta, 05/12/2025)
hoje = datetime(2025, 12, 5)
start_date = hoje.strftime("%Y-%m-%d")
due_date = hoje.strftime("%Y-%m-%d")  # Mesma data pois já foi concluído

# Criar autenticação
auth_string = f"{JIRA_EMAIL}:{JIRA_API_TOKEN}"
auth_bytes = auth_string.encode('ascii')
auth_base64 = base64.b64encode(auth_bytes).decode('ascii')

# Headers
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": f"Basic {auth_base64}"
}

# Descrição detalhada em formato ADF (Atlassian Document Format)
description = {
    "type": "doc",
    "version": 1,
    "content": [
        {
            "type": "heading",
            "attrs": {"level": 2},
            "content": [{"type": "text", "text": "📝 Contexto"}]
        },
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Modernização completa dos slides do Departamento Pessoal (DEPES), incluindo novo design responsivo, cores modernas, correção de categorizações e otimização de dados."
                }
            ]
        },
        {
            "type": "heading",
            "attrs": {"level": 2},
            "content": [{"type": "text", "text": "🎯 Objetivos Alcançados"}]
        },
        {
            "type": "bulletList",
            "content": [
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Layout profissional e moderno aplicado"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Responsividade mobile/desktop completa"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Paleta de cores vibrantes implementada"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Correção de dados (view SQL e backend)"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Logo responsiva integrada"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Formatação de datas padronizada"}]}]}
            ]
        },
        {
            "type": "heading",
            "attrs": {"level": 2},
            "content": [{"type": "text", "text": "✅ Critérios de Aceitação"}]
        },
        {
            "type": "bulletList",
            "content": [
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "View SQL exclui funcionários desligados"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Categorização por departamento priorizada"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Endpoint /ativos-categoria retorna dados corretos"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Tabela com gradiente e zebra striping"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Gráfico com 5 cores vibrantes"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Total Ativos como 5ª barra"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Logo responsiva integrada"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Data formatada sem hora"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Responsividade mobile/desktop funcional"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Ordem de dados invertida (Afastados)"}]}]}
            ]
        },
        {
            "type": "heading",
            "attrs": {"level": 2},
            "content": [{"type": "text", "text": "🔧 Arquivos Modificados"}]
        },
        {
            "type": "codeBlock",
            "attrs": {"language": "text"},
            "content": [
                {
                    "type": "text",
                    "text": "Frontend:\n├── DepesFuncionariosAtivosSlide.tsx\n└── DepesAfastadosSlide.tsx\n\nBackend:\n└── dept-pessoal.service.ts\n\nDatabase:\n└── vw_dept_pessoal_ativos_por_categoria.sql"
                }
            ]
        },
        {
            "type": "heading",
            "attrs": {"level": 2},
            "content": [{"type": "text", "text": "📊 Dados Corrigidos"}]
        },
        {
            "type": "paragraph",
            "content": [
                {
                    "type": "text",
                    "text": "Administração: 67 → 129 (+62 jovens aprendizes corrigidos)\nTotal mantido: 3.178 funcionários"
                }
            ]
        }
    ]
}

# Dados da issue
issue_data = {
    "fields": {
        "project": {
            "key": JIRA_PROJECT_KEY
        },
        "summary": "[FEAT] Modernização e Correção dos Slides Departamento Pessoal",
        "description": description,
        "issuetype": {
            "name": "Task"
        },
        "labels": ["frontend", "backend", "dashboard", "dept-pessoal", "UX"],
        "priority": {
            "name": "Medium"
        },
        "duedate": due_date
    }
}

# Criar issue
print("🚀 Criando issue no Jira...")
print(f"URL: {JIRA_URL}/rest/api/3/issue")

response = requests.post(
    f"{JIRA_URL}/rest/api/3/issue",
    headers=headers,
    data=json.dumps(issue_data)
)

if response.status_code == 201:
    result = response.json()
    issue_key = result['key']
    issue_url = f"{JIRA_URL}/browse/{issue_key}"
    
    print("\n✅ Issue criada com sucesso!")
    print(f"📋 Issue: {issue_key}")
    print(f"🔗 URL: {issue_url}")
    print(f"📅 Data: {due_date}")
    print(f"⏱️  Status: Concluído")
else:
    print(f"\n❌ Erro ao criar issue!")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
