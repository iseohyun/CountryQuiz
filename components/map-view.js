/**
 * @file components/map-view.js
 * @description 대륙 윤곽만 그린 간단한 세계지도. 지금 문제의 나라만 칠하고, 작은 나라도 보이도록 그 자리에 고리를 그린다.
 * 지도와 나라 모양은 data/world-map.js, data/countries.js 에 미리 계산한 SVG 경로(1000x500)다.
 *
 * 대륙을 하나만 골랐으면 그 대륙의 나라들이 다 보이는 만큼만 확대한다.
 * 지도 폭의 1/4 이 넘는 큰 나라(러시아 등)는 확대 범위를 정할 때 빼서, 대륙이 한쪽으로 작아지지 않게 한다.
 * 날짜변경선 양쪽에 걸친 대륙(오세아니아)은 지도를 좌우로 한 장씩 더 이어 붙여 끊기지 않게 보인다.
 */

import { WORLD_MAP } from '../data/world-map.js';
import { COUNTRIES } from '../data/countries.js';
import { CONTINENTS } from './country-data.js';

const CONTINENT_IDS = CONTINENTS.map((c) => c.id);
const BIG_COUNTRY_RATIO = 0.25;
const PADDING_RATIO = 0.08;
/** 보이는 지도 폭에 견줘 이보다 작은 나라는 퍼지는 원으로 자리를 알린다 */
const SMALL_COUNTRY_RATIO = 0.03;

/** 경로 문자열의 좌표로 만든 나라별 상자. 경로가 없는 작은 나라는 중심점 */
const bboxCache = new Map();
function getCountryBox(country) {
  if (bboxCache.has(country.code)) return bboxCache.get(country.code);
  let box = { x0: country.cx, y0: country.cy, x1: country.cx, y1: country.cy };
  if (country.path) {
    // 해외 영토(프랑스령 기아나, 알래스카 등)로 상자가 커지지 않도록 가장 큰 땅덩이 하나로 잰다
    let bestArea = -1;
    country.path.split('M').filter(Boolean).forEach((part) => {
      const nums = part.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      if (!xs.length) return;
      const b = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
      const area = (b.x1 - b.x0) * (b.y1 - b.y0);
      if (area > bestArea) { bestArea = area; box = b; }
    });
  }
  bboxCache.set(country.code, box);
  return box;
}

/** 대륙 하나를 보여 줄 viewBox. 지도 끝을 넘어가면 좌우 이어 붙인 지도에서 보인다 */
const viewCache = new Map();
function getContinentView(continentId, { padding = PADDING_RATIO, aspect = 2 } = {}) {
  const cacheKey = `${continentId}|${padding}|${aspect}`;
  if (viewCache.has(cacheKey)) return viewCache.get(cacheKey);
  const { width, height } = WORLD_MAP;
  const boxes = COUNTRIES.filter((c) => c.continent === continentId)
    .map(getCountryBox)
    .filter((b) => (b.x1 - b.x0) < width * BIG_COUNTRY_RATIO);
  // 날짜변경선 건너편(왼쪽 끝)에 있는 나라를 오른쪽으로 한 바퀴 옮겨 보고, 더 좁아지면 그쪽을 쓴다
  const spanOf = (list) => ({
    x0: Math.min(...list.map((b) => b.x0)), x1: Math.max(...list.map((b) => b.x1)),
    y0: Math.min(...list.map((b) => b.y0)), y1: Math.max(...list.map((b) => b.y1))
  });
  let span = spanOf(boxes);
  const wrapped = spanOf(boxes.map((b) => (b.x1 < width / 2 ? { ...b, x0: b.x0 + width, x1: b.x1 + width } : b)));
  if (wrapped.x1 - wrapped.x0 < span.x1 - span.x0) span = wrapped;
  // 지도 비율(2:1)에 맞추고 여백을 둔다
  let w = (span.x1 - span.x0) * (1 + padding * 2);
  let h = (span.y1 - span.y0) * (1 + padding * 2);
  if (w / h > aspect) h = w / aspect; else w = h * aspect;
  const cx = (span.x0 + span.x1) / 2;
  const cy = (span.y0 + span.y1) / 2;
  const view = { x: cx - w / 2, y: Math.max(-height * 0.1, cy - h / 2), w, h };
  viewCache.set(cacheKey, view);
  return view;
}

/**
 * @param {HTMLElement} container 지도를 넣을 요소
 * @param {object|null} country 칠할 나라(없으면 지도만)
 * @param {{focusContinent?: string, viewDomains?: string[]}} options
 *   viewDomains 가 대륙 하나면 그 대륙으로 확대, 아니면 세계 전체
 */
