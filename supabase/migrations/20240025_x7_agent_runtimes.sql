-- Migration 20240025_x7_agent_runtimes.sql
-- Add runtime and runtime_config to x7_agents table

ALTER TABLE public.x7_agents
ADD COLUMN IF NOT EXISTS runtime TEXT NOT NULL DEFAULT 'x7_native' CHECK (runtime IN ('x7_native', 'cursor', 'claude', 'opencode', 'deepagents', 'hermes')),
ADD COLUMN IF NOT EXISTS runtime_config JSONB DEFAULT '{}'::jsonb;
