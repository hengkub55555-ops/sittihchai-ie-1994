import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  RefreshCw,
  Download,
  Save,
  Calendar,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  YearlyManpowerStats,
  LanguageMode,
  generatePhasedYearStats,
} from '../data/manpowerData';

interface ManpowerTrendViewProps {
  yearlyStats: YearlyManpowerStats[];
  onChangeYearlyStats: (updated: YearlyManpowerStats[]) => void;
  scenarioTargets: {
    baseline: number;
    s1Remain: number;
    s2Remain: number;
    s3Remain: number;
  };
  langMode: LanguageMode;
  onSaveAll: () => void;
}

export const ManpowerTrendView: React.FC<ManpowerTrendViewProps> = ({
  yearlyStats,
  onChangeYearlyStats,
  scenarioTargets,
  langMode,
  onSaveAll,
}) => {
  const [selectedYear, setSelectedYear] = useState<number | 'all_years'>(2026);
  const [curvePreset, setCurvePreset] = useState<
    'quarterly' | 'linear' | 'seasonal'
  >('quarterly');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [visibleSeries, setVisibleSeries] = useState({
    baseline: true,
    s1: true,
    s2: true,
    s3: true,
    actual: true,
  });

  // Multilingual labels
  const labels = useMemo(() => {
    if (langMode === 'cn') {
      return {
        title: '月度及跨年度人力使用趋势与统计表 (2026年1月–12月及后续年度)',
        subtitle:
          '跟踪各月份方案一、方案二、方案三目标曲线与实际在岗人力 (Actual MP) 统计数据',
        allYearsBtn: '跨年度总览 (Multi-Year)',
        addYearBtn: '+ 新增下一年度',
        syncBtn: '按当前方案 1·2·3 目标重新生成月度曲线',
        curveQuarterly: '按季度阶梯精简 (Q1–Q4)',
        curveLinear: '按月度匀速精简 (1–12月)',
        curveSeasonal: '按旺淡季排产精简 (Seasonal)',
        baselineLine: '基准定编 (Baseline)',
        s1Line: '方案一目标 (Scenario 1)',
        s2Line: '方案二目标 (Scenario 2)',
        s3Line: '方案三目标 (Scenario 3)',
        actualLine: '实际使用人力 (Actual MP)',
        monthCol: '月份 (Month)',
        actualInputHint: '未录入',
        varianceCol: '实际 vs 方案一差异',
        noteCol: '月度执行节点 / 备注',
        exportCsvBtn: '导出月度统计 Excel (CSV)',
        saveBtn: '保存统计数据',
        avgActualLabel: '已记录月份平均实际人力',
        latestActualLabel: '最新月份实际人力',
        targetYearEndLabel: '年底目标 (方案 1 / 2 / 3)',
      };
    }
    if (langMode === 'en') {
      return {
        title:
          'Monthly & Multi-Year Manpower Trend & Usage Statistics (Jan–Dec 2026 & Beyond)',
        subtitle:
          'Track monthly trajectory across Scenarios 1, 2, 3 and log Actual Manpower utilization statistics',
        allYearsBtn: 'All Years Timeline',
        addYearBtn: '+ Add Next Year',
        syncBtn: 'Sync Monthly Curve with Current Scenario 1·2·3 Targets',
        curveQuarterly: 'Quarterly Step-Down (Q1–Q4)',
        curveLinear: 'Linear Monthly Reduction',
        curveSeasonal: 'Seasonal Production Curve',
        baselineLine: 'Baseline Quota',
        s1Line: 'Scenario 1 Plan',
        s2Line: 'Scenario 2 Plan',
        s3Line: 'Scenario 3 Plan',
        actualLine: 'Actual MP Used',
        monthCol: 'Month',
        actualInputHint: 'Pending',
        varianceCol: 'Actual vs S1 Variance',
        noteCol: 'Monthly Milestone / Remark',
        exportCsvBtn: 'Export Trend CSV',
        saveBtn: 'Save Statistics',
        avgActualLabel: 'Avg. Actual Manpower Used',
        latestActualLabel: 'Latest Recorded Actual MP',
        targetYearEndLabel: 'Year-End Target (S1 / S2 / S3)',
      };
    }
    return {
      title:
        'กราฟแนวโน้มและสถิติการใช้อัตรากำลังคนรายเดือน (ม.ค. – ธ.ค. 2026 และปีถัดๆ ไป)',
      subtitle:
        'ติดตามเทรนด์การลดกำลังคนตามช่วงสถานการณ์ที่ 1, 2, 3 รายเดือน พร้อมบันทึกสถิติการใช้กำลังคนจริง (Actual Manpower Used) ลงบนเว็บ',
      allYearsBtn: 'ดูต่อเนื่องทุกปี (Multi-Year)',
      addYearBtn: '+ เพิ่มปีถัดไป',
      syncBtn: 'คำนวณกราฟรายเดือนตามเป้าหมายแผน 1·2·3 ปัจจุบัน',
      curveQuarterly: 'ทยอยลดรายไตรมาส (Q1–Q4)',
      curveLinear: 'ลดเฉลี่ยเท่ากันทุกเดือน (ม.ค.–ธ.ค.)',
      curveSeasonal: 'ปรับตามฤดูกาลผลิต (High/Low Season)',
      baselineLine: 'อัตรากำลังตั้งต้น (Baseline)',
      s1Line: 'แผนสถานการณ์ที่ 1 (S1)',
      s2Line: 'แผนสถานการณ์ที่ 2 (S2)',
      s3Line: 'แผนสถานการณ์ที่ 3 (S3)',
      actualLine: 'ใช้จริงรายเดือน (Actual MP)',
      monthCol: 'เดือน (Month)',
      actualInputHint: 'รอกรอกสถิติ',
      varianceCol: 'ส่วนต่าง (ใช้จริง vs แผน 1)',
      noteCol: 'ช่วงสถานการณ์ / หมายเหตุประจำเดือน',
      exportCsvBtn: 'ส่งออกสถิติรายเดือน (CSV)',
      saveBtn: 'บันทึกสถิติลงเว็บ',
      avgActualLabel: 'ค่าเฉลี่ยการใช้กำลังคนจริง (Actual Avg.)',
      latestActualLabel: 'ยอดใช้กำลังคนจริงเดือนล่าสุด',
      targetYearEndLabel: 'เป้าหมายปลายปี ธ.ค. (แผน 1 / 2 / 3)',
    };
  }, [langMode]);

  // Active Year Object (when a single year is selected)
  const activeYearData = useMemo(() => {
    if (selectedYear === 'all_years') return yearlyStats[0];
    return (
      yearlyStats.find((y) => y.year === selectedYear) || yearlyStats[0]
    );
  }, [yearlyStats, selectedYear]);

  // Data points for the SVG Chart (either 12 months of selectedYear, or N*12 months across all years)
  const chartPoints = useMemo(() => {
    if (selectedYear === 'all_years') {
      return yearlyStats.flatMap((yr) =>
        yr.months.map((m) => ({
          label: `${
            langMode === 'cn'
              ? m.monthCn
              : langMode === 'en'
              ? m.monthEn
              : m.monthTh
          } ${String(yr.year).slice(-2)}`,
          fullLabel: `${
            langMode === 'cn'
              ? `${yr.year}年${m.monthCn}`
              : langMode === 'en'
              ? `${m.monthEn} ${yr.year}`
              : `${m.monthTh} ${yr.year}`
          }`,
          year: yr.year,
          monthIndex: m.monthIndex,
          baselineMp: m.baselineMp,
          scenario1Mp: m.scenario1Mp,
          scenario2Mp: m.scenario2Mp,
          scenario3Mp: m.scenario3Mp,
          actualMp: m.actualMp,
          phaseNote: m.phaseNote,
        }))
      );
    }

    return activeYearData.months.map((m) => ({
      label:
        langMode === 'cn'
          ? m.monthCn
          : langMode === 'en'
          ? m.monthEn
          : m.monthTh,
      fullLabel: `${
        langMode === 'cn'
          ? `${activeYearData.year}年${m.monthCn}`
          : langMode === 'en'
          ? `${m.monthEn} ${activeYearData.year}`
          : `${m.monthTh} ${activeYearData.year}`
      }`,
      year: activeYearData.year,
      monthIndex: m.monthIndex,
      baselineMp: m.baselineMp,
      scenario1Mp: m.scenario1Mp,
      scenario2Mp: m.scenario2Mp,
      scenario3Mp: m.scenario3Mp,
      actualMp: m.actualMp,
      phaseNote: m.phaseNote,
    }));
  }, [yearlyStats, selectedYear, activeYearData, langMode]);

  // Compute min and max Y for clean chart scaling
  const { minY, maxY } = useMemo(() => {
    let minVal = Infinity;
    let maxVal = -Infinity;
    chartPoints.forEach((p) => {
      const vals = [
        p.baselineMp,
        p.scenario1Mp,
        p.scenario2Mp,
        p.scenario3Mp,
        p.actualMp ?? p.scenario1Mp,
      ];
      vals.forEach((v) => {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      });
    });
    if (!isFinite(minVal) || !isFinite(maxVal)) {
      return { minY: 1500, maxY: 2600 };
    }
    const pad = Math.max(80, Math.round((maxVal - minVal) * 0.15));
    return {
      minY: Math.max(0, Math.floor((minVal - pad) / 50) * 50),
      maxY: Math.ceil((maxVal + pad) / 50) * 50,
    };
  }, [chartPoints]);

  // Summary KPIs for the selected view
  const summaryStats = useMemo(() => {
    const recordedActuals = chartPoints.filter(
      (p) => p.actualMp !== null && p.actualMp > 0
    );
    const avgActual =
      recordedActuals.length > 0
        ? Math.round(
            recordedActuals.reduce((sum, p) => sum + (p.actualMp || 0), 0) /
              recordedActuals.length
          )
        : 0;
    const latestActual =
      recordedActuals.length > 0
        ? recordedActuals[recordedActuals.length - 1]
        : null;
    const decPoint = chartPoints[chartPoints.length - 1];

    return {
      recordedCount: recordedActuals.length,
      avgActual,
      latestActual,
      decPoint,
    };
  }, [chartPoints]);

  // Handlers for adding next year, syncing curve, and editing monthly cells
  const handleAddNextYear = () => {
    const lastYearObj = yearlyStats[yearlyStats.length - 1];
    const nextYearNum = lastYearObj ? lastYearObj.year + 1 : 2029;
    const prevDec = lastYearObj.months[11];
    // Next year starts from previous year's Scenario 1 Dec target and reduces further by 5%, 10%, 15%
    const newBase = prevDec.scenario1Mp;
    const newS1 = Math.round(newBase * 0.95);
    const newS2 = Math.round(newBase * 0.9);
    const newS3 = Math.round(newBase * 0.85);

    const newYearStats = generatePhasedYearStats(
      nextYearNum,
      newBase,
      newS1,
      newS2,
      newS3,
      curvePreset,
      0
    );
    onChangeYearlyStats([...yearlyStats, newYearStats]);
    setSelectedYear(nextYearNum);
  };

  const handleDeleteYear = (yearToDelete: number) => {
    if (yearlyStats.length <= 1) return;
    const filtered = yearlyStats.filter((y) => y.year !== yearToDelete);
    onChangeYearlyStats(filtered);
    setSelectedYear(filtered[0].year);
  };

  const handleSyncActiveYearFromScenarios = () => {
    const targetYear =
      selectedYear === 'all_years' ? 2026 : selectedYear;
    onChangeYearlyStats(
      yearlyStats.map((yr) => {
        if (yr.year !== targetYear) return yr;
        const regenerated = generatePhasedYearStats(
          yr.year,
          scenarioTargets.baseline,
          scenarioTargets.s1Remain,
          scenarioTargets.s2Remain,
          scenarioTargets.s3Remain,
          curvePreset,
          0
        );
        // Preserve existing actualMp and phaseNote recorded by user
        return {
          ...regenerated,
          months: regenerated.months.map((m, idx) => ({
            ...m,
            actualMp: yr.months[idx].actualMp,
            phaseNote: yr.months[idx].phaseNote,
          })),
        };
      })
    );
  };

  const handleMonthFieldChange = (
    year: number,
    monthIndex: number,
    field:
      | 'baselineMp'
      | 'scenario1Mp'
      | 'scenario2Mp'
      | 'scenario3Mp'
      | 'actualMp'
      | 'phaseNote',
    rawValue: string
  ) => {
    onChangeYearlyStats(
      yearlyStats.map((yr) => {
        if (yr.year !== year) return yr;
        return {
          ...yr,
          months: yr.months.map((m) => {
            if (m.monthIndex !== monthIndex) return m;
            if (field === 'phaseNote') {
              return { ...m, phaseNote: rawValue };
            }
            if (field === 'actualMp') {
              if (rawValue.trim() === '') {
                return { ...m, actualMp: null };
              }
              return {
                ...m,
                actualMp: Math.max(0, parseInt(rawValue, 10) || 0),
              };
            }
            return {
              ...m,
              [field]: Math.max(0, parseInt(rawValue, 10) || 0),
            };
          }),
        };
      })
    );
  };

  const handleExportTrendCSV = () => {
    const headers = [
      'Year',
      'Month Index',
      'Month (TH)',
      'Month (CN)',
      'Month (EN)',
      'Baseline Quota',
      'Scenario 1 Target MP',
      'Scenario 2 Target MP',
      'Scenario 3 Target MP',
      'Actual Manpower Used',
      'Variance (Actual vs S1)',
      'Monthly Milestone / Note',
    ];

    const rowsCsv = yearlyStats.flatMap((yr) =>
      yr.months.map((m) => {
        const variance =
          m.actualMp !== null ? m.actualMp - m.scenario1Mp : '';
        return [
          yr.year,
          m.monthIndex,
          `"${m.monthTh}"`,
          `"${m.monthCn}"`,
          `"${m.monthEn}"`,
          m.baselineMp,
          m.scenario1Mp,
          m.scenario2Mp,
          m.scenario3Mp,
          m.actualMp !== null ? m.actualMp : '',
          variance,
          `"${m.phaseNote}"`,
        ].join(',');
      })
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...rowsCsv].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Manpower_Monthly_Trend_Statistics_2026_${
        yearlyStats[yearlyStats.length - 1].year
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // SVG Chart Geometry
  const svgWidth = 1080;
  const svgHeight = 360;
  const padLeft = 64;
  const padRight = 32;
  const padTop = 28;
  const padBottom = 46;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (idx: number) => {
    if (chartPoints.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (chartPoints.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const range = Math.max(1, maxY - minY);
    return padTop + plotH - ((val - minY) / range) * plotH;
  };

  const buildPath = (
    extractor: (p: (typeof chartPoints)[number]) => number | null
  ) => {
    const segments: string[] = [];
    let started = false;
    chartPoints.forEach((pt, idx) => {
      const val = extractor(pt);
      if (val === null || val === undefined) return;
      const x = getX(idx).toFixed(1);
      const y = getY(val).toFixed(1);
      if (!started) {
        segments.push(`M ${x} ${y}`);
        started = true;
      } else {
        segments.push(`L ${x} ${y}`);
      }
    });
    return segments.join(' ');
  };

  const yTicks = useMemo(() => {
    const count = 5;
    const step = (maxY - minY) / count;
    return Array.from({ length: count + 1 }, (_, i) =>
      Math.round(minY + step * i)
    );
  }, [minY, maxY]);

  return (
    <div className="space-y-6">
      {/* Header & Year Selector Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 print-sheet">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <TrendingDown className="w-4 h-4 text-slate-700" />
              <span>
                Manpower Historical & Forecast Telemetry · 2026 –{' '}
                {yearlyStats[yearlyStats.length - 1].year}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {labels.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{labels.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleExportTrendCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{labels.exportCsvBtn}</span>
            </button>
            <button
              type="button"
              onClick={onSaveAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{labels.saveBtn}</span>
            </button>
          </div>
        </div>

        {/* Year Tabs + Add Next Year + Curve Sync Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 no-print">
          {/* Year Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            {yearlyStats.map((yr) => (
              <button
                key={yr.year}
                type="button"
                onClick={() => setSelectedYear(yr.year)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedYear === yr.year
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {langMode === 'cn'
                    ? `${yr.year}年 (1-12月)`
                    : langMode === 'en'
                    ? `${yr.year} (Jan–Dec)`
                    : `ปี ${yr.year} (ม.ค.–ธ.ค.)`}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSelectedYear('all_years')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                selectedYear === 'all_years'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {labels.allYearsBtn} (2026–
              {yearlyStats[yearlyStats.length - 1].year})
            </button>

            <button
              type="button"
              onClick={handleAddNextYear}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {labels.addYearBtn} (
                {yearlyStats[yearlyStats.length - 1].year + 1})
              </span>
            </button>
          </div>

          {/* Sync Rollout Curve with Scenarios 1, 2, 3 */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={curvePreset}
              onChange={(e) =>
                setCurvePreset(
                  e.target.value as 'quarterly' | 'linear' | 'seasonal'
                )
              }
              className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="quarterly">{labels.curveQuarterly}</option>
              <option value="linear">{labels.curveLinear}</option>
              <option value="seasonal">{labels.curveSeasonal}</option>
            </select>

            <button
              type="button"
              onClick={handleSyncActiveYearFromScenarios}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
              title="ดึงยอดคงเหลือสุทธิของแผนที่ 1, 2, 3 มาสร้างเส้นกราฟรายเดือนอัตโนมัติ"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{labels.syncBtn}</span>
            </button>

            {typeof selectedYear === 'number' &&
              selectedYear > 2026 &&
              yearlyStats.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteYear(selectedYear)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="ลบข้อมูลปีนี้"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
          </div>
        </div>

        {/* Summary KPI Strip for Trend View */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <div className="text-xs text-slate-500 font-medium">
              {labels.latestActualLabel}
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono-tabular text-emerald-700">
                {summaryStats.latestActual
                  ? `${summaryStats.latestActual.actualMp?.toLocaleString()}`
                  : '-'}
              </span>
              <span className="text-xs font-mono-tabular text-slate-600">
                {summaryStats.latestActual
                  ? `${summaryStats.latestActual.fullLabel} (${summaryStats.recordedCount} เดือนที่บันทึกแล้ว)`
                  : 'ยังไม่มีข้อมูล'}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <div className="text-xs text-slate-500 font-medium">
              {labels.avgActualLabel}
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono-tabular text-slate-900">
                {summaryStats.avgActual > 0
                  ? summaryStats.avgActual.toLocaleString()
                  : '-'}
              </span>
              <span className="text-xs font-mono-tabular text-slate-500">
                Baseline:{' '}
                {chartPoints[0]?.baselineMp.toLocaleString() || '2,426'}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <div className="text-xs text-slate-500 font-medium">
              {labels.targetYearEndLabel}
            </div>
            <div className="mt-1.5 flex items-baseline justify-between font-mono-tabular">
              <span className="text-sm font-bold text-sky-700">
                S1: {summaryStats.decPoint?.scenario1Mp.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-amber-700">
                S2: {summaryStats.decPoint?.scenario2Mp.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-rose-700">
                S3: {summaryStats.decPoint?.scenario3Mp.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Series Legend & Visibility Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() =>
                setVisibleSeries((s) => ({ ...s, actual: !s.actual }))
              }
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border transition-opacity cursor-pointer ${
                visibleSeries.actual
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold'
                  : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
              }`}
            >
              <span className="w-3 h-1 bg-emerald-600 rounded-full inline-block" />
              <span>{labels.actualLine}</span>
            </button>

            <button
              type="button"
              onClick={() => setVisibleSeries((s) => ({ ...s, s1: !s.s1 }))}
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border transition-opacity cursor-pointer ${
                visibleSeries.s1
                  ? 'border-sky-300 bg-sky-50 text-sky-950 font-semibold'
                  : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
              }`}
            >
              <span className="w-3 h-1 bg-sky-600 rounded-full inline-block" />
              <span>{labels.s1Line}</span>
            </button>

            <button
              type="button"
              onClick={() => setVisibleSeries((s) => ({ ...s, s2: !s.s2 }))}
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border transition-opacity cursor-pointer ${
                visibleSeries.s2
                  ? 'border-amber-300 bg-amber-50 text-amber-950 font-semibold'
                  : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
              }`}
            >
              <span className="w-3 h-1 bg-amber-600 rounded-full inline-block" />
              <span>{labels.s2Line}</span>
            </button>

            <button
              type="button"
              onClick={() => setVisibleSeries((s) => ({ ...s, s3: !s.s3 }))}
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border transition-opacity cursor-pointer ${
                visibleSeries.s3
                  ? 'border-rose-300 bg-rose-50 text-rose-950 font-semibold'
                  : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
              }`}
            >
              <span className="w-3 h-1 bg-rose-600 rounded-full inline-block" />
              <span>{labels.s3Line}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setVisibleSeries((s) => ({ ...s, baseline: !s.baseline }))
              }
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border transition-opacity cursor-pointer ${
                visibleSeries.baseline
                  ? 'border-slate-300 bg-slate-100 text-slate-800 font-medium'
                  : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
              }`}
            >
              <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-500 inline-block" />
              <span>{labels.baselineLine}</span>
            </button>
          </div>

          {hoveredIdx !== null && chartPoints[hoveredIdx] && (
            <div className="text-xs font-mono-tabular bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-3">
              <span className="font-bold text-amber-300">
                {chartPoints[hoveredIdx].fullLabel}
              </span>
              <span>
                S1: {chartPoints[hoveredIdx].scenario1Mp.toLocaleString()}
              </span>
              <span>
                S2: {chartPoints[hoveredIdx].scenario2Mp.toLocaleString()}
              </span>
              <span>
                S3: {chartPoints[hoveredIdx].scenario3Mp.toLocaleString()}
              </span>
              <span className="text-emerald-300 font-bold">
                Actual:{' '}
                {chartPoints[hoveredIdx].actualMp !== null
                  ? chartPoints[hoveredIdx].actualMp?.toLocaleString()
                  : '-'}
              </span>
            </div>
          )}
        </div>

        {/* Interactive SVG Trend Chart */}
        <div className="w-full overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/40 p-3">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[720px] select-none"
          >
            {/* Horizontal Grid Lines & Y-Axis Labels */}
            {yTicks.map((tick) => {
              const y = getY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-[11px] font-mono"
                  >
                    {tick.toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Vertical Quarter / Year Divider Lines & X-Axis Labels */}
            {chartPoints.map((pt, idx) => {
              const x = getX(idx);
              const isQuarterBoundary = pt.monthIndex % 3 === 0;
              return (
                <g key={`${pt.year}-${pt.monthIndex}`}>
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={svgHeight - padBottom}
                    stroke={isQuarterBoundary ? '#CBD5E1' : '#F1F5F9'}
                    strokeDasharray={isQuarterBoundary ? '3 3' : undefined}
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={svgHeight - padBottom + 20}
                    textAnchor="middle"
                    className={`text-[11px] ${
                      hoveredIdx === idx
                        ? 'fill-slate-950 font-bold'
                        : 'fill-slate-600 font-medium'
                    }`}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}

            {/* 1. Baseline Dashed Line */}
            {visibleSeries.baseline && (
              <path
                d={buildPath((p) => p.baselineMp)}
                fill="none"
                stroke="#64748B"
                strokeWidth="1.75"
                strokeDasharray="5 5"
              />
            )}

            {/* 2. Scenario 3 Line (Rose) */}
            {visibleSeries.s3 && (
              <path
                d={buildPath((p) => p.scenario3Mp)}
                fill="none"
                stroke="#E11D48"
                strokeWidth="2.2"
              />
            )}

            {/* 3. Scenario 2 Line (Amber) */}
            {visibleSeries.s2 && (
              <path
                d={buildPath((p) => p.scenario2Mp)}
                fill="none"
                stroke="#D97706"
                strokeWidth="2.2"
              />
            )}

            {/* 4. Scenario 1 Line (Sky/Navy) */}
            {visibleSeries.s1 && (
              <path
                d={buildPath((p) => p.scenario1Mp)}
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.5"
              />
            )}

            {/* 5. Actual Manpower Used Line (Emerald Bold) */}
            {visibleSeries.actual && (
              <path
                d={buildPath((p) => p.actualMp)}
                fill="none"
                stroke="#059669"
                strokeWidth="3.2"
              />
            )}

            {/* Data Points & Value Callouts */}
            {chartPoints.map((pt, idx) => {
              const x = getX(idx);
              return (
                <g
                  key={`pts-${pt.year}-${pt.monthIndex}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible wide hover column */}
                  <rect
                    x={x - plotW / (chartPoints.length * 2)}
                    y={padTop}
                    width={plotW / chartPoints.length}
                    height={plotH}
                    fill="transparent"
                  />

                  {visibleSeries.s3 && (
                    <circle
                      cx={x}
                      cy={getY(pt.scenario3Mp)}
                      r={hoveredIdx === idx ? 5 : 3}
                      className="fill-rose-600 stroke-white stroke-1"
                    />
                  )}

                  {visibleSeries.s2 && (
                    <circle
                      cx={x}
                      cy={getY(pt.scenario2Mp)}
                      r={hoveredIdx === idx ? 5 : 3}
                      className="fill-amber-600 stroke-white stroke-1"
                    />
                  )}

                  {visibleSeries.s1 && (
                    <circle
                      cx={x}
                      cy={getY(pt.scenario1Mp)}
                      r={hoveredIdx === idx ? 5 : 3.5}
                      className="fill-sky-600 stroke-white stroke-1"
                    />
                  )}

                  {visibleSeries.actual && pt.actualMp !== null && (
                    <>
                      <circle
                        cx={x}
                        cy={getY(pt.actualMp)}
                        r={hoveredIdx === idx ? 6.5 : 4.5}
                        className="fill-emerald-600 stroke-white stroke-2"
                      />
                      {chartPoints.length <= 12 && (
                        <text
                          x={x}
                          y={getY(pt.actualMp) - 9}
                          textAnchor="middle"
                          className="fill-emerald-900 text-[10px] font-mono font-bold"
                        >
                          {pt.actualMp}
                        </text>
                      )}
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Editable Monthly Manpower Statistics Log Table (ม.ค. – ธ.ค.) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 print-sheet">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedYear === 'all_years'
                ? `ตารางบันทึกสถิติการใช้อัตรากำลังคนรายเดือน (${yearlyStats[0].year} – ${
                    yearlyStats[yearlyStats.length - 1].year
                  })`
                : `ตารางบันทึกสถิติการใช้อัตรากำลังคนรายเดือน ประจำปี ${activeYearData.year} (ม.ค. – ธ.ค. ${activeYearData.year})`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกกรอกตัวเลขในช่อง{' '}
              <strong className="text-emerald-800">
                "{labels.actualLine}"
              </strong>{' '}
              หรือเป้าหมายรายเดือนของแต่ละสถานการณ์เพื่อเก็บสถิติลงบนเว็บอัตโนมัติ
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium no-print">
            <CheckCircle2 className="w-4 h-4" />
            <span>บันทึกอัตโนมัติเมื่อพิมพ์แก้ไข (Auto-Saved on Web)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="border border-slate-700 px-3 py-2.5 text-center font-semibold w-28">
                  {labels.monthCol}
                </th>
                <th className="border border-slate-700 px-3 py-2.5 text-center font-semibold w-28">
                  {labels.baselineLine}
                </th>
                <th className="border border-slate-700 px-3 py-2.5 text-center font-semibold w-32 bg-sky-900">
                  {labels.s1Line}
                </th>
                <th className="border border-slate-700 px-3 py-2.5 text-center font-semibold w-32 bg-amber-900">
                  {labels.s2Line}
                </th>
                <th className="border border-slate-700 px-3 py-2.5 text-center font-semibold w-32 bg-rose-900">
                  {labels.s3Line}
                </th>
                <th className="border border-slate-700 px-3 py-2.5 text-center font-semibold w-36 bg-emerald-800">
                  {labels.actualLine} *
                </th>
                <th className="border border-slate-700 px-3 py-2.5 text-center font-semibold w-28">
                  {labels.varianceCol}
                </th>
                <th className="border border-slate-700 px-3 py-2.5 text-left font-semibold">
                  {labels.noteCol}
                </th>
              </tr>
            </thead>
            <tbody>
              {(selectedYear === 'all_years'
                ? yearlyStats
                : [activeYearData]
              ).map((yrObj) =>
                yrObj.months.map((m) => {
                  const diffVsS1 =
                    m.actualMp !== null ? m.actualMp - m.scenario1Mp : null;
                  return (
                    <tr
                      key={`${yrObj.year}-${m.monthIndex}`}
                      className="border-b border-slate-200 hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-900 bg-slate-50/60">
                        {langMode === 'cn'
                          ? `${yrObj.year}年 ${m.monthCn}`
                          : langMode === 'en'
                          ? `${m.monthEn} ${yrObj.year}`
                          : `${m.monthTh} ${yrObj.year}`}
                      </td>

                      {/* Baseline MP */}
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono-tabular">
                        <input
                          type="number"
                          min={0}
                          value={m.baselineMp}
                          onChange={(e) =>
                            handleMonthFieldChange(
                              yrObj.year,
                              m.monthIndex,
                              'baselineMp',
                              e.target.value
                            )
                          }
                          className="w-20 px-1.5 py-1 text-center font-mono-tabular text-slate-700 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 no-print"
                        />
                        <span className="hidden print-only">
                          {m.baselineMp.toLocaleString()}
                        </span>
                      </td>

                      {/* Scenario 1 Target MP */}
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono-tabular bg-sky-50/30">
                        <input
                          type="number"
                          min={0}
                          value={m.scenario1Mp}
                          onChange={(e) =>
                            handleMonthFieldChange(
                              yrObj.year,
                              m.monthIndex,
                              'scenario1Mp',
                              e.target.value
                            )
                          }
                          className="w-20 px-1.5 py-1 text-center font-mono-tabular font-semibold text-sky-900 bg-white border border-sky-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 no-print"
                        />
                        <span className="hidden print-only font-semibold">
                          {m.scenario1Mp.toLocaleString()}
                        </span>
                      </td>

                      {/* Scenario 2 Target MP */}
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono-tabular bg-amber-50/30">
                        <input
                          type="number"
                          min={0}
                          value={m.scenario2Mp}
                          onChange={(e) =>
                            handleMonthFieldChange(
                              yrObj.year,
                              m.monthIndex,
                              'scenario2Mp',
                              e.target.value
                            )
                          }
                          className="w-20 px-1.5 py-1 text-center font-mono-tabular font-semibold text-amber-900 bg-white border border-amber-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 no-print"
                        />
                        <span className="hidden print-only font-semibold">
                          {m.scenario2Mp.toLocaleString()}
                        </span>
                      </td>

                      {/* Scenario 3 Target MP */}
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono-tabular bg-rose-50/30">
                        <input
                          type="number"
                          min={0}
                          value={m.scenario3Mp}
                          onChange={(e) =>
                            handleMonthFieldChange(
                              yrObj.year,
                              m.monthIndex,
                              'scenario3Mp',
                              e.target.value
                            )
                          }
                          className="w-20 px-1.5 py-1 text-center font-mono-tabular font-semibold text-rose-900 bg-white border border-rose-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 no-print"
                        />
                        <span className="hidden print-only font-semibold">
                          {m.scenario3Mp.toLocaleString()}
                        </span>
                      </td>

                      {/* Actual Manpower Used (Editable Statistic Cell) */}
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono-tabular bg-emerald-50/50">
                        <input
                          type="number"
                          min={0}
                          placeholder={labels.actualInputHint}
                          value={m.actualMp !== null ? m.actualMp : ''}
                          onChange={(e) =>
                            handleMonthFieldChange(
                              yrObj.year,
                              m.monthIndex,
                              'actualMp',
                              e.target.value
                            )
                          }
                          className="w-24 px-2 py-1 text-center font-mono-tabular font-bold text-emerald-950 bg-white border border-emerald-400 rounded focus:outline-none focus:ring-2 focus:ring-emerald-700 placeholder:font-sans placeholder:font-normal placeholder:text-[11px] placeholder:text-slate-400 no-print"
                        />
                        <span className="hidden print-only font-bold text-emerald-900">
                          {m.actualMp !== null
                            ? m.actualMp.toLocaleString()
                            : '-'}
                        </span>
                      </td>

                      {/* Variance vs Scenario 1 */}
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono-tabular font-semibold">
                        {diffVsS1 === null ? (
                          <span className="text-slate-300">-</span>
                        ) : diffVsS1 === 0 ? (
                          <span className="text-emerald-700">ตรงเป้าหมาย (0)</span>
                        ) : diffVsS1 > 0 ? (
                          <span className="text-amber-700">+{diffVsS1} คน</span>
                        ) : (
                          <span className="text-emerald-700">{diffVsS1} คน</span>
                        )}
                      </td>

                      {/* Monthly Phase Note */}
                      <td className="border border-slate-300 px-3 py-1.5">
                        <input
                          type="text"
                          value={m.phaseNote}
                          onChange={(e) =>
                            handleMonthFieldChange(
                              yrObj.year,
                              m.monthIndex,
                              'phaseNote',
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 text-xs text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-slate-300 rounded focus:outline-none no-print"
                        />
                        <span className="hidden print-only text-xs text-slate-700">
                          {m.phaseNote}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
