import { useEffect, useState } from 'react';
import { Loader2, Save, Send } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Switch } from '@project/components/ui/switch';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { services } from '../../services/clashbot';
import { useAction, useApi } from '../../hooks/useApi';
import { useGuildMeta } from '../../components/common/Guild';
import { FieldInput } from '../../components/forms/Fields';
import { DataState, LoadingBlock } from '../../components/common/States';
import { emptyMessage, type DiscordMessage } from '../../types/message';
import MessageEditor, { validateMessage, type EditorFeatures } from './MessageEditor';
import type { Variable } from './Tools';

/** Message automatique d'un module (arrivées, départs, règlement, assistance…) : propre à chaque serveur. */
export function ModuleMessageEditor({ guildId, module, variables, features, description }: { guildId: string; module: string; variables?: Variable[]; features?: EditorFeatures; description?: string }) {
  const state = useApi(() => services.messages.moduleMessage(guildId, module), [guildId, module]);
  const meta = useGuildMeta(guildId);
  const [enabled, setEnabled] = useState(false);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [message, setMessage] = useState<DiscordMessage>(emptyMessage());
  const { run, pending } = useAction();

  useEffect(() => {
    if (!state.data) return;
    setEnabled(state.data.enabled); setChannelId(state.data.channelId); setMessage(state.data.message ?? emptyMessage());
  }, [state.data]);
  const errors = enabled ? validateMessage(message) : [];
  const save = () => run(() => services.messages.saveModuleMessage(guildId, module, { enabled, channelId, message }), 'Message enregistré pour ce serveur.');

  return (
    <DataState state={state} skeleton={<LoadingBlock rows={5} />}>
      {() => (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4 rounded-2xl border bg-card p-4">
            <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={enabled} onCheckedChange={setEnabled} />{enabled ? 'Activé' : 'Désactivé'}</label>
            <div className="min-w-[220px] flex-1 space-y-1.5">
              <Label className="text-xs">Salon d'envoi</Label>
              <FieldInput def={{ key: 'channel', label: 'Salon', type: 'channel', channelTypes: ['text', 'announcement'] }} value={channelId} onChange={(v) => setChannelId((v as string) ?? null)} meta={meta.data} />
            </div>
            <Button onClick={save} disabled={pending || (enabled && (!channelId || errors.length > 0))}>{pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}Enregistrer</Button>
          </div>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <MessageEditor value={message} onChange={setMessage} guildId={guildId} module={module} variables={variables} features={features} />
        </div>
      )}
    </DataState>
  );
}

/** Composition + envoi réel (ou planification) par le bot. Le succès n'est affiché qu'après confirmation du backend. */
export function Composer({ guildId, initial, editingId, onDone, channelTypes = ['text', 'announcement'], submit, submitLabel = 'Envoyer', extra }: {
  guildId: string; initial?: DiscordMessage; editingId?: string | null; onDone?: () => void; channelTypes?: ('text' | 'announcement')[];
  submit?: (channelId: string, message: DiscordMessage) => Promise<unknown>; submitLabel?: string; extra?: React.ReactNode;
}) {
  const meta = useGuildMeta(guildId);
  const [message, setMessage] = useState<DiscordMessage>(initial ?? emptyMessage());
  const [channelId, setChannelId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState('');
  const [existing, setExisting] = useState<{ channelId: string; messageId: string } | null>(null);
  const { run, pending } = useAction();
  useEffect(() => { if (initial) setMessage(initial); }, [initial]);
  const errors = validateMessage(message);
  const scheduledFor = schedule ? new Date(schedule) : null;
  const scheduleInvalid = !!scheduledFor && scheduledFor.getTime() <= Date.now();

  const send = async () => {
    if (editingId) {
      const r = await run(() => services.messages.editPublished(guildId, editingId, message), 'Message publié mis à jour sur Discord.');
      if (r) onDone?.();
      return;
    }
    if (!channelId) return;
    const r = await run(() => (submit ? submit(channelId, message) : services.messages.send(guildId, { channelId, message, scheduledFor: scheduledFor?.toISOString() ?? null })),
      scheduledFor ? 'Envoi planifié par le backend.' : 'Message envoyé par ClashBot.');
    if (r) { setMessage(emptyMessage()); setSchedule(''); onDone?.(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4">
        {!editingId && (
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label className="text-xs">Salon</Label>
            <FieldInput def={{ key: 'c', label: 'Salon', type: 'channel', channelTypes }} value={channelId} onChange={(v) => setChannelId((v as string) ?? null)} meta={meta.data} />
          </div>
        )}
        {!editingId && !submit && (
          <div className="space-y-1.5">
            <Label className="text-xs">Planifier (facultatif)</Label>
            <Input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="w-56" />
          </div>
        )}
        {extra}
        <Button onClick={send} disabled={pending || errors.length > 0 || (!editingId && !channelId) || scheduleInvalid}>
          {pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
          {editingId ? 'Mettre à jour le message publié' : scheduledFor ? 'Planifier' : submitLabel}
        </Button>
      </div>
      {scheduleInvalid && <p className="text-sm text-destructive">La date de planification doit être dans le futur.</p>}
      {existing && !editingId && <p className="text-sm text-muted-foreground">Message récupéré depuis Discord : il sera envoyé comme nouveau message dans le salon choisi.</p>}
      <MessageEditor value={message} onChange={setMessage} guildId={guildId} features={{ importExisting: !editingId }} onLoadExisting={setExisting} />
    </div>
  );
}
