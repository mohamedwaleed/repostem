import { MetricClassification } from "../types";

export function classify(value: number): MetricClassification {
  if (value < 0.3) return MetricClassification.LOW;
  if (value < 0.6) return MetricClassification.MEDIUM;
  return MetricClassification.HIGH;
}
