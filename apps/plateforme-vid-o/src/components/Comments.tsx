import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { interact, type BrowseOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Textarea } from '@project/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@project/components/ui/dropdown-menu';
import { useSession } from '../context/Session';
import { UserAvatar } from './VideoCard';
import { errorMessage, timeAgo } from '../lib/config';

type Comment = NonNullable<BrowseOutputType['comments']>[number];

function CommentItem({ c, onChange, onDelete }: { c: Comment; onChange: (content: string) => void; onDelete: () => void }) {
  const { profile, isAdmin } = useSession();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.content);
  const [busy, setBusy] = useState(false);
  const mine = profile?.userId === c.userId;

  const save = async () => {
    setBusy(true);
    try { await interact({ action: 'editComment', id: c.id, content: text }); onChange(text); setEditing(false); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  const remove = async () => {
    try { await interact({ action: 'deleteComment', id: c.id }); onDelete(); toast('Commentaire supprimé'); }
    catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div className="group flex gap-3">
      <Link to={c.username ? `/u/${c.username}` : '#'}><UserAvatar src={c.avatarUrl} name={c.name} className="h-9 w-9" /></Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <Link to={c.username ? `/u/${c.username}` : '#'} className="font-semibold hover:text-primary">{c.name}</Link>
          <span className="ml-2 text-xs text-muted-foreground">{timeAgo(c.createdAt)}{c.edited && ' · modifié'}</span>
        </p>
        {editing ? (
          <div className="mt-2 space-y-2">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={3} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setText(c.content); }}>Annuler</Button>
              <Button size="sm" onClick={save} disabled={busy || !text.trim()}>Enregistrer</Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">{c.content}</p>
        )}
      </div>
      {(mine || isAdmin) && !editing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 group-hover:opacity-100" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {mine && <DropdownMenuItem onClick={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" />Modifier</DropdownMenuItem>}
            <DropdownMenuItem onClick={remove} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />{mine ? 'Supprimer' : 'Supprimer (modération)'}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export default function Comments({ videoId, initial }: { videoId: string; initial: Comment[] }) {
  const { profile, requireAuth } = useSession();
  const [list, setList] = useState(initial);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const post = async () => {
    if (!requireAuth('Connectez-vous pour commenter.') || !profile || !text.trim()) return;
    setBusy(true);
    try {
      const r = await interact({ action: 'addComment', videoId, content: text });
      setList((l) => [{
        id: r.id ?? crypto.randomUUID(), content: text.trim(), createdAt: new Date().toISOString(), edited: false,
        userId: profile.userId, name: profile.displayName, username: profile.username, avatarUrl: profile.avatarUrl,
      }, ...l]);
      setText('');
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  return (
    <section>
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold"><MessageSquare className="h-5 w-5" />{list.length} commentaire{list.length > 1 ? 's' : ''}</h2>
      <div className="mb-8 flex gap-3">
        <UserAvatar src={profile?.avatarUrl} name={profile?.displayName ?? '?'} className="h-9 w-9" />
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={profile ? 'Ajouter un commentaire…' : 'Connectez-vous pour commenter'}
            value={text} maxLength={2000} rows={2}
            onFocus={() => requireAuth('Connectez-vous pour commenter.')}
            onChange={(e) => setText(e.target.value)}
            className="resize-none bg-muted/40"
          />
          {text && (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setText('')}>Annuler</Button>
              <Button size="sm" onClick={post} disabled={busy || !text.trim()}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Publier</Button>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        {list.map((c) => (
          <CommentItem key={c.id} c={c}
            onChange={(content) => setList((l) => l.map((x) => (x.id === c.id ? { ...x, content, edited: true } : x)))}
            onDelete={() => setList((l) => l.filter((x) => x.id !== c.id))} />
        ))}
        {!list.length && <p className="text-sm text-muted-foreground">Soyez le premier à commenter cette vidéo.</p>}
      </div>
    </section>
  );
}
