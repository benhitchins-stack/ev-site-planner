// Storage seed functions for tests. Each is serialised into a page init
// script, so it runs before the application boots and reads localStorage.
// Keep them dependency-free and JSON-serialisable.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const legacyFixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('./legacy-project.json', import.meta.url)), 'utf8'),
);

/** Seed a legacy saved project exactly as pre-Phase-1 builds stored it. */
export function seedLegacyProject(arg) {
  localStorage.setItem('evsp_welcomed', '1');
  localStorage.setItem('evsp_projects', JSON.stringify(arg.index));
  localStorage.setItem('evsp_proj_' + arg.index[0].id, JSON.stringify(arg.record));
}

/** Seed a Quotes & Invoices store (evqi.tool.v2) with one quote linked to projId. */
export function seedQuoteLink(arg) {
  localStorage.setItem('evsp_welcomed', '1');
  const doc = {
    id: 'q1', docType: 'quote', number: arg.number, status: arg.status || 'Sent',
    properties: [{
      plannerRef: { projId: arg.projId, name: 'Seeded plan', savedAt: '2026-01-01' },
      items: arg.items || [],
    }],
  };
  localStorage.setItem('evqi.tool.v2', JSON.stringify({ docs: { q1: doc }, order: ['q1'] }));
}

/** Seed a Project Support store under the CURRENT key (evsp_ps_v2). */
export function seedSupportLink(arg) {
  localStorage.setItem('evsp_welcomed', '1');
  localStorage.setItem('evsp_ps_v2', JSON.stringify({
    requests: [{ id: 'r1', ref: 'PS-0042', status: 'submitted', packId: arg.projId, title: 'Seeded request' }],
    nextRef: 43,
  }));
}

/** Seed only a legacy pack-panel section key (pre-Phase-1 value). */
export function seedLegacySectionKey(arg) {
  localStorage.setItem('evsp_welcomed', '1');
  localStorage.setItem('evsp_packsec', arg.value);
}
