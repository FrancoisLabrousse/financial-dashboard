import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

interface PaymentResultProps {
    status: 'success' | 'cancel';
}

const PaymentResult: React.FC<PaymentResultProps> = ({ status }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (status === 'success') {
            // Redirect to home after 3 seconds
            const timer = setTimeout(() => {
                navigate('/');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status, navigate]);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full text-center">
                {status === 'success' ? (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="bg-green-500/20 p-4 rounded-full">
                                <CheckCircle className="text-green-500" size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Paiement réussi !</h2>
                        <p className="text-slate-300 mb-6">
                            Merci pour votre abonnement. Votre compte a été mis à niveau avec succès.
                        </p>
                        <p className="text-slate-500 text-sm">
                            Redirection automatique vers l'accueil...
                        </p>
                    </>
                ) : (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="bg-red-500/20 p-4 rounded-full">
                                <XCircle className="text-red-500" size={48} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Paiement annulé</h2>
                        <p className="text-slate-300 mb-6">
                            Le processus de paiement a été annulé. Aucun débit n'a été effectué.
                        </p>
                        <button
                            onClick={() => navigate('/subscription')}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl transition-colors"
                        >
                            Retourner aux abonnements
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentResult;
