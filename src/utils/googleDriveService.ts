import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ConceptMediaAttachment, GoogleDriveSyncStatus } from '../types/learning';

// Initialize Firebase App instance singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token management
let cachedAccessToken: string | null = null;
let cachedFolderId: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token must be refreshed or re-acquired via interactive sign-in
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedFolderId = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedFolderId = null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Gets or creates the dedicated folder 'CognitiveTrack Media & Backups' in the user's Google Drive.
 */
export const getOrCreateAppFolder = async (token: string): Promise<string> => {
  if (cachedFolderId) return cachedFolderId;

  const folderName = 'CognitiveTrack Media & Backups';
  const query = encodeURIComponent(
    `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Error al buscar carpeta en Google Drive: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    cachedFolderId = searchData.files[0].id;
    return cachedFolderId!;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Archivos multimedia y respaldos automáticos de CognitiveTrack',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Error al crear carpeta en Google Drive: ${errText}`);
  }

  const createdFolder = await createRes.json();
  cachedFolderId = createdFolder.id;
  return cachedFolderId!;
};

/**
 * Detect media category from mimeType or extension
 */
export const categorizeMediaType = (
  mimeType: string,
  fileName: string
): 'image' | 'audio' | 'pdf' | 'other' => {
  const lowerMime = mimeType.toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (
    lowerMime.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(lowerName)
  ) {
    return 'image';
  }
  if (
    lowerMime.startsWith('audio/') ||
    /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/.test(lowerName)
  ) {
    return 'audio';
  }
  if (lowerMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }
  return 'other';
};

/**
 * Upload a media file (Image, Audio, PDF) to the user's Google Drive app folder.
 */
export const uploadMediaFileToDrive = async (
  token: string,
  file: File,
  caption?: string
): Promise<ConceptMediaAttachment> => {
  const folderId = await getOrCreateAppFolder(token);
  const mediaType = categorizeMediaType(file.type || 'application/octet-stream', file.name);

  const metadata = {
    name: file.name,
    parents: [folderId],
    mimeType: file.type || 'application/octet-stream',
    description: caption || `Adjunto multimedia de CognitiveTrack (${mediaType})`,
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileArrayBuffer = await file.arrayBuffer();

  const metadataContentType = 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
  const mediaContentType = `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

  const metadataBlob = new Blob(
    [delimiter, metadataContentType, JSON.stringify(metadata), delimiter, mediaContentType],
    { type: 'text/plain' }
  );

  const payload = new Blob(
    [metadataBlob, new Uint8Array(fileArrayBuffer), closeDelimiter],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: payload,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Error al subir archivo a Google Drive: ${errText}`);
  }

  const uploadedFile = await uploadRes.json();

  // Make link readable so image thumbnails and audio/pdf streams work smoothly
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Permisos de lectura pública omitidos o no requeridos:', permErr);
  }

  const attachment: ConceptMediaAttachment = {
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    driveFileId: uploadedFile.id,
    name: uploadedFile.name || file.name,
    mimeType: uploadedFile.mimeType || file.type,
    mediaType,
    sizeBytes: Number(uploadedFile.size) || file.size,
    webViewLink: uploadedFile.webViewLink,
    thumbnailLink: uploadedFile.thumbnailLink,
    downloadUrl: uploadedFile.webContentLink,
    createdAt: new Date().toISOString(),
    caption: caption || undefined,
  };

  return attachment;
};

/**
 * Delete a file from Google Drive with explicit user confirmation.
 */
export const deleteMediaFileFromDrive = async (
  token: string,
  fileId: string,
  fileName: string
): Promise<boolean> => {
  const confirmed = window.confirm(
    `¿Estás seguro de que deseas eliminar permanentemente "${fileName}" de tu Google Drive? Esta acción no se puede deshacer.`
  );
  if (!confirmed) return false;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 404) {
    const errText = await res.text();
    throw new Error(`Error al eliminar archivo de Drive: ${errText}`);
  }

  return true;
};

/**
 * Backup the entire CognitiveTrack state to Google Drive as CognitiveTrack_Backup_Latest.json
 */
export const backupStateToGoogleDrive = async (
  token: string,
  appData: any
): Promise<{ fileId: string; syncedAt: string }> => {
  const folderId = await getOrCreateAppFolder(token);
  const backupFileName = 'CognitiveTrack_Backup_Latest.json';

  // Check if file already exists
  const query = encodeURIComponent(
    `name = '${backupFileName}' and '${folderId}' in parents and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const searchData = await searchRes.json();
  const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

  const jsonString = JSON.stringify(appData, null, 2);
  const jsonBlob = new Blob([jsonString], { type: 'application/json' });

  let fileId = '';

  if (existingFile) {
    // Update existing file content
    const patchRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: jsonBlob,
      }
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      throw new Error(`Error al actualizar respaldo en Drive: ${errText}`);
    }

    fileId = existingFile.id;
  } else {
    // Create new backup file via multipart
    const metadata = {
      name: backupFileName,
      parents: [folderId],
      mimeType: 'application/json',
      description: 'Copia de seguridad integral sincronizada de CognitiveTrack',
    };

    const boundary = '-------backupboundary31415';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataBlob = new Blob(
      [
        delimiter,
        'Content-Type: application/json; charset=UTF-8\r\n\r\n',
        JSON.stringify(metadata),
        delimiter,
        'Content-Type: application/json\r\n\r\n',
      ],
      { type: 'text/plain' }
    );

    const payload = new Blob([metadataBlob, jsonBlob, closeDelimiter], {
      type: `multipart/related; boundary=${boundary}`,
    });

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: payload,
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Error al crear respaldo en Drive: ${errText}`);
    }

    const created = await createRes.json();
    fileId = created.id;
  }

  const syncedAt = new Date().toISOString();
  return { fileId, syncedAt };
};

/**
 * Restore the entire CognitiveTrack state from Google Drive
 */
export const restoreStateFromGoogleDrive = async (token: string): Promise<any> => {
  const folderId = await getOrCreateAppFolder(token);
  const backupFileName = 'CognitiveTrack_Backup_Latest.json';

  const query = encodeURIComponent(
    `name = '${backupFileName}' and '${folderId}' in parents and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const searchData = await searchRes.json();
  if (!searchData.files || searchData.files.length === 0) {
    throw new Error('No se encontró ningún archivo de respaldo previo en tu Google Drive.');
  }

  const fileId = searchData.files[0].id;

  const downloadRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!downloadRes.ok) {
    const errText = await downloadRes.text();
    throw new Error(`Error al descargar respaldo de Drive: ${errText}`);
  }

  const backupJson = await downloadRes.json();
  return backupJson;
};
