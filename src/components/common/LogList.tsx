import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@project/components/ui/badge';
import { cn } from '@project/components/lib/utils';
import { fmtDate } from '../../utils/format';
import { useApp } from '../../contexts/AppContext';
import type { LogEntry } from '../../types/api';

const LEVEL: Record<LogEntry['level'], string> = { info: 'bg-info', warning: 'bg-warning', error: 'bg-destructive' };

export function LogRow({ e, expandable = true }: { e: LogEntry; expandable?: boolean }) {
  const [open, setOpen] = useState(false);
  const { timezone } = useApp();
  const has = expandable && e.details && Object.keys(e.details).length > 0;
  return (
    <li className="py-3">
      <button type="button" disabled={!has} onClick={() => setOpen(!open)} className="flex w-full items-start gap-3 text-left">
        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', LEVEL[e.level])} />
        <div className="min-w-0 flex-1">
          <p className="text-sm">{e.summary}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">{e.category}</Badge>
            <span>{fmtDate(e.at, timezone)}</span>
            {e.actor && <span>par {e.actor.name}</span>}
            {e.guildName && <span>· {e.guildName}</span>}
          </p>
        </div>
        {has && <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-muted-foreground transition', open && 'rotate-180')} />}
      </button>
      {open && has && <pre className="ml-5 mt-2 max-h-72 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs">{JSON.stringify(e.details, null, 2)}</pre>}
    </li>
  );
}

export function LogList({ entries }: { entries: LogEntry[] }) {
  return <ul className="divide-y">{entries.map((e) => <LogRow key={e.id} e={e} />)}</ul>;
}
