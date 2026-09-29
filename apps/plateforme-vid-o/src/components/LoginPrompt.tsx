import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Button } from '@project/components/ui/button';
import { Sparkles } from 'lucide-react';
import { SITE_NAME } from '../lib/config';

export default function LoginPrompt({ open, reason, onClose, onLogin }: {
  open: boolean; reason: string; onClose: () => void; onLogin: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md border-border/60 bg-card">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">Rejoignez {SITE_NAME}</DialogTitle>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>
        <p className="text-center text-sm text-muted-foreground">
          Connexion en un clic avec Google ou par lien envoyé par e-mail. Gratuit.
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <Button size="lg" onClick={onLogin}>Se connecter ou créer un compte</Button>
          <Button variant="ghost" onClick={onClose}>Plus tard</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
