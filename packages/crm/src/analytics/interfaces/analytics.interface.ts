export interface ChannelData {
  channel: string;
  total: number;
}

export interface TimePoint {
  date: string; // formato "YYYY-MM"
  total: number;
}

export interface ProductData {
  product: string | null;
  total: number;
}
