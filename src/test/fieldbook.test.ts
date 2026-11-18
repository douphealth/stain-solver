import { describe, expect, it } from 'vitest';
import { normalizePlan } from '../../public/assets/js/plan-state.js';
import { setupDirectory } from '../../public/assets/js/guide-reader.js';

describe('shared and saved plan context', () => {
  it('keeps the previous cleaner choice through a URL round trip', () => {
    const plan = normalizePlan({ stain: 'coffee', surface: 'sofa', age: 'fresh', tried: 'product', heat: true });
    const search = new URLSearchParams(Object.entries(plan).map(([key, value]) => [key, String(value)]));
    expect(normalizePlan(Object.fromEntries(search))).toEqual(plan);
  });

  it('opens legacy saved plans with the original defaults', () => {
    expect(normalizePlan({ stain: 'coffee', surface: 'silk', age: 'fresh' })).toMatchObject({
      care: 'unsure', code: 'unknown', dairy: false, heat: false, tried: 'nothing',
    });
  });
});

describe('guide finder', () => {
  it('combines material with plain-language search and restores all guides on reset', () => {
    document.body.innerHTML = `<div class="directory-controls" hidden><input id="guide-filter">
      <select id="guide-material"><option value=""></option><option value="sofa">Sofa</option></select>
      <button id="reset-finder"></button><output id="guide-count"></output></div>
      <div id="guide-empty" hidden></div>
      <a class="directory-card" data-material="sofa" data-filter="red wine fabric sofa"></a>
      <a class="directory-card" data-material="silk" data-filter="red wine silk"></a>`;
    setupDirectory(document);
    const field = document.querySelector<HTMLInputElement>('#guide-filter')!;
    const material = document.querySelector<HTMLSelectElement>('#guide-material')!;
    field.value = 'wine on the couch';
    material.value = 'sofa';
    field.dispatchEvent(new Event('input'));
    expect(document.querySelector('#guide-count')?.textContent).toBe('1 guide');
    expect(document.querySelector('.directory-controls')?.hasAttribute('hidden')).toBe(false);
    field.value = 'missing';
    field.dispatchEvent(new Event('input'));
    expect(document.querySelector('#guide-empty')?.hasAttribute('hidden')).toBe(false);
    document.querySelector<HTMLButtonElement>('#reset-finder')!.click();
    expect(document.querySelector('#guide-count')?.textContent).toBe('2 guides');
  });
});
