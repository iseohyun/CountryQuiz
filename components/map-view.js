/**
 * @file components/map-view.js
 * @description 대륙 윤곽만 그린 간단한 세계지도. 지금 문제의 나라만 칠하고, 작은 나라도 보이도록 그 자리에 고리를 그린다.
 * 지도와 나라 모양은 data/world-map.js, data/countries.js 에 미리 계산한 SVG 경로(1000x500)다.
 */

import { WORLD_MAP } from '../data/world-map.js';
import { CONTINENTS } from './country-data.js';

const CONTINENT_IDS = CONTINENTS.map((c) => c.id);

/**
 * @param {HTMLElement} container 지도를 넣을 요소
 * @param {object|null} country 칠할 나라(없으면 지도만)
 * @param {{focusContinent?: string}} options focusContinent 가 있으면 그 대륙 윤곽을 진하게
 */
export function renderWorldMap(container, country, { focusContinent } = {}) {
  if (!container) return;
  const { width, height, continents } = WORLD_MAP;
  const outlines = CONTINENT_IDS.filter((id) => continents[id]).map((id) => `
    <path class="map-continent${id === focusContinent ? ' focus' : ''}" d="${continents[id]}"></path>`).join('');
  const highlight = country ? `
    ${country.path ? `<path class="map-country" d="${country.path}"></path>` : ''}
    <circle class="map-ring" cx="${country.cx}" cy="${country.cy}" r="14"></circle>
    <circle class="map-dot" cx="${country.cx}" cy="${country.cy}" r="3.5"></circle>` : '';
  container.innerHTML = `
    <svg class="world-map" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="세계지도">
      ${outlines}
      ${highlight}
    </svg>`;
}
