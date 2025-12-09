import LandingPage from './pages/LandingPage';

function App() {
    const { user } = useAuth(); // Need to access user state in App to condition root route

    // Note: useAuth needs to be inside AuthProvider. 
    // We need to refactor App structure or use a wrapper component.
    // Let's create a wrapper for the root route.

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
