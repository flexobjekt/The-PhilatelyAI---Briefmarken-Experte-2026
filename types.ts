
export interface Stamp {
  id: string;
  image: string;
  name: string;
  origin: string;
  year: string;
  estimatedValue: string;
  rarity: string;
  condition: string;
  description: string;
  dateAdded: string;
  expertStatus: 'none' | 'pending' | 'appraised';
  expertValuation?: string;
  expertNote?: string;
  historicalContext?: string;
  album: string;
  // Technical details for deep analysis
  printingMethod?: string;
  paperType?: string;
  cancellationType?: string;
}

export type AppView = 'dashboard' | 'scanner' | 'collection' | 'appraisal';
