-- Criando tabelas para sistema de atendimento com webhook
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(255),
    customer_email VARCHAR(255),
    agent_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    is_site_customer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) UNIQUE,
    sender_type VARCHAR(20) NOT NULL, -- 'customer' ou 'agent'
    sender_name VARCHAR(255),
    message_text TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS response_times (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    customer_message_id VARCHAR(255) NOT NULL,
    agent_message_id VARCHAR(255),
    customer_message_time TIMESTAMP WITH TIME ZONE NOT NULL,
    agent_response_time TIMESTAMP WITH TIME ZONE,
    response_time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_id ON conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_response_times_conversation ON response_times(conversation_id);
