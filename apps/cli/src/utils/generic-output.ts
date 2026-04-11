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

export class AnalysisTextFormatter implements GenericOutputFormatter {
  format(data: any, context?: any): string {
    const sections: string[] = [];

    sections.push("RepoStem Structural Analysis");
    sections.push("");
    sections.push(`Files analyzed: ${data.totalFiles || 0}`);
    sections.push(`Internal dependencies: ${data.totalDependencies || 0}`);
    sections.push(`Circular dependency groups: ${data.cycleCount || 0}`);
    sections.push("");

    if (data.topCentralFiles?.length > 0) {
      sections.push("Top 5 Most Central Files:");
      data.topCentralFiles.forEach((item: any, index: number) => {
        const score = (item.score || 0).toFixed(2);
        sections.push(`${index + 1}. ${item.file} (centrality: ${score})`);
      });
      sections.push("");
    }

    if (data.topRiskFiles?.length > 0) {
      sections.push("Top 5 Highest Risk Files:");
      data.topRiskFiles.forEach((item: any, index: number) => {
        const score = (item.score || 0).toFixed(2);
        sections.push(`${index + 1}. ${item.file} (risk: ${score})`);
      });
      sections.push("");
    }

    if (data.highChurnFiles?.length > 0) {
      sections.push("High Churn Files (Last 6 months):");
      data.highChurnFiles.forEach((item: any) => {
        const churnScore = item.score || 0;
        const commitEstimate = Math.round(churnScore * 100);
        sections.push(`- ${item.file} (~${commitEstimate} commits)`);
      });
      sections.push("");
    }

    if (data.architectureSignals && data.architectureSignals.length > 0) {
      sections.push("Architecture Signals:");
      data.architectureSignals.forEach((signal: string) => {
        sections.push(`- ${signal}`);
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
    
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
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
          const formattedVal = this.formatValue(val, indent + 1);
          if (typeof val === 'object' && val !== null) {
            return `${spaces}${key}:\n${formattedVal}`;
          }
          return `${spaces}${key}: ${formattedVal}`;
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
    const headers = allKeys;
    const rows = data.map(item => 
      allKeys.map(key => this.formatCell(item?.[key]))
    );

    return this.createTable([headers, ...rows]);
  }

  private objectToKeyValuePairs(obj: any): [string, string][] {
    if (obj === null || obj === undefined) return [];
    
    const pairs: [string, string][] = [];
    
    const processValue = (key: string, value: any, prefix = ''): void => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        pairs.push([fullKey, 'null']);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Recursively process nested objects
        Object.entries(value).forEach(([k, v]) => processValue(k, v, fullKey));
      } else if (Array.isArray(value)) {
        pairs.push([fullKey, this.formatArray(value)]);
      } else {
        pairs.push([fullKey, String(value)]);
      }
    };

    Object.entries(obj).forEach(([key, value]) => processValue(key, value));
    return pairs;
  }

  private formatKeyValueTable(pairs: [string, string][], context?: any): string {
    if (pairs.length === 0) return 'No data to display';

    const headers = context?.headers || ['Property', 'Value'];
    const rows = pairs.map(([key, value]) => [key, value]);

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
    if (typeof value === 'number') return Number.isInteger(value) ? value.toString() : value.toFixed(3);
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
