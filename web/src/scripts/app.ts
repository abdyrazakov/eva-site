import { loadSiteData } from '../lib/api';
import type { SiteData } from '../lib/types';
import { mountConfigurator } from './configurator-view';
import { renderSections } from './sections-view';

function readSnapshot(): SiteData {
  const el = document.getElementById('snapshot');
  if (!el?.textContent) throw new Error('Snapshot is missing from the page');
  return JSON.parse(el.textContent) as SiteData;
}

async function main(): Promise<void> {
  const snapshot = readSnapshot();
  const root = document.getElementById('configurator-root');
  if (!root) return;

  const sectionsRoot = document.getElementById('sections-root');
  const renderAll = (data: SiteData): void => {
    if (sectionsRoot) renderSections(sectionsRoot, data);
  };

  const configurator = mountConfigurator(root, snapshot);
  renderAll(snapshot);
  const live = await loadSiteData(fetch, snapshot);
  if (live !== snapshot) {
    configurator.update(live);
    renderAll(live);
  }
}

void main();
