import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Camera, ShieldCheck, PanelLeftClose } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Face Test', path: '/test', icon: Camera },
];

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const location = useLocation();

    return (
        <aside
            className={cn(
                'bg-slate-900 text-white h-screen sticky top-0 flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out',
                isOpen ? 'w-64' : 'w-0'
            )}
        >
            <div className="w-64 min-w-64 flex flex-col h-full">
                <div className="p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <ShieldCheck className="text-blue-400 w-8 h-8 shrink-0" />
                        <h1 className="text-xl font-bold tracking-tight truncate">Face Admin</h1>
                    </div>
                    <button
                        type="button"
                        onClick={onToggle}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                        aria-label="Close sidebar"
                    >
                        <PanelLeftClose size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                    isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                )}
                            >
                                <item.icon size={20} className="shrink-0" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center shrink-0">
                    © 2026 Face Recognition Server
                </div>
            </div>
        </aside>
    );
}