import { useState } from 'react';
import { Copy, Download, FileStack, Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { services } from '../../services/clashbot';
import { useAction, useApi } from '../../hooks/useApi';
import { DataState, EmptyState } from '../../components/common/States';
import { Confirm } from '../../components/common/Confirm';
import { fmtDate } from '../../utils/format';
import type { DiscordMessage, Template } from '../../types/message';

function List({ guildId, kind, module, current, onLoad }: { guildId: string; kind: 'templates' | 'drafts'; module?: string; current: DiscordMessage; onLoad: (m: DiscordMessage) => void }) {
  const state = useApi(() => services.messages.templates(guildId, kind), [guildId, kind]);
  const [name, setName] = useState('');
  const { run, pending } = useAction();
  const label = kind === 'templates' ? 'Modèle' : 'Brouillon';
  const save = (t: Partial<Template> & { name: string; message: DiscordMessage }, msg: string) =>
    run(() => services.messages.saveTemplate(guildId, kind, { id: t.id, name: t.name, module: module ?? t.module ?? null, message: t.message }), msg).then((r) => r && state.reload(true));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder={`Nom du ${label.toLowerCase()}`} value={name} onChange={(e) => setName(e.target.value)} />
        <Button disabled={!name.trim() || pending} onClick={() => save({ name: name.trim(), message: current }, `${label} enregistré.`).then(() => setName(''))}>
          {pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}Enregistrer le message actuel
        </Button>
      </div>
      <DataState state={state} isEmpty={(d) => !d.length} empty={<EmptyState title={`Aucun ${label.toLowerCase()}`} text="Enregistrez le message en cours pour le retrouver ici." />}>
        {(list) => (
          <div className="max-h-[50vh] divide-y overflow-y-auto rounded-xl border">
            {list.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.module ? `${t.module} · ` : ''}modifié {fmtDate(t.updatedAt)} · {t.message.embeds.length} embed(s)</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onLoad(structuredClone(t.message))}><Download className="mr-1.5 h-4 w-4" />Charger</Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Dupliquer" onClick={() => save({ name: `${t.name} (copie)`, message: t.message, module: t.module }, `${label} dupliqué.`)}><Copy className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Remplacer par le message actuel" onClick={() => save({ id: t.id, name: t.name, message: current, module: t.module }, `${label} mis à jour.`)}><Save className="h-4 w-4" /></Button>
                <Confirm title={`Supprimer « ${t.name} » ?`} onConfirm={() => run(() => services.messages.removeTemplate(guildId, kind, t.id), `${label} supprimé.`).then((r) => r && state.reload(true))}>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                </Confirm>
              </div>
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}

export function LibraryDialog({ guildId, module, current, onLoad }: { guildId: string; module?: string; current: DiscordMessage; onLoad: (m: DiscordMessage) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><FileStack className="mr-1.5 h-4 w-4" />Modèles et brouillons</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Modèles et brouillons</DialogTitle><DialogDescription>Enregistrés par serveur dans le backend ClashBot.</DialogDescription></DialogHeader>
          <Tabs defaultValue="drafts">
            <TabsList><TabsTrigger value="drafts">Brouillons</TabsTrigger><TabsTrigger value="templates">Modèles</TabsTrigger></TabsList>
            <TabsContent value="drafts" className="mt-4"><List guildId={guildId} kind="drafts" module={module} current={current} onLoad={(m) => { onLoad(m); setOpen(false); }} /></TabsContent>
            <TabsContent value="templates" className="mt-4"><List guildId={guildId} kind="templates" module={module} current={current} onLoad={(m) => { onLoad(m); setOpen(false); }} /></TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
