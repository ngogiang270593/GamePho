export interface LobbyRoom {
  code: string;
  phase: 'waiting' | 'ready';
  members: { name: string; avatar: string; ready: boolean; connected: boolean; isHost?: boolean }[];
  count: number;
  maxPlayers: number;
}

export type RealtimeStatus = 'connected' | 'reconnecting' | 'missing';

function updateAtPath(current: unknown, path: string, value: unknown) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return value;
  const root = current && typeof current === 'object' && !Array.isArray(current)
    ? { ...(current as Record<string, unknown>) }
    : {};
  let cursor = root;
  for (const part of parts.slice(0, -1)) {
    const child = cursor[part];
    cursor[part] = child && typeof child === 'object' && !Array.isArray(child)
      ? { ...(child as Record<string, unknown>) }
      : {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  const key = parts[parts.length - 1];
  if (value === null) delete cursor[key];
  else cursor[key] = value;
  return root;
}

function openStream(path: string, onChange: (data: unknown) => void, onConnection: (status: RealtimeStatus) => void) {
  let current: unknown;
  let stream: EventSource | null = null;
  let retryTimer = 0;
  let stopped = false;
  async function connect() {
    if (typeof EventSource === 'undefined') {
      onConnection('missing');
      return;
    }
    try {
      const response = await fetch('/api/realtime-config', { credentials: 'same-origin', cache: 'no-store' });
      const result = await response.json() as { databaseUrl?: string };
      if (!response.ok || !result.databaseUrl || !/^https:\/\/[a-z0-9.-]+$/i.test(result.databaseUrl)) {
        onConnection('missing');
        if (!stopped) retryTimer = window.setTimeout(() => void connect(), 15000);
        return;
      }
      if (stopped) return;
      stream = new EventSource(`${result.databaseUrl.replace(/\/+$/, '')}/${path}.json`);
      stream.addEventListener('put', receive);
      stream.addEventListener('patch', receive);
      stream.onopen = () => onConnection('connected');
      stream.onerror = () => onConnection('reconnecting');
    } catch {
      onConnection('reconnecting');
      if (!stopped) retryTimer = window.setTimeout(() => void connect(), 5000);
    }
  }
  const receive = (event: Event) => {
    try {
      const message = JSON.parse((event as MessageEvent<string>).data) as { path?: string; data?: unknown };
      const relativePath = message.path ?? '/';
      if (event.type === 'put' || relativePath === '/') current = updateAtPath(current, relativePath, message.data);
      else if (message.data && typeof message.data === 'object' && !Array.isArray(message.data)) {
        for (const [key, value] of Object.entries(message.data as Record<string, unknown>)) {
          current = updateAtPath(current, `${relativePath}/${key}`, value);
        }
      } else current = updateAtPath(current, relativePath, message.data);
      onChange(current);
    } catch {
      onConnection('reconnecting');
    }
  };
  void connect();
  return () => {
    stopped = true;
    window.clearTimeout(retryTimer);
    stream?.close();
  };
}

export function watchRoom(code: string, onChange: () => void, onConnection: (status: RealtimeStatus) => void) {
  return openStream(`rooms/${encodeURIComponent(code)}/public`, onChange, onConnection);
}

export function watchLobby(onChange: (rooms: LobbyRoom[]) => void, onConnection: (status: RealtimeStatus) => void) {
  return openStream('lobby', value => {
    const rooms = value && typeof value === 'object' ? Object.values(value as Record<string, LobbyRoom>) : [];
    onChange(rooms.filter(room => room && /^[A-HJ-NP-Z2-9]{6}$/.test(room.code)));
  }, onConnection);
}
