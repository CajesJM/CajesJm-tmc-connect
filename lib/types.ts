// lib/types.ts
export type Announcement = {
  id: string;
  title: string;
  body: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  createdBy?: string;
  createdAt: string;
};