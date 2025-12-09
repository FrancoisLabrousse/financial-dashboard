import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';
import Subscription from './pages/Subscription';
import PaymentResult from './pages/PaymentResult';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Chargement...</div>;
    }

    return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Chargement...</div>;
    }

    return user && user.is_admin ? <>{children}</> : <Navigate to="/dashboard" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/subscription" element={<PrivateRoute><Subscription /></PrivateRoute>} />
                    <Route path="/payment/success" element={<PrivateRoute><PaymentResult status="success" /></PrivateRoute>} />
                    <Route path="/payment/cancel" element={<PrivateRoute><PaymentResult status="cancel" /></PrivateRoute>} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/history"
                        element={
                            <PrivateRoute>
                                <History />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        }
                    />
                    {/* Root Route: Landing Page if guest, Home if user */}
                    <Route path="/" element={<RootRedirect />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

// Wrapper component to handle the conditional logic
const RootRedirect: React.FC = () => {
    const { user, loading } = useAuth();
    if (loading) return null; // Or a spinner
    return user ? <Home /> : <LandingPage />;
};

export default App;
