-- Adicionando campo is_site_customer que estava faltando na tabela conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_site_customer BOOLEAN DEFAULT FALSE;

-- Índice para melhor performance nas consultas por clientes do site
CREATE INDEX IF NOT EXISTS idx_conversations_site_customer ON conversations(is_site_customer);

-- Comentário para documentar o campo
COMMENT ON COLUMN conversations.is_site_customer IS 'Indica se o cliente veio do site (detectado pela mensagem inicial)';
