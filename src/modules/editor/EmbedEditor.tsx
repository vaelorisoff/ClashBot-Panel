import { ArrowDown, ArrowUp, Clock, Copy, Link2, Palette, Plus, Trash2, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@project/components/ui/popover';
import { Input } from '@project/components/ui/input';
import { cn } from '@project/components/lib/utils';
import { LIMITS, type Embed } from '../../types/message';
import { colorToHex, hexToColor } from '../../utils/format';
import { EditableText, ImageSlot } from './Editable';

const SWATCHES = ['#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245', '#f47b67', '#ffffff', '#99aab5', '#2b2d31'];

function ToolBtn({ label, onClick, children, active }: { label: string; onClick?: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      className={cn('flex h-7 w-7 items-center justify-center rounded-md text-[hsl(var(--discord-muted))] transition hover:bg-white/10 hover:text-white', active && 'bg-primary/25 text-white')}>
      {children}
    </button>
  );
}

export function EmbedEditor({ embed, onChange, onRemove, onDuplicate, onMove, index, count, timeZone }: {
  embed: Embed; onChange: (e: Embed) => void; onRemove: () => void; onDuplicate: () => void; onMove: (d: -1 | 1) => void;
  index: number; count: number; timeZone: string;
}) {
  const set = (p: Partial<Embed>) => onChange({ ...embed, ...p });
  const color = colorToHex(embed.color) || '#202225';
  const setField = (i: number, p: Partial<Embed['fields'][number]>) => set({ fields: embed.fields.map((f, j) => (j === i ? { ...f, ...p } : f)) });
  const ts = embed.timestamp === 'now' ? new Date() : embed.timestamp ? new Date(embed.timestamp) : null;

  return (
    <div className="group/embed relative max-w-[520px]">
      <div className="absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded-lg border border-white/10 bg-[hsl(var(--discord-embed))] p-0.5 opacity-0 shadow-lg transition group-hover/embed:opacity-100 group-focus-within/embed:opacity-100">
        <Popover>
          <PopoverTrigger asChild><span><ToolBtn label="Couleur"><Palette className="h-4 w-4" /></ToolBtn></span></PopoverTrigger>
          <PopoverContent className="w-56 space-y-3">
            <div className="grid grid-cols-9 gap-1.5">{SWATCHES.map((s) => <button key={s} type="button" aria-label={s} onClick={() => set({ color: hexToColor(s) })} className="h-5 w-5 rounded-full ring-1 ring-border" style={{ background: s }} />)}</div>
            <div className="flex gap-2"><input type="color" value={color} onChange={(e) => set({ color: hexToColor(e.target.value) })} className="h-9 w-10 cursor-pointer rounded border bg-transparent" />
              <Input value={embed.color == null ? '' : color} placeholder="#hexa" onChange={(e) => set({ color: hexToColor(e.target.value) })} /></div>
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => set({ color: null })}>Sans couleur</button>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild><span><ToolBtn label="Lien du titre" active={!!embed.url}><Link2 className="h-4 w-4" /></ToolBtn></span></PopoverTrigger>
          <PopoverContent className="w-72 space-y-2">
            <p className="text-xs font-medium">Lien du titre</p><Input value={embed.url ?? ''} placeholder="https://…" onChange={(e) => set({ url: e.target.value || undefined })} />
            <p className="text-xs font-medium">Lien de l'auteur</p><Input value={embed.author?.url ?? ''} placeholder="https://…" onChange={(e) => set({ author: { name: embed.author?.name ?? '', iconUrl: embed.author?.iconUrl, url: e.target.value || undefined } })} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild><span><ToolBtn label="Horodatage" active={!!embed.timestamp}><Clock className="h-4 w-4" /></ToolBtn></span></PopoverTrigger>
          <PopoverContent className="w-72 space-y-2">
            <p className="text-xs font-medium">Horodatage du pied de page</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <button type="button" className={cn('rounded-md border px-2 py-1', !embed.timestamp && 'border-primary text-primary')} onClick={() => set({ timestamp: null })}>Aucun</button>
              <button type="button" className={cn('rounded-md border px-2 py-1', embed.timestamp === 'now' && 'border-primary text-primary')} onClick={() => set({ timestamp: 'now' })}>Heure d'envoi</button>
            </div>
            <Input type="datetime-local" value={embed.timestamp && embed.timestamp !== 'now' ? embed.timestamp.slice(0, 16) : ''} onChange={(e) => set({ timestamp: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </PopoverContent>
        </Popover>
        <ToolBtn label="Monter" onClick={() => index > 0 && onMove(-1)}><ArrowUp className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Descendre" onClick={() => index < count - 1 && onMove(1)}><ArrowDown className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Dupliquer l'embed" onClick={onDuplicate}><Copy className="h-4 w-4" /></ToolBtn>
        <ToolBtn label="Supprimer l'embed" onClick={onRemove}><Trash2 className="h-4 w-4" /></ToolBtn>
      </div>

      <div className="flex overflow-hidden rounded bg-[hsl(var(--discord-embed))]">
        <div className="w-1 shrink-0" style={{ background: embed.color == null ? 'hsl(var(--discord-bg))' : color }} />
        <div className="min-w-0 flex-1 p-3 pr-4">
          <div className="flex gap-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <ImageSlot shape="circle" className="h-6 w-6" label="Icône de l'auteur" purpose="embed-author" value={embed.author?.iconUrl}
                  onChange={(u) => set({ author: { name: embed.author?.name ?? '', url: embed.author?.url, iconUrl: u } })} />
                <EditableText className="flex-1 text-sm font-semibold text-white" placeholder="Auteur" max={LIMITS.author} value={embed.author?.name ?? ''}
                  onChange={(v) => set({ author: v || embed.author?.iconUrl ? { name: v, url: embed.author?.url, iconUrl: embed.author?.iconUrl } : null })} />
              </div>
              <EditableText className={cn('text-base font-semibold', embed.url ? 'text-[hsl(var(--discord-link))]' : 'text-white')} placeholder="Titre de l'embed" max={LIMITS.title}
                value={embed.title ?? ''} onChange={(v) => set({ title: v || undefined })} />
              <EditableText multiline markdown timeZone={timeZone} className="text-sm leading-[1.375rem] text-[hsl(var(--discord-text))]" placeholder="Description — Markdown, variables et horodatages acceptés"
                max={LIMITS.description} value={embed.description ?? ''} onChange={(v) => set({ description: v || undefined })} />
            </div>
            <ImageSlot shape="square" className="h-20 w-20" label="Miniature" purpose="embed-thumbnail" value={embed.thumbnailUrl} onChange={(u) => set({ thumbnailUrl: u })} />
          </div>

          {embed.fields.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-2">
              {embed.fields.map((f, i) => (
                <div key={i} className={cn('group/field relative min-w-0 rounded', f.inline ? 'col-span-1' : 'col-span-3')}>
                  <div className="absolute -right-1 -top-1 z-10 hidden gap-0.5 rounded bg-black/60 p-0.5 group-hover/field:flex">
                    <button type="button" title={f.inline ? 'Pleine largeur' : 'En ligne'} onClick={() => setField(i, { inline: !f.inline })} className="rounded px-1 text-[10px] text-white hover:bg-white/10">{f.inline ? '⇥' : '▤'}</button>
                    <button type="button" title="Supprimer le champ" onClick={() => set({ fields: embed.fields.filter((_, j) => j !== i) })} className="rounded p-0.5 text-white hover:bg-white/10"><X className="h-3 w-3" /></button>
                  </div>
                  <EditableText className="text-sm font-semibold text-white" placeholder="Nom du champ" max={LIMITS.fieldName} value={f.name} onChange={(v) => setField(i, { name: v })} />
                  <EditableText multiline markdown timeZone={timeZone} className="text-sm text-[hsl(var(--discord-text))]" placeholder="Valeur" max={LIMITS.fieldValue} value={f.value} onChange={(v) => setField(i, { value: v })} />
                </div>
              ))}
            </div>
          )}
          {embed.fields.length < LIMITS.fields && (
            <button type="button" onClick={() => set({ fields: [...embed.fields, { name: '', value: '', inline: true }] })}
              className="mt-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[hsl(var(--discord-muted))] opacity-0 transition hover:bg-white/5 hover:text-white group-hover/embed:opacity-100">
              <Plus className="h-3.5 w-3.5" />Ajouter un champ ({embed.fields.length}/{LIMITS.fields})
            </button>
          )}

          <ImageSlot shape="wide" className="mt-3 aspect-[16/9] w-full max-w-[400px]" label="Image principale" purpose="embed-image" value={embed.imageUrl} onChange={(u) => set({ imageUrl: u })} />

          <div className="mt-2 flex items-center gap-2 text-xs text-[hsl(var(--discord-muted))]">
            <ImageSlot shape="circle" className="h-5 w-5" label="Icône du pied de page" purpose="embed-footer" value={embed.footer?.iconUrl}
              onChange={(u) => set({ footer: { text: embed.footer?.text ?? '', iconUrl: u } })} />
            <EditableText className="min-w-0 flex-1" placeholder="Pied de page" max={LIMITS.footer} value={embed.footer?.text ?? ''}
              onChange={(v) => set({ footer: v || embed.footer?.iconUrl ? { text: v, iconUrl: embed.footer?.iconUrl } : null })} />
            {ts && <span className="shrink-0">• {new Intl.DateTimeFormat('fr-FR', { timeZone, dateStyle: 'short', timeStyle: 'short' }).format(ts)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
