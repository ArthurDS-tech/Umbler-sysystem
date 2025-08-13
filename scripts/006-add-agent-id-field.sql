-- Adicionar campo agent_id na tabela conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS agent_id VARCHAR(255);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);

-- Comentário para documentação
COMMENT ON COLUMN conversations.agent_id IS 'ID único do atendente/agente da Umbler';
