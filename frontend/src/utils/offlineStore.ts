// IndexedDB helper for offline-first ResQAI emergency reports

export interface OfflineIncident {
  id: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  lat: number;
  lng: number;
  reporter_email?: string;
  reporter_phone?: string;
  photo_blob?: Blob | null;
  photo_name?: string;
  photo_url?: string;
  audio_blob?: Blob | null;
  audio_name?: string;
  audio_url?: string;
  created_at: string;
  time: string;
  sync_status: 'pending' | 'synced';
  notified?: boolean;
  notified_at?: string;
  email_sent?: boolean;
  email_sent_at?: string;
}

const DB_NAME = 'ResQOfflineDB';
const DB_VERSION = 2;
const STORE_NAME = 'offline_incidents';
const IMD_STORE_NAME = 'imd_alerts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('sync_status', 'sync_status', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
      if (!db.objectStoreNames.contains(IMD_STORE_NAME)) {
        db.createObjectStore(IMD_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function saveOfflineIncident(incident: OfflineIncident): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(incident);

    request.onsuccess = () => resolve();
    request.onerror = (e: any) => reject(e.target.error);
  });
}

export async function getPendingIncidents(): Promise<OfflineIncident[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('sync_status');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e: any) => reject(e.target.error);
  });
}

export async function getAllOfflineIncidents(): Promise<OfflineIncident[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e: any) => reject(e.target.error);
  });
}

export async function markIncidentSynced(id: string, serverIncident?: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (existing) {
        existing.sync_status = 'synced';
        if (serverIncident) {
          if (serverIncident.photo_url) existing.photo_url = serverIncident.photo_url;
          if (serverIncident.audio_url) existing.audio_url = serverIncident.audio_url;
        }
        store.put(existing);
      }
      resolve();
    };

    getReq.onerror = (e: any) => reject(e.target.error);
  });
}

export async function cacheOnlineIncidents(serverIncidents: any[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const inc of serverIncidents) {
    const offlineItem: OfflineIncident = {
      id: inc.id,
      type: inc.type,
      severity: inc.severity,
      status: inc.status,
      description: inc.description,
      lat: inc.location.lat,
      lng: inc.location.lng,
      reporter_email: inc.reporter_email,
      photo_url: inc.photo_url,
      audio_url: inc.audio_url,
      created_at: inc.created_at || inc.time,
      time: inc.created_at || inc.time,
      sync_status: 'synced',
      notified: inc.notified,
      notified_at: inc.notified_at,
      email_sent: inc.email_sent,
      email_sent_at: inc.email_sent_at
    };
    store.put(offlineItem);
  }
}

export async function cacheImdAlerts(alerts: any[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(IMD_STORE_NAME, 'readwrite');
  const store = tx.objectStore(IMD_STORE_NAME);

  for (const alert of alerts) {
    store.put(alert);
  }
}

export async function getCachedImdAlerts(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMD_STORE_NAME, 'readonly');
    const store = tx.objectStore(IMD_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e: any) => reject(e.target.error);
  });
}
