
import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (id: string) => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, title }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 max-w-md mx-auto relative overflow-hidden shadow-2xl">
      {/* Header Estilo Mobile */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-6 pt-12 pb-4 flex justify-between items-center sticky top-0 z-20 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 flex items-center justify-center">
             <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-32 px-5 pt-4 overflow-y-auto">
        {children}
      </main>

      {/* Navegação Inferior (Abas Native) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-700 px-6 pt-3 pb-8 flex justify-between items-center z-40">
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center transition-all duration-200 active:scale-90 ${
              activeTab === item.id ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <div className={`transition-transform duration-200 ${
              item.id === 'add'
                ? 'mb-6 -mt-12 bg-purple-600 text-white p-3 rounded-2xl shadow-xl shadow-purple-200 dark:shadow-purple-900/30 border-4 border-white dark:border-gray-800'
                : activeTab === item.id ? 'scale-110' : ''
            }`}>
              {item.icon}
            </div>
            {item.label && (
              <span className={`text-[10px] mt-1 font-bold ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
