import requests
import json
import base64
from datetime import datetime, timedelta

# Configurações do Jira
JIRA_URL = "https://pioneirasuporte.atlassian.net"
EMAIL = "leonardolopes@vpioneira.com.br"
API_TOKEN = "ATATT3xFfGF0e7_xsrQi9vd5Xi_uCy7CZ-UYzLjoCumwmtx6far9YtdpXzpje4xYdMLX3VVT6q-9wXhuRn5lCwd9a9KND6qo7n167lNKQRRMvFvz0h-Nf5mR8f6rAEO8mv9xa_47DFTMf3hIp5PtYOAJZH1Wvj7XsKe8n9Ecld2txUSWTAWMrdk=5D23D654"

# Autenticação
auth_str = f"{EMAIL}:{API_TOKEN}"
auth_bytes = auth_str.encode('ascii')
auth_b64 = base64.b64encode(auth_bytes).decode('ascii')

# Headers
headers = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

# Calcular datas
def calcular_due_date(start_date, dias_uteis):
    """Calcula due date pulando fins de semana"""
    current = start_date
    dias_adicionados = 0
    
    while dias_adicionados < dias_uteis:
        current += timedelta(days=1)
        if current.weekday() < 5:  # Segunda a Sexta
            dias_adicionados += 1
    
    return current

# Data atual ou próximo dia útil
hoje = datetime.now()
if hoje.weekday() >= 5:  # Se for fim de semana
    dias_ate_segunda = 7 - hoje.weekday()
    start_date = hoje + timedelta(days=dias_ate_segunda)
else:
    start_date = hoje

# Calcular due date (1 dia útil)
estimativa_dias = 1
due_date = calcular_due_date(start_date, estimativa_dias)

# Dados da issue
issue_data = {
    "fields": {
        "project": {"key": "WV"},
        "summary": "[Feature] Melhorar consulta SQL do Departamento Pessoal com dados completos",
        "description": {
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
                    "content": [{
                        "type": "text",
                        "text": "A consulta SQL do departamento pessoal estava com dados incompletos e genéricos. Foi necessário melhorar a consulta para buscar informações reais do Oracle, incluindo nome da mãe, salários da folha de pagamento, departamento/área corretos e informações de afastamento com CID médico."
                    }]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "🎯 Objetivo"}]
                },
                {
                    "type": "paragraph",
                    "content": [{
                        "type": "text",
                        "text": "Implementar consulta SQL otimizada com dados completos e precisos dos funcionários, incluindo informações financeiras e de afastamento."
                    }]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "✅ Melhorias Implementadas"}]
                },
                {
                    "type": "bulletList",
                    "content": [
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "MAE: Busca nome da mãe de FLP_DEPENDENTES (CODPAREN = 10)"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "CPF: Otimizado com subquery agrupada (evita duplicatas)"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "DEPARTAMENTO/AREA: Usa campos reais (DESCDEPTO, DESCAREA)"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "SALÁRIOS: Busca valores reais da folha (Base, Provento, Líquido)"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "AFASTAMENTO: Pega o mais recente com ROW_NUMBER()"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "CID: Código e descrição do CID médico"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "DATA_AFASTAMENTO: Campo adicional com data do afastamento"}]
                            }]
                        }
                    ]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "🔧 Arquivos Modificados"}]
                },
                {
                    "type": "bulletList",
                    "content": [
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "apps/workshop-backend/src/dept-pessoal/dept-pessoal.service.ts"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "database/migrations/add_dept_pessoal_new_fields.sql"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "database/migrations/update_upsert_dept_pessoal_function.sql"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "database/migrations/fix_missing_columns.sql"}]
                            }]
                        }
                    ]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "📊 Novos Campos no Banco"}]
                },
                {
                    "type": "bulletList",
                    "content": [
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "data_afastamento (DATE)"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "cid_medico (VARCHAR(10))"}]
                            }]
                        },
                        {
                            "type": "listItem",
                            "content": [{
                                "type": "paragraph",
                                "content": [{"type": "text", "text": "descricao_cid (VARCHAR(255))"}]
                            }]
                        }
                    ]
                },
                {
                    "type": "heading",
                    "attrs": {"level": 2},
                    "content": [{"type": "text", "text": "✅ Status"}]
                },
                {
                    "type": "paragraph",
                    "content": [{
                        "type": "text",
                        "text": "Implementado e testado com sucesso. Sincronização funcionando corretamente com todos os novos campos."
                    }]
                }
            ]
        },
        "issuetype": {"name": "Task"},
        "labels": ["backend", "database", "sql", "dept-pessoal"],
        "duedate": due_date.strftime("%Y-%m-%d")
    }
}

# Criar issue
try:
    response = requests.post(
        f"{JIRA_URL}/rest/api/3/issue",
        headers=headers,
        data=json.dumps(issue_data)
    )
    
    if response.status_code == 201:
        issue = response.json()
        print(f"✅ Issue criada com sucesso!")
        print(f"")
        print(f"📊 Detalhes:")
        print(f"  - Key: {issue['key']}")
        print(f"  - Título: [Feature] Melhorar consulta SQL do Departamento Pessoal")
        print(f"  - Estimativa: 1 dia (8h) - Complexidade Média")
        print(f"  - Start Date: {start_date.strftime('%d/%m/%Y')}")
        print(f"  - Due Date: {due_date.strftime('%d/%m/%Y')}")
        print(f"  - URL: {JIRA_URL}/browse/{issue['key']}")
    else:
        print(f"❌ Erro ao criar issue:")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Erro: {str(e)}")
