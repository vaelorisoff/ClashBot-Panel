import { useState } from 'react';
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import { services, type Row } from '../../services/clashbot';
import { useAction, useApi } from '../../hooks/useApi';
import { useGuildMeta } from '../common/Guild';
import { DataState, EmptyState, NotConfigured } from '../common/States';
import { Pagination, Toolbar } from '../common/Layout';
import { Confirm } from '../common/Confirm';
import { FieldRow, type FieldDef } from './Fields';

export type Column = { key: string; label: string; render?: (row: Row) => React.ReactNode; className?: string };

function cell(v: unknown) {
  if (v == null || v === '') return <NotConfigured />;
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (Array.isArray(v)) return v.length ? v.join(', ') : <NotConfigured />;
  return String(v);
}

/** Gestion CRUD d'une collection propre à un serveur (articles, métiers, succès, sources, catégories…). */
export function CollectionManager({ guildId, path, columns, fields, noun, extraActions, emptyText, renderEditorExtra }: {
  guildId: string; path: string; columns: Column[]; fields: FieldDef[]; noun: string;
  extraActions?: (row: Row, reload: () => void) => React.ReactNode; emptyText?: string;
  renderEditorExtra?: (values: Record<string, unknown>, set: (k: string, v: unknown) => void) => React.ReactNode;
}) {
  const [q, setQ] = useState('');
  const [dq] = useDebounce(q, 300);
  const [page, setPage] = useState(1);
  const state = useApi(() => services.collection.list(guildId, path, { search: dq, page, pageSize: 20 }), [guildId, path, dq, page]);
  const meta = useGuildMeta(guildId);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const { run, pending } = useAction();

  const missing = editing ? fields.filter((f) => f.required && (editing[f.key] == null || editing[f.key] === '')) : [];
  const save = async () => {
    if (!editing) return;
    const { id, ...body } = editing;
    const ok = await run(() => (id ? services.collection.update(guildId, path, String(id), body) : services.collection.create(guildId, path, body)),
      id ? `${noun} mis(e) à jour.` : `${noun} créé(e).`);
    if (ok) { setEditing(null); state.reload(true); }
  };
  const remove = (id: string) => run(() => services.collection.remove(guildId, path, id), `${noun} supprimé(e).`).then((ok) => ok && state.reload(true));

  return (
    <div>
      <Toolbar>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Rechercher…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <Button className="ml-auto" onClick={() => setEditing({})}><Plus className="mr-1.5 h-4 w-4" />Ajouter</Button>
      </Toolbar>
      <DataState state={state} isEmpty={(d) => !d.items.length}
        empty={<EmptyState title={`Aucun(e) ${noun.toLowerCase()}`} text={emptyText ?? 'Rien n\'a encore été créé pour ce serveur.'} action={<Button size="sm" onClick={() => setEditing({})}><Plus className="mr-1.5 h-4 w-4" />Ajouter</Button>} />}>
        {(d) => (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader><TableRow>{columns.map((c) => <TableHead key={c.key} className={c.className}>{c.label}</TableHead>)}<TableHead className="w-28 text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {d.items.map((r) => (
                    <TableRow key={r.id}>
                      {columns.map((c) => <TableCell key={c.key} className={c.className}>{c.render ? c.render(r) : cell(r[c.key])}</TableCell>)}
                      <TableCell className="whitespace-nowrap text-right">
                        {extraActions?.(r, () => state.reload(true))}
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Modifier" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
                        <Confirm title={`Supprimer cet élément ?`} onConfirm={() => remove(r.id)}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                        </Confirm>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onPage={setPage} />
          </>
        )}
      </DataState>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing?.id ? `Modifier` : `Ajouter`} — {noun}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((f) => <FieldRow key={f.key} def={f} value={editing[f.key] ?? null} meta={meta.data} onChange={(v) => setEditing((e) => ({ ...e, [f.key]: v }))} />)}
              {renderEditorExtra?.(editing, (k, v) => setEditing((e) => ({ ...e, [k]: v })))}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={save} disabled={pending || missing.length > 0}>{pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
