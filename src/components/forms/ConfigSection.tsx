import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { services, type ConfigValues } from '../../services/clashbot';
import { useAction, useApi } from '../../hooks/useApi';
import { useGuildMeta } from '../common/Guild';
import { DataState, LoadingBlock } from '../common/States';
import { Panel } from '../common/Layout';
import { FieldRow, type FieldDef } from './Fields';

export type ConfigGroup = { title: string; description?: string; fields: FieldDef[] };

/** Formulaire de configuration propre à UN serveur. Valeur absente = « Non configuré » (aucune valeur par défaut imposée). */
export function ConfigSection({ guildId, section, groups, intro }: { guildId: string; section: string; groups: ConfigGroup[]; intro?: React.ReactNode }) {
  const state = useApi(() => services.guildConfig.get(guildId, section), [guildId, section]);
  const meta = useGuildMeta(guildId);
  const [draft, setDraft] = useState<ConfigValues>({});
  const { run, pending } = useAction();

  useEffect(() => { if (state.data) setDraft(state.data); }, [state.data]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.data ?? {});
  const missingRequired = groups.flatMap((g) => g.fields).filter((f) => f.required && draft[f.key] == null);

  const save = async () => {
    const saved = await run(() => services.guildConfig.save(guildId, section, draft), 'Configuration enregistrée sur le serveur.');
    if (saved) state.setData(saved);
  };

  return (
    <DataState state={state} skeleton={<LoadingBlock rows={6} />}>
      {() => (
        <div className="space-y-5">
          {intro}
          {groups.map((g) => (
            <Panel key={g.title} title={g.title} description={g.description}>
              <div className="grid gap-5 sm:grid-cols-2">
                {g.fields.map((f) => (
                  <FieldRow key={f.key} def={f} value={draft[f.key] ?? null} meta={meta.data} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} />
                ))}
              </div>
            </Panel>
          ))}
          <div className="sticky bottom-4 z-10 flex justify-end">
            <div className={`flex items-center gap-2 rounded-xl border bg-card/95 p-2 shadow-lg backdrop-blur transition ${dirty ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
              <span className="px-2 text-sm text-muted-foreground">{missingRequired.length ? `${missingRequired.length} champ(s) requis` : 'Modifications non enregistrées'}</span>
              <Button variant="ghost" size="sm" onClick={() => setDraft(state.data ?? {})}><RotateCcw className="mr-1.5 h-4 w-4" />Annuler</Button>
              <Button size="sm" onClick={save} disabled={pending || !!missingRequired.length}>
                {pending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </DataState>
  );
}
