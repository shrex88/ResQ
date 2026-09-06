import { getPendingIncidents, markIncidentSynced } from './offlineStore';

export async function syncPendingIncidents(): Promise<{ syncedCount: number; errors: any[] }> {
  if (!navigator.onLine) {
    return { syncedCount: 0, errors: ['Device is offline'] };
  }

  const pending = await getPendingIncidents();
  if (pending.length === 0) {
    return { syncedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: any[] = [];

  for (const item of pending) {
    try {
      const formData = new FormData();
      formData.append('type', item.type);
      formData.append('severity', item.severity || 'MEDIUM');
      formData.append('status', item.status || 'REPORTED');
      formData.append('description', item.description);
      formData.append('created_at', item.created_at);
      if (item.reporter_email) formData.append('reporter_email', item.reporter_email);
      if (item.reporter_phone) formData.append('reporter_phone', item.reporter_phone);
      formData.append('lat', item.lat.toString());
      formData.append('lng', item.lng.toString());

      if (item.photo_blob) {
        const photoFile = new File([item.photo_blob], item.photo_name || 'photo.jpg', {
          type: item.photo_blob.type || 'image/jpeg'
        });
        formData.append('photo', photoFile);
      }

      if (item.audio_blob) {
        const audioFile = new File([item.audio_blob], item.audio_name || 'voice.webm', {
          type: item.audio_blob.type || 'audio/webm'
        });
        formData.append('audio', audioFile);
      }

      const response = await fetch('http://localhost:8000/incidents', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      const serverIncident = data.incident;

      // Update sync status in IndexedDB
      await markIncidentSynced(item.id, serverIncident);
      syncedCount++;

      // Trigger helper notification if requested
      if (item.notified && serverIncident?.id) {
        try {
          await fetch(`http://localhost:8000/incidents/${serverIncident.id}/notify-helper`, {
            method: 'POST'
          });
        } catch (e) {
          console.warn("Offline sync helper notification delayed:", e);
        }
      }

      // Trigger email alert if requested
      if (item.email_sent && serverIncident?.id) {
        try {
          await fetch(`http://localhost:8000/incidents/${serverIncident.id}/send-email`, {
            method: 'POST'
          });
        } catch (e) {
          console.warn("Offline sync email alert delayed:", e);
        }
      }

    } catch (err: any) {
      console.error(`[SYNC ERROR] Failed to sync report ${item.id}:`, err);
      errors.push({ id: item.id, error: err.message });
    }
  }

  if (syncedCount > 0) {
    window.dispatchEvent(new CustomEvent('resq-sync-complete', { detail: { syncedCount } }));
  }

  return { syncedCount, errors };
}

export function setupSyncManager() {
  window.addEventListener('online', () => {
    console.log('[NETWORK] Internet restored. Triggering automatic sync...');
    syncPendingIncidents();
  });
}
