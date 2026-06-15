export interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  created_at: string;
  photos?: Photo[];
}

export interface Photo {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  order_index: number;
  created_at: string;
}
