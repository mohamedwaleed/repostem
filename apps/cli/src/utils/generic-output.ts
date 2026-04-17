import { classify, getMetricLabel, MetricClassification } from "@repostem/engine";
import chalk from 'chalk';

export enum OutputFormat {
  TEXT = "text",
  JSON = "json", 
  TABLE = "table",
  ANALYSIS = "analysis"
}

export interface GenericOutputFormatter {
  format(data: any, context?: any): string;
}

export class JsonOutputFormatter implements GenericOutputFormatter {
  format(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}

// Color helper functions
const getRiskColor = (score: number) => {
  const level = classify(score);
  switch (level) {
    case MetricClassification.HIGH: return chalk.red.bold;
    case MetricClassification.MEDIUM: return chalk.yellow.bold;
    case MetricClassification.LOW: return chalk.green.bold;
    default: return chalk.gray;
  }
};

const getCentralityColor = (score: number) => {
  const level = classify(score);
  switch (level) {
    case MetricClassification.HIGH: return chalk.magenta.bold;
    case MetricClassification.MEDIUM: return chalk.blue.bold;
    case MetricClassification.LOW: return chalk.cyan.bold;
    default: return chalk.gray;
  }
};

const getChurnColor = (score: number) => {
  const level = classify(score);
  switch (level) {
    case MetricClassification.HIGH: return chalk.hex('#FFA500').bold; // Orange
    case MetricClassification.MEDIUM: return chalk.yellow.bold;
    case MetricClassification.LOW: return chalk.green.bold;
    default: return chalk.gray;
  }
};

export class AnalysisTextFormatter implements GenericOutputFormatter {
  format(data: any, context?: any): string {
    const sections: string[] = [];

    // RepoStem Banner
    sections.push('');
    sections.push(chalk.bold.cyan(' ____  _____ ____   ___  ____ _____ _____ __  __ '));
    sections.push(chalk.bold.cyan('|  _ \\| ____|  _ \\ / _ \\/ ___|_   _| ____|  \\/  |'));
    sections.push(chalk.bold.cyan('| |_) |  _| | |_) | | | \\___ \\ | | |  _| | |\\/| |'));
    sections.push(chalk.bold.cyan('|  _ <| |___|  __/| |_| |___) || | | |___| |  | |'));
    sections.push(chalk.bold.cyan('|_| \\_\\_____|_|    \\___/|____/ |_| |_____|_|  |_|'));
    sections.push('');
    sections.push(chalk.gray('  Structural Risk Analysis Tool'));
    sections.push('');
    sections.push(chalk.bold.cyan('RepoStem Structural Analysis'));
    sections.push("");
    sections.push(chalk.gray(`Files analyzed: ${data.totalFiles || 0}`));
    sections.push(chalk.gray(`Internal dependencies: ${data.totalDependencies || 0}`));
    sections.push(chalk.gray(`Circular dependency groups: ${data.cycleCount || 0}`));
    sections.push("");

    if (data.topCentralFiles?.length > 0) {
      sections.push(chalk.bold.magenta("Top 5 Most Central Files:"));
      data.topCentralFiles.forEach((item: any, index: number) => {
        const score = (item.score || 0).toFixed(2);
        const classification = classify(item.score || 0);
        const coloredScore = getCentralityColor(item.score || 0)(`${score} - ${classification.toLowerCase()}`);
        sections.push(`${chalk.gray(index + 1)}. ${chalk.white(item.file)} (${chalk.cyan(getMetricLabel('centrality').toLowerCase())}: ${coloredScore})`);
      });
      sections.push("");
    }

    if (data.topRiskFiles?.length > 0) {
      sections.push(chalk.bold.red("Top 5 Highest Risk Files:"));
      data.topRiskFiles.forEach((item: any, index: number) => {
        const score = (item.score || 0).toFixed(2);
        const classification = classify(item.score || 0);
        const coloredScore = getRiskColor(item.score || 0)(`${score} - ${classification.toLowerCase()}`);
        sections.push(`${chalk.gray(index + 1)}. ${chalk.white(item.file)} (${chalk.red(getMetricLabel('riskScore').toLowerCase())}: ${coloredScore})`);
      });
      sections.push("");
    }

    if (data.highChurnFiles?.length > 0) {
      sections.push(chalk.bold.hex('#FFA500')("High Churn Files (Last 6 months):"));
      data.highChurnFiles.forEach((item: any) => {
        const churnScore = item.score || 0;
        const churnPercent = Math.round(churnScore * 100);
        const classification = classify(churnScore);
        const coloredChurn = getChurnColor(churnScore)(`${classification.toLowerCase()} churn`);
        sections.push(`${chalk.gray('-')} ${chalk.white(item.file)} (${chalk.hex('#FFA500')(`${churnPercent}%`)} - ${coloredChurn})`);
      });
      sections.push("");
    }

    if (data.architectureSignals && data.architectureSignals.length > 0) {
      sections.push(chalk.bold.yellow("Architecture Signals:"));
      data.architectureSignals.forEach((signal: string) => {
        sections.push(`${chalk.gray('-')} ${chalk.yellow(signal)}`);
      });
    }

    return sections.join('\n');
  }
}

export class TextOutputFormatter implements GenericOutputFormatter {
  format(data: any, context?: any): string {
    return this.formatValue(data, 0);
  }

