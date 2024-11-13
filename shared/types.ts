export type Painting = {
  paintingId: string;
  artistId: string;
  title: string;
  artist: string;
  year: string;
  description: string;
  medium: string;
  place: string;
  period: string;
  currentStatus: string;
};

export type Artist = {
  artistId: string;
  name: string;
  birthYear: string;
  deathYear?: string;
  nationality: string;
  biography: string;
};

export type PaintingArtistLink = {
  paintingId: string;
  artistId: string;
};
