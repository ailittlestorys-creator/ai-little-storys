export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  price: number;
  originalPrice: number;
  language: string;
  level: string;
  isPublished: boolean;
  purchaseCount: number;
}
