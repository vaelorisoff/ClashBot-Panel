import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { Loader2, Search } from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@project/components/ui/command';
import { services } from '../services/clashbot';
import { errorText } from '../services/http';
import { useApp } from '../contexts/AppContext';
import { NAV } from './nav';

type Hit = { type: string; id: string; label: string; sub?: string; href: string };

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [dq] = useDebounce(q, 300);
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { apiConfigured } = useApp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!apiConfigured || dq.trim().length < 2) { setHits([]); setError(''); return; }
    let live = true;
    setLoading(true);
    services.system.search(dq.trim()).then((r) => { if (live) { setHits(r); setError(''); } })
      .catch((e) => { if (live) { setHits([]); setError(errorText(e)); } })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [dq, apiConfigured]);

  const go = (href: string) => { setOpen(false); setQ(''); navigate(href); };
  const pages = NAV.flatMap((g) => g.items).filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));
  const groups = hits.reduce<Record<string, Hit[]>>((a, h) => ({ ...a, [h.type]: [...(a[h.type] ?? []), h] }), {});

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition hover:bg-muted">
        <Search className="h-4 w-4" /><span className="flex-1 truncate text-left">Rechercher un serveur, un membre, une commande…</span>
        <kbd className="hidden rounded border bg-background px-1.5 font-mono text-[10px] sm:inline">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher dans le panel…" value={q} onValueChange={setQ} />
        <CommandList>
          <CommandEmpty>{loading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Recherche…</span> : error || 'Aucun résultat.'}</CommandEmpty>
          {!!pages.length && (
            <CommandGroup heading="Pages">
              {pages.map((p) => <CommandItem key={p.to} value={`page-${p.label}`} onSelect={() => go(p.to)}><p.icon className="mr-2 h-4 w-4" />{p.label}</CommandItem>)}
            </CommandGroup>
          )}
          {Object.entries(groups).map(([type, list]) => (
            <CommandGroup key={type} heading={type}>
              {list.map((h) => (
                <CommandItem key={h.type + h.id} value={`${h.type}-${h.id}-${h.label}`} onSelect={() => go(h.href)}>
                  <span className="truncate">{h.label}</span>{h.sub && <span className="ml-2 truncate text-xs text-muted-foreground">{h.sub}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
