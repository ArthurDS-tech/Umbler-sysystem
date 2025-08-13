-- Adicionar coluna de tags na tabela conversations
ALTER TABLE conversations 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Adicionar índice para busca por tags
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING GIN(tags);

-- Inserir dados de exemplo para teste
INSERT INTO conversations (conversation_id, customer_name, agent_name, status, tags, created_at, updated_at)
VALUES 
  ('test_conv_1', 'João Silva', 'Ester', 'active', '{"💙 CLIENTE SITE", "🐨 Qualificação"}', NOW(), NOW()),
  ('test_conv_2', 'Maria Santos', 'Sarah', 'closed', '{"💙 CLIENTE SITE", "✨ BMW VEICULOS"}', NOW() - INTERVAL '1 hour', NOW())
ON CONFLICT (conversation_id) DO NOTHING;

-- Inserir mensagens de exemplo
INSERT INTO messages (conversation_id, message_id, sender_type, sender_name, message_text, timestamp, created_at)
VALUES 
  ('test_conv_1', 'msg_1', 'customer', 'João Silva', 'Olá, gostaria de informações sobre veículos', NOW() - INTERVAL '30 minutes', NOW()),
  ('test_conv_1', 'msg_2', 'agent', 'Ester', 'Olá João! Claro, posso te ajudar. Que tipo de veículo você procura?', NOW() - INTERVAL '25 minutes', NOW()),
  ('test_conv_2', 'msg_3', 'customer', 'Maria Santos', 'Tenho interesse em uma BMW', NOW() - INTERVAL '2 hours', NOW()),
  ('test_conv_2', 'msg_4', 'agent', 'Sarah', 'Perfeito! Temos várias opções BMW disponíveis.', NOW() - INTERVAL '1 hour 55 minutes', NOW())
ON CONFLICT (message_id) DO NOTHING;

-- Calcular tempos de resposta para os exemplos
INSERT INTO response_times (conversation_id, customer_message_id, agent_message_id, response_time_seconds, created_at)
VALUES 
  ('test_conv_1', 'msg_1', 'msg_2', 300, NOW()),
  ('test_conv_2', 'msg_3', 'msg_4', 300, NOW())
ON CONFLICT (customer_message_id, agent_message_id) DO NOTHING;
