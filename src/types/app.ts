export interface App {
  id: string;
  title: string;
  description: string;
  logoUrl: string;
  logoUrls?: string[]; // Multiple logo URLs
  screenshots?: string[];
  apkLink: string;
  websiteLink?: string;
  downloads: number;
  views?: number;
  rating?: number;
  category?: string;
  version?: string;
  size?: string;
  tags?: string[];
  featured?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
