import {
  Activity, BarChart3, Bell, Bot, Coins, FileClock, Hash, Headphones, LayoutDashboard, Megaphone, MessageSquareText,
  Mic, Rocket, Server, Settings, ShieldCheck, Terminal, Users, type LucideIcon,
} from 'lucide-react';

export type NavItem = { to: string; label: string; icon: LucideIcon };
export type NavGroup = { title: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  { title: 'Vue d\'ensemble', items: [
    { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { to: '/statistiques', label: 'Statistiques', icon: BarChart3 },
  ] },
  { title: 'Communauté', items: [
    { to: '/serveurs', label: 'Serveurs', icon: Server },
    { to: '/membres', label: 'Membres', icon: Users },
    { to: '/roles-salons', label: 'Rôles et salons', icon: Hash },
  ] },
  { title: 'Fonctionnalités', items: [
    { to: '/commandes', label: 'Commandes', icon: Terminal },
    { to: '/economie', label: 'Économie', icon: Coins },
    { to: '/messages', label: 'Messages', icon: MessageSquareText },
    { to: '/notifications-sociales', label: 'Notifications sociales', icon: Bell },
    { to: '/assistance', label: 'Assistance', icon: Headphones },
    { to: '/tts', label: 'Synthèse vocale', icon: Mic },
    { to: '/bump', label: 'Bump et classement', icon: Rocket },
  ] },
  { title: 'ClashBot', items: [
    { to: '/clashbot-infos', label: '#clashbot-infos', icon: Megaphone },
    { to: '/journaux', label: 'Journaux', icon: FileClock },
    { to: '/administrateurs', label: 'Administrateurs', icon: ShieldCheck },
    { to: '/parametres', label: 'Paramètres', icon: Settings },
  ] },
];

export const BrandIcon = Bot;
export const ActivityIcon = Activity;
