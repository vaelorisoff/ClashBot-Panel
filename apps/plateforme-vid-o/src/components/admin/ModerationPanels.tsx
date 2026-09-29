import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { admin } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@project/components/ui/table';
import { timeAgo } from '../../lib/config';
import { Confirm, TableShell, Toolbar, type AdminCategory, type AdminData, type Run } from './shared';

export function CommentsPanel({ comments, run }: { comments: NonNullable<AdminData['comments']>; run: Run }) {
  const [q, setQ] = useState('');
  const rows = comments.filter((c) => !q || [c.content, c.userName, c.videoTitle].some((x) => x.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Texte, auteur, vidéo…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Toolbar>
      <TableShell empty={!rows.length}>
        <Table>
          <TableHeader><TableRow><TableHead>Commentaire</TableHead><TableHead className="hidden md:table-cell">Auteur</TableHead><TableHead className="hidden md:table-cell">Vidéo</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="max-w-md"><p className="line-clamp-2">{c.content}</p><span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}<span className="md:hidden"> · {c.userName}</span></span></TableCell>
                <TableCell className="hidden md:table-cell">{c.userName}</TableCell>
                <TableCell className="hidden max-w-[220px] md:table-cell"><Link to={`/v/${c.videoId}`} className="line-clamp-1 hover:text-primary">{c.videoTitle}</Link></TableCell>
                <TableCell className="text-right">
                  <Confirm title="Supprimer ce commentaire ?" onConfirm={() => run(() => admin({ action: 'deleteComment', id: c.id }), 'Commentaire supprimé')}>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                  </Confirm>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  );
}

function DeleteCategory({ cat, all, run, onClose }: { cat: AdminCategory; all: AdminCategory[]; run: Run; onClose: () => void }) {
  const [to, setTo] = useState('');
  const others = all.filter((c) => c.id !== cat.id);
  const used = cat.count > 0;
  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {cat.name} » ?</AlertDialogTitle>
          <AlertDialogDescription>
            {used ? `${cat.count} vidéo(s) utilisent cette catégorie. Choisissez où les déplacer avant la suppression.` : 'Cette catégorie ne contient aucune vidéo.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {used && (
          <Select value={to || undefined} onValueChange={setTo}>
            <SelectTrigger><SelectValue placeholder={others.length ? 'Déplacer les vidéos vers…' : 'Créez d\'abord une autre catégorie'} /></SelectTrigger>
            <SelectContent>{others.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction disabled={used && !to} onClick={() => run(() => admin({ action: 'deleteCategory', id: cat.id, reassignTo: to || undefined }), 'Catégorie supprimée')}>
            {used ? 'Déplacer et supprimer' : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CategoriesPanel({ categories, run }: { categories: AdminCategory[]; run: Run }) {
  const [name, setName] = useState('');
  const [edit, setEdit] = useState<{ id: string; name: string } | null>(null);
  const [del, setDel] = useState<AdminCategory | null>(null);
  const [order, setOrder] = useState<AdminCategory[] | null>(null);
  const list = order ?? categories;

  const move = (i: number, d: -1 | 1) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setOrder(next);
    run(() => admin({ action: 'reorderCategories', ids: next.map((c) => c.id) }), 'Ordre mis à jour').then(() => setOrder(null));
  };

  return (
    <div className="space-y-4">
      <Toolbar>
        <Input placeholder="Nouvelle catégorie" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
        <Button disabled={!name.trim()} onClick={() => run(async () => { await admin({ action: 'saveCategory', name, sortOrder: list.length + 1 }); setName(''); }, 'Catégorie ajoutée')}>
          <Plus className="mr-1.5 h-4 w-4" />Ajouter
        </Button>
      </Toolbar>
      <TableShell empty={!list.length}>
        <Table>
          <TableHeader><TableRow><TableHead className="w-24">Ordre</TableHead><TableHead>Nom</TableHead><TableHead className="hidden md:table-cell">Adresse</TableHead><TableHead>Vidéos</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map((c, i) => (
              <TableRow key={c.id}>
                <TableCell className="whitespace-nowrap">
                  <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} aria-label="Monter" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === list.length - 1} aria-label="Descendre" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                </TableCell>
                <TableCell>
                  {edit?.id === c.id ? (
                    <div className="flex items-center gap-1">
                      <Input autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="h-8 max-w-[220px]" />
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Valider" disabled={!edit.name.trim()}
                        onClick={() => run(() => admin({ action: 'saveCategory', id: c.id, name: edit.name, sortOrder: c.sortOrder }), 'Catégorie modifiée').then(() => setEdit(null))}><Check className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Annuler" onClick={() => setEdit(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : <span className="font-medium">{c.name}</span>}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">/explorer/{c.slug}</TableCell>
                <TableCell className="tabular-nums">{c.count}</TableCell>
                <TableCell className="whitespace-nowrap text-right">
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Renommer" onClick={() => setEdit({ id: c.id, name: c.name })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Supprimer" onClick={() => setDel(c)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
      {del && <DeleteCategory cat={del} all={categories} run={run} onClose={() => setDel(null)} />}
    </div>
  );
}
