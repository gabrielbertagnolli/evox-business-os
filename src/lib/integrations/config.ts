// OAuth provider configuration for all integrations

export type ProviderId =
  | "meta"
  | "google"
  | "hubspot"
  | "slack"
  | "linkedin"
  | "notion"
  | "github";

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  category: string;
  color: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: string;
  clientSecretEnv: string;
  profileUrl?: string;
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  meta: {
    id: "meta",
    name: "Meta Ads",
    description: "Facebook & Instagram ad campaigns",
    category: "Advertising",
    color: "#1877F2",
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scopes: ["ads_read", "ads_management", "business_management", "pages_read_engagement"],
    clientIdEnv: "META_CLIENT_ID",
    clientSecretEnv: "META_CLIENT_SECRET",
    profileUrl: "https://graph.facebook.com/me?fields=id,name",
  },
  google: {
    id: "google",
    name: "Google Ads",
    description: "Search, display, and YouTube ads",
    category: "Advertising",
    color: "#4285F4",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/adwords",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    profileUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
  },
  hubspot: {
    id: "hubspot",
    name: "HubSpot",
    description: "CRM, contacts, and pipeline",
    category: "CRM & Sales",
    color: "#FF7A59",
    authUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    scopes: ["crm.objects.contacts.read", "crm.objects.deals.read", "crm.objects.companies.read"],
    clientIdEnv: "HUBSPOT_CLIENT_ID",
    clientSecretEnv: "HUBSPOT_CLIENT_SECRET",
    profileUrl: "https://api.hubapi.com/oauth/v1/access-tokens/",
  },
  slack: {
    id: "slack",
    name: "Slack",
    description: "Team messaging and channels",
    category: "Communication",
    color: "#4A154B",
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["channels:read", "chat:write", "users:read", "team:read"],
    clientIdEnv: "SLACK_CLIENT_ID",
    clientSecretEnv: "SLACK_CLIENT_SECRET",
    profileUrl: "https://slack.com/api/auth.test",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn Ads",
    description: "B2B advertising and lead gen",
    category: "Advertising",
    color: "#0A66C2",
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: ["r_ads", "r_ads_reporting", "r_basicprofile"],
    clientIdEnv: "LINKEDIN_CLIENT_ID",
    clientSecretEnv: "LINKEDIN_CLIENT_SECRET",
    profileUrl: "https://api.linkedin.com/v2/me",
  },
  notion: {
    id: "notion",
    name: "Notion",
    description: "Knowledge base and project tracking",
    category: "Productivity",
    color: "#000000",
    authUrl: "https://api.notion.com/v1/oauth/authorize",
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    scopes: [],
    clientIdEnv: "NOTION_CLIENT_ID",
    clientSecretEnv: "NOTION_CLIENT_SECRET",
  },
  github: {
    id: "github",
    name: "GitHub",
    description: "Code repositories and issues",
    category: "Productivity",
    color: "#181717",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["repo", "read:user"],
    clientIdEnv: "GITHUB_OAUTH_CLIENT_ID",
    clientSecretEnv: "GITHUB_OAUTH_CLIENT_SECRET",
    profileUrl: "https://api.github.com/user",
  },
};

export const INTEGRATION_CATEGORIES = [
  {
    id: "Advertising",
    label: "Advertising",
    providers: ["meta", "google", "linkedin"] as ProviderId[],
  },
  {
    id: "CRM & Sales",
    label: "CRM & Sales",
    providers: ["hubspot"] as ProviderId[],
  },
  {
    id: "Communication",
    label: "Communication",
    providers: ["slack"] as ProviderId[],
  },
  {
    id: "Productivity",
    label: "Productivity",
    providers: ["notion", "github"] as ProviderId[],
  },
];
