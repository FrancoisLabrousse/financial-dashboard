import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    Shield,
    Zap,
    CheckCircle,
    ArrowRight,
    BarChart3
} from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="text-blue-500" size={32} />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                FinDash
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-slate-300 hover:text-white transition-colors"
                            >
                                Connexion
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-all hover:scale-105"
                            >
                                Commencer
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-blue-400 mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Nouvelle version disponible
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
                        Maîtrisez vos finances <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-500">
                            en toute simplicité
                        </span>
                    </h1>

                    <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Analysez vos relevés bancaires, visualisez vos flux de trésorerie et obtenez des prévisions précises grâce à notre IA avancée.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => navigate('/register')}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105 flex items-center gap-2"
                        >
                            Essayer gratuitement
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => {
                                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-8 py-4 bg-slate-800 rounded-xl font-bold text-lg border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2"
                        >
                            Découvrir
                        </button>
                    </div>

                    {/* Dashboard Preview Mockup */}
                    <div className="mt-20 relative mx-auto max-w-5xl">
                        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-2 shadow-2xl backdrop-blur-sm">
                            <img
                                src="/assets/overview.png"
                                alt="Dashboard Preview"
                                className="rounded-lg w-full h-auto opacity-90 hover:opacity-100 transition-opacity duration-700"
                            />
                        </div>
                        {/* Floating Cards */}
                        <div className="absolute -right-8 top-1/4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl hidden lg:block animate-bounce-slow">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <TrendingUp className="text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-400">Revenus Mensuels</div>
                                    <div className="font-bold text-emerald-400">+12% vs N-1</div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -left-8 bottom-1/4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl hidden lg:block animate-bounce-slow-delay">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Zap className="text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-400">Prévision IA</div>
                                    <div className="font-bold text-purple-400">Optimisation détectée</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="py-24 bg-slate-900/50 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">Fonctionnalités Puissantes</h2>
                        <p className="text-slate-400">Tout ce dont vous avez besoin pour piloter votre activité.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BarChart3 className="text-blue-400" size={32} />,
                                title: "Visualisation de Données",
                                desc: "Transformez des fichiers CSV/Excel complexes en graphiques clairs et interactifs."
                            },
                            {
                                icon: <Zap className="text-purple-400" size={32} />,
                                title: "Intelligence Artificielle",
                                desc: "Notre IA analyse vos tendances pour vous offrir des prévisions financières fiables."
                            },
                            {
                                icon: <Shield className="text-emerald-400" size={32} />,
                                title: "Sécurité Maximale",
                                desc: "Vos données sont chiffrées et stockées de manière sécurisée. Vous gardez le contrôle."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="p-8 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-slate-700 transition-all hover:-translate-y-1">
                                <div className="mb-6">{feature.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Simple Pricing/CTA Section */}
            <div className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5" />
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl font-bold mb-8">Prêt à transformer votre gestion financière ?</h2>
                    <div className="flex flex-col gap-4 items-center">
                        <div className="flex gap-2 text-slate-300 mb-6">
                            <span className="flex items-center gap-1"><CheckCircle size={16} className="text-emerald-400" /> Pas de carte requise</span>
                            <span className="flex items-center gap-1"><CheckCircle size={16} className="text-emerald-400" /> 2 uploads gratuits</span>
                            <span className="flex items-center gap-1"><CheckCircle size={16} className="text-emerald-400" /> Support 24/7</span>
                        </div>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-8 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105"
                        >
                            Créer mon compte gratuitement
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-12 bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="text-slate-600" />
                        <span className="text-slate-500 font-semibold">FinDash © 2025</span>
                    </div>
                    <div className="flex gap-6 text-slate-500">
                        <a href="#" className="hover:text-blue-400 transition-colors">Confidentialité</a>
                        <a href="#" className="hover:text-blue-400 transition-colors">CGU</a>
                        <a href="#" className="hover:text-blue-400 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
