import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { CheckCircle2, Film, Loader2, X, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { browse, interact, type InteractOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import RequireSignIn from '../components/RequireSignIn';
import UploadField from '../components/UploadField';
import { errorMessage, SITE_NAME } from '../lib/config';
import { useLoad } from '../lib/useLoad';

const schema = z.object({
  title: z.string().trim().min(2, 'Titre requis').max(200),
  creatorName: z.string().trim().min(1, 'Créateur requis').max(120),
  categoryId: z.string().min(1, 'Choisissez une catégorie'),
  description: z.string().max(5000),
});
type Form = z.infer<typeof schema>;
type Preview = NonNullable<InteractOutputType['preview']>;

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({ step, title, text, children }: { step: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{step}</span>
        <div><h2 className="font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{text}</p></div>
      </div>
      {children}
    </section>
  );
}

function YouTubeImport({ value, onValue, preview, onPreview, onInfo }: {
  value: string; onValue: (v: string) => void; preview: Preview | null; onPreview: (p: Preview | null) => void; onInfo: (p: Preview) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const check = useDebouncedCallback(async (v: string) => {
    if (!v.trim()) { onPreview(null); setError(''); return; }
    setChecking(true); setError('');
    try {
      const r = await interact({ action: 'previewVideo', youtube: v });
      onPreview(r.preview ?? null);
      if (r.preview) onInfo(r.preview);
    } catch (e) { onPreview(null); setError(errorMessage(e)); } finally { setChecking(false); }
  }, 600);
  return (
    <Field label="URL YouTube" error={error} hint="ex. https://www.youtube.com/watch?v=… — aucune vidéo n'est téléchargée depuis YouTube.">
      <div className="relative">
        <Youtube className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="px-9" value={value} placeholder="https://youtu.be/…" onChange={(e) => { onValue(e.target.value); check(e.target.value); }} />
        {checking ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          : value && <button aria-label="Retirer" onClick={() => { onValue(''); onPreview(null); setError(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
      </div>
      {preview && <p className="flex items-center gap-1.5 text-xs font-medium text-primary"><CheckCircle2 className="h-3.5 w-3.5" />Vidéo YouTube trouvée : {preview.title}</p>}
    </Field>
  );
}

function PublishForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({ title: '', creatorName: '', categoryId: '', description: '' });
  const [youtube, setYoutube] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [videoFileUrl, setVideoFileUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [busy, setBusy] = useState(0);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const { data: cats } = useLoad(() => browse({ view: 'explore' }), []);

  useEffect(() => {
    if (!id) return;
    interact({ action: 'getVideoForEdit', id }).then((r) => {
      const v = r.video;
      if (!v) return;
      setForm({ title: v.title, creatorName: v.creatorName, categoryId: v.categoryId ?? '', description: v.description });
      setVideoFileUrl(v.videoFileUrl);
      setThumbnailUrl(v.thumbnailUrl);
      if (v.youTubeId) {
        setYoutube(`https://youtu.be/${v.youTubeId}`);
        setPreview({ youTubeId: v.youTubeId, title: v.title, author: v.creatorName, thumbnailUrl: `https://i.ytimg.com/vi/${v.youTubeId}/hqdefault.jpg` });
      }
    }).catch((e) => toast.error(errorMessage(e)));
  }, [id]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const parsed = schema.safeParse(form);
  const errors = touched && !parsed.success ? Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])) as Record<string, string> : {};
  const hasSource = !!preview || !!videoFileUrl;
  const pendingYouTube = !!youtube.trim() && !preview;
  const onBusy = (b: boolean) => setBusy((n) => n + (b ? 1 : -1));

  const submit = async () => {
    setTouched(true);
    if (!parsed.success || !hasSource || pendingYouTube) return;
    setSaving(true);
    try {
      const r = await interact({ action: 'saveVideo', id, ...parsed.data, youtube: preview?.youTubeId ?? '', videoFileUrl, thumbnailUrl });
      navigate(`/v/${r.id}`);
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  const cover = thumbnailUrl || preview?.thumbnailUrl;

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{id ? 'Modifier' : 'Publier'}</p>
      <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{id ? 'Modifier la publication' : `Publier une vidéo sur ${SITE_NAME}`}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Section step="A" title="Importer depuis YouTube" text="Collez l'URL d'une vidéo YouTube. Ses informations publiques sont récupérées automatiquement.">
            <YouTubeImport value={youtube} onValue={setYoutube} preview={preview} onPreview={setPreview}
              onInfo={(p) => setForm((f) => ({ ...f, title: f.title || p.title, creatorName: f.creatorName || p.author }))} />
          </Section>

          <Section step="B" title="Importer un fichier vidéo" text={`Envoyez un fichier depuis votre appareil. Il est conservé sur ${SITE_NAME} et lu directement, ou utilisé si la source YouTube devient indisponible.`}>
            <UploadField kind="video" value={videoFileUrl} onChange={setVideoFileUrl} onBusy={onBusy} />
          </Section>
          {touched && !hasSource && <p className="text-sm text-destructive">Ajoutez une source : une URL YouTube, un fichier vidéo, ou les deux.</p>}

          <Section step="C" title="Informations de la publication" text="Ces informations appartiennent à votre publication et restent modifiables.">
            <Field label="Titre" error={errors.title}>
              <Input value={form.title} maxLength={200} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Créateur / auteur" error={errors.creatorName}>
                <Input value={form.creatorName} maxLength={120} onChange={(e) => set('creatorName', e.target.value)} />
              </Field>
              <Field label="Catégorie" error={errors.categoryId}>
                <Select value={form.categoryId || undefined} onValueChange={(v) => set('categoryId', v)}>
                  <SelectTrigger><SelectValue placeholder={cats?.categories?.length ? 'Choisir…' : 'Aucune catégorie disponible'} /></SelectTrigger>
                  <SelectContent>{cats?.categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Description" error={errors.description}>
              <Textarea rows={6} maxLength={5000} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Présentez votre vidéo à la communauté…" />
            </Field>
            <Field label="Miniature (facultatif)" hint="Sans miniature personnalisée, celle de la source YouTube est utilisée lorsqu'elle existe.">
              <UploadField kind="image" value={thumbnailUrl} onChange={setThumbnailUrl} onBusy={onBusy} />
            </Field>
          </Section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="aspect-video bg-muted">
              {cover ? <img src={cover} alt="" className="h-full w-full object-cover" />
                : videoFileUrl ? <video src={videoFileUrl} muted playsInline preload="metadata" className="h-full w-full bg-black object-cover" />
                  : <div className="grid h-full place-items-center text-muted-foreground"><Film className="h-8 w-8" /></div>}
            </div>
            <div className="space-y-2 p-4">
              <p className="line-clamp-2 font-semibold">{form.title || 'Titre de la vidéo'}</p>
              <p className="text-sm text-muted-foreground">{form.creatorName || 'Créateur'}</p>
              <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                <span className={preview ? 'rounded-full bg-primary/15 px-2 py-0.5 text-primary' : 'rounded-full bg-secondary px-2 py-0.5 text-muted-foreground'}>YouTube {preview ? '✓' : '—'}</span>
                <span className={videoFileUrl ? 'rounded-full bg-primary/15 px-2 py-0.5 text-primary' : 'rounded-full bg-secondary px-2 py-0.5 text-muted-foreground'}>Fichier {videoFileUrl ? '✓' : '—'}</span>
              </div>
            </div>
          </div>
          <Button size="lg" className="w-full rounded-full" onClick={submit} disabled={saving || busy > 0 || pendingYouTube || (touched && (!parsed.success || !hasSource))}>
            {(saving || busy > 0) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {busy > 0 ? 'Envoi en cours…' : id ? 'Enregistrer les modifications' : 'Publier la vidéo'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PublishPage() {
  return (
    <RequireSignIn title="Publiez sur la plateforme" text="Connectez-vous pour partager des vidéos avec la communauté.">
      <PublishForm />
    </RequireSignIn>
  );
}
