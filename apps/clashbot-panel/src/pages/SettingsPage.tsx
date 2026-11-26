import { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, LogOut, Moon, Plug, Sun, XCircle } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { cn } from '@project/components/lib/utils';
import { toast } from 'sonner';
import { services } from '../services/clashbot';
import { errorText, getApiToken, getApiUrl, setApiToken, setApiUrl } from '../services/http';
import { useAction, useApi } from '../hooks/useApi';
import { useApp } from '../contexts/AppContext';
import { Avatar, PageHeader, Panel } from '../components/common/Layout';
import { DataState } from '../components/common/States';
import { discordTimestamp, nextLocalMidnight } from '../utils/discordTime';

const ZONES: string[] = (() => { try { return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone'); } catch { return ['UTC', 'Europe/Paris', 'Europe/Zurich', 'Europe/Brussels', 'America/Montreal']; } })();
const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;

function TzSelect({ value, onChange, placeholder }: { value: string | null; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder={placeholder ?? 'Choisir un fuseau IANA'} /></SelectTrigger>
      <SelectContent className="max-h-72">{ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function Backend() {
  const [url, setUrl] = useState(getApiUrl());
  const [token, setToken] = useState(getApiToken());
  const [test, setTest] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const valid = /^https?:\/\/.+/.test(url.trim());
  const run = async () => {
    setTesting(true); setTest(null);
    const prevUrl = getApiUrl(); const prevToken = getApiToken();
    setApiUrl(url.trim()); setApiToken(token.trim());
    try {
      const s = await services.system.status();
      setTest({ ok: true, text: `Connexion réussie · bot ${s.bot.online ? 'en ligne' : 'hors ligne'}` });
    } catch (e) {
      setApiUrl(prevUrl); setApiToken(prevToken);
      setTest({ ok: false, text: errorText(e) });
    } finally { setTesting(false); }
  };
  const save = () => { setApiUrl(url.trim()); setApiToken(token.trim()); toast.success('Connexion enregistrée. Rechargement…'); setTimeout(() => window.location.reload(), 600); };
  return (
    <Panel title="Connexion au backend ClashBot" description="Le panel ne stocke aucune donnée : tout passe par l'API de ClashBot (Railway + Supabase).">
      <div className="space-y-4">
        <div className="space-y-1.5"><Label>URL de l'API</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.clashbot.exemple/panel" className="font-mono" />
          <p className="text-xs text-muted-foreground">Peut aussi être fournie à la compilation via VITE_CLASHBOT_API_URL.</p></div>
        <div className="space-y-1.5"><Label>Jeton d'accès (facultatif)</Label><Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Laisser vide si la session Discord (cookie) suffit" className="font-mono" /></div>
        {test && <p className={cn('flex items-center gap-2 text-sm', test.ok ? 'text-success' : 'text-destructive')}>{test.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{test.text}</p>}
        <div className="flex gap-2">
          <Button variant="outline" disabled={!valid || testing} onClick={run}>{testing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plug className="mr-1.5 h-4 w-4" />}Tester</Button>
          <Button disabled={!valid} onClick={save}>Enregistrer</Button>
        </div>
      </div>
    </Panel>
  );
}

function GuildTimezone({ guildId, name }: { guildId: string; name: string }) {
  const state = useApi(() => services.guilds.settings(guildId), [guildId]);
  const { run, pending } = useAction();
  const [tz, setTz] = useState<string | null>(null);
  return (
    <DataState state={state}>
      {(s) => {
        const current = tz ?? s.timezone;
        return (
          <div className="space-y-2">
            <Label>Fuseau de « {name} » <span className="font-normal text-muted-foreground">(jour civil de l'économie)</span></Label>
            <div className="flex flex-wrap gap-2">
              <TzSelect value={current} onChange={setTz} placeholder="Non configuré" />
              <Button disabled={!tz || tz === s.timezone || pending} onClick={() => run(() => services.guilds.saveSettings(guildId, { timezone: tz }), 'Fuseau du serveur enregistré.').then((r) => r && state.reload(true))}>
                {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Enregistrer
              </Button>
            </div>
          </div>
        );
      }}
    </DataState>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, timezone, setTimezone, guild, me, status, apiConfigured } = useApp();
  const next = useMemo(() => nextLocalMidnight(timezone), [timezone]);
  const logout = async () => { try { await services.system.logout(); window.location.reload(); } catch (e) { toast.error(errorText(e)); } };

  return (
    <>
      <PageHeader eyebrow="Panel" title="Paramètres" description="Préférences personnelles, fuseau horaire, compte et connexion au backend." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Apparence">
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'light'] as const).map((t) => (
              <button key={t} onClick={() => setTheme(t)} className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition', theme === t ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted')}>
                {t === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}{t === 'dark' ? 'Sombre' : 'Clair'}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Fuseau horaire" description="Utilisé pour l'affichage des dates et des horodatages Discord dans le panel.">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <TzSelect value={timezone} onChange={setTimezone} />
              <Button variant="outline" disabled={timezone === detected} onClick={() => setTimezone(detected)}>Détecter ({detected})</Button>
            </div>
            <p className="text-xs text-muted-foreground">Prochain minuit local : <code className="font-mono">{discordTimestamp(next, 'F')}</code></p>
            {guild && apiConfigured && <GuildTimezone guildId={guild.id} name={guild.name} />}
          </div>
        </Panel>
        <Panel title="Compte">
          {me ? (
            <div className="flex flex-wrap items-center gap-3">
              <Avatar src={me.avatarUrl} name={me.username} className="h-11 w-11" />
              <div className="min-w-0 flex-1"><p className="font-medium">{me.globalName || me.username}</p><p className="font-mono text-xs text-muted-foreground">{me.id} · {me.role}</p></div>
              <Button variant="outline" onClick={logout}><LogOut className="mr-1.5 h-4 w-4" />Se déconnecter</Button>
            </div>
          ) : <p className="text-sm text-muted-foreground">Non connecté. Configurez le backend puis connectez-vous avec Discord depuis la barre supérieure.</p>}
        </Panel>
        <Panel title="Informations système">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">API</dt><dd className="truncate font-mono text-xs">{getApiUrl() || 'Non configurée'}</dd>
            <dt className="text-muted-foreground">Version du bot</dt><dd>{status?.bot.version ?? '—'}</dd>
            <dt className="text-muted-foreground">Bot</dt><dd>{status ? (status.bot.online ? 'En ligne' : 'Hors ligne') : '—'}</dd>
            <dt className="text-muted-foreground">Backend</dt><dd>{status ? (status.backend.ok ? 'Opérationnel' : 'Indisponible') : '—'}</dd>
            <dt className="text-muted-foreground">Supabase</dt><dd>{status ? (status.supabase.ok ? 'Opérationnel' : 'Indisponible') : '—'}</dd>
          </dl>
        </Panel>
        <div className="xl:col-span-2"><Backend /></div>
      </div>
    </>
  );
}
