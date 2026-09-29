import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Pause, Play, X } from 'lucide-react';
import { cn } from '@project/components/lib/utils';

export type PlayerVideo = { id: string; youTubeId: string; title: string; creatorName: string; thumbnailUrl: string };

type YTPlayer = { playVideo(): void; pauseVideo(): void; loadVideoById(id: string): void; destroy(): void };
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: { PLAYING: number } };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadApi() {
  if (window.YT?.Player) return Promise.resolve();
  apiPromise ??= new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve();
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(s);
  });
  return apiPromise;
}

type Ctx = {
  current: PlayerVideo | null;
  play: (v: PlayerVideo) => void;
  setAnchor: (videoId: string | null, el: HTMLElement | null) => void;
};
const PlayerContext = createContext<Ctx | null>(null);
export const usePlayer = () => useContext(PlayerContext)!;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState<PlayerVideo | null>(null);
  const [playing, setPlaying] = useState(false);
  const [anchor, setAnchorState] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);

  const play = useCallback(async (v: PlayerVideo) => {
    setCurrent(v);
    if (player.current) { player.current.loadVideoById(v.youTubeId); return; }
    await loadApi();
    const el = document.createElement('div');
    mountRef.current?.replaceChildren(el);
    player.current = new window.YT!.Player(el, {
      videoId: v.youTubeId,
      width: '100%', height: '100%',
      playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onReady: (e: { target: YTPlayer }) => e.target.playVideo(),
        onStateChange: (e: { data: number }) => setPlaying(e.data === window.YT!.PlayerState.PLAYING),
      },
    });
  }, []);

  const close = () => {
    player.current?.destroy();
    player.current = null;
    setCurrent(null);
    setPlaying(false);
  };

  const setAnchor = useCallback((id: string | null, el: HTMLElement | null) => {
    setAnchorState(id && el ? { id, el } : null);
  }, []);

  const docked = !!current && anchor?.id === current.id;

  useLayoutEffect(() => {
    if (!docked || !anchor) { setRect(null); return; }
    const measure = () => {
      const r = anchor.el.getBoundingClientRect();
      setRect({ top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(anchor.el);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [docked, anchor]);

  useEffect(() => () => player.current?.destroy(), []);

  const mini = !!current && !docked;

  return (
    <PlayerContext.Provider value={{ current, play, setAnchor }}>
      {children}
      {createPortal(
        <>
          {mini && current && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/v/${current.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/v/${current.id}`)}
              className="fixed bottom-[96px] left-3 z-50 flex h-[100px] w-[min(380px,calc(100vw-24px))] cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-2 pl-[165px] shadow-2xl backdrop-blur-xl transition hover:border-primary/40 xl:bottom-4"
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{current.title}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{current.creatorName}</p>
              </div>
              <button
                aria-label={playing ? 'Pause' : 'Lecture'}
                onClick={(e) => { e.stopPropagation(); if (playing) player.current?.pauseVideo(); else player.current?.playVideo(); }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-95"
              >
                {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
              </button>
              <button
                aria-label="Fermer le lecteur"
                onClick={(e) => { e.stopPropagation(); close(); }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div
            style={docked && rect ? { position: 'absolute', ...rect } : undefined}
            className={cn(
              'overflow-hidden bg-black',
              !current && 'hidden',
              docked ? 'z-30 rounded-2xl' : 'fixed bottom-[104px] left-5 z-[51] h-[84px] w-[149px] rounded-xl xl:bottom-6',
            )}
          >
            <div ref={mountRef} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
            {mini && current && (
              <button aria-label="Revenir à la vidéo" onClick={() => navigate(`/v/${current.id}`)} className="absolute inset-0" />
            )}
          </div>
        </>,
        document.body,
      )}
    </PlayerContext.Provider>
  );
}
