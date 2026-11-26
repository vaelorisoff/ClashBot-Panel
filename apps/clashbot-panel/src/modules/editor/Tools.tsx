import { useState } from 'react';
import { Braces, CalendarClock, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@project/components/ui/popover';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { discordTimestamp, nextLocalMidnight, renderTimestamp, TIMESTAMP_STYLES, toUnix, type TimestampStyle } from '../../utils/discordTime';

export type Variable = { key: string; label: string };
export const COMMON_VARIABLES: Variable[] = [
  { key: 'user', label: 'Mention du membre' }, { key: 'user.name', label: 'Nom du membre' }, { key: 'user.id', label: 'Identifiant du membre' },
  { key: 'user.avatar', label: 'Avatar du membre' }, { key: 'server', label: 'Nom du serveur' }, { key: 'server.icon', label: 'Icône du serveur' },
  { key: 'server.members', label: 'Nombre de membres' }, { key: 'channel', label: 'Salon actuel' }, { key: 'date', label: 'Date du jour' },
];

export function VariablesMenu({ variables, onInsert }: { variables: Variable[]; onInsert: (token: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="outline" size="sm"><Braces className="mr-1.5 h-4 w-4" />Variables</Button></PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <p className="px-2 py-1 text-xs text-muted-foreground">Cliquez pour ajouter au contenu. Elles sont remplacées par le bot à l'envoi.</p>
        <div className="max-h-72 overflow-y-auto">
          {variables.map((v) => (
            <button key={v.key} type="button" onClick={() => onInsert(`{${v.key}}`)} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent">
              <span>{v.label}</span><code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{`{${v.key}}`}</code>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Générateur d'horodatages Discord <t:TIMESTAMP:STYLE>, avec « prochain minuit local » pour les réinitialisations quotidiennes. */
export function TimestampTool({ timeZone, onInsert }: { timeZone: string; onInsert?: (token: string) => void }) {
  const [value, setValue] = useState('');
  const [style, setStyle] = useState<TimestampStyle>('R');
  const date = value ? new Date(value) : null;
  const token = date ? discordTimestamp(date, style) : '';
  const use = (t: string) => { if (onInsert) onInsert(t); else navigator.clipboard.writeText(t).then(() => toast.success('Horodatage copié.')); };
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="outline" size="sm"><CalendarClock className="mr-1.5 h-4 w-4" />Horodatage</Button></PopoverTrigger>
      <PopoverContent className="w-80 space-y-3">
        <p className="text-sm font-semibold">Horodatage Discord</p>
        <Input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => setValue(toLocalInput(new Date()))}>Maintenant</Button>
          <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => setValue(toLocalInput(nextLocalMidnight(timeZone)))}>Prochain minuit ({timeZone})</Button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {TIMESTAMP_STYLES.map((s) => (
            <button key={s.style} type="button" onClick={() => setStyle(s.style)}
              className={`rounded-md border px-2 py-1.5 text-left text-xs ${style === s.style ? 'border-primary bg-primary/10' : ''}`}>
              <span className="block font-medium">{s.label} <code className="text-muted-foreground">:{s.style}</code></span>
              <span className="text-muted-foreground">{date ? renderTimestamp(toUnix(date), s.style, timeZone) : '—'}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input readOnly value={token} placeholder="<t:…:R>" className="font-mono text-xs" />
          <Button size="sm" disabled={!token} onClick={() => use(token)}>{onInsert ? 'Insérer' : <Copy className="h-4 w-4" />}</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
