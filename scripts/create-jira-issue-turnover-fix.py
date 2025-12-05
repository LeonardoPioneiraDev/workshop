#!/usr/bin/env python3
"""
Script para criar issue no Jira sobre correção de turnover
"""

import requests
import json
from datetime import datetime
import base64

# Credenciais Jira
JIRA_URL = "https://pioneirasuporte.atlassian.net"
JIRA_EMAIL = "leonardolopes@vpioneira.com.br"
JIRA_PROJECT_KEY = "WV"
JIRA_API_TOKEN = "ATATT3xFfGF0e7_xsrQi9vd5Xi_uCy7CZ-UYzLjoCumwmtx6far9YtdpXzpje4xYdMLX3VVT6q-9wXhuRn5lCwd9a9KND6qo7n167lNKQRRMvFvz0h-Nf5mR8f6rAEO8mv9xa_47DFTMf3hIp5PtYOAJZH1Wvj7XsKe8n9Ecld2txUSWTAWMrdk=5D23D654"

# Datas
hoje = datetime(2025, 12, 5)
due_date = hoje.strftime("%Y-%m-%d")

# Auth
auth_string = f"{JIRA_EMAIL}:{JIRA_API_TOKEN}"
auth_base64 = base64.b64encode(auth_bytes := auth_string.encode('ascii')).decode('ascii')

headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": f"Basic {auth_base64}"
}

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
                    "text": "Correção da lógica de cálculo de turnover no backend e ajustes visuais no slide."
                }
            ]
        },
        {
            "type": "heading",
            "attrs": {"level": 2},
            "content": [{"type": "text", "text": "🎯 Mudanças Realizadas"}]
        },
        {
            "type": "bulletList",
            "content": [
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Backend: Contagem real de admissões/desligamentos por mês (usando snapshot)"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Frontend: Removido ajuste manual de ano (backend já retorna correto)"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Frontend: Formatado custos como 'Não Informado'"}]}]},
                {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Frontend: Ordenação corrigida (Mais recente primeiro)"}]}]}
            ]
        }
    ]
}

issue_data = {
    "fields": {
        "project": {"key": JIRA_PROJECT_KEY},
        "summary": "[FIX] Correção de Cálculo de Turnover e Formatação",
        "description": description,
        "issuetype": {"name": "Task"},
        "labels": ["backend", "frontend", "bugfix", "dept-pessoal"],
        "priority": {"name": "High"},
        "duedate": due_date
    }
}

print("🚀 Criando issue no Jira...")
response = requests.post(f"{JIRA_URL}/rest/api/3/issue", headers=headers, data=json.dumps(issue_data))

if response.status_code == 201:
    result = response.json()
    print(f"\n✅ Issue criada: {result['key']}")
    print(f"🔗 URL: {JIRA_URL}/browse/{result['key']}")
else:
    print(f"\n❌ Erro: {response.status_code} - {response.text}")
