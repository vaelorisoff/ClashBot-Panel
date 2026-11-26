import { Fragment } from 'react';
import { renderTimestamp, type TimestampStyle } from '../../utils/discordTime';

// Rendu Markdown Discord (sous-ensemble) : gras, italique, souligné, barré, code, liens, mentions,
// horodatages <t:…:…> et variables {variable} mises en évidence.
const TOKEN = /(```[\s\S]+?```|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|~~[^~]+~~|\|\|[^|]+\|\||<t:-?\d+(?::[tTdDfFR])?>|<@!?&?\d+>|<#\d+>|\[[^\]]+\]\([^)]+\)|https?:\/\/\S+|\{[a-zA-Z0-9_.]+\})/g;
const NEWLINE = /\r?\n/;
const mention = 'rounded bg-[hsl(235_86%_65%/0.3)] px-0.5 text-[hsl(236_100%_85%)]';

function inline(text: string, tz?: string): React.ReactNode[] {
  return text.split(TOKEN).filter((p) => p !== '').map((p, i) => {
    if (p.startsWith('```')) return <pre key={i} className="my-1 whitespace-pre-wrap rounded bg-black/30 p-2 font-mono text-[0.85em]">{p.slice(3, -3)}</pre>;
    if (p.startsWith('`')) return <code key={i} className="rounded bg-black/30 px-1 py-0.5 font-mono text-[0.85em]">{p.slice(1, -1)}</code>;
    if (p.startsWith('**')) return <strong key={i}>{inline(p.slice(2, -2), tz)}</strong>;
    if (p.startsWith('__')) return <u key={i}>{inline(p.slice(2, -2), tz)}</u>;
    if (p.startsWith('~~')) return <s key={i}>{inline(p.slice(2, -2), tz)}</s>;
    if (p.startsWith('||')) return <span key={i} className="rounded bg-black/40 px-0.5">{inline(p.slice(2, -2), tz)}</span>;
    if ((p.startsWith('*') && p.endsWith('*') && p.length > 2) || (p.startsWith('_') && p.endsWith('_') && p.length > 2)) return <em key={i}>{inline(p.slice(1, -1), tz)}</em>;
    const ts = p.match(/^<t:(-?\d+)(?::([tTdDfFR]))?>$/);
    if (ts) return <span key={i} className="rounded bg-white/10 px-1">{renderTimestamp(Number(ts[1]), (ts[2] ?? 'f') as TimestampStyle, tz)}</span>;
    if (/^<@&\d+>$/.test(p)) return <span key={i} className={mention}>@rôle</span>;
    if (/^<@!?\d+>$/.test(p)) return <span key={i} className={mention}>@membre</span>;
    if (/^<#\d+>$/.test(p)) return <span key={i} className={mention}>#salon</span>;
    const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noreferrer" className="text-[hsl(var(--discord-link))] hover:underline" onClick={(e) => e.stopPropagation()}>{link[1]}</a>;
    if (/^https?:\/\//.test(p)) return <a key={i} href={p} target="_blank" rel="noreferrer" className="text-[hsl(var(--discord-link))] hover:underline" onClick={(e) => e.stopPropagation()}>{p}</a>;
    if (/^\{[a-zA-Z0-9_.]+\}$/.test(p)) return <span key={i} className="rounded bg-primary/25 px-1 font-mono text-[0.85em] text-[hsl(349_100%_85%)]">{p}</span>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export function DiscordMarkdown({ text, timeZone }: { text: string; timeZone?: string }) {
  const lines = text.split(NEWLINE);
  return (
    <>
      {lines.map((line, i) => {
        const h = line.match(/^(#{1,3}) (.*)$/);
        const quote = line.startsWith('> ');
        const node = inline(h ? h[2] : quote ? line.slice(2) : line, timeZone);
        if (h) return <div key={i} className={h[1].length === 1 ? 'my-1 text-[1.5em] font-bold' : h[1].length === 2 ? 'my-1 text-[1.25em] font-bold' : 'my-1 text-[1.1em] font-bold'}>{node}</div>;
        if (quote) return <div key={i} className="border-l-4 border-white/25 pl-2">{node}</div>;
        return <Fragment key={i}>{node}{i < lines.length - 1 && <br />}</Fragment>;
      })}
    </>
  );
}
