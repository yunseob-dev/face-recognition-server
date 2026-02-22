import { useState, useRef } from 'react';
import { userService, type BulkRegisterResponse } from '../services/userService';
import { FolderOpen, Play, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

export default function BulkRegister() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<BulkRegisterResponse | null>(null);
    const [selectedMap, setSelectedMap] = useState<Map<string, File>>(new Map());
    const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const fileMap = new Map<string, File>();
        for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i];
            if (!file.name.match(/\.(jpg|jpeg|png|bmp)$/i)) continue;

            const parts = file.webkitRelativePath.split('/');
            if (parts.length < 3) continue;
            const userName = parts[1];
            if (!fileMap.has(userName)) {
                fileMap.set(userName, file);
            }
        }

        setSelectedMap(fileMap);
        setResult(null);
    };

    const handleClear = () => {
        setSelectedMap(new Map());
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleBulkRegister = async () => {
        if (selectedMap.size === 0) return;

        if (!window.confirm(`${selectedMap.size}명의 사용자를 일괄 등록하시겠습니까?`)) {
            return;
        }

        setIsLoading(true);
        setResult(null);
        setProgress(null);

        try {
            const files = Array.from(selectedMap.values());
            const names = Array.from(selectedMap.keys());
            const data = await userService.registerBulkUsers(files, names, (event) => {
                setProgress({ current: event.current, total: event.total, name: event.name });
            });
            setResult(data);
        } catch (error: any) {
            console.error('Bulk registration failed:', error);
            alert('일괄 등록 실패: ' + (error.response?.data?.detail || error.message));
        } finally {
            setIsLoading(false);
            setProgress(null);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-800">대량 일괄 등록 (Bulk Registration)</h2>
            <p className="text-slate-500">
                로컬 폴더를 선택하여 하위 폴더명을 사용자 이름으로 자동 등록합니다.
            </p>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                    이미지 폴더 선택
                </label>

                {selectedMap.size === 0 ? (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-colors">
                        <FolderOpen className="w-10 h-10 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500 font-medium">폴더를 선택하세요</span>
                        <span className="text-xs text-slate-400 mt-1">폴더 구조: 인물명/이미지.jpg</span>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFolderSelect}
                            // @ts-ignore
                            webkitdirectory=""
                            directory=""
                            multiple
                        />
                    </label>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <div>
                                <p className="text-indigo-800 font-bold text-lg">{selectedMap.size}명 감지됨</p>
                                <p className="text-indigo-600 text-sm">각 인물별 대표 이미지 1장이 선택되었습니다.</p>
                            </div>
                            <button
                                onClick={handleClear}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                                title="선택 해제"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <button
                            onClick={handleBulkRegister}
                            disabled={isLoading}
                            className={`w-full px-6 py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${isLoading
                                ? 'bg-slate-300 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                                }`}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                            <span>{isLoading ? '등록 처리 중...' : '등록 시작'}</span>
                        </button>
                    </div>
                )}

                <p className="text-xs text-slate-400">
                    * 폴더 내 첫 번째 이미지 파일(.jpg, .png, .bmp)이 대표 이미지로 사용됩니다.
                </p>
            </div>

            {isLoading && progress && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span className="font-medium truncate mr-4">처리 중: {progress.name}</span>
                        <span className="shrink-0 font-mono">{progress.current} / {progress.total}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-400 text-right">
                        {Math.round((progress.current / progress.total) * 100)}% 완료
                    </p>
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-center">
                            <span className="block text-sm text-blue-600 font-medium mb-1">총 스캔 폴더</span>
                            <span className="text-3xl font-bold text-blue-800">{result.total_folders_scanned}</span>
                        </div>
                        <div className="bg-green-50 border border-green-100 p-4 rounded-lg text-center">
                            <span className="block text-sm text-green-600 font-medium mb-1">성공</span>
                            <span className="text-3xl font-bold text-green-800">{result.success_count}</span>
                        </div>
                        <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-center">
                            <span className="block text-sm text-red-600 font-medium mb-1">실패</span>
                            <span className="text-3xl font-bold text-red-800">{result.failed_count}</span>
                        </div>
                    </div>

                    {result.failures.length > 0 ? (
                        <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
                            <div className="bg-red-50 px-6 py-3 border-b border-red-200 flex items-center gap-2">
                                <AlertCircle className="text-red-600 w-5 h-5" />
                                <h3 className="font-bold text-red-800">실패 항목 상세</h3>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">폴더명 (사용자 이름)</th>
                                        <th className="px-6 py-3 font-medium">실패 사유</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {result.failures.map((fail, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 font-medium text-slate-700">{fail.folder}</td>
                                            <td className="px-6 py-3 text-red-600">{fail.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center flex flex-col items-center gap-2">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                            <h3 className="text-lg font-bold text-green-800">모든 작업이 성공적으로 완료되었습니다!</h3>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
