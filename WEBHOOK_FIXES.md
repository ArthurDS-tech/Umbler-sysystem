# Correções do Webhook Umbler

## Problemas Identificados e Corrigidos

### 1. **Propriedade `Member` Inexistente**
**Problema:** O código tentava acessar `lastMessage.Member?.Name`, mas essa propriedade não existe na estrutura do webhook.

**Solução:** Removida a referência a `lastMessage.Member` e implementada lógica alternativa.

### 2. **Estrutura de Dados Incorreta para OrganizationMember**
**Problema:** O código assumia que `chatData.OrganizationMember` tinha propriedades `Name` e `DisplayName`, mas no webhook real, `OrganizationMember` só tem `Id`.

**Solução:** Implementada função `extractAgentName()` que:
- Busca o nome do agente em `OrganizationMembers` usando o ID de `LastOrganizationMember`
- Usa fallbacks para `OrganizationMember` se disponível
- Cria nome padrão baseado no setor se necessário

### 3. **Lógica de Detecção de Agente Falha**
**Problema:** A lógica para determinar se é uma mensagem de agente estava baseada em propriedades inexistentes.

**Solução:** Implementada lógica mais robusta que:
- Verifica o campo `Source` da mensagem
- Usa fallbacks inteligentes baseados na estrutura disponível
- Adiciona logs detalhados para debug

### 4. **Propriedade de Telefone Incorreta**
**Problema:** O código tentava acessar `chatData.Contact?.Phone`, mas a propriedade correta é `PhoneNumber`.

**Solução:** Corrigido para usar `chatData.Contact?.PhoneNumber`.

## Estrutura Correta do Webhook

Baseado no exemplo que funcionou, a estrutura correta é:

```json
{
  "Type": "Message",
  "Payload": {
    "Type": "Chat",
    "Content": {
      "Contact": {
        "Name": "Nome do Cliente",
        "PhoneNumber": "+5547999955497"
      },
      "OrganizationMembers": [
        {
          "Id": "ZW-E1ydfRz6GV84t",
          "Name": "Nome do Agente",
          "DisplayName": "Nome Exibido"
        }
      ],
      "LastOrganizationMember": {
        "Id": "ZW-E1ydfRz6GV84t"
      },
      "Sector": {
        "Name": "DVA"
      }
    }
  }
}
```

## Como o Nome do Agente é Extraído

1. **Prioridade 1:** Busca em `OrganizationMembers` usando o ID de `LastOrganizationMember`
2. **Prioridade 2:** Usa `OrganizationMember` se disponível
3. **Prioridade 3:** Cria nome baseado no setor (`Atendente DVA`)
4. **Fallback:** Nome padrão "Atendente"

## Logs de Debug Adicionados

- Logs detalhados para cada etapa da extração do nome
- Identificação clara do tipo de remetente
- Informações sobre a estrutura de dados recebida
- Resultados finais simplificados

## Testes Realizados

✅ Teste com webhook completo - Nome extraído: "Ester Ramos"
✅ Teste sem LastOrganizationMember - Fallback para setor
✅ Teste sem OrganizationMembers - Fallback para setor
✅ Teste sem Sector - Nome extraído do member

## Arquivos Modificados

- `app/api/webhook/umbler/route.ts` - Lógica principal corrigida
- Adicionados logs de debug
- Implementada função `extractAgentName()`
- Corrigida lógica de detecção de remetente

## Como Testar

1. Envie um webhook para o endpoint `/api/webhook/umbler`
2. Verifique os logs no console para confirmar a extração correta
3. Confirme que o nome do agente está sendo salvo no banco de dados

## Próximos Passos

- Monitorar os logs para confirmar funcionamento
- Ajustar a lógica se necessário baseado em novos webhooks
- Considerar implementar cache para nomes de agentes frequentes