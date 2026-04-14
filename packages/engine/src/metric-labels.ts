const METRIC_LABELS: Record<string, string> = {
    centrality: "Dependency Importance",
    coupling: "Connectivity",
    churn: "Change Frequency",
    circularDependency: "Cyclic Dependency",
    hasCircularDependency: "Cyclic Dependency",
    riskScore: "Structural Risk",
    risk: "Structural Risk",
};

export function getMetricLabel(key: string): string {
    return METRIC_LABELS[key] ?? key;
}

export { METRIC_LABELS };
