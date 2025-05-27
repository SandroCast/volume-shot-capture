
import React, { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Capacitor } from "@capacitor/core";

interface CameraPreviewProps {}

const CameraPreview: React.FC<CameraPreviewProps> = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isNative, setIsNative] = useState<boolean>(false);

  // Detecta ambiente Capacitor
  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

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

  // Handler para tirar a foto E já baixar automaticamente, nomeando o arquivo com data/hora
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

        // Gerar timestamp para nome do arquivo
        const now = new Date();
        const pad = (num: number) => String(num).padStart(2, "0");
        const day = pad(now.getDate());
        const month = pad(now.getMonth() + 1);
        const year = now.getFullYear();
        const hour = pad(now.getHours());
        const minute = pad(now.getMinutes());
        const second = pad(now.getSeconds());
        const filename = `captura-${day}${month}${year}${hour}${minute}${second}.jpg`;

        // Download automático ao capturar, nome único
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }
  };

  // Suporte para botão físico de volume +
  useEffect(() => {
    if (isNative) {
      // Recomendação: criar/instalar plugin nativo para escutar eventos de hardware volume
      // Por padrão, browser não permite escutar botão volume em JS puro no app nativo.
      // Exemplo para integração futura:
      // window.addEventListener("VolumeUpButtonPressed", handleCapture);
      // [Aqui deve instalar e configurar plugin Capacitor custom da sua escolha]
      return;
    }
    function onVolumeKey(event: KeyboardEvent) {
      if (
        event.code === "AudioVolumeUp" ||
        event.key === "+" ||
        event.key === "Add"
      ) {
        event.preventDefault();
        handleCapture();
      }
    }
    window.addEventListener("keydown", onVolumeKey);
    return () => window.removeEventListener("keydown", onVolumeKey);
  }, [isNative]);

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
        {isNative
          ? <span>
              ⚠️ O botão físico de volume só funcionará se for integrado via plugin nativo Capacitor.<br />
              Para suporte real, instale <b>um plugin nativo que captura eventos de hardware de volume</b>. Navegue até <a href="https://github.com/charlesstover/capacitor-keyboard-shortcuts" target="_blank" rel="noopener noreferrer" className="underline">veja sugestão aqui</a>.<br/>
              Ou <b>use o botão dentro do app</b> normalmente.
            </span>
          : <span>
              {wakeLock === null
                ? "⚠️ Não foi possível manter a tela ligada neste navegador."
                : "Tela permanecerá ligada enquanto esta página estiver aberta."}
            </span>
        }
      </div>
    </div>
  );
};

export default CameraPreview;
