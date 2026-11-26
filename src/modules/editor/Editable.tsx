import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@project/components/ui/popover';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';
import { cn } from '@project/components/lib/utils';
import { errorText, uploadFile } from '../../services/http';
import { DiscordMarkdown } from './DiscordMarkdown';

/** Texte modifiable directement dans l'aperçu : clic → saisie, sortie du champ → validation. */
export function EditableText({ value, onChange, placeholder, multiline, markdown, max, className, inputClassName, timeZone }: {
  value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean; markdown?: boolean; max?: number;
  className?: string; inputClassName?: string; timeZone?: string;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (editing && el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
  }, [editing]);
  if (editing) {
    return (
      <div className="relative">
        <textarea ref={ref} value={value} maxLength={max} rows={1} placeholder={placeholder}
          onChange={(e) => { onChange(multiline ? e.target.value : e.target.value.replace(/[\r\n]/g, '')); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Escape' || (!multiline && e.key === 'Enter')) { e.preventDefault(); setEditing(false); } }}
          className={cn('w-full resize-none overflow-hidden rounded bg-black/25 px-1 outline-none ring-1 ring-primary/70', inputClassName)} />
        {max && <span className={cn('absolute -bottom-4 right-0 text-[10px]', value.length > max * 0.9 ? 'text-destructive' : 'text-[hsl(var(--discord-muted))]')}>{value.length}/{max}</span>}
      </div>
    );
  }
  return (
    <div role="button" tabIndex={0} onClick={() => setEditing(true)} onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
      className={cn('-mx-1 cursor-text rounded px-1 outline-none ring-primary/50 transition hover:bg-white/5 hover:ring-1 focus-visible:ring-1', className)}>
      {value ? (markdown ? <DiscordMarkdown text={value} timeZone={timeZone} /> : value) : <span className="italic text-[hsl(var(--discord-muted))] opacity-70">{placeholder}</span>}
    </div>
  );
}

/** Zone d'image aux dimensions et formes du rendu Discord (miniature, image, icône d'auteur, pied de page, avatar). */
export function ImageSlot({ value, onChange, shape, label, className, purpose }: {
  value?: string; onChange: (url: string | undefined) => void; shape: 'circle' | 'square' | 'wide'; label: string; className?: string; purpose: string;
}) {
  const [url, setUrl] = useState(value ?? '');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setUrl(value ?? ''), [value]);
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try { const r = await uploadFile(file, purpose); onChange(r.url); setOpen(false); }
    catch (e) { toast.error(errorText(e)); } finally { setBusy(false); }
  };
  const radius = shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-md' : 'rounded-lg';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" title={label} className={cn('group relative shrink-0 overflow-hidden outline-none', radius, className,
          value ? 'ring-primary/60 hover:ring-2' : 'border border-dashed border-white/25 bg-white/[0.03] hover:border-primary/70 hover:bg-primary/10')}>
          {value ? <img src={value} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.opacity = '0.2'; }} />
            : <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-[hsl(var(--discord-muted))]"><ImagePlus className={shape === 'wide' ? 'h-6 w-6' : 'h-3.5 w-3.5'} />{shape === 'wide' && <span className="text-xs">{label}</span>}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3">
        <p className="text-sm font-semibold">{label}</p>
        <div className="flex gap-2">
          <div className="relative flex-1"><Link2 className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-8" placeholder="https://… ou {variable}" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => { onChange(url.trim() || undefined); setOpen(false); }}>OK</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild className="flex-1" disabled={busy}>
            <label className="cursor-pointer">{busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Upload className="mr-1.5 h-4 w-4" />}Importer un fichier
              <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          </Button>
          {value && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { onChange(undefined); setOpen(false); }}><Trash2 className="mr-1.5 h-4 w-4" />Retirer</Button>}
        </div>
        <p className="text-xs text-muted-foreground">L'import utilise le stockage du backend ClashBot (POST /uploads).</p>
      </PopoverContent>
    </Popover>
  );
}
