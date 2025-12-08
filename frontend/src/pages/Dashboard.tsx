import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell, ComposedChart, Line, LabelList } from 'recharts';
import { DollarSign, TrendingUp, ShoppingCart, CreditCard, Activity, Trash2, Calendar, PieChart as PieChartIcon, ArrowLeft, Percent, AlertCircle, LineChart, X, Download, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import KPICard from '../components/KPICard';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400 p-8">
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-bold mb-4">Une erreur est survenue</h1>
                        <pre className="bg-slate-800 p-4 rounded overflow-auto">{this.state.error?.toString()}</pre>
                        <pre className="mt-2 text-sm text-slate-500">{this.state.error?.stack}</pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const uploadId = searchParams.get('uploadId');
    const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'annual' | 'forecast' | 'export' | 'analysis'>('overview');

    const formatDateFR = (dateStr: string) => {
        if (!dateStr || typeof dateStr !== 'string') return '';
        // Handle YYYY-MM
        if (/^\d{4}-\d{2}$/.test(dateStr)) {
            const [year, month] = dateStr.split('-');
            return `${month}/${year}`;
        }
        // Handle YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split('-');
            return `${day}/${month}/${year}`;
        }
        return dateStr;
    };
    const [stats, setStats] = useState<any>(null);
    const [advancedStats, setAdvancedStats] = useState<any>(null);
    const [cashflow, setCashflow] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [annualData, setAnnualData] = useState<any[]>([]);
    const [topExpenses, setTopExpenses] = useState<any[]>([]);
    const [topIncome, setTopIncome] = useState<any[]>([]);
    const [forecastData, setForecastData] = useState<any[]>([]);
    const [customBalance, setCustomBalance] = useState<number | ''>('');
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDetails, setSelectedDetails] = useState<any[]>([]);
    const [modalTitle, setModalTitle] = useState("");
    const [selectedMonthStats, setSelectedMonthStats] = useState<{ income: number; expense: number } | null>(null);

    const fetchData = async () => {
        try {
            const params = uploadId ? `&upload_id=${uploadId}` : '';
            const qParams = uploadId ? `?upload_id=${uploadId}` : '';

            const [statsRes, advStatsRes, cashflowRes, monthlyRes, annualRes, topExpRes, topIncRes, forecastRes, analysisRes] = await Promise.all([
                api.get(`/dashboard/stats${qParams}`),
                api.get(`/dashboard/advanced-kpis${qParams}`),
                api.get(`/dashboard/cashflow?granularity=day${params}`),
                api.get(`/dashboard/monthly${qParams}`), // Let backend choose default year
                api.get(`/dashboard/annual${qParams}`),
                api.get(`/dashboard/top-expenses?limit=0${params}`), // Fetch ALL expenses
                api.get(`/dashboard/top-income?limit=0${params}`), // Fetch ALL income
                api.get(`/forecast?months=6${params}`),
                api.get(`/dashboard/analysis${qParams}`)
            ]);
            setStats(statsRes.data);
            if (statsRes.data?.current_balance !== undefined) {
                setCustomBalance(statsRes.data.current_balance);
            }
            setAdvancedStats(advStatsRes.data);
            setCashflow(cashflowRes.data || []);
            setMonthlyData(monthlyRes.data || []);
            setAnnualData(annualRes.data || []);
            setTopExpenses(topExpRes.data || []);
            setTopIncome(topIncRes.data || []);
            setForecastData(forecastRes.data || []);
            setAnalysisData(analysisRes.data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [uploadId]);

    const handleBarClick = async (data: any, index: number, event: React.MouseEvent) => {
        // Recharts onClick passes the data object of the clicked item
        // But for BarChart with multiple bars (Income/Expense), we need to know WHICH bar was clicked.
        // Unfortunately, Recharts generic onClick on BarChart doesn't easily distinguish the series.
        // Instead, we put onClick on the specific <Bar> components.
    };

    const handleSeriesClick = async (data: any, type: 'income' | 'expense') => {
        const item = data.payload || data;
        if (!item || !item.month) return;

        setModalTitle(`Détails ${type === 'income' ? 'Revenus' : 'Dépenses'} - ${formatDateFR(item.month)}`);
        setSelectedMonthStats({ income: item.income, expense: item.expense });
        setIsModalOpen(true);
        setSelectedDetails([]); // Clear previous

        try {
            const params = uploadId ? `&upload_id=${uploadId}` : '';
            const res = await api.get(`/dashboard/details?month=${item.month}&type=${type}${params}`);
            setSelectedDetails(res.data);
        } catch (error) {
            console.error("Failed to fetch details", error);
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('full-report');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                backgroundColor: '#0f172a', // Match slate-900
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height] // Custom size to fit content
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Failed to generate PDF");
        }
    };

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#6366f1'];
    const GREEN_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669', '#047857', '#065f46', '#064e3b'];

    const adjustedForecastData = useMemo(() => {
        if (customBalance === '' || !forecastData || !forecastData.length) return forecastData || [];
        let currentBal = Number(customBalance);
        return forecastData.map(item => {
            currentBal += item.predicted_net;
            return {
                ...item,
                predicted_balance: currentBal
            };
        });
    }, [forecastData, customBalance]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!loading && !stats) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
                <AlertCircle size={48} className="text-red-400" />
                <h2 className="text-2xl font-bold">Impossible de charger les données</h2>
                <p className="text-slate-400">Veuillez réessayer ou vérifier votre fichier.</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Retour à l'accueil
                </button>
            </div>
        );
    }



    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-slate-900 p-8 text-slate-50">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8 flex justify-between items-center border-b border-slate-800 pb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={24} className="text-slate-400" />
                            </button>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    Tableau de bord financier
                                </h1>
                                <p className="text-slate-400 mt-2">
                                    {uploadId ? (
                                        <span className="flex items-center gap-2 text-yellow-400">
                                            <Clock size={16} /> Consultation de l'historique #{uploadId}
                                        </span>
                                    ) : (
                                        "Aperçu financier en temps réel & suivi de performance"
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
                                        try {
                                            await api.delete('/data');
                                            window.location.reload();
                                        } catch (e) {
                                            alert('Failed to reset data');
                                        }
                                    }
                                }}
                                className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20 flex items-center gap-2"
                            >
                            </button>
                        </div>
                    </header>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-8">
                        {[
                            { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
                            { id: 'monthly', label: 'Détails Mensuels', icon: Calendar },
                            { id: 'annual', label: 'Vue Annuelle', icon: TrendingUp },
                            { id: 'forecast', label: 'Prévisions', icon: LineChart },
                            { id: 'analysis', label: 'Analyse IA', icon: Activity },
                            { id: 'export', label: 'Exporter', icon: Download },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>


                    {activeTab === 'overview' && (
                        <>
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
                                <div className="lg:col-span-2">
                                    <KPICard title="Ventes Totales" value={`${stats?.total_sales?.toLocaleString()}€`} icon={TrendingUp} color="text-emerald-400" bgColor="bg-emerald-500/10" borderColor="border-emerald-500/20" />
                                </div>
                                <div className="lg:col-span-2">
                                    <KPICard title="Achats Totaux" value={`${Math.abs(stats?.total_purchases || 0).toLocaleString()}€`} icon={ShoppingCart} color="text-rose-400" bgColor="bg-rose-500/10" borderColor="border-rose-500/20" />
                                </div>


                                {/* Advanced KPIs */}
                                <div className="lg:col-span-2">
                                    <KPICard title="Marge Brute" value={`${stats?.margin?.toLocaleString()}€`} icon={DollarSign} color="text-blue-400" bgColor="bg-blue-500/10" borderColor="border-blue-500/20" />
                                </div>
                                <div className="lg:col-span-2">
                                    <KPICard title="Taux de Rentabilité" value={`${advancedStats?.savings_rate}%`} icon={Percent} color="text-yellow-400" bgColor="bg-yellow-500/10" borderColor="border-yellow-500/20" />
                                </div>
                                <div className="lg:col-span-2">
                                    <KPICard
                                        title="Dépense Max"
                                        value={`${advancedStats?.max_expense?.toLocaleString()}€`}
                                        icon={AlertCircle}
                                        color="text-orange-400"
                                        bgColor="bg-orange-500/10"
                                        borderColor="border-orange-500/20"
                                        onClick={() => {
                                            if (advancedStats?.max_expense_details) {
                                                setModalTitle("Détails Dépense Max");
                                                setSelectedDetails([advancedStats.max_expense_details]);
                                                setSelectedMonthStats(null);
                                                setIsModalOpen(true);
                                            }
                                        }}
                                        className="cursor-pointer hover:bg-slate-800/80 transition-colors"
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <KPICard
                                        title="Recette Max"
                                        value={`${advancedStats?.max_income?.toLocaleString()}€`}
                                        icon={TrendingUp}
                                        color="text-emerald-400"
                                        bgColor="bg-emerald-500/10"
                                        borderColor="border-emerald-500/20"
                                        onClick={() => {
                                            if (advancedStats?.max_income_details) {
                                                setModalTitle("Détails Recette Max");
                                                setSelectedDetails([advancedStats.max_income_details]);
                                                setSelectedMonthStats(null);
                                                setIsModalOpen(true);
                                            }
                                        }}
                                        className="cursor-pointer hover:bg-slate-800/80 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                        <Activity size={20} className="text-blue-400" /> Flux de Trésorerie Quotidien
                                    </h3>
                                    <div className="h-96">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={cashflow}>
                                                <defs>
                                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#94a3b8"
                                                    tickFormatter={(str) => formatDateFR(str).split('/').slice(0, 2).join('/')}
                                                />
                                                <YAxis stroke="#94a3b8" />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                                    itemStyle={{ color: '#f8fafc' }}
                                                    labelFormatter={(label) => formatDateFR(label)}
                                                />
                                                <Area type="monotone" dataKey="balance" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorBalance)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                        <PieChartIcon size={20} className="text-rose-400" /> Top Dépenses
                                    </h3>
                                    <div className="h-96">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={topExpenses}
                                                layout="vertical"
                                                margin={{ top: 5, right: 100, left: 40, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                                <XAxis type="number" stroke="#94a3b8" hide />
                                                <YAxis
                                                    dataKey="category"
                                                    type="category"
                                                    width={100}
                                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                                    itemStyle={{ color: '#f8fafc' }}
                                                    cursor={{ fill: '#334155', opacity: 0.4 }}
                                                />
                                                <Bar dataKey="amount" name="Montant" radius={[0, 4, 4, 0]}>
                                                    {topExpenses.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                    <LabelList dataKey="amount" position="right" fill="#ef4444" fontWeight="bold" formatter={(val: number) => `${val.toLocaleString()}€`} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'monthly' && (
                        <>
                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                                <h3 className="text-xl font-semibold mb-6">Détails Mensuels</h3>
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={formatDateFR} />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-slate-800 p-4 border border-slate-700 rounded-lg shadow-xl">
                                                                <p className="text-slate-300 mb-2 font-medium">{formatDateFR(label)}</p>
                                                                {payload.map((entry: any, index: number) => (
                                                                    <p key={index} className={`text-sm font-bold ${entry.name === 'Revenus' ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                                        {entry.name === 'Revenus' ? 'Recettes' : 'Dépenses'} : {Math.abs(entry.value).toLocaleString()}€
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="income"
                                                fill="#10b981"
                                                name="Revenus"
                                                radius={[4, 4, 0, 0]}
                                                cursor="pointer"
                                                onClick={(data) => handleSeriesClick(data, 'income')}
                                            />
                                            <Bar
                                                dataKey="expense"
                                                fill="#f43f5e"
                                                name="Dépenses"
                                                radius={[0, 0, 4, 4]}
                                                cursor="pointer"
                                                onClick={(data) => handleSeriesClick(data, 'expense')}
                                            />

                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 mt-6">
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-emerald-400" /> Saisonnalité des Revenus
                                </h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={monthlyData}>
                                            <defs>
                                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={formatDateFR} />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                                itemStyle={{ color: '#f8fafc' }}
                                                labelFormatter={formatDateFR}
                                                formatter={(value: number) => [value ? `${value.toLocaleString()}€` : '0€', 'Revenus']}
                                            />
                                            <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'annual' && (
                        <div className="space-y-6">
                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                                <h3 className="text-xl font-semibold mb-6">Vue Annuelle</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={annualData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="year" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                                itemStyle={{ color: '#f8fafc' }}
                                                cursor={{ fill: 'transparent' }}
                                            />
                                            <Legend />
                                            <Bar dataKey="income" fill="#10b981" name="Revenus" radius={[4, 4, 0, 0]}>
                                                <LabelList dataKey="income" position="top" fill="#f8fafc" formatter={(val: number) => val ? `${val.toLocaleString()}€` : ''} />
                                            </Bar>
                                            <Bar dataKey="expense" fill="#f43f5e" name="Dépenses" radius={[4, 4, 0, 0]}>
                                                <LabelList dataKey="expense" position="top" fill="#f8fafc" formatter={(val: number) => val ? `${Math.abs(val).toLocaleString()}€` : ''} />
                                            </Bar>
                                            <Bar dataKey="margin" fill="#3b82f6" name="Marge" radius={[4, 4, 0, 0]}>
                                                <LabelList dataKey="margin" position="top" fill="#f8fafc" formatter={(val: number) => val ? `${val.toLocaleString()}€` : ''} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-emerald-400" /> Détail des Revenus Annuels
                                </h3>
                                <div className="h-[600px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={topIncome}
                                            layout="vertical"
                                            margin={{ top: 5, right: 100, left: 100, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                            <XAxis type="number" stroke="#94a3b8" hide />
                                            <YAxis
                                                dataKey="category"
                                                type="category"
                                                width={150}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                                itemStyle={{ color: '#f8fafc' }}
                                                cursor={{ fill: '#334155', opacity: 0.4 }}
                                                formatter={(value: number) => [value ? `${value.toLocaleString()}€` : '0€', 'Montant']}
                                            />
                                            <Bar dataKey="amount" name="Montant" radius={[0, 4, 4, 0]}>
                                                {topIncome.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={GREEN_COLORS[index % GREEN_COLORS.length]} />
                                                ))}
                                                <LabelList dataKey="amount" position="right" fill="#10b981" fontWeight="bold" formatter={(val: number) => val ? `${val.toLocaleString()}€` : ''} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <PieChartIcon size={20} className="text-rose-400" /> Détail des Dépenses Annuelles
                                </h3>
                                <div className="h-[600px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={topExpenses}
                                            layout="vertical"
                                            margin={{ top: 5, right: 100, left: 100, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                            <XAxis type="number" stroke="#94a3b8" hide />
                                            <YAxis
                                                dataKey="category"
                                                type="category"
                                                width={150}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                                itemStyle={{ color: '#f8fafc' }}
                                                cursor={{ fill: '#334155', opacity: 0.4 }}
                                                formatter={(value: number) => [value ? `${value.toLocaleString()}€` : '0€', 'Montant']}
                                            />
                                            <Bar dataKey="amount" name="Montant" radius={[0, 4, 4, 0]}>
                                                {topExpenses.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                                <LabelList dataKey="amount" position="right" fill="#ef4444" fontWeight="bold" formatter={(val: number) => val ? `${val.toLocaleString()}€` : ''} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'forecast' && (
                        <div className="space-y-6">
                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-semibold">Prévisions de Trésorerie (6 mois)</h3>
                                    <div className="flex items-center gap-4">
                                        <label className="text-slate-400 text-sm">Solde de trésorerie initial :</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={customBalance}
                                                onChange={(e) => setCustomBalance(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-40 text-right"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-3 top-2 text-slate-400">€</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={adjustedForecastData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={formatDateFR} />
                                            <YAxis yAxisId="left" stroke="#94a3b8" />
                                            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                                itemStyle={{ color: '#f8fafc' }}
                                                labelFormatter={formatDateFR}
                                            />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="predicted_income" name="Revenus Prévus" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar yAxisId="left" dataKey="predicted_expense" name="Dépenses Prévues" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Line yAxisId="right" type="monotone" dataKey="predicted_balance" name="Solde Projeté" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
                                <h3 className="text-xl font-semibold mb-6">Détail des Prévisions</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-700 text-slate-400">
                                                <th className="p-4 font-medium">Mois</th>
                                                <th className="p-4 font-medium text-right">Revenus Prévus</th>
                                                <th className="p-4 font-medium text-right">Dépenses Prévues</th>
                                                <th className="p-4 font-medium text-right">Résultat Net</th>
                                                <th className="p-4 font-medium text-right">Solde Projeté</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {adjustedForecastData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-4 font-medium text-slate-200">{formatDateFR(row.date)}</td>
                                                    <td className="p-4 text-right text-emerald-400">+{row.predicted_income.toLocaleString()}€</td>
                                                    <td className="p-4 text-right text-rose-400">-{Math.abs(row.predicted_expense).toLocaleString()}€</td>
                                                    <td className="p-4 text-right font-bold text-blue-400">{row.predicted_net.toLocaleString()}€</td>
                                                    <td className="p-4 text-right font-bold text-purple-400">{row.predicted_balance.toLocaleString()}€</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'export' && (
                        <div className="space-y-6">
                            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur py-4 border-b border-slate-800 mb-6 flex justify-between items-center">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium flex items-center gap-2 transition-colors border border-slate-700"
                                >
                                    <ArrowLeft size={20} /> Retour au Tableau de Bord
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/25"
                                >
                                    <Download size={20} /> Télécharger le Rapport PDF
                                </button>
                            </div>

                            <div id="full-report" className="space-y-12 bg-slate-900 p-8 rounded-xl border border-slate-800">
                                <div className="text-center mb-12 border-b border-slate-800 pb-8">
                                    <h2 className="text-4xl font-bold text-white mb-2">Rapport Financier Complet</h2>
                                    <p className="text-slate-400">Généré le {new Date().toLocaleDateString()} à {new Date().toLocaleTimeString()}</p>
                                </div>

                                {/* 1. VUE D'ENSEMBLE */}
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-bold text-blue-400 border-l-4 border-blue-500 pl-4">1. Vue d'ensemble</h3>

                                    {/* KPIs */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <KPICard title="Ventes Totales" value={`${stats?.total_sales?.toLocaleString()}€`} icon={TrendingUp} color="text-emerald-400" bgColor="bg-emerald-500/10" borderColor="border-emerald-500/20" />
                                        <KPICard title="Achats Totaux" value={`${Math.abs(stats?.total_purchases || 0).toLocaleString()}€`} icon={ShoppingCart} color="text-rose-400" bgColor="bg-rose-500/10" borderColor="border-rose-500/20" />
                                        <KPICard title="Marge Brute" value={`${stats?.margin?.toLocaleString()}€`} icon={DollarSign} color="text-blue-400" bgColor="bg-blue-500/10" borderColor="border-blue-500/20" />
                                        <KPICard title="Taux de Rentabilité" value={`${advancedStats?.savings_rate}%`} icon={Percent} color="text-yellow-400" bgColor="bg-yellow-500/10" borderColor="border-yellow-500/20" />
                                        <KPICard title="Dépense Max" value={`${advancedStats?.max_expense?.toLocaleString()}€`} icon={AlertCircle} color="text-orange-400" bgColor="bg-orange-500/10" borderColor="border-orange-500/20" />
                                        <KPICard title="Recette Max" value={`${advancedStats?.max_income?.toLocaleString()}€`} icon={TrendingUp} color="text-emerald-400" bgColor="bg-emerald-500/10" borderColor="border-emerald-500/20" />
                                    </div>

                                    {/* Cashflow */}
                                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                        <h4 className="text-lg font-semibold mb-4">Flux de Trésorerie</h4>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={cashflow}>
                                                    <defs>
                                                        <linearGradient id="colorBalanceExport" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                    <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(str) => formatDateFR(str).split('/').slice(0, 2).join('/')} />
                                                    <YAxis stroke="#94a3b8" />
                                                    <Area type="monotone" dataKey="balance" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorBalanceExport)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </section>

                                {/* 2. DÉTAILS MENSUELS */}
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-bold text-blue-400 border-l-4 border-blue-500 pl-4">2. Détails Mensuels</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                            <h4 className="text-lg font-semibold mb-4">Répartition Mensuelle</h4>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={monthlyData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                        <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={formatDateFR} />
                                                        <YAxis stroke="#94a3b8" />
                                                        <Bar dataKey="income" fill="#10b981" name="Revenus" radius={[4, 4, 0, 0]} />
                                                        <Bar dataKey="expense" fill="#f43f5e" name="Dépenses" radius={[0, 0, 4, 4]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                            <h4 className="text-lg font-semibold mb-4">Saisonnalité</h4>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={monthlyData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                        <XAxis dataKey="month" stroke="#94a3b8" tickFormatter={formatDateFR} />
                                                        <YAxis stroke="#94a3b8" />
                                                        <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={0.3} fill="#10b981" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 3. VUE ANNUELLE */}
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-bold text-blue-400 border-l-4 border-blue-500 pl-4">3. Vue Annuelle</h3>

                                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                        <h4 className="text-lg font-semibold mb-4">Comparatif Annuel</h4>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={annualData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                    <XAxis dataKey="year" stroke="#94a3b8" />
                                                    <YAxis stroke="#94a3b8" />
                                                    <Legend />
                                                    <Bar dataKey="income" fill="#10b981" name="Revenus" radius={[4, 4, 0, 0]}>
                                                        <LabelList dataKey="income" position="top" fill="#f8fafc" formatter={(val: number) => val ? `${val.toLocaleString()}€` : ''} />
                                                    </Bar>
                                                    <Bar dataKey="expense" fill="#f43f5e" name="Dépenses" radius={[4, 4, 0, 0]}>
                                                        <LabelList dataKey="expense" position="top" fill="#f8fafc" formatter={(val: number) => val ? `${Math.abs(val).toLocaleString()}€` : ''} />
                                                    </Bar>
                                                    <Bar dataKey="margin" fill="#3b82f6" name="Marge" radius={[4, 4, 0, 0]}>
                                                        <LabelList dataKey="margin" position="top" fill="#f8fafc" formatter={(val: number) => val ? `${val.toLocaleString()}€` : ''} />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                            <h4 className="text-lg font-semibold mb-4">Top Revenus</h4>
                                            <div className="h-[400px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={topIncome} layout="vertical" margin={{ top: 5, right: 50, left: 50, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                                        <XAxis type="number" stroke="#94a3b8" hide />
                                                        <YAxis dataKey="category" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                        <Bar dataKey="amount" name="Montant" radius={[0, 4, 4, 0]}>
                                                            {topIncome.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={GREEN_COLORS[index % GREEN_COLORS.length]} />
                                                            ))}
                                                            <LabelList dataKey="amount" position="right" fill="#10b981" fontSize={10} formatter={(val: number) => val ? `${val.toLocaleString()}€` : ''} />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                            <h4 className="text-lg font-semibold mb-4">Top Dépenses</h4>
                                            <div className="h-[400px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={topExpenses} layout="vertical" margin={{ top: 5, right: 50, left: 50, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                                        <XAxis type="number" stroke="#94a3b8" hide />
                                                        <YAxis dataKey="category" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                                        <Bar dataKey="amount" name="Montant" radius={[0, 4, 4, 0]}>
                                                            {topExpenses.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                            <LabelList dataKey="amount" position="right" fill="#ef4444" fontSize={10} formatter={(val: number) => val ? `${val.toLocaleString()}€` : ''} />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* 4. PRÉVISIONS */}
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-bold text-blue-400 border-l-4 border-blue-500 pl-4">4. Prévisions</h3>

                                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                        <h4 className="text-lg font-semibold mb-4">Projection sur 6 mois</h4>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={adjustedForecastData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                                    <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={formatDateFR} />
                                                    <YAxis yAxisId="left" stroke="#94a3b8" />
                                                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                                                    <Bar yAxisId="left" dataKey="predicted_income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                                    <Bar yAxisId="left" dataKey="predicted_expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                                                    <Line yAxisId="right" type="monotone" dataKey="predicted_balance" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-900/50 text-slate-400 uppercase font-semibold">
                                                <tr>
                                                    <th className="p-3">Mois</th>
                                                    <th className="p-3 text-right">Revenus</th>
                                                    <th className="p-3 text-right">Dépenses</th>
                                                    <th className="p-3 text-right">Solde</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700">
                                                {adjustedForecastData.slice(0, 6).map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-3 text-slate-200">{formatDateFR(row.date)}</td>
                                                        <td className="p-3 text-right text-emerald-400">+{row.predicted_income.toLocaleString()}€</td>
                                                        <td className="p-3 text-right text-rose-400">-{Math.abs(row.predicted_expense).toLocaleString()}€</td>
                                                        <td className="p-3 text-right text-purple-400 font-bold">{row.predicted_balance.toLocaleString()}€</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* 5. ANALYSE IA */}
                                {analysisData && (
                                    <section className="space-y-6 break-before-page">
                                        <h3 className="text-2xl font-bold text-purple-400 border-l-4 border-purple-500 pl-4">5. Analyse IA & Recommandations</h3>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="bg-slate-800/50 p-6 rounded-xl border border-emerald-500/20">
                                                <h4 className="text-lg font-semibold text-emerald-400 mb-4">Points Forts</h4>
                                                <ul className="space-y-2">
                                                    {analysisData.strengths?.map((item: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                                            <div className="mt-1.5 min-w-[6px] h-1.5 rounded-full bg-emerald-500" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-slate-800/50 p-6 rounded-xl border border-rose-500/20">
                                                <h4 className="text-lg font-semibold text-rose-400 mb-4">Points à Améliorer</h4>
                                                <ul className="space-y-2">
                                                    {analysisData.weaknesses?.map((item: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                                            <div className="mt-1.5 min-w-[6px] h-1.5 rounded-full bg-rose-500" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/20">
                                                <h4 className="text-lg font-semibold text-blue-400 mb-4">Recommandations Stratégiques</h4>
                                                <ul className="space-y-2">
                                                    {analysisData.recommendations?.map((item: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                                            <div className="mt-1.5 min-w-[6px] h-1.5 rounded-full bg-blue-500" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    )}

                    {
                        activeTab === 'analysis' && (
                            <div className="space-y-8">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                                        Analyse Financière IA
                                    </h2>
                                    <p className="text-slate-400 mt-2">Insights automatisés basés sur vos données financières</p>
                                </div>

                                {analysisData ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {/* Strengths */}
                                        <div className="bg-slate-800/50 p-6 rounded-xl border border-emerald-500/20">
                                            <h3 className="text-xl font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                                                <TrendingUp size={24} /> Points Forts
                                            </h3>
                                            <ul className="space-y-4">
                                                {analysisData.strengths?.map((item: string, idx: number) => (
                                                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                                                        <div className="mt-1 min-w-[8px] h-2 rounded-full bg-emerald-500" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Weaknesses */}
                                        <div className="bg-slate-800/50 p-6 rounded-xl border border-rose-500/20">
                                            <h3 className="text-xl font-semibold text-rose-400 mb-4 flex items-center gap-2">
                                                <AlertCircle size={24} /> Points à Améliorer
                                            </h3>
                                            <ul className="space-y-4">
                                                {analysisData.weaknesses?.map((item: string, idx: number) => (
                                                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                                                        <div className="mt-1 min-w-[8px] h-2 rounded-full bg-rose-500" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Recommendations */}
                                        <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-500/20">
                                            <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
                                                <Activity size={24} /> Recommandations
                                            </h3>
                                            <ul className="space-y-4">
                                                {analysisData.recommendations?.map((item: string, idx: number) => (
                                                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                                                        <div className="mt-1 min-w-[8px] h-2 rounded-full bg-blue-500" />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400 py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                                        Génération de l'analyse...
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* Transaction Details Modal */}
                    {
                        isModalOpen && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-slate-700">
                                    <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{modalTitle}</h3>
                                            {selectedMonthStats && (
                                                <div className="flex gap-6 mt-2 text-sm">
                                                    <span className="text-emerald-400 font-bold">Recettes : {selectedMonthStats.income.toLocaleString()}€</span>
                                                    <span className="text-orange-400 font-bold">Dépenses : {Math.abs(selectedMonthStats.expense).toLocaleString()}€</span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                setSelectedMonthStats(null);
                                            }}
                                            className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                                        >
                                            <X size={24} className="text-slate-400" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6">
                                        {selectedDetails.length === 0 ? (
                                            <p className="text-slate-400 text-center">Chargement...</p>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs font-semibold sticky top-0">
                                                    <tr>
                                                        <th className="p-3">Date</th>
                                                        <th className="p-3">Description</th>
                                                        <th className="p-3">Catégorie</th>
                                                        <th className="p-3 text-right">Montant</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-700">
                                                    {selectedDetails.map((t, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-700/30">
                                                            <td className="p-3 text-slate-300 text-sm">{formatDateFR(t.date)}</td>
                                                            <td className="p-3 text-slate-200 font-medium">{t.description}</td>
                                                            <td className="p-3 text-slate-400 text-sm">
                                                                <span className="px-2 py-1 rounded-full bg-slate-700 text-xs">
                                                                    {t.category || 'Uncategorized'}
                                                                </span>
                                                            </td>
                                                            <td className={`p-3 text-right font-bold ${t.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString()}€
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >
        </ErrorBoundary >
    );
};

export default Dashboard;
