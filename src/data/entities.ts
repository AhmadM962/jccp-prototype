// Organisations within each sector, so the Profile screen can show how a sector is constituted: the sector alone does not
// identify the entity (the Water Authority of Jordan sits above separate distribution companies with separate estates).
//
// ILLUSTRATIVE. The list is curated by the prototype and has not been checked by NCSC. Listing a real organisation is not
// a statement about it, and NO ASSESSMENT EXISTS for any of them: the assessable entity in this prototype is the fictional
// demonstration organisation, and choosing a real one shows an empty assessment state, never a figure.

export interface Entity {
  id: string;
  name: string;
}

export const DEMO_ENTITY = 'demo';
export const OTHER_ENTITY = 'other';

export const ENTITIES: Record<string, Entity[]> = {
  energy: [
    { id: 'nepco', name: 'National Electric Power Company (NEPCO)' },
    { id: 'jepco', name: 'Jordanian Electric Power Company (JEPCO)' },
    { id: 'ideco', name: 'Irbid District Electricity Company (IDECO)' },
    { id: 'edco', name: 'Electricity Distribution Company (EDCO)' },
  ],
  water: [
    { id: 'waj', name: 'Water Authority of Jordan' },
    { id: 'miyahuna', name: 'Miyahuna (Jordan Water Company)' },
    { id: 'yarmouk', name: 'Yarmouk Water Company' },
    { id: 'aqaba-water', name: 'Aqaba Water Company' },
  ],
  telecom: [
    { id: 'zain', name: 'Zain Jordan' },
    { id: 'orange', name: 'Orange Jordan' },
    { id: 'umniah', name: 'Umniah' },
  ],
  finance: [
    { id: 'arab-bank', name: 'Arab Bank' },
    { id: 'housing-bank', name: 'Housing Bank for Trade and Finance' },
    { id: 'bank-of-jordan', name: 'Bank of Jordan' },
    { id: 'cab', name: 'Cairo Amman Bank' },
  ],
  gov_services: [
    { id: 'modee', name: 'Ministry of Digital Economy and Entrepreneurship (MoDEE)' },
    { id: 'cspd', name: 'Civil Status and Passports Department' },
    { id: 'istd', name: 'Income and Sales Tax Department' },
  ],
  health: [
    { id: 'moh', name: 'Ministry of Health' },
    { id: 'khcc', name: 'King Hussein Cancer Center' },
  ],
  transport: [
    { id: 'rj', name: 'Royal Jordanian' },
    { id: 'aig', name: 'Airport International Group (Queen Alia International Airport)' },
  ],
  education: [
    { id: 'uj', name: 'The University of Jordan' },
    { id: 'moe', name: 'Ministry of Education' },
  ],
  industry_trade: [
    { id: 'jpmc', name: 'Jordan Phosphate Mines Company' },
    { id: 'apc', name: 'Arab Potash Company' },
  ],
  defence_security: [],
};

/** Saved state from before the field existed has no entity: that is the demonstration organisation. */
export const isRealEntity = (entity?: string): boolean => Boolean(entity) && entity !== DEMO_ENTITY;

export const entitiesFor = (sectorId: string): Entity[] => ENTITIES[sectorId] ?? [];
