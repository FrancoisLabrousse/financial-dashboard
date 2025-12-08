import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Shield } from 'lucide-react';

interface UserData {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
    created_at: string;
    upload_count: number;
}

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !user.is_admin) {
            navigate('/dashboard');
            return;
        }

        const fetchUsers = async () => {
            try {
                const response = await api.get('/admin/users');
                setUsers(response.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [user, navigate]);

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Chargement...</div>;

    return (
        <div className="min-h-screen bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Shield className="text-emerald-400" />
                        Administration
                    </h1>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        Retour au Dashboard
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Users className="text-blue-400" size={20} />
                            Utilisateurs Inscrits ({users.length})
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Utilisateur</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Rôle</th>
                                    <th className="px-6 py-4">Date d'inscription</th>
                                    <th className="px-6 py-4 text-center">Uploads</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-500">#{u.id}</td>
                                        <td className="px-6 py-4 text-white font-medium">{u.username}</td>
                                        <td className="px-6 py-4 text-slate-300">{u.email}</td>
                                        <td className="px-6 py-4">
                                            {u.is_admin ? (
                                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium border border-emerald-500/20">Admin</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-medium border border-blue-500/20">User</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{u.created_at}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-slate-200 text-sm">
                                                <FileText size={14} />
                                                {u.upload_count}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
