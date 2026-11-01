import { afterEach, describe, expect, it, vi } from 'vitest';

class FakeEventSource {
  static latest: FakeEventSource;
  readonly listeners = new Map<string, EventListener[]>();
  closed = false;
  onopen: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  constructor(readonly url: string) { FakeEventSource.latest = this; }
  addEventListener(type: string, listener: EventListener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  close() { this.closed = true; }
  emit(type: string, value: unknown) {
    const event = new MessageEvent(type, { data: JSON.stringify(value) });
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Firebase Realtime Database event stream', () => {
  it('applies lobby updates and removals from partial SSE events', async () => {
    vi.stubGlobal('EventSource', FakeEventSource);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      databaseUrl: 'https://xnl-test-default-rtdb.firebaseio.com',
    })));
    const { watchLobby } = await import('./firebaseRealtime');
    const updates: string[][] = [];
    const statuses: string[] = [];
    const stop = watchLobby(rooms => updates.push(rooms.map(room => room.code)), status => statuses.push(status));
    await vi.waitFor(() => expect(FakeEventSource.latest).toBeTruthy());
    const stream = FakeEventSource.latest;
    stream.onopen?.(new Event('open'));

    stream.emit('put', { path: '/', data: {} });
    stream.emit('patch', {
      path: '/ABC234',
      data: { code: 'ABC234', phase: 'waiting', members: [], count: 1, maxPlayers: 4 },
    });
    stream.emit('patch', {
      path: '/DEF567',
      data: { code: 'DEF567', phase: 'ready', members: [], count: 2, maxPlayers: 4 },
    });
    stream.emit('patch', { path: '/ABC234', data: null });

    expect(stream.url).toBe('https://xnl-test-default-rtdb.firebaseio.com/lobby.json');
    expect(statuses).toContain('connected');
    expect(updates).toEqual([[], ['ABC234'], ['ABC234', 'DEF567'], ['DEF567']]);
    stop();
    expect(stream.closed).toBe(true);
  });
});
