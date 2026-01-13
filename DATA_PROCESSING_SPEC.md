# Backend Analysis Agent Specification (MICE Scout)

## 1. Role & Goal
**Role**: Backend analysis agent for 'MICE Scout' service, responsible for data processing and selecting exhibition candidate companies.
**Input**: Raw Article JSON collected via Naver News Search API.
**Output**: Exhibition Candidate List (Organizer-ready).

**Goals**:
1. Reconstruct data from Article(JSON) to Entity(Company/Institution).
2. Capture 'New Product/Tech Showcase' and 'Manufacturing/B2B Ready' targets, in addition to 'Procurement' types.
3. Clearly explain "Why this company is recommended" from an organizer's perspective.
4. **MVP/PoC Priority**: Clarity of judgment based on article data, independent of existing lists.

---

## 2. Entity Structure

The `Company` (Entity) object is reconstructed with the following fields:

```typescript
type EntityType = 'COMPANY' | 'INSTITUTION' | 'ASSOCIATION';
type CompanyScale = 'SME' | 'LARGE' | 'PUBLIC' | 'OTHER';
type MarketTarget = 'PUBLIC' | 'PRIVATE' | 'BOTH';
type ExhibitionParticipationType = 
  | 'PRODUCT_LAUNCH'       // New Product/Tech Reveal (e.g. A2 Type)
  | 'MANUFACTURING_READY'  // Mfg/Cert/B2B Ready (e.g. SR Tech Type)
  | 'SOLUTION_PARTNER'
  | 'MIXED';

type PrimaryCategory = 
  | 'LIGHTING'
  | 'OLED'
  | 'SMART_LIGHTING'
  | 'IOT'
  | 'CONVERGENCE'
  | 'OTHER';

type CandidateStatus = 'CONFIRMED' | 'PENDING' | 'EXCLUDED';

interface Entity {
  entity_id: string; // generated
  entity_name: string;

  entity_type: EntityType;
  company_scale: CompanyScale;
  market_target: MarketTarget;

  exhibition_participation_type: ExhibitionParticipationType;

  primary_category: PrimaryCategory;
  category_tags: string[];
  keywords: Record<string, number>; // keyword: count

  evidence_articles: Article[]; // Reference to source articles

  signals: {
    product_launch: boolean;
    manufacturing: boolean;
    certification: boolean;
    government_support: boolean;
    procurement_ready: boolean;
  };

  fit_score: number;
  recommendation_reason: string;

  candidate_status: CandidateStatus;
}
```

---

## 3. Article to Entity Conversion Rules

### 3.1 Entity Candidate Extraction
- Extract distinct proper nouns identified as Company/Institution.
- Identifiers: '㈜', '주식회사', '공사', '공단', '협회', '테크노파크', etc.
- If the entity is unclear, mark as **PENDING**.

### 3.2 Merge Logic
- Merge multiple articles mentioning the same entity.
- Article count is used as an **Activity** indicator.

---

## 4. Exhibition Participation Signals

### ① Product / Launch Signal
If title/body contains:
`출시`, `신제품`, `공개`, `첫 선`, `론칭`, `선보여`, `상용화`, `개발 완료`
=> `signals.product_launch = true`
=> `exhibition_participation_type = PRODUCT_LAUNCH`

### ② Manufacturing / B2B Signal
If title/body contains:
- `LED 등기구`, `양산`, `생산라인`, `제조`
- `안전 인증`, `전자파 인증`, `KC`, `고효율 인증`
- `제조혁신 바우처`, `스마트공장`, `정부 바우처`
=> `signals.manufacturing = true` (or certification/gov_support)
=> `exhibition_participation_type = MANUFACTURING_READY`

### ③ Procurement Signal
If title/body contains:
`조달`, `납품`, `공공`, `실증`, `규격 대응`
=> `signals.procurement_ready = true`
=> `market_target = PUBLIC` (or `BOTH` if others exist)

---

## 5. Category Classification Rules

| Category | Keywords / Logic |
| :--- | :--- |
| **LIGHTING** | LED + 조명 |
| **SMART_LIGHTING** | 스마트, 제어, 센서, 플랫폼 (in context of Lighting) |
| **IOT** | 스마트, 제어, 센서, 플랫폼 (General) |
| **OLED** | OLED, 마이크로LED |
| **CONVERGENCE** | LED + 웨어러블/디바이스/전자제품 |
| **OTHER** | Failure to match specific logic |

*Logic*: Determine `primary_category` by the strongest signal. Store others in `category_tags`.

---

## 6. Keyword Processing
- Accumulate article-level keywords to the Entity.
- **Keep**: Tech, Product, Achievement related keywords.
- **Penalize/Remove**: Policy, Person names, Event names, Awards (unless product-related).

---

## 7. Recommendation Criteria

### CONFIRMED
- Satisifes **PRODUCT_LAUNCH** OR **MANUFACTURING_READY**.
- Clear "Showcase Content" for an exhibition.

### PENDING
- Entity exists but lacks strong exhibition signals.
- Upgrade possible with more data.

### EXCLUDED
- Policy, Event, Person, Organization promotion only.
- Cannot determine exhibition value.

---

## 8. Output Principles
- Provide Entity List Only (No raw articles).
- **Mandatory Fields**: `exhibition_participation_type`, `recommendation_reason`.
- **Constraint**: Select only candidates worth reviewing to minimize Organizer's effort (Precision > Recall for this MVP).
