export interface GameDetails {
  steamId: string;
  name: string;
  description: string;
  price: number;
  reviews: number;
  reviewsSteam: number;
  followers: number;
  avgPlaytime: number;
  reviewScore: number;
  tags: string[];
  genres: string[];
  releaseDate: Date | null; // Update this line
  copiesSold: number;
  revenue: number;
  // Add other fields as needed
}

export interface SearchResult {
  steamId: string;
  name: string;
  price: number;
  followers: number;
  reviewScore: number;
  unreleased: boolean; // Add this line
  // Add other fields as needed
}