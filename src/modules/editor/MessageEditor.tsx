import { AlertTriangle, LayoutList, ListPlus, SquarePlus } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { cn } from '@project/components/lib/utils';
import { useApp } from '../../contexts/AppContext';
import { emptyEmbed, embedLength, LIMITS, type DiscordMessage } from '../../types/message';
import { EditableText } from './Editable';
import { EmbedEditor } from './EmbedEditor';
import { ComponentsEditor, newButtonRow, newSelectRow } from './ComponentsEditor';
import { COMMON_VARIABLES, TimestampTool, VariablesMenu, type Variable } from './Tools';
import { LibraryDialog } from './Library';
import { ImportExistingDialog, JsonDialog } from './ImportDialogs';
import { SenderHeader } from './SenderHeader';

export type EditorFeatures = { embeds?: boolean; components?: boolean; sender?: boolean; library?: boolean; importExisting?: boolean };

export function validateMessage(m: DiscordMessage): string[] {
  const errs: string[] = [];
  if (!m.content.trim() && !m.embeds.length) errs.push('Le message est vide : ajoutez du texte ou un embed.');
  if (m.content.length > LIMITS.content) errs.push(`Le contenu dépasse ${LIMITS.content} caractères.`);
  const total = m.embeds.reduce((n, e) => n + embedLength(e), 0);
  if (total > LIMITS.total) errs.push(`Les embeds dépassent ${LIMITS.total} caractères au total.`);
  m.embeds.forEach((e, i) => {
    if (!e.title && !e.description && !e.fields.length && !e.imageUrl && !e.thumbnailUrl && !e.author?.name) errs.push(`L'embed ${i + 1} est vide.`);
    e.fields.forEach((f, j) => { if (!f.name.trim() || !f.value.trim()) errs.push(`Embed ${i + 1}, champ ${j + 1} : nom et valeur requis.`); });
  });
  m.rows.forEach((r, i) => r.components.forEach((c) => {
    if (c.type === 'button' && !c.label && !c.emoji) errs.push(`Rangée ${i + 1} : un bouton n'a ni libellé ni emoji.`);
    if (c.type === 'button' && c.style === 'link' && !/^https?:\/\//.test(c.url ?? '')) errs.push(`Rangée ${i + 1} : un bouton lien n'a pas d'URL valide.`);
    if (c.type === 'button' && c.style !== 'link' && !c.customId) errs.push(`Rangée ${i + 1} : un bouton n'a pas d'identifiant d'action.`);
    if (c.type === 'select' && (!c.customId || c.options.some((o) => !o.label || !o.value))) errs.push(`Rangée ${i + 1} : menu incomplet.`);
  }));
  return errs;
}

/**
 * Éditeur de messages commun à tous les modules (annonces, arrivées, départs, règlements, assistance, notifications…).
 * L'aperçu Discord EST l'éditeur : chaque élément se modifie directement en cliquant dessus.
 */
export default function MessageEditor({ value, onChange, guildId, module, variables = [], features = {}, onLoadExisting }: {
  value: DiscordMessage; onChange: (m: DiscordMessage) => void; guildId?: string | null; module?: string;
  variables?: Variable[]; features?: EditorFeatures;
  onLoadExisting?: (ref: { channelId: string; messageId: string }) => void;
}) {
  const { timezone, apiConfigured } = useApp();
  const f = { embeds: true, components: true, sender: true, library: true, importExisting: false, ...features };
  const set = (p: Partial<DiscordMessage>) => onChange({ ...value, ...p });
  const vars = [...variables, ...COMMON_VARIABLES.filter((c) => !variables.some((v) => v.key === c.key))];
  const insert = (t: string) => set({ content: value.content + (value.content && !value.content.endsWith(' ') ? ' ' : '') + t });
  const errors = validateMessage(value);
  const moveEmbed = (i: number, d: -1 | 1) => { const e = [...value.embeds]; [e[i], e[i + d]] = [e[i + d], e[i]]; set({ embeds: e }); };

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
        {f.embeds && <Button variant="outline" size="sm" disabled={value.embeds.length >= LIMITS.embeds} onClick={() => set({ embeds: [...value.embeds, emptyEmbed()] })}><SquarePlus className="mr-1.5 h-4 w-4" />Embed</Button>}
        {f.components && <>
          <Button variant="outline" size="sm" disabled={value.rows.length >= LIMITS.rows} onClick={() => set({ rows: [...value.rows, newButtonRow()] })}><ListPlus className="mr-1.5 h-4 w-4" />Boutons</Button>
          <Button variant="outline" size="sm" disabled={value.rows.length >= LIMITS.rows} onClick={() => set({ rows: [...value.rows, newSelectRow()] })}><LayoutList className="mr-1.5 h-4 w-4" />Menu</Button>
        </>}
        <VariablesMenu variables={vars} onInsert={insert} />
        <TimestampTool timeZone={timezone} onInsert={insert} />
        <div className="ml-auto flex flex-wrap gap-2">
          {f.library && guildId && <LibraryDialog guildId={guildId} module={module} current={value} onLoad={onChange} />}
          {f.importExisting && guildId && <ImportExistingDialog guildId={guildId} onLoad={(m, ref) => { onChange(m); onLoadExisting?.(ref); }} />}
          <JsonDialog value={value} onLoad={onChange} />
        </div>
      </div>

      <div className="bg-[hsl(var(--discord-bg))] px-4 py-5 font-sans text-[15px] leading-[1.375rem] text-[hsl(var(--discord-text))] sm:px-6">
        <SenderHeader enabled={f.sender && apiConfigured} value={value.senderProfileId} onChange={(id) => set({ senderProfileId: id })} />
        <div className="space-y-3 pl-14">
          <EditableText multiline markdown timeZone={timezone} max={LIMITS.content} placeholder="Cliquez ici pour écrire le message…" value={value.content} onChange={(v) => set({ content: v })} />
          {value.embeds.map((e, i) => (
            <EmbedEditor key={i} embed={e} index={i} count={value.embeds.length} timeZone={timezone}
              onChange={(ne) => set({ embeds: value.embeds.map((x, j) => (j === i ? ne : x)) })}
              onRemove={() => set({ embeds: value.embeds.filter((_, j) => j !== i) })}
              onDuplicate={() => value.embeds.length < LIMITS.embeds && set({ embeds: [...value.embeds.slice(0, i + 1), structuredClone(e), ...value.embeds.slice(i + 1)] })}
              onMove={(d) => moveEmbed(i, d)} />
          ))}
          {f.components && <ComponentsEditor rows={value.rows} onChange={(rows) => set({ rows })} />}
        </div>
      </div>

      <div className={cn('flex items-start gap-2 border-t px-4 py-2.5 text-xs', errors.length ? 'text-warning' : 'text-muted-foreground')}>
        {errors.length ? <><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{errors.join(' · ')}</span></>
          : <span>{value.content.length}/{LIMITS.content} caractères · {value.embeds.length}/{LIMITS.embeds} embeds · {value.rows.length}/{LIMITS.rows} rangées · fuseau {timezone}</span>}
      </div>
    </div>
  );
}
