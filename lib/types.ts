
export type Attraction = {
  id: string;
  name: string;
  position: [number, number];
  category: string;
  address: string | null;
  website: string | null;
  openingHours: string | null;
};
