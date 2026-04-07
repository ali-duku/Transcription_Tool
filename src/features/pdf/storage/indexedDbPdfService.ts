import {
  PDF_INDEXED_DB_NAME,
  PDF_INDEXED_DB_STORE
} from "../../../shared/constants/storageKeys";
import type { PdfStoreKey } from "../mainViewer/state/pdfViewerReducer";

const DB_VERSION = 1;

function openPdfDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PDF_INDEXED_DB_NAME, DB_VERSION);
    request.onerror = () => reject(new Error("Failed to open PDF IndexedDB."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PDF_INDEXED_DB_STORE)) {
        db.createObjectStore(PDF_INDEXED_DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function readKey(db: IDBDatabase, key: PdfStoreKey): Promise<ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PDF_INDEXED_DB_STORE, "readonly");
    const store = tx.objectStore(PDF_INDEXED_DB_STORE);
    const request = store.get(key);
    request.onerror = () => reject(new Error(`Failed reading PDF key "${key}".`));
    request.onsuccess = () => {
      const value = request.result;
      resolve(value instanceof ArrayBuffer ? value : null);
    };
  });
}

function writeKey(db: IDBDatabase, key: PdfStoreKey, value: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PDF_INDEXED_DB_STORE, "readwrite");
    const store = tx.objectStore(PDF_INDEXED_DB_STORE);
    const request = store.put(value, key);
    request.onerror = () => reject(new Error(`Failed saving PDF key "${key}".`));
    request.onsuccess = () => resolve();
  });
}

function deleteKey(db: IDBDatabase, key: PdfStoreKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PDF_INDEXED_DB_STORE, "readwrite");
    const store = tx.objectStore(PDF_INDEXED_DB_STORE);
    const request = store.delete(key);
    request.onerror = () => reject(new Error(`Failed deleting PDF key "${key}".`));
    request.onsuccess = () => resolve();
  });
}

export async function loadPdfBuffer(key: PdfStoreKey): Promise<ArrayBuffer | null> {
  const db = await openPdfDatabase();
  try {
    return await readKey(db, key);
  } finally {
    db.close();
  }
}

export async function savePdfBuffer(key: PdfStoreKey, value: ArrayBuffer): Promise<void> {
  const db = await openPdfDatabase();
  try {
    await writeKey(db, key, value);
  } finally {
    db.close();
  }
}

export async function clearPdfBuffer(key: PdfStoreKey): Promise<void> {
  const db = await openPdfDatabase();
  try {
    await deleteKey(db, key);
  } finally {
    db.close();
  }
}
