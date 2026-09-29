import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Loader2, Upload, Youtube, CheckCircle2, Film } from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { useUpload } from 'zitejs/upload';
import { browse, interact, type InteractOutputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import RequireSignIn from '../components/RequireSignIn';
import { errorMessage, SITE_NAME } from '../lib/config';
import { useLoad } from '../lib/useLoad';

const schema = z.object({
  youtube: z.string(),
  videoFileUrl: z.string(),
  title: z.string().trim().min(2, 'Titre requis').max(200),
  creatorName: z.string().trim().min(1, 'Créateur requis').max(120),
  categoryId: z.string().min(1, 'Choisissez une catégorie'),
  thumbnailUrl: z.string().url('URL invalide').or(z.literal('')),
  description: z.string().max(5000),
});
type Form = z.infer<typeof schema>;
const empty: Form = { youtube: '', videoFileUrl: '', title: '', creatorName: '', categoryId: '', thumbnailUrl: '', description: '' };

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PublishForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { upload, isUploading } = useUpload();
  const [form, setForm] = useState<Form>(empty);
  const [touched, setTouched] = useState(false);
  const [preview, setPreview] = useState<InteractOutputType['preview'] | null>(null);
  const [checking, setChecking] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: cats } = useLoad(() => browse({ view: 'explore' }), []);

  useEffect(() => {
    if (!id) return;
    interact({ action: 'getVideoForEdit', id }).then((r) => {
      if (!r.video) return;
      const v = r.video;
      setForm({ youtube: v.youTubeId, videoFileUrl: v.videoFileUrl, title: v.title, creatorName: v.creatorName, categoryId: v.categoryId ?? '', thumbnailUrl: v.thumbnailUrl, description: v.description });
      if (v.youTubeId) setPreview({ youTubeId: v.youTubeId, title: v.title, author: v.creatorName, thumbnailUrl: `https://i.ytimg.com/vi/${v.youTubeId}/hqdefault.jpg` });
    }).catch((e) => toast.error(errorMessage(e)));
  }, [id]);

  const check = useDebouncedCallback(async (value: string) => {
    if (!value.trim()) { setPreview(null); setPreviewError(''); return; }
    setChecking(true); setPreviewError('');
    try {
      const r = await interact({ action: 'previewVideo', youtube: value });
      setPreview(r.preview ?? null);
      if (r.preview) {
        const p = r.preview;
        setForm((f) => ({ ...f, title: f.title || p.title, creatorName: f.creatorName || p.author }));
      }
    } catch (e) { setPreview(null); setPreviewError(errorMessage(e)); } finally { setChecking(false); }
  }, 600);

  const [fileUploading, setFileUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const onVideoFile = async (file?: File) => {
    if (!file) return;
    setFileUploading(true);
    try { const { url } = await upload(file); set('videoFileUrl', url); setFileName(file.name); toast.success('Fichier vidéo envoyé'); }
    catch (e) { toast.error(errorMessage(e)); } finally { setFileUploading(false); }
  };
  const hasSource = !!preview || !!form.videoFileUrl;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const parsed = schema.safeParse(form);
  const errors = touched && !parsed.success ? Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])) as Record<string, string> : {};

  const submit = async () => {
    setTouched(true);
    if (!parsed.success || !hasSource || (form.youtube.trim() && !preview)) return;
    setSaving(true);
    try {
      const r = await interact({ action: 'saveVideo', id, ...parsed.data, youtube: preview?.youTubeId ?? '' });
      toast.success(id ? 'Publication mise à jour' : 'Vidéo publiée !');
      navigate(`/v/${r.id}`);
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  const onThumb = async (file?: File) => {
    if (!file) return;
    try { const { url } = await upload(file); set('thumbnailUrl', url); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{id ? 'Modifier' : 'Publier'}</p>
      <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{id ? 'Modifier la publication' : `Partager une vidéo sur ${SITE_NAME}`}</h1>
      <p className="mt-2 text-muted-foreground">Envoyez votre fichier vidéo, ajoutez un lien YouTube, ou les deux : le fichier sert de copie de sauvegarde sur {SITE_NAME}.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card/70 p-6">
          <Field label="Fichier vidéo" hint={form.videoFileUrl ? `Copie conservée sur ${SITE_NAME}${fileName ? ` · ${fileName}` : ''}` : 'Facultatif si un lien YouTube est fourni. Lu automatiquement si la source YouTube devient indisponible.'}>
            <div className="flex items-center gap-2">
              <Button variant="secondary" asChild disabled={fileUploading}>
                <label className="cursor-pointer">
                  {fileUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
                  {fileUploading ? 'Envoi en cours…' : form.videoFileUrl ? 'Remplacer le fichier' : 'Choisir un fichier vidéo'}
                  <input type="file" accept="video/*" className="hidden" disabled={fileUploading} onChange={(e) => onVideoFile(e.target.files?.[0])} />
                </label>
              </Button>
              {form.videoFileUrl && !fileUploading && (
                <Button variant="ghost" size="sm" onClick={() => { set('videoFileUrl', ''); setFileName(''); }}>Retirer</Button>
              )}
            </div>
          </Field>
          <Field label="Lien ou identifiant YouTube (facultatif)" error={errors.youtube || previewError} hint="ex. https://www.youtube.com/watch?v=… ou youtu.be/…">
            <div className="relative">
              <Youtube className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={form.youtube} placeholder="https://youtu.be/…" onChange={(e) => { set('youtube', e.target.value); check(e.target.value); }} />
              {checking && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
          </Field>
          <Field label="Titre" error={errors.title} hint="Pré-rempli depuis YouTube lorsqu'un lien est fourni">
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
          <Field label="Description (facultatif)" error={errors.description}>
            <Textarea rows={5} maxLength={5000} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Présentez la vidéo à la communauté…" />
          </Field>
          <Field label="Miniature personnalisée (facultatif)" error={errors.thumbnailUrl} hint="Par défaut, la miniature YouTube est utilisée lorsqu'elle existe.">
            <div className="flex gap-2">
              <Input value={form.thumbnailUrl} placeholder="https://…" onChange={(e) => set('thumbnailUrl', e.target.value)} />
              <Button variant="secondary" asChild disabled={isUploading}>
                <label className="cursor-pointer">
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onThumb(e.target.files?.[0])} />
                </label>
              </Button>
            </div>
          </Field>
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="aspect-video bg-muted">
              {preview || form.thumbnailUrl ? <img src={form.thumbnailUrl || preview?.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                : form.videoFileUrl ? <video src={form.videoFileUrl} muted playsInline className="h-full w-full object-cover" />
                : <div className="grid h-full place-items-center text-sm text-muted-foreground">Aperçu de la vidéo</div>}
            </div>
            <div className="p-4">
              {preview ? (
                <>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />Vidéo intégrable trouvée</p>
                  <p className="mt-2 line-clamp-2 font-semibold">{form.title || preview.title}</p>
                  <p className="text-sm text-muted-foreground">{form.creatorName || preview.author}</p>
                </>
              ) : form.videoFileUrl ? (
                <>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-primary"><CheckCircle2 className="h-3.5 w-3.5" />Fichier vidéo prêt</p>
                  <p className="mt-2 line-clamp-2 font-semibold">{form.title || 'Sans titre'}</p>
                  <p className="text-sm text-muted-foreground">{form.creatorName}</p>
                </>
              ) : <p className="text-sm text-muted-foreground">Ajoutez un fichier vidéo ou un lien YouTube pour voir l'aperçu.</p>}
            </div>
          </div>
          <Button size="lg" className="w-full rounded-full" onClick={submit} disabled={saving || fileUploading || isUploading || !hasSource || (touched && !parsed.success)}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{id ? 'Enregistrer les modifications' : 'Publier la vidéo'}
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
