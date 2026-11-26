import { useState } from 'react';
import { Check, ChevronsUpDown, Hash, Volume2, X } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { Textarea } from '@project/components/ui/textarea';
import { Switch } from '@project/components/ui/switch';
import { Button } from '@project/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@project/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { cn } from '@project/components/lib/utils';
import { colorToHex } from '../../utils/format';
import { TIME_ZONES } from '../../utils/discordTime';
import type { DiscordChannel, DiscordRole } from '../../types/api';

export type FieldType = 'number' | 'integer' | 'money' | 'percent' | 'duration' | 'text' | 'textarea' | 'emoji' | 'boolean' | 'select'
  | 'channel' | 'channels' | 'role' | 'roles' | 'timezone' | 'time' | 'url';
export type FieldDef = {
  key: string; label: string; type: FieldType; hint?: string; options?: { value: string; label: string }[];
  min?: number; max?: number; channelTypes?: DiscordChannel['type'][]; wide?: boolean; required?: boolean;
};
export type Meta = { roles: DiscordRole[]; channels: DiscordChannel[] } | null;

const UNITS = [{ v: 1, l: 'secondes' }, { v: 60, l: 'minutes' }, { v: 3600, l: 'heures' }, { v: 86400, l: 'jours' }];

function DurationInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [unit, setUnit] = useState(() => (value ? [...UNITS].reverse().find((u) => value % u.v === 0)?.v ?? 1 : 60));
  return (
    <div className="flex gap-2">
      <Input type="number" min={0} placeholder="Non configuré" value={value == null ? '' : value / unit}
        onChange={(e) => onChange(e.target.value === '' ? null : Math.max(0, Number(e.target.value)) * unit)} />
      <Select value={String(unit)} onValueChange={(u) => { const nu = Number(u); if (value != null) onChange(Math.round((value / unit) * nu)); setUnit(nu); }}>
        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
        <SelectContent>{UNITS.map((u) => <SelectItem key={u.v} value={String(u.v)}>{u.l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function Picker({ multiple, items, value, onChange, placeholder }: {
  multiple: boolean; items: { id: string; label: string; icon?: React.ReactNode; color?: string }[];
  value: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const [q, setQ] = useState('');
  const chosen = items.filter((i) => value.includes(i.id));
  const shown = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())).slice(0, 200);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-auto min-h-10 w-full justify-between px-3 py-1.5 font-normal">
          <span className="flex min-w-0 flex-wrap gap-1">
            {chosen.length ? chosen.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs">
                {c.icon}{c.color && <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />}{c.label}
              </span>
            )) : <span className="text-sm italic text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-2" align="start">
        <Input autoFocus placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-2 h-8" />
        <div className="max-h-64 overflow-y-auto">
          {shown.map((i) => {
            const on = value.includes(i.id);
            return (
              <button key={i.id} type="button" onClick={() => onChange(multiple ? (on ? value.filter((x) => x !== i.id) : [...value, i.id]) : (on ? [] : [i.id]))}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent">
                <Check className={cn('h-4 w-4 text-primary', !on && 'invisible')} />
                {i.icon}{i.color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />}
                <span className="truncate">{i.label}</span>
              </button>
            );
          })}
          {!shown.length && <p className="px-2 py-4 text-center text-sm text-muted-foreground">Aucun résultat.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function FieldInput({ def, value, onChange, meta }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void; meta: Meta }) {
  const num = (v: string) => (v === '' ? null : def.type === 'integer' ? Math.trunc(Number(v)) : Number(v));
  switch (def.type) {
    case 'number': case 'integer': case 'money': case 'percent':
      return (
        <div className="relative">
          <Input type="number" min={def.min} max={def.max ?? (def.type === 'percent' ? 100 : undefined)} step={def.type === 'integer' ? 1 : 'any'}
            placeholder="Non configuré" value={value == null ? '' : String(value)} onChange={(e) => onChange(num(e.target.value))} className={def.type === 'percent' ? 'pr-8' : undefined} />
          {def.type === 'percent' && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>}
        </div>
      );
    case 'duration': return <DurationInput value={(value as number | null) ?? null} onChange={onChange} />;
    case 'text': case 'emoji': case 'url':
      return <Input type={def.type === 'url' ? 'url' : 'text'} placeholder="Non configuré" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} />;
    case 'time':
      return <Input type="time" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || null)} />;
    case 'textarea':
      return <Textarea rows={3} placeholder="Non configuré" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)} />;
    case 'boolean':
      return (
        <div className="flex h-10 items-center gap-3">
          <Switch checked={value === true} onCheckedChange={onChange} />
          <span className={cn('text-sm', value == null && 'italic text-muted-foreground')}>{value == null ? 'Non configuré' : value ? 'Activé' : 'Désactivé'}</span>
        </div>
      );
    case 'select': case 'timezone': {
      const opts = def.type === 'timezone' ? TIME_ZONES.map((z) => ({ value: z, label: z })) : def.options ?? [];
      return (
        <Select value={(value as string) ?? undefined} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder={<span className="italic text-muted-foreground">Non configuré</span>} /></SelectTrigger>
          <SelectContent className="max-h-72">{opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    case 'channel': case 'channels': {
      const items = (meta?.channels ?? []).filter((c) => c.type !== 'category' && (!def.channelTypes || def.channelTypes.includes(c.type)))
        .map((c) => ({ id: c.id, label: c.name, icon: c.type === 'voice' || c.type === 'stage' ? <Volume2 className="h-3.5 w-3.5 opacity-60" /> : <Hash className="h-3.5 w-3.5 opacity-60" /> }));
      const arr = def.type === 'channel' ? (value ? [value as string] : []) : ((value as string[]) ?? []);
      return <Picker multiple={def.type === 'channels'} items={items} value={arr} placeholder={meta ? 'Non configuré' : 'Salons indisponibles'}
        onChange={(v) => onChange(def.type === 'channel' ? v[0] ?? null : v.length ? v : null)} />;
    }
    case 'role': case 'roles': {
      const items = (meta?.roles ?? []).filter((r) => !r.managed && r.name !== '@everyone').map((r) => ({ id: r.id, label: r.name, color: r.color ? colorToHex(r.color) : undefined }));
      const arr = def.type === 'role' ? (value ? [value as string] : []) : ((value as string[]) ?? []);
      return <Picker multiple={def.type === 'roles'} items={items} value={arr} placeholder={meta ? 'Non configuré' : 'Rôles indisponibles'}
        onChange={(v) => onChange(def.type === 'role' ? v[0] ?? null : v.length ? v : null)} />;
    }
  }
}

export function FieldRow({ def, value, onChange, meta }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void; meta: Meta }) {
  return (
    <div className={cn('space-y-1.5', def.wide && 'sm:col-span-2')}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium">{def.label}{def.required && <span className="text-primary"> *</span>}</label>
        {value != null && !def.required && (
          <button type="button" onClick={() => onChange(null)} className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground" title="Revenir à « Non configuré »">
            <X className="h-3 w-3" />Effacer
          </button>
        )}
      </div>
      <FieldInput def={def} value={value} onChange={onChange} meta={meta} />
      {def.hint && <p className="text-xs text-muted-foreground">{def.hint}</p>}
    </div>
  );
}
