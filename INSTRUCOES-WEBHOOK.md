# 🎯 INSTRUÇÕES PARA CORRIGIR O WEBHOOK DA UMBLER

## 🔧 PROBLEMAS IDENTIFICADOS E CORRIGIDOS

### 1. **Campo `is_site_customer` faltando na tabela**
- ❌ **Problema**: O código estava tentando usar `is_site_customer` mas a tabela não tinha esse campo
- ✅ **Solução**: Adicionei o campo na estrutura da tabela

### 2. **Lógica complexa demais para captura do nome do agente**
- ❌ **Problema**: Código muito complexo com múltiplos fallbacks confusos
- ✅ **Solução**: Lógica simplificada e clara:
  - **Mensagens de agente**: `lastMessage.Member` (quem está enviando)
  - **Mensagens de cliente**: `chatData.OrganizationMember` (agente responsável)

### 3. **Código não otimizado para ambiente serverless da Vercel**
- ❌ **Problema**: Logs excessivos e lógica desnecessariamente complexa
- ✅ **Solução**: Código limpo e otimizado para produção

## 🚀 PRÓXIMOS PASSOS PARA FUNCIONAR

### **PASSO 1: Atualizar o banco de dados**
Execute no seu banco Neon:
```sql
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_site_customer BOOLEAN DEFAULT FALSE;
```

### **PASSO 2: Fazer deploy na Vercel**
```bash
git add .
git commit -m "Webhook corrigido - campo is_site_customer adicionado"
git push
```

### **PASSO 3: Testar o webhook**
```bash
# Definir URL do webhook (substitua pela sua URL da Vercel)
export WEBHOOK_URL="https://seu-projeto.vercel.app/api/webhook/umbler"

# Executar teste
node scripts/test-webhook.js
```

## 📊 COMO FUNCIONA AGORA

### **Captura Inteligente do Nome do Atendente**
1. **Mensagens de agente**: Usa `lastMessage.Member` (quem está enviando)
2. **Mensagens de cliente**: Usa `chatData.OrganizationMember` (agente responsável)

### **Detecção de Cliente do Site**
- Identifica automaticamente quando a mensagem contém "olá, vim do site do marcelino"
- Marca `is_site_customer = true` para essas conversas

### **Cálculo de Tempo de Resposta**
- Calcula automaticamente o tempo entre mensagem do cliente e resposta do agente
- Salva na tabela `response_times` para métricas

## 🔍 DEBUG E LOGS

O webhook agora tem logs claros para cada etapa:
- 📝 Dados recebidos
- 🎧 Nome do atendente capturado
- 👤 Agente responsável pela conversa
- 🌐 Detecção de cliente do site
- ⏱️ Cálculo de tempo de resposta
- 💾 Salvamento no banco

## ✅ RESULTADO ESPERADO

Após as correções, o webhook deve:
- ✅ Capturar corretamente o nome do atendente
- ✅ Diferenciar mensagens de cliente vs. agente
- ✅ Salvar todos os dados no banco
- ✅ Calcular tempos de resposta
- ✅ Funcionar perfeitamente na Vercel

## 🚨 EM CASO DE PROBLEMAS

1. **Verifique os logs na Vercel**: Function Logs > seu-projeto
2. **Teste localmente primeiro**: `npm run dev` + script de teste
3. **Verifique a estrutura do banco**: Confirme que o campo `is_site_customer` foi adicionado
4. **Teste com dados reais**: Use o script de teste para simular webhooks

## 📞 SUPORTE

Se ainda houver problemas, verifique:
- ✅ Variáveis de ambiente na Vercel (DATABASE_URL)
- ✅ Permissões do banco Neon
- ✅ Logs de erro específicos
- ✅ Estrutura das tabelas no banco