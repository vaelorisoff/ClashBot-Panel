import { BrowserRouter, Outlet, Route, Routes, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from '@project/components/ui/sonner';
import { SessionProvider } from './context/Session';
import Header, { MobileNav } from './components/Header';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import SearchPage from './pages/SearchPage';
import WatchPage from './pages/WatchPage';
import ProfilePage from './pages/ProfilePage';
import LibraryPage from './pages/LibraryPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import PublishPage from './pages/PublishPage';
import SettingsPage from './pages/SettingsPage';
import PlaylistPage from './pages/PlaylistPage';
import AdminPage from './pages/AdminPage';
import { PARTNER_NAME, PARTNER_URL, SITE_NAME } from './lib/config';

document.documentElement.classList.add('dark');

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout() {
  return (
    <div className="min-h-screen">
      <ScrollTop />
      <Header />
      <main className="mx-auto max-w-[1600px] px-4 pb-28 pt-6 lg:px-6 xl:pb-16">
        <Outlet />
      </main>
      <footer className="mx-auto hidden max-w-[1600px] border-t border-border/50 px-6 py-8 text-xs text-muted-foreground xl:block">
        <p>
          © {new Date().getFullYear()} {SITE_NAME} — plateforme indépendante. Les vidéos sont lues via le lecteur officiel YouTube ;
          les J'aime, commentaires et abonnements sont propres à {SITE_NAME}.{' '}
          <a href={PARTNER_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary">{PARTNER_NAME} ↗</a>{' '}
          est une entité distincte.
        </p>
      </footer>
      <MobileNav />
    </div>
  );
}

function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-4xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-muted-foreground">Ce contenu n'existe pas ou a été retiré.</p>
      <Link to="/" className="mt-6 inline-block text-primary hover:underline">Retour à l'accueil</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explorer" element={<ExplorePage />} />
            <Route path="/explorer/:category" element={<ExplorePage />} />
            <Route path="/recherche" element={<SearchPage />} />
            <Route path="/v/:id" element={<WatchPage />} />
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/abonnements" element={<SubscriptionsPage />} />
            <Route path="/bibliotheque" element={<LibraryPage />} />
            <Route path="/publier" element={<PublishPage />} />
            <Route path="/publier/:id" element={<PublishPage />} />
            <Route path="/parametres" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </SessionProvider>
    </BrowserRouter>
  );
}
