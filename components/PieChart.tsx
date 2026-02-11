
import React from 'react';

interface PieChartData {
  category: string;
  value: number;
  icon: string;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-400 dark:text-gray-500 font-bold text-sm">
          Nenhum dado disponível
        </p>
      </div>
    );
  }

  // Calcular ângulos para cada fatia
  let currentAngle = -90; // Começar do topo
  const slices = data.map(item => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const slice = {
      ...item,
      percentage,
      startAngle: currentAngle,
      angle
    };
    currentAngle += angle;
    return slice;
  });

  // Função para calcular o path do arco SVG
  const createArc = (startAngle: number, angle: number) => {
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="space-y-6">
      {/* Gráfico de Pizza */}
      <div className="flex justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={createArc(slice.startAngle, slice.angle)}
              fill={slice.color}
              className="transition-all duration-300 hover:opacity-80"
            />
          ))}
          {/* Círculo branco no centro para efeito donut */}
          <circle cx="100" cy="100" r="50" fill="white" className="dark:fill-gray-800" />
        </svg>
      </div>

      {/* Total no centro */}
      <div className="text-center -mt-32 mb-20">
        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Total
        </p>
        <p className="text-2xl font-black text-gray-800 dark:text-white">
          R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Legenda */}
      <div className="space-y-3">
        {slices.map((slice, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-xl">{slice.icon}</span>
              <div>
                <p className="font-bold text-gray-800 dark:text-white text-sm">
                  {slice.category}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold">
                  {slice.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="font-black text-gray-800 dark:text-white">
              R$ {slice.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;
