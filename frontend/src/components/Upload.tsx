import React, { useState } from 'react';
import { Upload as UploadIcon, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface UploadProps {
    onUploadSuccess: (uploadId: number) => void;
}

const Upload: React.FC<UploadProps> = ({ onUploadSuccess }) => {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setMessage(null);

        try {
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage({ type: 'success', text: response.data.message });
            setFile(null);
            onUploadSuccess(response.data.upload_id);
        } catch (err: any) {
            console.error("Upload error:", err);
            // Check for upload limit error
            if (err.response && err.response.status === 403 && err.response.data.code === 'LIMIT_REACHED') {
                alert(err.response.data.message);
                navigate('/subscription');
                return;
            }
            setMessage({
                type: 'error',
                text: err.response?.data?.error || err.message || 'Upload failed. Please check console/logs.'
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <UploadIcon size={20} className="text-blue-400" /> Importer des Données Financières
            </h3>

            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all relative group ${file ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                }`}>
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".csv,.xlsx,.xls"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                <div className="flex flex-col items-center justify-center gap-3">
                    {file ? (
                        <>
                            <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
                                <FileSpreadsheet size={32} />
                            </div>
                            <div>
                                <p className="font-medium text-white">{file.name}</p>
                                <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-3 bg-slate-700 rounded-full text-slate-400 group-hover:text-slate-300 transition-colors">
                                <UploadIcon size={32} />
                            </div>
                            <div className="text-slate-400">
                                <p className="font-medium text-slate-200">Cliquez ou glissez-déposez un fichier</p>
                                <p className="text-xs mt-1">Supporte Quickbooks, Sage, EBP (.csv, .xlsx)</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`mt-4 w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${!file || uploading
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    }`}
            >
                {uploading ? 'Traitement en cours...' : 'Traiter le Fichier'}
            </button>
        </div>
    );
};

export default Upload;