  private formatValue(value: any, indent: number): string {
    const spaces = '  '.repeat(indent);
    
    if (value === null || value === undefined) {
      return 'null';
    }
    
    if (typeof value === 'string' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (typeof value === 'number') {
      const classification = classify(value);
      return `${value} (${classification})`;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return value.map(item => `${spaces}- ${this.formatValue(item, indent + 1)}`).join('\n');
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      
      return entries
        .map(([key, val]) => {
          const label = getMetricLabel(key);
          const formattedVal = this.formatValue(val, indent + 1);
          if (typeof val === 'object' && val !== null) {
            return `${spaces}${label}:\n${formattedVal}`;
          }
          return `${spaces}${label}: ${formattedVal}`;
        })
        .join('\n');
    }
    
    return String(value);
  }
}

export class TableOutputFormatter implements GenericOutputFormatter {
  format(data: any, context?: any): string {
    if (this.isTabularData(data)) {
      return this.formatTable(data, context);
    }
    
    // For non-tabular data, convert to key-value pairs
    const keyValuePairs = this.objectToKeyValuePairs(data);
    return this.formatKeyValueTable(keyValuePairs, context);
  }

  private isTabularData(data: any): boolean {
    return Array.isArray(data) && 
           data.length > 0 && 
           typeof data[0] === 'object' &&
           data[0] !== null;
  }

  private formatTable(data: any[], context?: any): string {
    if (data.length === 0) return 'No data to display';

    // Get all unique keys from all objects
    const allKeys = Array.from(new Set(
      data.flatMap(item => Object.keys(item || {}))
    ));

    // Build table rows
    const headers = allKeys.map(key => getMetricLabel(key));
    const rows = data.map(item => 
      allKeys.map(key => this.formatCell(item?.[key]))
    );

    return this.createTable([headers, ...rows]);
  }

  private objectToKeyValuePairs(obj: any): [string, any][] {
    if (obj === null || obj === undefined) return [];
    
    const pairs: [string, any][] = [];
    
    const processValue = (key: string, value: any, prefix = ''): void => {
      const label = getMetricLabel(key);
      const fullKey = prefix ? `${prefix}.${label}` : label;
      
      if (value === null || value === undefined) {
        pairs.push([fullKey, 'null']);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Recursively process nested objects
        Object.entries(value).forEach(([k, v]) => processValue(k, v, fullKey));
      } else if (Array.isArray(value)) {
        pairs.push([fullKey, this.formatArray(value)]);
      } else {
        pairs.push([fullKey, value]);
      }
    };

    Object.entries(obj).forEach(([key, value]) => processValue(key, value));
    return pairs;
  }

  private formatKeyValueTable(pairs: [string, any][], context?: any): string {
    if (pairs.length === 0) return 'No data to display';

    const headers = context?.headers || ['Property', 'Value'];
    const rows = pairs.map(([key, value]) => [key, this.formatCell(value)]);

    return this.createTable([headers, ...rows]);
  }

  private formatArray(arr: any[]): string {
    if (arr.length === 0) return '[]';
    
    // If array contains objects, format as nested table
    if (arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
      const allKeys = Array.from(new Set(arr.flatMap(item => Object.keys(item))));
      const rows = arr.map(item => allKeys.map(key => this.formatCell(item[key])));
      return '\n' + this.createTable([allKeys, ...rows]).split('\n').map(line => '  ' + line).join('\n');
    }
    
    // For primitive arrays
    if (arr.length <= 3) {
      return `[${arr.map(item => this.formatCell(item)).join(', ')}]`;
    }
    return `[${arr.slice(0, 3).map(item => this.formatCell(item)).join(', ')}, ... (${arr.length} items)]`;
  }

  private formatCell(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(3);
      const classification = classify(value);
      return `${formatted} (${classification})`;
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private createTable(rows: string[][]): string {
    if (rows.length === 0) return '';

    const colWidths = rows[0].map((_, colIndex) => 
      Math.max(...rows.map(row => (row[colIndex] || '').length))
    );

    const formattedRows = rows.map(row => 
      row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' | ')
    );

    const separator = colWidths.map(width => '-'.repeat(width)).join('-|-');

    return [
      formattedRows[0],
      separator,
      ...formattedRows.slice(1)
    ].join('\n');
  }
}

export function getGenericFormatter(format: OutputFormat = OutputFormat.TEXT): GenericOutputFormatter {
  switch (format) {
    case OutputFormat.JSON:
      return new JsonOutputFormatter();
    case OutputFormat.TABLE:
      return new TableOutputFormatter();
    case OutputFormat.ANALYSIS:
      return new AnalysisTextFormatter();
    case OutputFormat.TEXT:
    default:
      return new TextOutputFormatter();
  }
}

export function outputGeneric(data: any, format: OutputFormat = OutputFormat.TEXT, context?: any): void {
  const formatter = getGenericFormatter(format);
  console.log(formatter.format(data, context));
}

export function parseOutputFormat(format?: string): OutputFormat {
  switch (format?.toLowerCase()) {
    case 'json':
      return OutputFormat.JSON;
    case 'table':
      return OutputFormat.TABLE;
    case 'text':
    default:
      return OutputFormat.TEXT;
  }
}
