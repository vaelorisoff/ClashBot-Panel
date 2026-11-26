import { useState } from 'react';
import { Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@project/components/ui/popover';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Switch } from '@project/components/ui/switch';
import { services } from '../../services/clashbot';
import { useAction, useApi } from '../../hooks/useApi';
import type { SenderProfile } from '../../types/message';
import { ImageSlot } from './Editable';

/** En-tête du message dans l'aperçu : choix du profil d'expéditeur (bot ou profil personnalisé via webhook). */
export function SenderHeader({ value, onChange, enabled }: { value: string | null | undefined; onChange: (id: string | null) => void; enabled: boolean }) {
  const state = useApi(services.messages.senders, [], { enabled });
  const { run, pending } = useAction();
  const [draft, setDraft] = useState<Partial<SenderProfile> | null>(null);
  const list = state.data ?? [];
  const current = list.find((p) => p.id === value);
  const name = current?.name ?? 'ClashBot';

  const save = async () => {
    if (!draft?.name?.trim()) return;
    const r = await run(() => services.messages.saveSender({ ...draft, name: draft.name!.trim(), useWebhook: draft.useWebhook ?? true }), 'Profil enregistré.');
    if (r) { setDraft(null); await state.reload(true); onChange(r.id); }
  };

  const header = (
    <span className="flex items-baseline gap-2">
      <span className="font-medium text-white hover:underline">{name}</span>
      {!current || !current.useWebhook ? <span className="rounded bg-[#5865f2] px-1 text-[10px] font-semibold leading-4 text-white">APP</span> : null}
      <span className="text-xs text-[hsl(var(--discord-muted))]">Aujourd'hui à {new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}</span>
    </span>
  );

  return (
    <Popover>
      <PopoverTrigger asChild disabled={!enabled}>
        <button type="button" className="flex items-start gap-4 text-left" title={enabled ? 'Changer le profil d\'expéditeur' : undefined}>
          {current?.avatarUrl ? <img src={current.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{name.slice(0, 2).toUpperCase()}</span>}
          {header}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3">
        <p className="text-sm font-semibold">Profil d'expéditeur</p>
        {state.error && !state.data && <p className="text-xs text-muted-foreground">{state.error.message}</p>}
        <div className="max-h-56 space-y-1 overflow-y-auto">
          <button type="button" onClick={() => onChange(null)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
            <Check className={`h-4 w-4 text-primary ${value ? 'invisible' : ''}`} />ClashBot (compte du bot)
          </button>
          {list.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <button type="button" onClick={() => onChange(p.id)} className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                <Check className={`h-4 w-4 text-primary ${value === p.id ? '' : 'invisible'}`} />
                {p.avatarUrl && <img src={p.avatarUrl} alt="" className="h-5 w-5 rounded-full" />}<span className="truncate">{p.name}</span>
                {p.useWebhook && <span className="ml-auto text-[10px] text-muted-foreground">webhook</span>}
              </button>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Modifier" onClick={() => setDraft(p)}>✎</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label="Supprimer"
                onClick={() => run(() => services.messages.removeSender(p.id), 'Profil supprimé.').then((r) => { if (r) { if (value === p.id) onChange(null); state.reload(true); } })}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        {draft ? (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <ImageSlot shape="circle" className="h-10 w-10" label="Avatar" purpose="sender-avatar" value={draft.avatarUrl ?? undefined} onChange={(u) => setDraft({ ...draft, avatarUrl: u ?? null })} />
              <Input placeholder="Nom affiché" value={draft.name ?? ''} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <label className="flex items-center justify-between text-sm">Envoyer via webhook<Switch checked={draft.useWebhook ?? true} onCheckedChange={(v) => setDraft({ ...draft, useWebhook: v })} /></label>
            <p className="text-[11px] text-muted-foreground">Discord n'autorise un nom et un avatar personnalisés que via un webhook créé par le bot.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Annuler</Button>
              <Button size="sm" onClick={save} disabled={pending || !draft.name?.trim()}>{pending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Enregistrer</Button>
            </div>
          </div>
        ) : <Button variant="secondary" size="sm" className="w-full" onClick={() => setDraft({ name: '', useWebhook: true })}><Plus className="mr-1.5 h-4 w-4" />Nouveau profil</Button>}
      </PopoverContent>
    </Popover>
  );
}
