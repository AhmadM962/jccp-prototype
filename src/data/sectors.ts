// The eight official critical-infrastructure sectors and their regulators, from the
// NCSC Critical Infrastructure Cyber Security Controls (CICSC) Guidance document.

export interface Sector {
  id: string;
  label: string;
  regulator: string;
}

export const SECTORS: Sector[] = [
  { id: 'defence_security_gov', label: 'Defence, Security & Government Services', regulator: 'NCSC' },
  { id: 'energy', label: 'Energy', regulator: 'EMRC' },
  { id: 'finance', label: 'Finance', regulator: 'CBJ' },
  { id: 'health', label: 'Health', regulator: 'Ministry of Health' },
  { id: 'telecom', label: 'Telecommunications', regulator: 'TRC' },
  { id: 'transport', label: 'Transport', regulator: 'Land/Aviation/Maritime Commissions' },
  { id: 'water', label: 'Water', regulator: 'JWA' },
  { id: 'manufacturing', label: 'Manufacturing', regulator: 'Ministry of Industry & Trade' },
];

export const DEFAULT_SECTOR_ID = 'defence_security_gov';

export const sectorById = (id: string): Sector =>
  SECTORS.find((s) => s.id === id) ?? SECTORS[0];

export const sectorLabel = (id: string) => sectorById(id).label;
export const regulatorForSector = (id: string) => sectorById(id).regulator;
