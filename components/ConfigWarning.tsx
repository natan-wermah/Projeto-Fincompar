import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfigWarning: React.FC = () => {
  const hasSupabase = import.meta.env.VITE_SUPABASE_URL &&
                      import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co';
  const hasGemini = import.meta.env.VITE_GEMINI_API_KEY &&
                    import.meta.env.VITE_GEMINI_API_KEY !== 'PLACEHOLDER_API_KEY';

  // Don't show warning if everything is configured
  if (hasSupabase && hasGemini) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto">
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900 text-sm mb-1">
              ⚠️ Configuração Incompleta
            </h3>
            <ul className="text-xs text-yellow-800 space-y-1">
              {!hasSupabase && (
                <li>• Configure as variáveis do Supabase no .env.local</li>
              )}
              {!hasGemini && (
                <li>• Configure a chave da API do Gemini no .env.local</li>
              )}
            </ul>
            <p className="text-xs text-yellow-700 mt-2 italic">
              Veja <a href="/SETUP.md" className="underline font-semibold">SETUP.md</a> para instruções
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigWarning;
