import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface Message {
    id: number;
    text: string;
    sender: 'bot' | 'user';
}

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Bonjour ! Je suis votre assistant virtuel. Vous rencontrez des difficultés avec vos fichiers Excel ou l'importation ? Je suis là pour vous aider.", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Simulate bot response
        setTimeout(() => {
            const botResponse = getBotResponse(userMessage.text);
            setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: 'bot' }]);
        }, 1000);
    };

    const getBotResponse = (text: string): string => {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('excel') || lowerText.includes('format') || lowerText.includes('colonne')) {
            return "Pour que votre fichier Excel soit reconnu, il doit contenir au minimum les colonnes suivantes : 'Date', 'Libellé' (ou Description), et 'Montant' (ou Débit/Crédit). Assurez-vous qu'il n'y a pas de lignes vides avant l'en-tête.";
        }
        if (lowerText.includes('erreur') || lowerText.includes('echec') || lowerText.includes('marche pas')) {
            return "Si vous rencontrez une erreur lors de l'import, vérifiez que votre fichier est bien au format .xlsx ou .csv. Essayez également de simplifier le fichier en ne gardant que les données brutes (pas de graphiques ni de formules complexes).";
        }
        if (lowerText.includes('date')) {
            return "Les dates doivent être au format standard (JJ/MM/AAAA ou AAAA-MM-JJ). Si Excel affiche des '#####', élargissez la colonne, mais l'import devrait fonctionner tant que la valeur est correcte.";
        }
        if (lowerText.includes('bonjour') || lowerText.includes('salut')) {
            return "Bonjour ! Comment puis-je vous aider aujourd'hui ?";
        }

        return "Je ne suis pas sûr de comprendre. Pouvez-vous préciser votre problème ? Je peux vous aider sur le formatage des fichiers Excel et les erreurs d'importation.";
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-80 sm:w-96 mb-4 overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-10 fade-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">Assistant Support</h3>
                                <p className="text-blue-100 text-xs">En ligne</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-slate-700 text-slate-200 rounded-tl-none border border-slate-600'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-slate-800 border-t border-slate-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Posez votre question..."
                                className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <button
                                onClick={handleSend}
                                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!input.trim()}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 ${isOpen
                        ? 'bg-slate-700 text-slate-300 rotate-90'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-blue-500/25'
                    }`}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </button>
        </div>
    );
};

export default Chatbot;
