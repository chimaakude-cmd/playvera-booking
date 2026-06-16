export type ComponentHealth = "operational" | "degraded" | "outage";

export type OverallStatus = "operational" | "degraded" | "major_outage";

export type IncidentStatus = "resolved" | "investigating" | "monitoring";

export type StatusComponent = {
  id: string;
  name: string;
  health: ComponentHealth;
};

export type StatusIncident = {
  id: string;
  date: string;
  issue: string;
  resolution: string;
  status: IncidentStatus;
};

export type PlatformStatusSnapshot = {
  overall: OverallStatus;
  components: StatusComponent[];
  uptimePercent: number;
  responseTimeMs: number;
  lastIncident: string;
  incidents: StatusIncident[];
  updatedAt: string;
};

export const OVERALL_STATUS_LABELS: Record<OverallStatus, string> = {
  operational: "Operational",
  degraded: "Degraded performance",
  major_outage: "Major outage",
};

export const COMPONENT_HEALTH_LABELS: Record<ComponentHealth, string> = {
  operational: "Operational",
  degraded: "Degraded",
  outage: "Outage",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  resolved: "Resolved",
  investigating: "Investigating",
  monitoring: "Monitoring",
};
