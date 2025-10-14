// lib/mockApi.ts
type Announcement = {
  id: string;
  title: string;
  body: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  createdBy?: string;
  createdAt: string;
};

let STORE: Announcement[] = [
  { id: "1", title: "Welcome Week", body: "Join orientation activities.", createdAt: new Date().toISOString() },
  { id: "2", title: "Library Hours", body: "Extended hours this week.", createdAt: new Date().toISOString() },
];

function delay(ms = 250) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  await delay(300);
  return [...STORE];
}

export async function fetchAnnouncementById(id: string): Promise<Announcement> {
  await delay(200);
  const item = STORE.find((s) => s.id === id);
  if (!item) throw new Error("Announcement not found");
  return { ...item };
}

export async function createAnnouncement(payload: {
  title: string;
  body: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  createdBy?: string;
}) {
  await delay(200);
  const id = String(Date.now());
  const newItem: Announcement = {
    id,
    title: payload.title,
    body: payload.body,
    location: payload.location,
    startsAt: payload.startsAt,
    endsAt: payload.endsAt,
    createdBy: payload.createdBy,
    createdAt: new Date().toISOString(),
  };
  STORE = [newItem, ...STORE];
  return newItem;
}

export async function updateAnnouncement(
  id: string,
  payload: {
    title?: string;
    body?: string;
    location?: string;
    startsAt?: string;
    endsAt?: string;
  }
) {
  await delay(200);
  let found = false;
  STORE = STORE.map((s) => {
    if (s.id === id) {
      found = true;
      return { ...s, ...payload };
    }
    return s;
  });
  if (!found) throw new Error("Announcement not found");
  return STORE.find((s) => s.id === id)!;
}

export async function deleteAnnouncement(id: string) {
  await delay(150);
  const before = STORE.length;
  STORE = STORE.filter((s) => s.id !== id);
  if (STORE.length === before) throw new Error("Announcement not found");
  return true;
}