export interface App {
  id: string;
  title: string;
  description: string;
  apkLink: string;
  websiteLink?: string;
  logoUrl: string;
  screenshots: string[];
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  uid: string;
  email: string;
  isAdmin: boolean;
}