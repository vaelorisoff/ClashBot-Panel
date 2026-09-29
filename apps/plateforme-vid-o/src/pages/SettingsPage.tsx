import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useUpload } from 'zitejs/upload';
import { interact } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import RequireSignIn from '../components/RequireSignIn';
import { UserAvatar } from '../components/VideoCard';
import { useSession } from '../context/Session';
import { errorMessage } from '../lib/config';

function SettingsForm() {
  const { profile, refresh } = useSession();
  const navigate = useNavigate();
  const { upload, isUploading } = useUpload();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const usernameOk = /^[a-z0-9_]{3,24}$/.test(username);
  const valid = usernameOk && displayName.trim().length > 0;

  const save = async () => {
    setSaving(true);
    try {
      await interact({ action: 'updateProfile', username, displayName, bio, avatarUrl });
      await refresh();
      toast.success('Profil mis à jour');
      navigate(`/u/${username}`);
    } catch (e) { toast.error(errorMessage(e)); } finally { setSaving(false); }
  };

  const onAvatar = async (file?: File) => {
    if (!file) return;
    try { const { url } = await upload(file); setAvatarUrl(url); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold">Modifier le profil</h1>
      <div className="mt-8 space-y-6 rounded-2xl border border-border/60 bg-card/70 p-6">
        <div className="flex items-center gap-5">
          <UserAvatar src={avatarUrl} name={displayName || '?'} className="h-20 w-20 text-xl" />
          <div className="flex gap-2">
            <Button variant="secondary" asChild disabled={isUploading}>
              <label className="cursor-pointer">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Changer l'avatar
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} />
              </label>
            </Button>
            {avatarUrl && <Button variant="ghost" onClick={() => setAvatarUrl('')}>Retirer</Button>}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Nom d'utilisateur</Label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
            <Input className="pl-7" value={username} maxLength={24} onChange={(e) => setUsername(e.target.value.toLowerCase())} /></div>
          {!usernameOk && <p className="text-xs text-destructive">3 à 24 caractères : lettres minuscules, chiffres ou _</p>}
        </div>
        <div className="space-y-2">
          <Label>Nom affiché</Label>
          <Input value={displayName} maxLength={60} onChange={(e) => setDisplayName(e.target.value)} />
          {!displayName.trim() && <p className="text-xs text-destructive">Nom affiché requis</p>}
        </div>
        <div className="space-y-2">
          <Label>Biographie</Label>
          <Textarea rows={4} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Parlez un peu de vous…" />
          <p className="text-right text-xs text-muted-foreground">{bio.length}/500</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>Annuler</Button>
          <Button onClick={save} disabled={!valid || saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { profile } = useSession();
  return (
    <RequireSignIn title="Votre profil" text="Connectez-vous pour modifier votre profil.">
      <SettingsForm key={profile?.id} />
    </RequireSignIn>
  );
}
