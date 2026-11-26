import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';
import { Toaster } from '@project/components/ui/sonner';
import { AppProvider } from './contexts/AppContext';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ServersPage from './pages/ServersPage';
import ServerDetailPage from './pages/ServerDetailPage';
import MembersPage from './pages/MembersPage';
import MemberDetailPage from './pages/MemberDetailPage';
import RolesChannelsPage from './pages/RolesChannelsPage';
import CommandsPage from './pages/CommandsPage';
import EconomyPage from './pages/economy/EconomyPage';
import MessagesPage from './pages/MessagesPage';
import SocialPage from './pages/SocialPage';
import SupportPage from './pages/SupportPage';
import TtsPage from './pages/TtsPage';
import BumpPage from './pages/BumpPage';
import InfosPage from './pages/InfosPage';
import LogsPage from './pages/LogsPage';
import AdminsPage from './pages/AdminsPage';
import SettingsPage from './pages/SettingsPage';

function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl font-semibold text-primary">404</p>
      <p className="mt-3 text-lg font-medium">Page introuvable</p>
      <Link to="/" className="mt-6 inline-block text-sm text-primary hover:underline">Retour au tableau de bord</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/statistiques" element={<AnalyticsPage />} />
            <Route path="/serveurs" element={<ServersPage />} />
            <Route path="/serveurs/:id" element={<ServerDetailPage />} />
            <Route path="/membres" element={<MembersPage />} />
            <Route path="/membres/:guildId/:userId" element={<MemberDetailPage />} />
            <Route path="/roles-salons" element={<RolesChannelsPage />} />
            <Route path="/commandes" element={<CommandsPage />} />
            <Route path="/economie" element={<EconomyPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications-sociales" element={<SocialPage />} />
            <Route path="/assistance" element={<SupportPage />} />
            <Route path="/tts" element={<TtsPage />} />
            <Route path="/bump" element={<BumpPage />} />
            <Route path="/clashbot-infos" element={<InfosPage />} />
            <Route path="/journaux" element={<LogsPage />} />
            <Route path="/administrateurs" element={<AdminsPage />} />
            <Route path="/parametres" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster richColors position="bottom-right" />
      </AppProvider>
    </BrowserRouter>
  );
}
