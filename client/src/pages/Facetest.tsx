import { useState, useEffect, useRef } from 'react';
import WebcamCapture from '../components/common/WebcamCapture';
import { userService } from '../services/userService';
import { Loader2, User, XCircle, CheckCircle, Upload } from 'lucide-react';

export default function FaceTest() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [inputPreviewUrl, setInputPreviewUrl] = useState<string | null>(null);
    const [dbImageUrl, setDbImageUrl] = useState<string | null>(null);
    const dbImageUrlRef = useRef<string | null>(null);

    const handleCapture = async (file: File) => {
        if (inputPreviewUrl) {
            URL.revokeObjectURL(inputPreviewUrl);
            setInputPreviewUrl(null);
        }
        setInputPreviewUrl(URL.createObjectURL(file));
        setIsLoading(true);
        setResult(null);
        setDbImageUrl(null);
        if (dbImageUrlRef.current) {
            URL.revokeObjectURL(dbImageUrlRef.current);
            dbImageUrlRef.current = null;
        }
        try {
            const data = await userService.searchUser(file);
            setResult(data);
        } catch (error) {
            console.error('Face search failed:', error);
            alert('얼굴 검색 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const url = result?.user?.face_image_url;
        if (!url) {
            if (dbImageUrlRef.current) {
                URL.revokeObjectURL(dbImageUrlRef.current);
                dbImageUrlRef.current = null;
            }
            setDbImageUrl(null);
            return;
        }
        let cancelled = false;
        const token = localStorage.getItem('access_token');
        const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
        fetch(fullUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('Failed to load image'))))
            .then((blob) => {
                if (cancelled) return;
                if (dbImageUrlRef.current) URL.revokeObjectURL(dbImageUrlRef.current);
                const blobUrl = URL.createObjectURL(blob);
                dbImageUrlRef.current = blobUrl;
                setDbImageUrl(blobUrl);
            })
            .catch(() => { if (!cancelled) setDbImageUrl(null); });
        return () => {
            cancelled = true;
            if (dbImageUrlRef.current) {
                URL.revokeObjectURL(dbImageUrlRef.current);
                dbImageUrlRef.current = null;
            }
            setDbImageUrl(null);
        };
    }, [result?.user?.face_image_url]);

    useEffect(() => {
        return () => {
            if (inputPreviewUrl) URL.revokeObjectURL(inputPreviewUrl);
        };
    }, [inputPreviewUrl]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">안면인식 테스트</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-medium mb-4">카메라 Input</h3>
                        <WebcamCapture onCapture={handleCapture} />

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">또는 파일 업로드</span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                                <Upload size={18} />
                                <span>이미지 선택</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleCapture(e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full min-h-[300px] flex flex-col items-center justify-center">
                        <h3 className="text-lg font-medium mb-6 w-full text-left">분석 결과</h3>

                        {isLoading ? (
                            <div className="text-center space-y-3">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
                                <p className="text-slate-500">Embedding 추출 및 DB 검색 중...</p>
                            </div>
                        ) : result ? (
                            <div className="text-center space-y-4 w-full">
                                <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-slate-500">Input</p>
                                        {inputPreviewUrl ? (
                                            <img src={inputPreviewUrl} alt="Input" className="w-full aspect-square object-cover rounded-lg border border-slate-200" />
                                        ) : (
                                            <div className="w-full aspect-square rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">No image</div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-slate-500">DB</p>
                                        {dbImageUrl ? (
                                            <img src={dbImageUrl} alt="DB" className="w-full aspect-square object-cover rounded-lg border border-slate-200" />
                                        ) : (
                                            <div className="w-full aspect-square rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">No image</div>
                                        )}
                                    </div>
                                </div>

                                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${result.search_result ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {result.search_result ? <CheckCircle size={40} /> : <XCircle size={40} />}
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500 font-medium">BEST MATCH</p>
                                    <h4 className="text-2xl font-bold text-slate-900">
                                        {result.user?.name || 'Unknown User'}
                                    </h4>
                                    <p className="text-xs text-slate-400 font-mono">
                                        ID: {result.user?.identity_id || '-'}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-100 w-full">
                                    <div className="flex justify-between items-center px-8">
                                        <span className="text-slate-500">유사도 (Cosine Similarity)</span>
                                        <span className={`text-xl font-bold ${result.similarity >= 0.7 ? 'text-green-600' : 'text-slate-400'
                                            }`}>
                                            {(result.similarity * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="px-8 mt-2">
                                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full ${result.similarity >= 0.7 ? 'bg-green-500' : 'bg-slate-300'
                                                    }`}
                                                style={{ width: `${Math.min(result.similarity * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 space-y-2">
                                <User size={48} className="mx-auto opacity-20" />
                                <p>왼쪽에서 사진을 촬영하면<br />여기에 결과가 표시됩니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}