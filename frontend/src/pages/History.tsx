import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, Trash2 } from 'lucide-react';
import api from '../api';

interface UploadRecord {
    id: number;
    filename: string;
    date: string;
    status: string;
    error?: string;
}

const History: React.FC = () => {
    const navigate = useNavigate();
    const [uploads, setUploads] = useState<UploadRecord[]>([]);

    useEffect(() => {
        const fetchUploads = async () => {
            try {
                const response = await api.get('/uploads');
                setUploads(response.data);
            } catch (error) {
                console.error("Error fetching history:", error);
            }
        };
        fetchUploads();
    }, []);

    const handleDelete = async (id: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet historique ? Cette action est irréversible et supprimera toutes les données associées.")) {
            try {
                await api.delete(`/uploads/${id}`);
                setUploads(uploads.filter(u => u.id !== id));
            } catch (error) {
                console.error("Error deleting upload:", error);
                alert("Erreur lors de la suppression.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
                        <Clock size={32} className="text-blue-400" /> Historique des Uploads
                    </h1>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} /> Retour à l'accueil
                    </button>
                </div>

                <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Nom du Fichier</th>
                                <th className="p-4">Statut</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {uploads.map((upload) => (
                                <tr key={upload.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 text-slate-400">{upload.date}</td>
                                    <td className="p-4 font-medium">
                                        <button
                                            onClick={() => navigate(`/dashboard?uploadId=${upload.id}`)}
                                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                                        >
                                            <FileText size={16} />
                                            {upload.filename}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${upload.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                            upload.status === 'error' ? 'bg-rose-500/10 text-rose-400' :
                                                'bg-blue-500/10 text-blue-400'
                                            }`}>
                                            {upload.status === 'completed' ? 'Terminé' :
                                                upload.status === 'error' ? 'Erreur' : 'En cours'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-400 flex items-center gap-2">
                                        {upload.status === 'completed' ? (
                                            <button
                                                onClick={() => navigate(`/dashboard?uploadId=${upload.id}`)}
                                                className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
                                            >
                                                Voir le Tableau de Bord
                                            </button>
                                        ) : (
                                            <span className="text-rose-400">{upload.error || '-'}</span>
                                        )}
                                        <button
                                            onClick={() => handleDelete(upload.id)}
                                            className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors"
                                            title="Supprimer l'historique"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default History;
