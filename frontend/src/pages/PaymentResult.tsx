import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

interface PaymentResultProps {
    status: 'success' | 'cancel';
}

const PaymentResult: React.FC<PaymentResultProps> = ({ status }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (status === 'success') {
            const searchParams = new URLSearchParams(window.location.search);
            const sessionId = searchParams.get('session_id');

            if (sessionId) {
                // Verify session with backend to ensure status is updated immediately
                // This acts as a fallback/accelerator for the webhook
                fetch(`${import.meta.env.VITE_API_URL || '/api'}/payment/verify-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ session_id: sessionId })
                })
                    .then(res => res.json())
                    .then(data => {
                        console.log("Verification result:", data);
                        // Redirect after verification
                        setTimeout(() => navigate('/'), 2000);
                    })
                    .catch(err => {
                        console.error("Verification failed:", err);
                        setTimeout(() => navigate('/'), 3000);
                    });
            } else {
                setTimeout(() => navigate('/'), 3000);
            }
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
