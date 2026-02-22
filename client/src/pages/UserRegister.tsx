import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import WebcamCapture from '../components/common/WebcamCapture';
import { ArrowLeft, Upload, Loader2, CheckCircle2 } from 'lucide-react';

export default function UserRegister() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCapture = (file: File) => {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !selectedFile) return;

        setIsLoading(true);
        try {
            await userService.registerUser(name, selectedFile);
            alert('사용자가 성공적으로 등록되었습니다.');
            navigate('/users');
        } catch (error) {
            console.error('Registration failed:', error);
            alert('등록에 실패했습니다. 이름을 확인하거나 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/users')}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="text-slate-600" />
                </button>
                <h2 className="text-2xl font-bold text-slate-800">사용자 등록</h2>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">이름</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="등록할 이름을 입력하세요"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">얼굴 사진</label>
                    
                    {!selectedFile ? (
                        <div className="space-y-4">
                            <WebcamCapture onCapture={handleCapture} />
                            
                            <div className="relative">
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
                                        onChange={handleFileChange} 
                                    />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl">
                            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-md">
                                {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex items-center gap-2 text-green-600 font-medium">
                                <CheckCircle2 size={20} />
                                <span>이미지가 준비되었습니다</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                className="text-sm text-slate-500 hover:text-red-500 underline"
                            >
                                다시 찍기 / 선택하기
                            </button>
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isLoading || !name || !selectedFile}
                        className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                            isLoading || !name || !selectedFile
                                ? 'bg-slate-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="animate-spin" /> 처리 중...
                            </span>
                        ) : (
                            '등록하기'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