export function renderWorldMap(container, country, { focusContinent, viewDomains = [] } = {}) {
  if (!container) return;
  const { width, height, continents } = WORLD_MAP;
  const single = viewDomains.length === 1 && CONTINENT_IDS.includes(viewDomains[0]) ? viewDomains[0] : null;
  const view = single ? getContinentView(single) : { x: 0, y: 0, w: width, h: height };
  // 확대하면 선 굵기와 고리 크기가 같이 커지지 않게 줄인다
  const scale = view.w / width;

  const focusColor = CONTINENTS.find((c) => c.id === focusContinent)?.color;
  const outlines = CONTINENT_IDS.filter((id) => continents[id]).map((id) => `
    <path class="map-continent${id === focusContinent ? ' focus' : ''}" d="${continents[id]}"
      ${id === focusContinent && focusColor ? `style="stroke:${focusColor}"` : ''}></path>`).join('');
  // 나라가 화면에서 너무 작으면(경로 없음, 또는 지도 폭의 SMALL_COUNTRY_RATIO 보다 작음) 그 자리에서 원이 퍼져 나가게 해 위치를 알린다
  let highlight = '';
  if (country) {
    const box = getCountryBox(country);
    const isSmall = !country.path || Math.max(box.x1 - box.x0, box.y1 - box.y0) < view.w * SMALL_COUNTRY_RATIO;
    const ripples = isSmall ? [0, 1, 2].map((i) => `
      <circle class="map-ripple" cx="${country.cx}" cy="${country.cy}" r="${40 * scale}" style="animation-delay:${i * 0.6}s"></circle>`).join('') + `
      <circle class="map-dot" cx="${country.cx}" cy="${country.cy}" r="${3.5 * scale}"></circle>` : '';
    highlight = `${country.path ? `<path class="map-country" d="${country.path}"></path>` : ''}${ripples}`;
  }
  const id = `map-${Math.random().toString(36).slice(2, 8)}`;
  container.innerHTML = `
    <svg class="world-map" viewBox="${view.x} ${view.y} ${view.w} ${view.h}" preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="세계지도" style="--map-scale:${scale}">
      <g id="${id}">${outlines}${highlight}</g>
      ${single ? `<use href="#${id}" x="${width}"></use><use href="#${id}" x="${-width}"></use>` : ''}
    </svg>`;
}

/**
 * 학습현황의 대륙 진도 지도: 그 대륙의 나라마다 진도 색을 칠한다. 아직 배우지 않은 나라는 옅은 회색.
 * 경로가 없는 작은 나라는 그 자리에 같은 색 점으로 그린다.
 * @param {HTMLElement} container
 * @param {string} continentId
 * @param {(country: object) => string|null} colorOf 나라의 칠할 색(없으면 배우지 않음)
 */
export function renderProgressMap(container, continentId, colorOf) {
  if (!container) return;
  const { width, continents } = WORLD_MAP;
  const view = getContinentView(continentId);
  const scale = view.w / width;
  const outlines = CONTINENT_IDS.filter((id) => continents[id]).map((id) => `
    <path class="map-continent${id === continentId ? ' focus' : ''}" d="${continents[id]}"></path>`).join('');
  const countries = COUNTRIES.filter((c) => c.continent === continentId).map((c) => {
    const color = colorOf(c);
    const fill = color || '#e5e7eb';
    const title = `<title>${c.name}</title>`;
    return c.path
      ? `<path class="map-progress-country${color ? ' learned' : ''}" d="${c.path}" style="fill:${fill}">${title}</path>`
      : `<circle class="map-progress-dot${color ? ' learned' : ''}" cx="${c.cx}" cy="${c.cy}" r="${5 * scale}" style="fill:${fill}">${title}</circle>`;
  }).join('');
  const id = `pmap-${Math.random().toString(36).slice(2, 8)}`;
  container.innerHTML = `
    <svg class="world-map" viewBox="${view.x} ${view.y} ${view.w} ${view.h}" preserveAspectRatio="xMidYMid meet"
      role="img" aria-label="대륙 진도 지도">
      <g id="${id}">${outlines}${countries}</g>
      <use href="#${id}" x="${width}"></use><use href="#${id}" x="${-width}"></use>
    </svg>`;
}

/**
 * 대륙 아이콘: 그 대륙 윤곽을 대륙 색으로 칠한 작은 SVG. 언어와 상관없이 같은 그림이다.
 * @param {string} continentId
 * @param {{size?: number, title?: string}} options
 */
export function renderContinentIcon(continentId, { size = 24, title = '' } = {}) {
  const { width, continents } = WORLD_MAP;
  const d = continents[continentId];
  if (!d) return '';
  const color = CONTINENTS.find((c) => c.id === continentId)?.color || '#64748b';
  const view = getContinentView(continentId, { padding: 0.04, aspect: 1 });
  // 날짜변경선 건너편(오세아니아 동쪽 섬)도 보이도록 좌우로 한 번씩 더 그린다
  const path = `<path d="${d}" fill="${color}"></path>`;
  return `<svg class="continent-icon" viewBox="${view.x} ${view.y} ${view.w} ${view.h}" width="${size}" height="${size}"
    preserveAspectRatio="xMidYMid meet" role="img" aria-label="${title}">
    ${path}<g transform="translate(${width} 0)">${path}</g><g transform="translate(${-width} 0)">${path}</g>
  </svg>`;
}
