import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    bgColor?: string;
    borderColor?: string;
    trend?: string;
    onClick?: () => void;
    className?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, color, bgColor, borderColor, trend, onClick, className }) => {
    return (
        <div
            onClick={onClick}
            className={`bg-slate-800 p-6 rounded-xl shadow-lg border ${borderColor || 'border-slate-700'} ${className || ''}`}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
                <div className={`p-2 rounded-lg ${bgColor || 'bg-slate-700'} ${color}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold text-white">{value}</span>
                {trend && (
                    <span className="text-sm text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded">
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
};

export default KPICard;
