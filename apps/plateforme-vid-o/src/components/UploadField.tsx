import { useState } from 'react';
import { Film, ImagePlus, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUpload } from 'zitejs/upload';
import { Button } from '@project/components/ui/button';
import { errorMessage } from '../lib/config';

/** Real upload to Nexia storage with a progress bar, replace and remove. */
export default function UploadField({ kind, value, onChange, onBusy }: {
  kind: 'video' | 'image';
  value: string;
  onChange: (url: string) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const { upload } = useUpload();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [progress, setProgress] = useState(0);
  const Icon = kind === 'video' ? Film : ImagePlus;
  const label = kind === 'video' ? 'Importer un fichier vidéo' : 'Ajouter une miniature';

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true); onBusy?.(true); setName(file.name); setProgress(5);
    // The upload SDK reports completion only; ease the bar towards 90% until it resolves.
    const t = window.setInterval(() => setProgress((p) => Math.min(90, p + (90 - p) * 0.08)), 250);
    try { const { url } = await upload(file); setProgress(100); onChange(url); }
    catch (e) { toast.error(errorMessage(e)); setName(''); }
    finally { window.clearInterval(t); setBusy(false); onBusy?.(false); }
  };

  const input = (
    <input type="file" accept={kind === 'video' ? 'video/*' : 'image/*'} className="hidden" disabled={busy}
      onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
  );

  if (busy) {
    return (
      <div className="rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="min-w-0 flex-1 truncate">{name}</span><span className="tabular-nums text-muted-foreground">{Math.round(progress)}%</span></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} /></div>
      </div>
    );
  }

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-2">
        {kind === 'image'
          ? <img src={value} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
          : <video src={value} muted playsInline preload="metadata" className="h-12 w-20 shrink-0 rounded-lg bg-black object-cover" />}
        <p className="min-w-0 flex-1 truncate text-sm">{name || (kind === 'video' ? 'Fichier vidéo enregistré' : 'Miniature personnalisée')}</p>
        <Button variant="ghost" size="sm" asChild>
          <label className="cursor-pointer"><RefreshCw className="mr-1.5 h-4 w-4" />Remplacer{input}</label>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Supprimer" onClick={() => { onChange(''); setName(''); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button variant="secondary" asChild className="w-full justify-start sm:w-auto">
      <label className="cursor-pointer"><Icon className="mr-2 h-4 w-4" />{label}{input}</label>
    </Button>
  );
}
