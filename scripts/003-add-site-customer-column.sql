-- Adicionar coluna para marcar clientes que vieram do site
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_site_customer BOOLEAN DEFAULT FALSE;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_conversations_site_customer 
ON conversations(is_site_customer);

-- Comentário explicativo
COMMENT ON COLUMN conversations.is_site_customer IS 'Marca automaticamente clientes que enviaram a mensagem específica do site';
