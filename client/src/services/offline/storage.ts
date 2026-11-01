import { onlineGame } from '../gameMode';
import { onlineRequest } from '../online/account';
import { localApi, newRoot, type LocalRoot } from './engine';
let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('pho-xom-offline-v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('game');
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); database = undefined; }; resolve(request.result); };
    request.onerror = () => { database = undefined; reject(new Error('Không mở được dữ liệu trên thiết bị. Hãy cho phép trình duyệt lưu dữ liệu.')); };
  });
}
export async function runLocalRequest(method: string, path: string, body: Record<string, unknown>, params: Record<string, unknown>) {
  if (onlineGame) { const query = new URLSearchParams(Object.entries(params).map(([k,v]) => [k,String(v)])).toString(); return onlineRequest(path + (query ? '?' + query : ''), method === 'GET' ? undefined : body, method); }
  return runOfflineRequest(method, path, body, params);
}
export async function runOfflineRequest(method: string, path: string, body: Record<string, unknown>, params: Record<string, unknown>) {
  const db = await openDatabase();
  return new Promise<unknown>((resolve, reject) => {
    const transaction = db.transaction('game', 'readwrite');
    const store = transaction.objectStore('game');
    let result: unknown;
    let failure: unknown;
    const request = store.get('root');
    request.onsuccess = () => {
      try {
        const root: LocalRoot = request.result ?? newRoot();
        result = localApi(root, method, path, body, params);
        store.put(root, 'root');
      } catch (error) { failure = error; transaction.abort(); }
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(failure ?? new Error('Không lưu được tiến trình trên thiết bị. Kiểm tra dung lượng lưu trữ.'));
    transaction.onerror = () => { failure ??= transaction.error; };
  });
}
