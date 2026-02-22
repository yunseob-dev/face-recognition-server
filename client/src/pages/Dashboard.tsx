import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../services/userService';
import { healthService } from '../services/healthService';
import type { User } from '../types/user';
import type { HealthResponse } from '../services/healthService';
import {
    Loader2,
    Users,
    UserCheck,
    Activity,
    Plus,
    Camera,
    FolderInput,
    User as UserIcon,
    ChevronRight,
} from 'lucide-react';

const RECENT_COUNT = 10;

export default function Dashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [usersLoading, setUsersLoading] = useState(true);
    const [healthLoading, setHealthLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [usersData] = await Promise.all([
                    userService.getUsers(),
                    healthService.getHealth().then((h) => {
                        setHealth(h);
                        return h;
                    }),
                ]);
                setUsers(usersData);
            } catch (e) {
                console.error('Dashboard load error:', e);
            } finally {
                setUsersLoading(false);
                setHealthLoading(false);
            }
        };
        load();
    }, []);

    const activeCount = users.filter((u) => u.is_active).length;
    const recentUsers = [...users]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, RECENT_COUNT);

    const isLoading = usersLoading;
    const isHealthReady = !healthLoading && health !== null;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">등록 사용자 수</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {isLoading ? '—' : users.length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">활성 사용자 수</p>
                            <p className="text-2xl font-bold text-slate-800">
                                {isLoading ? '—' : activeCount}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">시스템 상태</p>
                            <p className="text-lg font-semibold text-slate-800">
                                {!isHealthReady
                                    ? '—'
                                    : health!.model_loaded
                                      ? 'Healthy'
                                      : 'Degraded'}
                            </p>
                            {isHealthReady && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Model: {health!.model_loaded ? 'Loaded' : 'Not loaded'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                    <Link
                        to="/users/new"
                        className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <Plus size={20} />
                        새 사용자 등록
                    </Link>
                    <Link
                        to="/test"
                        className="flex items-center gap-2 px-4 py-3 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                        <Camera size={20} />
                        얼굴 검색 테스트
                    </Link>
                    <Link
                        to="/users/bulk"
                        className="flex items-center gap-2 px-4 py-3 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                        <FolderInput size={20} />
                        대량 등록
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">최근 등록 사용자</h3>
                    <Link
                        to="/users"
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        전체 보기
                        <ChevronRight size={16} />
                    </Link>
                </div>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : recentUsers.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500">데이터가 없습니다.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Identity ID</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <UserIcon size={16} />
                                            </div>
                                            <span className="font-medium text-slate-700">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                                        {user.identity_id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
