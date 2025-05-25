
// Página inicial minimalista com acesso à câmera HD

import { Link } from "react-router-dom";
import { Camera } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 text-white">Bem-vindo!</h1>
          <p className="text-lg text-zinc-400">
            Capture fotos em alta definição<br />direto do seu celular.
          </p>
        </div>
        <Link
          to="/camera"
          className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full px-6 py-3 text-xl font-semibold shadow-xl transition-all duration-150"
        >
          <Camera size={28} />
          Ir para a Câmera
        </Link>
        <p className="text-xs text-zinc-500 pt-10">
          Este app roda no navegador mobile.<br />
          O bloqueio de tela será evitado enquanto a câmera estiver aberta.
        </p>
      </div>
    </div>
  );
};

export default Index;
