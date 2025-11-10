#!/bin/bash
# apps/backend/scripts/test-sync.sh

echo "🧪 Testando sincronização de funcionários completos..."

# 1. Verificar estrutura da tabela
echo "📋 Verificando estrutura da tabela..."
docker exec -it workshop-postgres psql -U postgres -d workshop -c "
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'pessoal_funcionarios_completos' 
ORDER BY ordinal_position;
"

# 2. Limpar dados antigos (opcional)
echo "🧹 Limpando dados antigos..."
docker exec -it workshop-postgres psql -U postgres -d workshop -c "
DELETE FROM pessoal_funcionarios_completos WHERE mes_referencia = '$(date +%Y-%m)';
"

# 3. Testar sincronização
echo "🔄 Testando sincronização..."
curl -X POST "http://10.10.100.176:3333/departamentos/pessoal/funcionarios-completos/teste-sincronizacao" \
  -H "Content-Type: application/json" | jq '.'

# 4. Verificar resultados
echo "📊 Verificando resultados..."
docker exec -it workshop-postgres psql -U postgres -d workshop -c "
SELECT 
  situacao,
  COUNT(*) as total,
  AVG(salario_total) as salario_medio
FROM pessoal_funcionarios_completos 
WHERE mes_referencia = '$(date +%Y-%m)'
GROUP BY situacao
ORDER BY situacao;
"

echo "✅ Teste concluído!"