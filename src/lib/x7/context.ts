import { PROVIDERS, type ProviderId } from "@/lib/integrations/config";
import { createClient } from "@/lib/supabase/server";

export interface X7IntegrationSource {
  id: string;
  provider: string;
  providerName: string;
  category: string;
  accountName: string | null;
  accountId: string | null;
  scopes: string[];
  connectedAt: string | null;
}

export interface X7AgentSource {
  id: string;
  name: string;
  description: string | null;
  status: string;
  integrations: string[];
  lastRunAt: string | null;
  runCount: number;
}

export interface X7WorkflowSource {
  id: string;
  name: string;
  description: string | null;
  status: string;
  integrations: string[];
  runCount: number;
}

export interface X7RunLogSource {
  id: string;
  sourceType: string;
  sourceName: string | null;
  status: string;
  output: string | null;
  error: string | null;
  startedAt: string;
}

export interface X7DataContext {
  integrations: X7IntegrationSource[];
  agents: X7AgentSource[];
  workflows: X7WorkflowSource[];
  recentRunLogs: X7RunLogSource[];
  generatedAt: string;
}

interface IntegrationRecord {
  id: string;
  provider: string;
  provider_account_id: string | null;
  provider_account_name: string | null;
  scopes: string[] | null;
  connected_at: string | null;
}

interface AgentRecord {
  id: string;
  name: string;
  description: string | null;
  status: string;
  integrations: string[] | null;
  last_run_at: string | null;
  run_count: number | null;
}

interface WorkflowRecord {
  id: string;
  name: string;
  description: string | null;
  status: string;
  integrations: string[] | null;
  run_count: number | null;
}

interface RunLogRecord {
  id: string;
  source_type: string;
  source_name: string | null;
  status: string;
  output: string | null;
  error: string | null;
  started_at: string;
}

function getProviderConfig(provider: string) {
  return PROVIDERS[provider as ProviderId];
}

export async function getX7DataContext(userId: string): Promise<X7DataContext> {
  const supabase = await createClient();

  const [integrationsResult, agentsResult, workflowsResult, logsResult] = await Promise.all([
    supabase
      .from("integrations")
      .select("id, provider, provider_account_id, provider_account_name, scopes, connected_at")
      .eq("user_id", userId)
      .order("connected_at", { ascending: false }),
    supabase
      .from("agents")
      .select("id, name, description, status, integrations, last_run_at, run_count")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("workflows")
      .select("id, name, description, status, integrations, run_count")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("run_logs")
      .select("id, source_type, source_name, status, output, error, started_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  if (integrationsResult.error) {
    throw new Error(integrationsResult.error.message);
  }

  if (agentsResult.error) {
    throw new Error(agentsResult.error.message);
  }

  if (workflowsResult.error) {
    throw new Error(workflowsResult.error.message);
  }

  if (logsResult.error) {
    throw new Error(logsResult.error.message);
  }

  const integrations = ((integrationsResult.data ?? []) as IntegrationRecord[]).map((integration) => {
    const config = getProviderConfig(integration.provider);

    return {
      id: integration.id,
      provider: integration.provider,
      providerName: config?.name ?? integration.provider,
      category: config?.category ?? "Custom",
      accountName: integration.provider_account_name,
      accountId: integration.provider_account_id,
      scopes: integration.scopes ?? [],
      connectedAt: integration.connected_at,
    };
  });

  return {
    integrations,
    agents: ((agentsResult.data ?? []) as AgentRecord[]).map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      integrations: agent.integrations ?? [],
      lastRunAt: agent.last_run_at,
      runCount: agent.run_count ?? 0,
    })),
    workflows: ((workflowsResult.data ?? []) as WorkflowRecord[]).map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      integrations: workflow.integrations ?? [],
      runCount: workflow.run_count ?? 0,
    })),
    recentRunLogs: ((logsResult.data ?? []) as RunLogRecord[]).map((log) => ({
      id: log.id,
      sourceType: log.source_type,
      sourceName: log.source_name,
      status: log.status,
      output: log.output,
      error: log.error,
      startedAt: log.started_at,
    })),
    generatedAt: new Date().toISOString(),
  };
}

export function summarizeX7DataContext(context: X7DataContext) {
  const activeAgents = context.agents.filter((agent) => agent.status === "active").length;
  const activeWorkflows = context.workflows.filter((workflow) => workflow.status === "active").length;
  const failingRuns = context.recentRunLogs.filter((log) => log.status === "error");

  return {
    connectedSources: context.integrations.length,
    sourceNames: context.integrations.map((integration) => integration.providerName),
    activeAgents,
    totalAgents: context.agents.length,
    activeWorkflows,
    totalWorkflows: context.workflows.length,
    failingRuns: failingRuns.length,
    latestRunStatus: context.recentRunLogs[0]?.status ?? null,
    learnedSkills: 0,
    memoryNodes: 0,
  };
}
