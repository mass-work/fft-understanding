import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Grid,
  Paper,
  Slider,
  Box,
} from "@mui/material";
import { SliderProps } from "@mui/material/Slider";

import { styled } from "@mui/material/styles";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";

// スタイリング

interface Complex {
  r: number;
  i: number;
}

// FFTアルゴリズムの実装
function fft(data: Complex[]): Complex[] {
  const N = data.length;
  if (N <= 1) return data;

  const half = Math.floor(N / 2);
  const even = fft(data.filter((_, i) => i % 2 === 0));
  const odd = fft(data.filter((_, i) => i % 2 !== 0));
  const a = -2 * Math.PI;

  let results = new Array<Complex>(N);

  for (let k = 0; k < half; k++) {
    const exp: Complex = {
      r: Math.cos((a * k) / N),
      i: Math.sin((a * k) / N),
    };
    let temp: Complex = {
      r: exp.r * odd[k].r - exp.i * odd[k].i,
      i: exp.i * odd[k].r + exp.r * odd[k].i,
    };
    results[k] = {
      r: even[k].r + temp.r,
      i: even[k].i + temp.i,
    };
    results[k + half] = {
      r: even[k].r - temp.r,
      i: even[k].i - temp.i,
    };
  }
  return results;
}

// サイン波を生成
const generateSineWave = (
  numPoints: number,
  freq: number,
  amp: number,
  decay: number,
  phase: number // 位相パラメータを追加
): Complex[] => {
  return Array.from({ length: numPoints }, (_, index) => {
    const angle =
      (index / numPoints) * freq * Math.PI * 2 + (phase * Math.PI) / 180;
    const amplitude = Math.sin(angle) * amp * Math.exp(-decay * index);
    return { r: amplitude, i: 0 };
  });
};

// 合成波を生成
const generateCompositeWave = (
  numPoints: number,
  freqs: number[],
  amps: number[],
  decays: number[],
  phases: number[] // 位相パラメータの配列を追加
): Complex[] => {
  const waves = freqs.map(
    (freq, i) =>
      generateSineWave(numPoints, freq, amps[i], decays[i], phases[i]) // ここに位相パラメータを追加
  );
  // 以下は変更なし
  return waves[0].map((_, index) => {
    return waves.reduce(
      (acc: Complex, wave) => {
        acc.r += wave[index].r;
        return acc;
      },
      { r: 0, i: 0 }
    );
  });
};

interface WaveData {
  time: number;
  value: number;
}

