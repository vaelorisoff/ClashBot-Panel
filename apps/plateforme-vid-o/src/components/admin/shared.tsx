import { toast } from 'sonner';
import type { AdminOutputType } from 'zitejs/api';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@project/components/ui/alert-dialog';
import { errorMessage } from '../../lib/config';

export type AdminData = AdminOutputType;
export type AdminUser = NonNullable<AdminOutputType['users']>[number];
export type AdminVideo = NonNullable<AdminOutputType['videos']>[number];
export type AdminCategory = NonNullable<AdminOutputType['categories']>[number];

/** Runs an admin action, toasts the result and silently refreshes the data. */
export function makeRun(reload: (silent?: boolean) => Promise<void>) {
  return async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.success(msg); await reload(true); return true; }
    catch (e) { toast.error(errorMessage(e)); return false; }
  };
}
export type Run = ReturnType<typeof makeRun>;

export function Confirm({ title, text = 'Cette action est définitive.', onConfirm, children }: { title: string; text?: string; onConfirm: () => void; children: React.ReactNode }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{text}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Confirmer</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums">{value.toLocaleString('fr-FR')}</p>
      <p className="mt-1 h-4 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function TableShell({ children, empty }: { children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/40">
      {children}
      {empty && <p className="p-10 text-center text-sm text-muted-foreground">Aucun résultat.</p>}
    </div>
  );
}
