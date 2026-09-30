// The ten official sectors named in the NCSC critical-infrastructure sector designation
// document. That document names sectors only — it does not name regulators. Regulator
// names below come from the separate CICSC guidance, which names a regulator for seven of
// the ten. The remaining three (Government Services, Education, Defence and Security)
// carry no named regulator in either source: that is disclosed as "not designated", never
// filled in with a placeholder or a fallback to "NCSC".

export interface Sector {
  id: string;
  /** Arabic source label, verbatim from the NCSC sector designation document */
  arabicLabel: string;
  label: string;
  /** empty string = not designated by either source document */
  regulator: string;
}

export const SECTORS: Sector[] = [
  { id: 'energy', arabicLabel: 'قطاع الطاقة', label: 'Energy', regulator: 'EMRC' },
  { id: 'water', arabicLabel: 'قطاع المياه', label: 'Water', regulator: 'Jordan Water Authority' },
  { id: 'telecom', arabicLabel: 'قطاع الاتصالات وتكنولوجيا المعلومات', label: 'Telecommunications and IT', regulator: 'TRC' },
  { id: 'gov_services', arabicLabel: 'قطاع الخدمات الحكومية', label: 'Government Services', regulator: '' },
  { id: 'industry_trade', arabicLabel: 'قطاع الصناعة والتجارة', label: 'Industry and Trade', regulator: 'Ministry of Industry and Trade' },
  { id: 'finance', arabicLabel: 'القطاع المالي والمصرفي', label: 'Financial and Banking', regulator: 'Central Bank of Jordan' },
  { id: 'health', arabicLabel: 'قطاع الصحة', label: 'Health', regulator: 'Ministry of Health' },
  { id: 'transport', arabicLabel: 'قطاع النقل', label: 'Transport', regulator: 'Land / Aviation / Maritime commissions' },
  { id: 'education', arabicLabel: 'قطاع التعليم', label: 'Education', regulator: '' },
  { id: 'defence_security', arabicLabel: 'قطاع الدفاع والأمن', label: 'Defence and Security', regulator: '' },
];

export const DEFAULT_SECTOR_ID = 'gov_services';

export const NO_REGULATOR_LABEL = 'not designated';

export const sectorById = (id: string): Sector =>
  SECTORS.find((s) => s.id === id) ?? SECTORS[0];

export const sectorLabel = (id: string) => sectorById(id).label;
export const regulatorForSector = (id: string) => sectorById(id).regulator;
export const regulatorDisplay = (id: string) => sectorById(id).regulator || NO_REGULATOR_LABEL;
