import React from 'react';
import { useNavigate } from 'react-router-dom';
import Upload from '../components/Upload';
import Chatbot from '../components/Chatbot';
import { useAuth } from '../context/AuthContext';
import { History, CheckCircle, Shield, LogOut } from 'lucide-react';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleUploadSuccess = (uploadId: number) => {
        // Navigate to dashboard with the specific upload ID to show only new data
        navigate(`/dashboard?uploadId=${uploadId}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="absolute top-6 right-6 p-3 bg-slate-800/80 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-full transition-all border border-slate-700 hover:border-red-500/50 z-50 backdrop-blur-sm"
                title="Se déconnecter"
            >
                <LogOut size={24} />
            </button>

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="z-10 w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
                        Tableau de Bord Financier
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Importez vos données financières pour générer des insights instantanés.
                    </p>
                </div>

                <Upload onUploadSuccess={handleUploadSuccess} />

                <div className="flex justify-center mt-8 gap-4">
                    <button
                        onClick={() => navigate('/history')}
                        className="flex items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all group w-full max-w-xs"
                    >
                        <History className="text-purple-400 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-medium">Mes tableaux de bord</span>
                    </button>

                    {user && user.is_admin && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all group w-full max-w-xs"
                        >
                            <Shield className="text-red-400 group-hover:scale-110 transition-transform" />
                            <span className="text-slate-200 font-medium">Admin</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Product Tour Section */}
            <div className="w-full max-w-7xl mt-24 grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
                <div className="space-y-8 lg:col-span-2">
                    <h2 className="text-4xl font-bold text-white leading-tight">
                        Transformez vos données en <span className="text-emerald-400">décisions stratégiques</span>
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Notre solution simplifie l'analyse financière pour les entreprises modernes.
                        Fini les tableurs complexes : obtenez des tableaux de bord clairs et des données probantes en quelques secondes.
                    </p>

                    <ul className="space-y-6">
                        <li className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-blue-500/20 rounded-full">
                                <CheckCircle size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-slate-200 font-semibold text-lg">Visualisation Instantanée</h3>
                                <p className="text-slate-500">Vue d'ensemble claire de vos performances.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-purple-500/20 rounded-full">
                                <CheckCircle size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-slate-200 font-semibold text-lg">Analyse IA Avancée</h3>
                                <p className="text-slate-500">Détection automatique des opportunités.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-emerald-500/20 rounded-full">
                                <CheckCircle size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-slate-200 font-semibold text-lg">Prévisions Fiables</h3>
                                <p className="text-slate-500">Anticipez l'avenir avec précision.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="lg:col-span-3 grid grid-cols-2 gap-8">
                    <div className="group cursor-pointer transition-transform hover:scale-105 duration-300">
                        <div className="relative rounded-xl overflow-hidden border-2 border-slate-700/50 shadow-2xl">
                            <div className="absolute -inset-2 bg-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <img src="/assets/overview.png" alt="Vue d'ensemble" className="relative w-full" />
                        </div>
                        <p className="mt-3 text-center text-slate-300 font-medium group-hover:text-blue-400 transition-colors">Vue Globale</p>
                    </div>
                    <div className="group cursor-pointer transition-transform hover:scale-105 duration-300">
                        <div className="relative rounded-xl overflow-hidden border-2 border-slate-700/50 shadow-2xl">
                            <div className="absolute -inset-2 bg-purple-500/20 blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <img src="/assets/annual.png" alt="Vue Annuelle" className="relative w-full" />
                        </div>
                        <p className="mt-3 text-center text-slate-300 font-medium group-hover:text-purple-400 transition-colors">Comparatif Annuel</p>
                    </div>
                    <div className="group cursor-pointer transition-transform hover:scale-105 duration-300">
                        <div className="relative rounded-xl overflow-hidden border-2 border-slate-700/50 shadow-2xl">
                            <div className="absolute -inset-2 bg-emerald-500/20 blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <img src="/assets/forecast.png" alt="Prévisions" className="relative w-full" />
                        </div>
                        <p className="mt-3 text-center text-slate-300 font-medium group-hover:text-emerald-400 transition-colors">Prévisions</p>
                    </div>
                    <div className="group cursor-pointer transition-transform hover:scale-105 duration-300">
                        <div className="relative rounded-xl overflow-hidden border-2 border-slate-700/50 shadow-2xl">
                            <div className="absolute -inset-2 bg-orange-500/20 blur-lg opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <img src="/assets/analysis.png" alt="Analyse IA" className="relative w-full" />
                        </div>
                        <p className="mt-3 text-center text-slate-300 font-medium group-hover:text-orange-400 transition-colors">Analyse IA</p>
                    </div>
                </div>
            </div>
            <Chatbot />
        </div>
    );
};

export default Home;
