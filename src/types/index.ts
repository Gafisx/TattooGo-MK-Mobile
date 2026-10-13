export interface Artist {
  id: string;
  name: string;
  handle: string;
  city: string;
  styles: string[];
  priceFromCents: number;
  rating: number;
  artworks: number;
  verified: boolean;
}

export interface ChatThread {
  id: string;
  artistName: string;
  lastMessage: string;
  updatedAt: string;
  unread: number;
}

export interface PortfolioPiece {
  id: string;
  title: string;
  style: string;
  priceCents: number;
}
