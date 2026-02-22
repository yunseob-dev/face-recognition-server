import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import type { User } from '../types/user';
import { Trash2, User as UserIcon, Loader2, Search, Plus, FolderInput, Pencil, X, ImageOff } from 'lucide-react';

function PreprocessedThumbnail({ identityId }: { identityId: string }) {
    const [src, setSrc] = useState<string | null>(null);
    const blobUrlRef = useRef<string | null>(null);
    useEffect(() => {
        if (!identityId) return;
        const token = localStorage.getItem('access_token');
        const url = `${window.location.origin}/api/v1/users/face-preprocessed-image/${identityId}`;
        fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then((r) => (r.ok ? r.blob() : null))
            .then((blob) => {
                if (blob) {
                    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
                    blobUrlRef.current = URL.createObjectURL(blob);
                    setSrc(blobUrlRef.current);
                }
            })
            .catch(() => {});
        return () => {
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
            }
            setSrc(null);
        };
    }, [identityId]);
    if (src) return <img src={src} alt="Preprocessed" className="w-10 h-10 object-cover rounded border border-slate-200" />;
    return (
        <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400" title="No preprocessed image">
            <ImageOff size={18} />
        </div>
    );
}

export default function UserList() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editName, setEditName] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await userService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (userId: number) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            await userService.deleteUser(userId);
            setUsers(users.filter(user => user.id !== userId));
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('삭제 실패');
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setEditName(user.name);
        setEditIsActive(user.is_active);
    };

    const closeEditModal = () => {
        setEditingUser(null);
        setIsSaving(false);
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;
        const name = editName.trim();
        if (!name) {
            alert('이름을 입력해 주세요.');
            return;
        }
        setIsSaving(true);
        try {
            const updated = await userService.updateUser(editingUser.id, {
                name,
                is_active: editIsActive,
            });
            setUsers(users.map(u => (u.id === updated.id ? updated : u)));
            closeEditModal();
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('수정 실패');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.identity_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">사용자 관리</h2>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="이름 또는 ID 검색..."
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => navigate('/users/bulk')}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm mr-2"
                    >
                        <FolderInput size={18} />
                        <span>대량 등록</span>
                    </button>

                    <button
                        onClick={() => navigate('/users/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        <span>새 사용자 등록</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium">ID</th>
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">Identity ID</th>
                            <th className="px-6 py-4 font-medium">Preprocessed</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Created At</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    데이터가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500">#{user.id}</td>
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
                                        <PreprocessedThumbnail identityId={user.identity_id} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit User"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeEditModal}>
                    <div
                        className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">사용자 수정</h3>
                            <button
                                onClick={closeEditModal}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="edit-is-active"
                                    checked={editIsActive}
                                    onChange={(e) => setEditIsActive(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="edit-is-active" className="text-sm font-medium text-slate-600">
                                    Active
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={closeEditModal}
                                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
