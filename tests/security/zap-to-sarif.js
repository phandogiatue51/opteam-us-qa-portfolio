/**
 * OWASP ZAP JSON to OASIS SARIF 2.1.0 Converter
 * 
 * Converts OWASP ZAP traditional JSON scan reports into standard SARIF v2.1.0 format
 * suitable for ingestion by GitHub Advanced Security / GitHub Security Tab (Code Scanning).
 * 
 * Usage:
 *   node zap-to-sarif.js <input-zap-json-path> <output-sarif-path> [repo-artifact-uri]
 */

const fs = require('fs');
const path = require('path');

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
}

function mapRiskToLevel(riskcode) {
  switch (String(riskcode)) {
    case '3': // High
      return 'error';
    case '2': // Medium
      return 'warning';
    case '1': // Low
      return 'note';
    case '0': // Informational
    default:
      return 'none';
  }
}

function mapRiskToSeverity(riskcode) {
  switch (String(riskcode)) {
    case '3':
      return 'error';
    case '2':
      return 'warning';
    case '1':
      return 'recommendation';
    case '0':
    default:
      return 'recommendation';
  }
}

function convertZapJsonToSarif(zapReport, artifactUri = 'Backend/swagger.json') {
  const rulesMap = new Map();
  const rules = [];
  const results = [];

  const sites = Array.isArray(zapReport.site)
    ? zapReport.site
    : (zapReport.site ? [zapReport.site] : []);

  for (const site of sites) {
    const alerts = Array.isArray(site.alerts) ? site.alerts : [];

    for (const alert of alerts) {
      const ruleId = String(alert.pluginid || alert.alertRef || 'zap-alert');
      const ruleName = alert.name || alert.alert || 'ZAP Alert';
      const riskCode = alert.riskcode || '1';
      const level = mapRiskToLevel(riskCode);
      const desc = stripHtml(alert.desc);
      const solution = stripHtml(alert.solution);
      const reference = stripHtml(alert.reference);

      // Register rule if first time seen
      let ruleIndex = rulesMap.get(ruleId);
      if (ruleIndex === undefined) {
        ruleIndex = rules.length;
        rulesMap.set(ruleId, ruleIndex);

        const tags = ['security', 'dast', 'owasp'];
        if (alert.cweid) tags.push(`CWE-${alert.cweid}`);
        if (alert.wascid) tags.push(`WASC-${alert.wascid}`);

        rules.push({
          id: ruleId,
          name: ruleName.replace(/[^a-zA-Z0-9_-]/g, '-'),
          shortDescription: {
            text: ruleName,
          },
          fullDescription: {
            text: desc || ruleName,
          },
          help: {
            text: `### Remediation\n${solution || 'No specific solution provided.'}\n\n### References\n${reference || 'N/A'}`,
            markdown: `### Remediation\n${solution || 'No specific solution provided.'}\n\n### References\n${reference || 'N/A'}`
          },
          defaultConfiguration: {
            level: level === 'none' ? 'note' : level,
          },
          properties: {
            tags,
            'problem.severity': mapRiskToSeverity(riskCode),
            precision: 'high',
          },
        });
      }

      // Each instance becomes a result item
      const instances = Array.isArray(alert.instances) && alert.instances.length > 0
        ? alert.instances
        : [{ uri: site['@name'] || 'API Endpoint', method: 'ALL' }];

      for (const instance of instances) {
        const method = instance.method || 'GET';
        const targetUri = instance.uri || site['@name'] || 'API';
        const param = instance.param ? ` (Parameter: ${instance.param})` : '';
        const evidence = instance.evidence ? ` Evidence: ${instance.evidence}` : '';

        const messageText = `[${alert.riskdesc || 'Alert'}] ${ruleName} detected at ${method} ${targetUri}${param}.${evidence}`;

        results.push({
          ruleId: ruleId,
          ruleIndex: ruleIndex,
          level: level === 'none' ? 'note' : level,
          message: {
            text: messageText,
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: artifactUri,
                  uriBaseId: '%SRCROOT%',
                },
                region: {
                  startLine: 1,
                  startColumn: 1,
                },
              },
              logicalLocations: [
                {
                  name: `${method} ${targetUri}`,
                  kind: 'route',
                },
              ],
            },
          ],
          properties: {
            method: instance.method || '',
            uri: instance.uri || '',
            parameter: instance.param || '',
            attackPayload: instance.attack || '',
            cweId: alert.cweid || '',
            confidence: alert.confidence || '',
          },
        });
      }
    }
  }

  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'OWASP ZAP',
            fullName: 'OWASP Zed Attack Proxy',
            semanticVersion: zapReport['@version'] || '2.14.0',
            informationUri: 'https://www.zaproxy.org/',
            rules: rules,
          },
        },
        results: results,
      },
    ],
  };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node zap-to-sarif.js <input-zap-json> <output-sarif> [artifact-uri]');
    process.exit(1);
  }

  const inputFile = path.resolve(args[0]);
  const outputFile = path.resolve(args[1]);
  const artifactUri = args[2] || 'Backend/swagger.json';

  if (!fs.existsSync(inputFile)) {
    console.warn(`[zap-to-sarif] Input file not found: ${inputFile}. Creating empty SARIF run.`);
    const emptySarif = {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'OWASP ZAP',
              fullName: 'OWASP Zed Attack Proxy',
              semanticVersion: '2.14.0',
              informationUri: 'https://www.zaproxy.org/',
              rules: [],
            },
          },
          results: [],
        },
      ],
    };
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, JSON.stringify(emptySarif, null, 2), 'utf8');
    return;
  }

  const rawJson = fs.readFileSync(inputFile, 'utf8');
  let zapData;
  try {
    zapData = JSON.parse(rawJson);
  } catch (err) {
    console.error(`[zap-to-sarif] Failed to parse ZAP JSON report: ${err.message}`);
    process.exit(1);
  }

  const sarif = convertZapJsonToSarif(zapData, artifactUri);
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(sarif, null, 2), 'utf8');
  console.log(`[zap-to-sarif] Successfully converted ZAP report to SARIF (${sarif.runs[0].results.length} findings) -> ${outputFile}`);
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}

module.exports = {
  convertZapJsonToSarif,
};

