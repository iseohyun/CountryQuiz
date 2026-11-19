/**
 * @file components/country-data.js
 * @description 나라 데이터(data/countries.js)를 퀴즈에 맞게 묶는다.
 *  - 대륙 = 챕터(도메인). 대륙 안의 나라는 면적이 큰 순서로 늘어서고, 그 순서가 글자 ID(charId)가 된다.
 *  - 퀴즈 범위(문제 종류): 나라 이름(지도에 칠한 나라)·수도·국기·면적·정치체계·지도자·언어. 기본은 나라 이름·수도·국기.
 *  - 보기는 늘 나라 이름이다. 정답과 같은 답을 가진 나라(같은 정치체계, 같은 언어 등)는 보기에서 뺀다.
 */

import { COUNTRIES, LEADER_DATA_AS_OF } from '../data/countries.js';

export { LEADER_DATA_AS_OF };

// 대륙 색: 올림픽 오륜에서 시작(유럽 파랑·아시아 노랑·아프리카 검정·아메리카 빨강·오세아니아 초록), 남아메리카는 주황.
// 아이콘(components/map-view.js 의 renderContinentIcon)·칩·지도 윤곽에 함께 써서 언어와 상관없이 대륙을 알아보게 한다.
export const CONTINENTS = [
  { id: 'asia', name: '아시아', short: '아', color: '#eab308' },
  { id: 'europe', name: '유럽', short: '유', color: '#2563eb' },
  { id: 'africa', name: '아프리카', short: '프', color: '#334155' },
  { id: 'northAmerica', name: '북아메리카', short: '북', color: '#dc2626' },
  { id: 'southAmerica', name: '남아메리카', short: '남', color: '#ea580c' },
  { id: 'oceania', name: '오세아니아', short: '오', color: '#16a34a' }
];

const ROW_SIZE = 5;
const byName = new Map(COUNTRIES.map((c) => [c.name, c]));

/** 대륙별 나라 이름 표(한 줄 5개). engine.js 의 ALPHABETS 로 쓴다 */
export const COUNTRY_ROWS = Object.fromEntries(CONTINENTS.map(({ id }) => {
  const names = COUNTRIES.filter((c) => c.continent === id).sort((a, b) => b.area - a.area).map((c) => c.name);
  const rows = [];
  for (let i = 0; i < names.length; i += ROW_SIZE) rows.push(names.slice(i, i + ROW_SIZE));
  return [id, rows];
}));

export function getCountryByName(name) {
  return byName.get(name) || null;
}

export function getContinent(id) {
  return CONTINENTS.find((c) => c.id === id) || CONTINENTS[0];
}

/** 대륙의 나라 면적 합(km²) */
export function getContinentArea(id) {
  return COUNTRIES.filter((c) => c.continent === id).reduce((sum, c) => sum + c.area, 0);
}

export const QUIZ_TYPES = [
  { id: 'map', label: '나라 이름' },
  { id: 'capital', label: '수도' },
  { id: 'flag', label: '국기' },
  { id: 'area', label: '면적' },
  { id: 'government', label: '정치체계' },
  { id: 'leader', label: '지도자' },
  { id: 'language', label: '언어' }
];
export const DEFAULT_QUIZ_TYPES = ['map', 'capital', 'flag'];

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const formatArea = (km2) => `${km2.toLocaleString('ko-KR')} km²`;

/** 문제 글. 국기는 그림, 위치는 지도만 보고 고른다 */
export function renderQuestionHtml(type, country) {
  switch (type) {
    case 'capital': return `<span class="q-label">수도</span><strong class="q-value">${escapeHtml(country.capital)}</strong>`;
    case 'flag': return `<img class="q-flag" src="./assets/flags/${country.cca2}.svg" alt="국기">`;
    case 'area': return `<span class="q-label">면적</span><strong class="q-value">약 ${escapeHtml(formatArea(country.area))}</strong>`;
    case 'government': return `<span class="q-label">정치체계</span><strong class="q-value">${escapeHtml(country.government)}</strong>`;
    case 'leader': return `<span class="q-label">지도자 (${LEADER_DATA_AS_OF} 기준)</span><strong class="q-value">${escapeHtml(country.leader)}</strong>`;
    case 'language': return `<span class="q-label">언어</span><strong class="q-value">${escapeHtml(country.languages.join(', '))}</strong>`;
    default: return '<span class="q-label">지도에 빛나는 나라는?</span>';
  }
}

/** 💡로 연 힌트 한 개(칩) */
export function renderHintChipHtml(type, country) {
  const label = QUIZ_TYPES.find((q) => q.id === type)?.label || '';
  if (type === 'flag') return `<span class="hint-chip"><img src="./assets/flags/${country.cca2}.svg" alt="국기"></span>`;
  const value = {
    capital: country.capital,
    area: `약 ${formatArea(country.area)}`,
    government: country.government,
    leader: country.leader,
    language: country.languages.join(', ')
  }[type];
  return value ? `<span class="hint-chip"><b>${escapeHtml(label)}</b> ${escapeHtml(value)}</span>` : '';
}

/** 정답 확인 뒤 보여 줄 나라 정보 한 줄 */
export function renderFactLine(country) {
  return `${escapeHtml(country.name)} · 수도 ${escapeHtml(country.capital)} · ${escapeHtml(formatArea(country.area))}`;
}

/**
 * 이 나라를 보기에 넣으면 답이 둘이 되는가. 같은 정치체계·같은 언어를 가진 나라, 면적이 거의 같은 나라는 뺀다.
 */
export function conflictsWithAnswer(type, answer, other) {
  if (!answer || !other || answer.name === other.name) return true;
  if (type === 'government') return answer.government === other.government;
  if (type === 'language') return other.languages.some((l) => answer.languages.includes(l));
  if (type === 'area') return Math.abs(answer.area - other.area) / Math.max(answer.area, 1) < 0.15;
  if (type === 'leader') return answer.leader === other.leader;
  return false;
}
