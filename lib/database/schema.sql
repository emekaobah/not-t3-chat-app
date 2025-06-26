-- Database schema for model management
-- Run this in your Supabase SQL editor

-- Core model definitions
CREATE TABLE IF NOT EXISTS available_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,           -- 'gpt-4.1-nano' (used for display too)
  provider VARCHAR NOT NULL,              -- 'openai', 'google', 'anthropic'
  model_id VARCHAR NOT NULL,              -- API identifier
  model_type VARCHAR NOT NULL,            -- 'reasoning', 'visual', 'text', 'multimodal'
  description TEXT,                       -- User-friendly description
  capabilities TEXT[],                    -- ['vision', 'tool-calling', 'fast'] for tags
  is_active BOOLEAN DEFAULT true,         -- Global availability toggle
  sort_order INTEGER DEFAULT 0,          -- Display ordering within type
  created_at TIMESTAMP DEFAULT NOW()
);

-- User model preferences
CREATE TABLE IF NOT EXISTS user_model_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,               -- Clerk user ID
  model_id UUID REFERENCES available_models(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,        -- User's toggle state
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, model_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_available_models_type ON available_models(model_type);
CREATE INDEX IF NOT EXISTS idx_available_models_active ON available_models(is_active);
CREATE INDEX IF NOT EXISTS idx_user_model_preferences_user ON user_model_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_model_preferences_enabled ON user_model_preferences(is_enabled);

-- Seed data with current models + types and capabilities
INSERT INTO available_models (name, provider, model_id, model_type, description, capabilities, sort_order) VALUES
('gpt-4.1-nano', 'openai', 'gpt-4.1-nano', 'text', 'Fast and efficient OpenAI model for general text tasks', ARRAY['fast', 'text'], 1),
('gemini-2.0-flash', 'google', 'gemini-2.0-flash', 'multimodal', 'Google''s flagship model, known for speed and accuracy (and also web search)', ARRAY['vision', 'tool-calling', 'web-search'], 2),
('gemini-2.0-flash-lite-preview-02-05', 'google', 'gemini-2.0-flash-lite-preview-02-05', 'multimodal', 'Similar to 2.0 Flash, but even faster', ARRAY['fast', 'vision', 'tool-calling'], 3)
ON CONFLICT (name) DO NOTHING;
