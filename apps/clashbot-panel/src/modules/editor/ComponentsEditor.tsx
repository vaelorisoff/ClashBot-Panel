import { Plus, Trash2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@project/components/ui/popover';
import { Input } from '@project/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Button } from '@project/components/ui/button';
import { cn } from '@project/components/lib/utils';
import { LIMITS, type ActionRow, type ButtonStyle, type MessageButton, type SelectMenu } from '../../types/message';

const STYLE_CLASS: Record<ButtonStyle, string> = {
  primary: 'bg-[#5865f2] text-white', secondary: 'bg-[#4e5058] text-white', success: 'bg-[#248046] text-white', danger: 'bg-[#da373c] text-white', link: 'bg-[#4e5058] text-white',
};
const STYLE_LABEL: Record<ButtonStyle, string> = { primary: 'Principal', secondary: 'Secondaire', success: 'Succès', danger: 'Danger', link: 'Lien' };

function ButtonChip({ b, onChange, onRemove }: { b: MessageButton; onChange: (b: MessageButton) => void; onRemove: () => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={cn('inline-flex h-8 items-center gap-1.5 rounded-[3px] px-4 text-sm font-medium transition hover:brightness-110', STYLE_CLASS[b.style], b.disabled && 'opacity-50')}>
          {b.emoji && <span>{b.emoji}</span>}{b.label || <span className="italic opacity-70">Bouton</span>}{b.style === 'link' && <span className="text-xs">↗</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3">
        <Input placeholder="Libellé" maxLength={LIMITS.buttonLabel} value={b.label} onChange={(e) => onChange({ ...b, label: e.target.value })} />
        <div className="flex gap-2">
          <Input className="w-20" placeholder="Emoji" value={b.emoji ?? ''} onChange={(e) => onChange({ ...b, emoji: e.target.value || undefined })} />
          <Select value={b.style} onValueChange={(s) => onChange({ ...b, style: s as ButtonStyle })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(STYLE_LABEL) as ButtonStyle[]).map((s) => <SelectItem key={s} value={s}>{STYLE_LABEL[s]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {b.style === 'link'
          ? <Input placeholder="https://…" value={b.url ?? ''} onChange={(e) => onChange({ ...b, url: e.target.value })} />
          : <Input placeholder="Identifiant d'action (custom_id)" value={b.customId ?? ''} onChange={(e) => onChange({ ...b, customId: e.target.value })} />}
        <div className="flex justify-between">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!b.disabled} onChange={(e) => onChange({ ...b, disabled: e.target.checked })} />Désactivé</label>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onRemove}><Trash2 className="mr-1 h-4 w-4" />Retirer</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SelectChip({ s, onChange, onRemove }: { s: SelectMenu; onChange: (s: SelectMenu) => void; onRemove: () => void }) {
  const setOpt = (i: number, p: Partial<SelectMenu['options'][number]>) => onChange({ ...s, options: s.options.map((o, j) => (j === i ? { ...o, ...p } : o)) });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-10 w-full max-w-[400px] items-center justify-between rounded border border-black/30 bg-[#1e1f22] px-3 text-sm text-[hsl(var(--discord-muted))]">
          {s.placeholder || 'Choisir une option'}<span>▾</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 space-y-3">
        <Input placeholder="Texte indicatif" value={s.placeholder} onChange={(e) => onChange({ ...s, placeholder: e.target.value })} />
        <Input placeholder="Identifiant d'action (custom_id)" value={s.customId} onChange={(e) => onChange({ ...s, customId: e.target.value })} />
        <div className="max-h-60 space-y-2 overflow-y-auto">
          {s.options.map((o, i) => (
            <div key={i} className="flex gap-1.5">
              <Input className="w-14" placeholder="😀" value={o.emoji ?? ''} onChange={(e) => setOpt(i, { emoji: e.target.value || undefined })} />
              <Input placeholder="Libellé" value={o.label} onChange={(e) => setOpt(i, { label: e.target.value })} />
              <Input placeholder="Valeur" value={o.value} onChange={(e) => setOpt(i, { value: e.target.value })} />
              <Button variant="ghost" size="icon" className="shrink-0" aria-label="Retirer l'option" onClick={() => onChange({ ...s, options: s.options.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          <Button variant="secondary" size="sm" disabled={s.options.length >= LIMITS.selectOptions} onClick={() => onChange({ ...s, options: [...s.options, { label: '', value: '' }] })}><Plus className="mr-1 h-4 w-4" />Option</Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onRemove}><Trash2 className="mr-1 h-4 w-4" />Retirer le menu</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ComponentsEditor({ rows, onChange }: { rows: ActionRow[]; onChange: (r: ActionRow[]) => void }) {
  const setRow = (i: number, r: ActionRow | null) => onChange(r ? rows.map((x, j) => (j === i ? r : x)) : rows.filter((_, j) => j !== i));
  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const isSelect = row.components[0]?.type === 'select';
        return (
          <div key={i} className="group/row flex flex-wrap items-center gap-2">
            {row.components.map((c, j) => c.type === 'button'
              ? <ButtonChip key={j} b={c} onChange={(b) => setRow(i, { components: row.components.map((x, k) => (k === j ? b : x)) })}
                  onRemove={() => setRow(i, row.components.length > 1 ? { components: row.components.filter((_, k) => k !== j) } : null)} />
              : <SelectChip key={j} s={c} onChange={(s) => setRow(i, { components: [s] })} onRemove={() => setRow(i, null)} />)}
            {!isSelect && row.components.length < LIMITS.buttonsPerRow && (
              <button type="button" aria-label="Ajouter un bouton" onClick={() => setRow(i, { components: [...row.components, { type: 'button', label: '', style: 'secondary' }] })}
                className="flex h-8 w-8 items-center justify-center rounded border border-dashed border-white/25 text-[hsl(var(--discord-muted))] opacity-0 transition hover:text-white group-hover/row:opacity-100"><Plus className="h-4 w-4" /></button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const newButtonRow = (): ActionRow => ({ components: [{ type: 'button', label: '', style: 'primary' }] });
export const newSelectRow = (): ActionRow => ({ components: [{ type: 'select', customId: '', placeholder: '', options: [{ label: '', value: '' }] }] });
