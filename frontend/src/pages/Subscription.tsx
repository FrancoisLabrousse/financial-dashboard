import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, CreditCard, Star } from 'lucide-react';
import api from '../api';

const Subscription: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const response = await api.post('/payment/create-checkout-session');
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error("Subscription error:", error);
            alert("Une erreur est survenue lors de la création de la session de paiement.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-4xl w-full mx-auto text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Passez à la vitesse supérieure
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    Vous avez atteint la limite de votre plan gratuit. Débloquez toutes les fonctionnalités et analysez vos finances sans limites.
                </p>
            </div>

            <div className="relative z-10 grid md:grid-cols-2 gap-8 max-w-4xl w-full">
                {/* Free Plan (Current) */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 flex flex-col opacity-75 grayscale">
                    <div className="mb-4">
                        <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm font-medium">Actuel</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Gratuit</h3>
                    <div className="text-4xl font-bold text-white mb-6">0€ <span className="text-lg text-slate-400 font-normal">/mois</span></div>

                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-slate-300">
                            <Check className="text-green-500" size={20} />
                            <span>2 imports de fichiers</span>
                        </li>
                    </ul>

                    <button disabled className="w-full py-3 px-6 rounded-xl bg-slate-700 text-slate-400 font-medium cursor-not-allowed">
                        Plan actuel
                    </button>
                </div>

                {/* Premium Plan */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-8 flex flex-col relative shadow-2xl shadow-blue-500/10 transform hover:scale-105 transition-transform duration-300">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                        <Star size={14} fill="white" /> RECOMMANDÉ
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2 mt-2">Premium</h3>
                    <div className="text-4xl font-bold text-white mb-6">39€ <span className="text-lg text-slate-400 font-normal">/mois</span></div>

                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-white">
                            <div className="bg-blue-500/20 p-1 rounded-full"><Check className="text-blue-400" size={16} /></div>
                            <span>Imports illimités</span>
                        </li>
                        <li className="flex items-center gap-3 text-white">
                            <div className="bg-blue-500/20 p-1 rounded-full"><Check className="text-blue-400" size={16} /></div>
                            <span>Analyses avancées & Prévisions</span>
                        </li>
                        <li className="flex items-center gap-3 text-white">
                            <div className="bg-blue-500/20 p-1 rounded-full"><Check className="text-blue-400" size={16} /></div>
                            <span>Support prioritaire 24/7</span>
                        </li>
                        <li className="flex items-center gap-3 text-white">
                            <div className="bg-blue-500/20 p-1 rounded-full"><Check className="text-blue-400" size={16} /></div>
                            <span>Export PDF professionnel</span>
                        </li>
                    </ul>

                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-lg shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CreditCard size={20} />
                                S'abonner maintenant
                            </>
                        )}
                    </button>
                    <p className="text-center text-slate-500 text-sm mt-4">Paiement sécurisé via Stripe. Annulable à tout moment.</p>
                </div>
            </div>

            <button onClick={() => navigate('/')} className="mt-12 text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                Retour à l'accueil
            </button>
        </div>
    );
};

export default Subscription;