const WaveChart = ({
  data,
  color,
  title,
}: {
  data: WaveData[];
  color: string;
  title: string;
}) => {
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dot={false} dataKey="value" stroke={color} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

function formatFrequency(frequency: number): string {
  return frequency.toFixed(0); // 四捨五入して整数にする
}

const SpectrumChart = ({
  data,
  frequencyRange,
  color,
  dataKey,
}: {
  data: Array<{ frequency: number; [key: string]: number | string }>;
  frequencyRange: number[];
  color: string;
  dataKey: string;
}) => {
  // frequencyRange に基づいてデータをフィルタリング
  const filteredData = data.filter(
    (item) =>
      item.frequency >= frequencyRange[0] && item.frequency <= frequencyRange[1]
  );

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={filteredData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="frequency"
          domain={[frequencyRange[0], frequencyRange[1]]}
          type="number"
          scale="linear"
          tickFormatter={formatFrequency}
        />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dot={false} dataKey={dataKey} stroke={color} />
      </LineChart>
    </ResponsiveContainer>
  );
};

interface ComplexPlaneChartProps {
  data: Complex[];
  centroid: Complex; // 重心を表すプロパティを追加
}

const ComplexPlaneChart: React.FC<ComplexPlaneChartProps> = ({
  data,
  centroid,
}) => {
  const chartData = data.map((point, index) => ({
    x: point.r,
    y: point.i,
    index, // 線をつなぐためには、各データ点にユニークなキーが必要
  }));

  return (
    <ResponsiveContainer width={500} height={500}>
      <LineChart>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="Real" domain={[-10, 10]} />
        <YAxis type="number" dataKey="y" name="Imaginary" domain={[-10, 10]} />
        {/* <Tooltip cursor={{ strokeDasharray: "3 3" }} /> */}
        <Line
          data={[
            { x: centroid.r, y: centroid.i },
            { x: centroid.r + 0.000001, y: centroid.i + 0.000001 },
          ]}
          dataKey="y"
          stroke="red"
          fill="red"
        />
        <Line
          data={chartData}
          type="monotone"
          dot={false}
          dataKey="y"
          stroke="#8884d8"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

function calculateDFTForFrequency(
  data: Complex[],
  targetFrequency: number,
  numPoints: number,
  samplingRate: number
): Complex[] {
  const dftResults = [];
  const twoPi = 2 * Math.PI;
  const freqRad = (twoPi * targetFrequency) / samplingRate;

  for (let n = 0; n < numPoints; n++) {
    let realPart = 0;
    let imagPart = 0;
    const angle = freqRad * n;
    realPart = data[n].r * Math.cos(angle) - data[n].i * Math.sin(angle);
    imagPart = data[n].i * Math.cos(angle) + data[n].r * Math.sin(angle);
    dftResults.push({ r: realPart, i: imagPart });
  }

  return dftResults;
}

// アプリケーションコンポーネント
function App() {
  const [frequencyRange, setFrequencyRange] = useState([0, 500]); // 初期値をナイキスト周波数に設定

  // ステート
  const [freq1, setFreq1] = useState<number>(2);
  const [freq2, setFreq2] = useState<number>(4);
  const [freq3, setFreq3] = useState<number>(6);
  const [phase1, setPhase1] = useState<number>(0);
  const [phase2, setPhase2] = useState<number>(0);
  const [phase3, setPhase3] = useState<number>(0);

  const [amp1, setAmp1] = useState<number>(1);
  const [amp2, setAmp2] = useState<number>(1);
  const [amp3, setAmp3] = useState<number>(1);
  // 減衰係数のステート
  const [decay1, setDecay1] = useState<number>(0);
  const [decay2, setDecay2] = useState<number>(0);
  const [decay3, setDecay3] = useState<number>(0);
  const [selectedFrequency, setSelectedFrequency] = useState(0);
  const [dftDataForChart, setDftDataForChart] = useState<Complex[]>([]);
  const [centroid, setCentroid] = useState({ r: 0, i: 0 });

  const numPoints = 512;
  const samplingRate = 1000; // 1秒間に1000サンプル

  // サンプリングレートを基に時間軸を計算
  const timeAxis = Array.from(
    { length: numPoints },
    (_, i) => i / samplingRate
  );

  // サイン波を生成
  const sineWave1 = generateSineWave(numPoints, freq1, amp1, decay1, phase1);
  const sineWave2 = generateSineWave(numPoints, freq2, amp2, decay2, phase2);
  const sineWave3 = generateSineWave(numPoints, freq3, amp3, decay3, phase3);
  const compositeWave = generateCompositeWave(
    numPoints,
    [freq1, freq2, freq3],
    [amp1, amp2, amp3],
    [decay1, decay2, decay3],
    [phase1, phase2, phase3]
  );

  // グラフデータを時間軸に対応させる
  const chartData1 = sineWave1.map((point, index) => ({
    time: timeAxis[index],
    value: point.r,
  }));
  const chartData2 = sineWave2.map((point, index) => ({
    time: timeAxis[index],
    value: point.r,
  }));
  const chartData3 = sineWave3.map((point, index) => ({
    time: timeAxis[index],
    value: point.r,
  }));
  const chartDataComposite = compositeWave.map((point, index) => ({
    time: timeAxis[index],
    value: point.r,
  }));

  const fftResults = fft(compositeWave);
  const dftResultsForSelectedFrequency = calculateDFTForFrequency(
    compositeWave,
    selectedFrequency,
    numPoints,
    samplingRate
  );

  // ナイキスト周波数を考慮した周波数軸の計算
  const frequencyAxis = Array.from(
    { length: numPoints / 2 },
    (_, i) => (i * samplingRate) / numPoints
  );
  const amplitudeSpectrum = fftResults.map((c) =>
    Math.sqrt(c.r ** 2 + c.i ** 2)
  );
  const amplitudeSpectrumData = amplitudeSpectrum
    .slice(0, numPoints / 2)
    .map((amp, index) => ({
      frequency: frequencyAxis[index],
      amp: (amp * 2) / numPoints, // データ点数で割り、2をかける
    }));

  const phaseSpectrum = fftResults.map((c) => Math.atan2(c.i, c.r));
  const phaseSpectrumData = phaseSpectrum
    .slice(0, numPoints / 2)
    .map((phase, index) => ({
      frequency: frequencyAxis[index],
      phase: (phase * 180) / Math.PI, // ラジアンから度に変換
    }));

  useEffect(() => {
    const dftResults = calculateDFTForFrequency(
      compositeWave,
      selectedFrequency,
      numPoints,
      samplingRate
    );
    setDftDataForChart(dftResults);

    // 重心を計算
    const total = dftResults.reduce(
      (acc, point) => ({ r: acc.r + point.r, i: acc.i + point.i }),
      { r: 0, i: 0 }
    );
    setCentroid({
      r: total.r / dftResults.length,
      i: total.i / dftResults.length,
    });
  }, [selectedFrequency, compositeWave, numPoints, samplingRate]);
  console.log(centroid.r);

  console.log(centroid.i);

  return (
    <>
      <AppBar position="static">{/* AppBarの内容 */}</AppBar>
      <Grid container spacing={2}>
        {/* 各サイン波のグラフとスライダー */}
        {/* 各サイン波のグラフの直下に振幅と減衰のスライダーを配置 */}
        <Grid item xs={9} sm={4} md={3}>
          <WaveChart data={chartData1} color="#8884d8" title="Wave 1" />
          <LabeledHorizonSlider
            label="freq"
            value={freq1}
            onChange={(e, val) => typeof val === "number" && setFreq1(val)}
            min={1.0}
            max={50.0}
          />
          <LabeledHorizonSlider
            label="phase"
            value={phase1}
            onChange={(e, val) => typeof val === "number" && setPhase1(val)}
            min={-180}
            max={180}
            step={1} // ステップサイズを1に設定
          />
        </Grid>
        <Grid item xs={1.2} sm={0.8} md={0.4}>
          <LabeledVerticalSlider
            label="amp"
            value={amp1}
            onChange={(e, val) => typeof val === "number" && setAmp1(val)}
            orientation="vertical"
            min={0}
            max={5}
            step={0.1}
          />
        </Grid>
        <Grid item xs={1.2} sm={0.8} md={0.4}>
          <LabeledVerticalSlider
            label="e"
            value={decay1}
            onChange={(e, val) => typeof val === "number" && setDecay1(val)}
            orientation="vertical"
            min={0}
            max={0.01}
            step={0.001}
          />
        </Grid>
        <Grid item xs={9} sm={4} md={3}>
          <WaveChart data={chartData2} color="#82ca9d" title="Wave 2" />
          <LabeledHorizonSlider
            label="freq"
            value={freq2}
            onChange={(e, val) => typeof val === "number" && setFreq2(val)}
            min={1.0}
            max={50.0}
          />
          <LabeledHorizonSlider
            label="phase"
            value={phase2}
            onChange={(e, val) => typeof val === "number" && setPhase2(val)}
            min={-180}
            max={180}
            step={1} // ステップサイズを1に設定
          />
        </Grid>
        <Grid item xs={1.2} sm={0.8} md={0.4}>
          <LabeledVerticalSlider
            label="amp"
            value={amp2}
            onChange={(e, val) => typeof val === "number" && setAmp2(val)}
            orientation="vertical"
            min={0}
            max={5}
            step={0.1}
          />
        </Grid>
        <Grid item xs={1.2} sm={0.8} md={0.4}>
          <LabeledVerticalSlider
            label="e"
            value={decay2}
            onChange={(e, val) => typeof val === "number" && setDecay2(val)}
            orientation="vertical"
            min={0}
            max={0.01}
            step={0.001}
          />
        </Grid>
        <Grid item xs={9} sm={4} md={3}>
          <WaveChart data={chartData3} color="#ffc658" title="Wave 3" />
          <LabeledHorizonSlider
            label="freq"
            value={freq3}
            onChange={(e, val) => typeof val === "number" && setFreq3(val)}
            min={1.0}
            max={50.0}
          />
          <LabeledHorizonSlider
            label="phase"
            value={phase3}
            onChange={(e, val) => typeof val === "number" && setPhase3(val)}
            min={-180}
            max={180}
            step={1} // ステップサイズを1に設定
          />
        </Grid>
        <Grid item xs={1.2} sm={0.8} md={0.4}>
          <LabeledVerticalSlider
            label="amp"
            value={amp3}
            onChange={(e, val) => typeof val === "number" && setAmp3(val)}
            orientation="vertical"
            min={0}
            max={5}
            step={0.1}
          />
        </Grid>
        <Grid item xs={1.2} sm={0.8} md={0.4}>
          <LabeledVerticalSlider
            label="e"
            value={decay3}
            onChange={(e, val) => typeof val === "number" && setDecay3(val)}
            orientation="vertical"
            min={0}
            max={0.01}
            step={0.001}
          />
        </Grid>
        {/* 合成波のグラフ */}
        <Grid item xs={12} sm={6} md={4}>
          {" "}
          <WaveChart
            data={chartDataComposite}
            color="#ff7300"
            title="Composite Wave"
          />
        </Grid>

        {/* 振幅スペクトルのグラフ */}
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={{ width: "100%", height: "100%" }}>
            <SpectrumChart
              data={amplitudeSpectrumData}
              frequencyRange={frequencyRange}
              color="#8884d8"
              dataKey="amp"
            />
            <LabeledHorizonSlider
              label="freq"
              value={frequencyRange}
              onChange={(e, val) => setFrequencyRange(val as number[])} // 型アサーションを追加
              valueLabelDisplay="auto"
              min={0}
              max={500} // ナイキスト周波数まで
            />
          </Box>
        </Grid>

        {/* 位相スペクトルのグラフ */}
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={{ width: "100%", height: "100%" }}>
            <SpectrumChart
              data={phaseSpectrumData}
              frequencyRange={frequencyRange}
              color="#82ca9d"
              dataKey="phase"
            />
          </Box>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <Typography gutterBottom>
          Selected Frequency: {selectedFrequency} Hz
        </Typography>
        <LabeledHorizonSlider
          label="Selected Frequency"
          value={selectedFrequency}
          onChange={(e, val) => setSelectedFrequency(val as number)}
          min={0}
          max={numPoints / 2 - 1}
          step={1}
        />
      </Grid>
      <Grid item xs={12}>
        <ComplexPlaneChart data={dftDataForChart} centroid={centroid} />
      </Grid>
    </>
  );
}

export default App;

const VerticalSlider = styled(Slider)(({ theme }) => ({
  "& .MuiSlider-thumb": {
    height: 10,
    width: 10,
    // 他に必要なスタイルを追加
  },
  "& .MuiSlider-track": {
    width: 2,
    // 他に必要なスタイルを追加
  },
  "& .MuiSlider-rail": {
    width: 3,
    // 他に必要なスタイルを追加
  },
  height: 150,
  marginTop: theme.spacing(1), // 例えば、8px
  marginBottom: theme.spacing(1), // 同じく、8px
  marginLeft: theme.spacing(0), // 例えば、8px
  marginRight: theme.spacing(0), // 同じく、8px
}));

interface LabeledVerticalSliderProps extends SliderProps {
  label: string;
}

const LabeledVerticalSlider = ({
  label,
  ...sliderProps
}: LabeledVerticalSliderProps) => {
  return (
    <Box sx={{ width: "100%", height: "100%", textAlign: "center" }}>
      <Typography gutterBottom>{label}</Typography>
      <VerticalSlider {...sliderProps} />
    </Box>
  );
};

const HorizonSlider = styled(Slider)(({ theme }) => ({
  "& .MuiSlider-thumb": {
    height: 10,
    width: 10,
    // 他に必要なスタイルを追加
  },
  "& .MuiSlider-track": {
    height: 2,
    // 他に必要なスタイルを追加
  },
  "& .MuiSlider-rail": {
    height: 3,
    // 他に必要なスタイルを追加
  },
  marginLeft: theme.spacing(4), // 例えば、8px
  marginRight: theme.spacing(4), // 同じく、8px
}));

interface LabeledHorizonSliderProps extends SliderProps {
  label: string;
}

const LabeledHorizonSlider = ({
  label,
  ...sliderProps
}: LabeledHorizonSliderProps) => {
  return (
    <Box sx={{ width: "100%", height: "15%", textAlign: "center" }}>
      <Typography gutterBottom>{label}</Typography>
      <HorizonSlider {...sliderProps} />
    </Box>
  );
};

const GridItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));
