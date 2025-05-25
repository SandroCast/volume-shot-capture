import React, { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";

interface CameraPreviewProps {}

const CameraPreview: React.FC<CameraPreviewProps> = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Solicita câmeras disponíveis
  useEffect(() => {
    async function fetchDevices() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices(devices.filter((device) => device.kind === "videoinput"));
    }
    fetchDevices();
  }, []);

  // Inicia o vídeo da câmera selecionada
  useEffect(() => {
    async function initCamera() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: selectedDeviceId ? undefined : "environment",
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert("Falha ao acessar a câmera. Verifique permissões e tente novamente.");
      }
    }
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [selectedDeviceId]);

  // WakeLock para manter tela ligada
  useEffect(() => {
    let wakeLockObj: any = null;
    async function requestWakeLock() {
      try {
        // @ts-ignore
        if ("wakeLock" in navigator && "request" in navigator.wakeLock) {
          // @ts-ignore
          wakeLockObj = await navigator.wakeLock.request("screen");
          setWakeLock(wakeLockObj);
        }
      } catch {
        setWakeLock(null);
      }
    }
    requestWakeLock();

    document.addEventListener("visibilitychange", () => {
      if (wakeLockObj && document.visibilityState === "visible") {
        // @ts-ignore
        navigator.wakeLock.request("screen").then((wl: any) => setWakeLock(wl))
      }
    });

    return () => {
      if (wakeLockObj && wakeLockObj.release) {
        wakeLockObj.release();
      }
    };
  }, []);

  // Handler para tirar a foto E já baixar automaticamente
  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.96);
        setPhotoSrc(dataUrl);

        // Download automático ao capturar
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "captura.jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  };

  // Suporte para botão físico de volume +
  useEffect(() => {
    function onVolumeKey(event: KeyboardEvent) {
      // Detecção de botão de volume (código geralmente 175/AudioVolumeUp em Android-Chrome, pode variar)
      // No navegador mobile, access de volume+ é capturado como "volumeup" nas key events se permissão/hardware permitir.
      // Mas em mobile browsers, geralmente não é possível. Para PWA install pode funcionar. Então, fallback para "+" do teclado.
      if (
        event.code === "AudioVolumeUp" ||
        event.key === "+" ||
        event.key === "Add" // fallback teclado físico
      ) {
        event.preventDefault();
        handleCapture();
      }
    }
    window.addEventListener("keydown", onVolumeKey);
    return () => window.removeEventListener("keydown", onVolumeKey);
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4">
      <div className="rounded-xl overflow-hidden bg-black max-w-[90vw] max-h-[60vh] aspect-[9/16] flex items-center justify-center border-2 border-gray-700 shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="object-cover w-full h-full"
        />
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      <div className="flex gap-4 justify-center items-center w-full px-2">
        {devices.length > 1 && (
          <select
            className="bg-zinc-800 text-white rounded p-2 text-base"
            value={selectedDeviceId || ""}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            <option value="">Auto</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Câmera ${d.deviceId.slice(-4)}`}
              </option>
            ))}
          </select>
        )}
        <button
          className="w-14 h-14 bg-white text-zinc-900 rounded-full flex items-center justify-center shadow-lg border-4 border-zinc-700 transition hover:scale-105 active:scale-95"
          onClick={handleCapture}
        >
          <Camera size={32} />
        </button>
      </div>
      <div className="text-xs text-gray-400 w-full text-center">
        Toque volume <b>+</b> para tirar a foto<br />
        <span>
          {wakeLock === null
            ? "⚠️ Não foi possível manter a tela ligada neste navegador."
            : "Tela permanecerá ligada enquanto esta página estiver aberta."}
        </span>
      </div>
      {photoSrc && (
        <div className="pt-4 flex flex-col items-center">
          <img src={photoSrc} alt="Captura" className="max-w-[300px] rounded-lg shadow" />
          <a
            className="mt-2 px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-lg hover:bg-emerald-800 transition"
            href={photoSrc}
            download={"captura.jpg"}
          >
            Baixar foto
          </a>
        </div>
      )}
    </div>
  );
};

export default CameraPreview;
