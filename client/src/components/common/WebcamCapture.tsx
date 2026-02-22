import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface WebcamCaptureProps {
    onCapture: (file: File) => void;
}

export default function WebcamCapture({ onCapture }: WebcamCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
            });
            setStream(mediaStream);
            setIsStreaming(true);
        } catch (err) {
            console.error('Camera access denied:', err);
            alert('카메라 접근 권한이 필요합니다.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
            setIsStreaming(false);
        }
    };

    useEffect(() => {
        if (isStreaming && videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [isStreaming, stream]);

    const captureImage = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
                        onCapture(file);
                        stopCamera();
                    }
                }, 'image/jpeg');
            }
        }
    }, [onCapture, stream]);

    return (
        <div className="flex flex-col items-center gap-4 p-4 border rounded-xl bg-slate-50">
            <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                {!isStreaming ? (
                    <button
                        onClick={startCamera}
                        className="flex flex-col items-center text-slate-400 hover:text-white transition-colors"
                    >
                        <Camera size={48} />
                        <span className="mt-2 text-sm">카메라 켜기</span>
                    </button>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {isStreaming && (
                <div className="flex gap-2">
                    <button
                        onClick={captureImage}
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                        촬영하기
                    </button>
                    <button
                        onClick={stopCamera}
                        type="button"
                        className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg"
                        title="취소"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
