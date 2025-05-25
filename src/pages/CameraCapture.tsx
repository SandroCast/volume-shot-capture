
import CameraPreview from "@/components/CameraPreview";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CameraCapture = () => {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="w-full flex items-center px-2 py-4">
        <button
          onClick={() => nav("/")}
          className="flex items-center gap-1 text-zinc-200 hover:text-white transition text-base font-medium"
        >
          <ChevronLeft /> Início
        </button>
        <h1 className="mx-auto text-white text-lg font-bold tracking-wider select-none">
          Câmera em HD
        </h1>
      </header>
      <main className="flex-1 flex flex-col items-center w-full">
        <CameraPreview />
      </main>
    </div>
  );
};

export default CameraCapture;
