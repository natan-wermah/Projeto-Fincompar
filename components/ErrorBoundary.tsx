import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <AlertTriangle size={48} className="text-red-600" />
              </div>

              <h1 className="text-2xl font-black text-gray-800 mb-2">
                Algo deu errado
              </h1>

              <p className="text-gray-600 mb-6">
                Ocorreu um erro inesperado. Isso pode acontecer se as variáveis de ambiente não estão configuradas.
              </p>

              {this.state.error && (
                <div className="bg-gray-100 p-4 rounded-2xl mb-6 w-full text-left">
                  <p className="text-xs font-mono text-red-600 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="space-y-3 w-full">
                <button
                  onClick={this.handleReload}
                  className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
                >
                  <RefreshCw size={20} />
                  Recarregar Página
                </button>

                <div className="text-sm text-gray-500">
                  <p className="font-semibold mb-2">Possíveis soluções:</p>
                  <ul className="text-left space-y-1 text-xs">
                    <li>• Verifique se as variáveis de ambiente estão configuradas</li>
                    <li>• Consulte o arquivo <code className="bg-gray-200 px-1 rounded">SETUP.md</code></li>
                    <li>• Limpe o cache do navegador</li>
                    <li>• Verifique o console (F12) para mais detalhes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
