/**
 * Mission country registry — hardcoded for MVP.
 * Designed to be migrated to a `mission_countries` DB table later.
 *
 * mapX / mapY: approximate position in a 1000×480 equirectangular SVG viewport.
 * tags: matched against post.tags to surface country-specific posts.
 */

export type MissionRegion =
  | "동아시아"
  | "동남아시아"
  | "남아시아"
  | "중동"
  | "아프리카"
  | "유럽"
  | "북미"
  | "중남미"
  | "오세아니아";

export type MissionCountry = {
  /** ISO 3166-1 alpha-2, uppercase — used in /mission/[code] URL */
  code: string;
  /** Korean display name */
  name: string;
  /** English name */
  nameEn: string;
  /** Emoji flag */
  flag: string;
  region: MissionRegion;
  /** One-sentence description for the country page */
  description: string;
  /** Approximate SVG pin position (viewBox 0 0 1000 480) */
  mapX: number;
  mapY: number;
  /** Post tags that belong to this country's feed */
  tags: string[];
};

export const MISSION_COUNTRIES: MissionCountry[] = [
  // ─── 동아시아 ───────────────────────────────────────────────────
  {
    code: "KR", name: "한국", nameEn: "Korea", flag: "🇰🇷",
    region: "동아시아",
    description: "한반도 복음화와 한국 선교사들의 파송 베이스",
    mapX: 842, mapY: 148,
    tags: ["한국", "korea", "KR"],
  },
  {
    code: "JP", name: "일본", nameEn: "Japan", flag: "🇯🇵",
    region: "동아시아",
    description: "영적 폐쇄성을 넘어 복음의 문이 열리는 땅",
    mapX: 872, mapY: 155,
    tags: ["일본", "japan", "JP"],
  },
  {
    code: "CN", name: "중국", nameEn: "China", flag: "🇨🇳",
    region: "동아시아",
    description: "지하교회와 소수민족 복음화 사역의 현장",
    mapX: 800, mapY: 165,
    tags: ["중국", "china", "CN"],
  },
  // ─── 동남아시아 ─────────────────────────────────────────────────
  {
    code: "TH", name: "태국", nameEn: "Thailand", flag: "🇹🇭",
    region: "동남아시아",
    description: "불교 문화 속에서 복음을 전하는 사역자들",
    mapX: 787, mapY: 228,
    tags: ["태국", "thailand", "TH"],
  },
  {
    code: "KH", name: "캄보디아", nameEn: "Cambodia", flag: "🇰🇭",
    region: "동남아시아",
    description: "내전의 상처를 치유하고 복음으로 세워지는 공동체",
    mapX: 808, mapY: 240,
    tags: ["캄보디아", "cambodia", "KH"],
  },
  {
    code: "ID", name: "인도네시아", nameEn: "Indonesia", flag: "🇮🇩",
    region: "동남아시아",
    description: "세계 최대 이슬람 인구 속의 개척 사역",
    mapX: 832, mapY: 295,
    tags: ["인도네시아", "indonesia", "ID"],
  },
  {
    code: "MM", name: "미얀마", nameEn: "Myanmar", flag: "🇲🇲",
    region: "동남아시아",
    description: "정치적 혼란 속에서도 이어지는 선교와 구호",
    mapX: 773, mapY: 218,
    tags: ["미얀마", "myanmar", "MM"],
  },
  // ─── 남아시아 ────────────────────────────────────────────────────
  {
    code: "IN", name: "인도", nameEn: "India", flag: "🇮🇳",
    region: "남아시아",
    description: "13억 인구와 수천 민족에게 닿는 복음 사역",
    mapX: 726, mapY: 230,
    tags: ["인도", "india", "IN"],
  },
  {
    code: "NP", name: "네팔", nameEn: "Nepal", flag: "🇳🇵",
    region: "남아시아",
    description: "히말라야 산간 마을의 교회 개척 사역",
    mapX: 720, mapY: 198,
    tags: ["네팔", "nepal", "NP"],
  },
  // ─── 중동 ────────────────────────────────────────────────────────
  {
    code: "IL", name: "이스라엘", nameEn: "Israel", flag: "🇮🇱",
    region: "중동",
    description: "성지와 유대인 복음화, 아랍권 선교 허브",
    mapX: 548, mapY: 185,
    tags: ["이스라엘", "israel", "IL"],
  },
  {
    code: "TR", name: "튀르키예", nameEn: "Turkey", flag: "🇹🇷",
    region: "중동",
    description: "이슬람 문화권 접촉 최전선의 사역",
    mapX: 536, mapY: 162,
    tags: ["튀르키예", "터키", "turkey", "TR"],
  },
  // ─── 아프리카 ────────────────────────────────────────────────────
  {
    code: "ET", name: "에티오피아", nameEn: "Ethiopia", flag: "🇪🇹",
    region: "아프리카",
    description: "고대 기독교 전통 위에 새롭게 세워지는 교회들",
    mapX: 534, mapY: 270,
    tags: ["에티오피아", "ethiopia", "ET"],
  },
  {
    code: "NG", name: "나이지리아", nameEn: "Nigeria", flag: "🇳🇬",
    region: "아프리카",
    description: "아프리카 최대 인구 국가의 복음 운동",
    mapX: 442, mapY: 268,
    tags: ["나이지리아", "nigeria", "NG"],
  },
  {
    code: "KE", name: "케냐", nameEn: "Kenya", flag: "🇰🇪",
    region: "아프리카",
    description: "동아프리카 선교 허브이자 교회 성장의 현장",
    mapX: 542, mapY: 295,
    tags: ["케냐", "kenya", "KE"],
  },
  // ─── 북미 ────────────────────────────────────────────────────────
  {
    code: "US", name: "미국", nameEn: "United States", flag: "🇺🇸",
    region: "북미",
    description: "한인 디아스포라 공동체와 다문화 사역",
    mapX: 158, mapY: 155,
    tags: ["미국", "usa", "US"],
  },
  // ─── 중남미 ──────────────────────────────────────────────────────
  {
    code: "BR", name: "브라질", nameEn: "Brazil", flag: "🇧🇷",
    region: "중남미",
    description: "남미 최대 복음화 사역과 아마존 부족 선교",
    mapX: 198, mapY: 335,
    tags: ["브라질", "brazil", "BR"],
  },
  {
    code: "CO", name: "콜롬비아", nameEn: "Colombia", flag: "🇨🇴",
    region: "중남미",
    description: "분쟁 이후 재건과 회복 사역의 현장",
    mapX: 148, mapY: 285,
    tags: ["콜롬비아", "colombia", "CO"],
  },
  // ─── 오세아니아 ─────────────────────────────────────────────────
  {
    code: "PG", name: "파푸아뉴기니", nameEn: "Papua New Guinea", flag: "🇵🇬",
    region: "오세아니아",
    description: "수백 부족 언어 성경 번역과 오지 교회 개척",
    mapX: 882, mapY: 318,
    tags: ["파푸아뉴기니", "papua", "PG"],
  },
];

/** Regions in display order */
export const MISSION_REGIONS: MissionRegion[] = [
  "동아시아", "동남아시아", "남아시아", "중동",
  "아프리카", "북미", "중남미", "유럽", "오세아니아",
];

/** Find a country by ISO code (case-insensitive). */
export function findCountryByCode(code: string): MissionCountry | undefined {
  return MISSION_COUNTRIES.find((c) => c.code === code.toUpperCase());
}

/** Group countries by region. */
export function groupByRegion(
  countries: MissionCountry[]
): Map<MissionRegion, MissionCountry[]> {
  const map = new Map<MissionRegion, MissionCountry[]>();
  for (const c of countries) {
    const list = map.get(c.region) ?? [];
    list.push(c);
    map.set(c.region, list);
  }
  return map;
}
