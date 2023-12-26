import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Complex {
  r: number;
  i: number;
}

interface ComplexPlaneChartProps {
  data: Complex[];
  selectedFrequency: number;
}

const ComplexPlaneChart: React.FC<ComplexPlaneChartProps> = ({
  data,
  selectedFrequency,
}) => {
  const point = data[selectedFrequency] || { r: 0, i: 0 };

  const chartData = [{ x: point.r, y: point.i }];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ScatterChart>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="Real" />
        <YAxis type="number" dataKey="y" name="Imaginary" />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={chartData} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  );
};

export default ComplexPlaneChart;
