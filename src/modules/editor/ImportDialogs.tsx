import { useState } from 'react';
import { DownloadCloud, FileJson, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Textarea } from '@project/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { services } from '../../services/clashbot';
import { useAction } from '../../hooks/useApi';
import type { DiscordMessage } from '../../types/message';

/** Récupère un message déjà publié sur Discord (via le bot) pour le modifier. */
export function ImportExistingDialog({ guildId, onLoad }: { guildId: string; onLoad: (m: DiscordMessage, ref: { channelId: string; messageId: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState('');
  const { run, pending } = useAction();
  const parsed = link.match(/channels\/\d+\/(\d+)\/(\d+)/) ?? link.match(/^(\d{15,})[-/ ](\d{15,})$/);
  const go = async () => {
    if (!parsed) return;
    const r = await run(() => services.messages.fetchExisting(guildId, parsed[1], parsed[2]));
    if (r) {
      onLoad(r.message, { channelId: parsed[1], messageId: parsed[2] });
      if (!r.editable) toast.warning("Message chargé : il n'a pas été publié par ClashBot, il ne pourra être que republié.");
      setOpen(false);
    }
  };
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}><DownloadCloud className="mr-1.5 h-4 w-4" />Récupérer un message</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Récupérer un message existant</DialogTitle><DialogDescription>Collez le lien du message (clic droit → Copier le lien du message).</DialogDescription></DialogHeader>
          <Input placeholder="https://discord.com/channels/…/…/…" value={link} onChange={(e) => setLink(e.target.value.trim())} />
          {link && !parsed && <p className="text-xs text-destructive">Lien de message invalide.</p>}
          <DialogFooter><Button onClick={go} disabled={!parsed || pending}>{pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Récupérer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Import / export JSON du message (format interne ClashBot). */
export function JsonDialog({ value, onLoad }: { value: DiscordMessage; onLoad: (m: DiscordMessage) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const apply = () => {
    try {
      const m = JSON.parse(text) as DiscordMessage;
      if (typeof m.content !== 'string' || !Array.isArray(m.embeds)) throw new Error();
      onLoad({ content: m.content, embeds: m.embeds.map((e) => ({ ...e, fields: e.fields ?? [] })), rows: m.rows ?? [], senderProfileId: m.senderProfileId ?? null });
      setOpen(false);
    } catch { toast.error('JSON invalide pour un message ClashBot.'); }
  };
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setText(JSON.stringify(value, null, 2)); setOpen(true); }}><FileJson className="mr-1.5 h-4 w-4" />JSON</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Import / export JSON</DialogTitle></DialogHeader>
          <Textarea rows={16} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-xs" />
          <DialogFooter>
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(text).then(() => toast.success('JSON copié.'))}>Copier</Button>
            <Button onClick={apply}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
