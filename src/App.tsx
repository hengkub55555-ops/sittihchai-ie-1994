import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  PenTool,
  CheckCircle2,
  SlidersHorizontal,
  Calculator,
  Search,
  Check,
  Info,
  Save,
  Copy,
  Layers,
  Percent,
  Link2,
  Globe,
  LayoutTemplate,
} from 'lucide-react';
import {
  INITIAL_SCENARIOS,
  INITIAL_YEARLY_STATS,
  ManpowerRow,
  DocumentConfig,
  SignatureRecord,
  ScenarioPlan,
  RoundingMethod,
  LanguageMode,
  DocumentStyleMode,
  YearlyManpowerStats,
  applyRounding,
} from './data/manpowerData';
import { SignatureModal } from './components/SignatureModal';
import { ManpowerTrendView } from './components/ManpowerTrendView';

type ViewMode = 'document' | 'compare' | 'trends' | 'analytics' | 'audit';

const STORAGE_KEY = 'manpower_plan_2026_scenarios_v4';
const ACTIVE_SCENARIO_KEY = 'manpower_plan_2026_active_scenario_v4';
const LANG_MODE_KEY = 'manpower_plan_2026_lang_mode_v4';
const STYLE_MODE_KEY = 'manpower_plan_2026_style_mode_v4';
const YEARLY_STATS_KEY = 'manpower_plan_2026_yearly_stats_v4';

export default function App() {
  // Load scenarios from localStorage or fallback to INITIAL_SCENARIOS
  const [scenarios, setScenarios] = useState<ScenarioPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_SCENARIOS;
  });

  const [activeScenarioId, setActiveScenarioId] = useState<
    'scenario-1' | 'scenario-2' | 'scenario-3'
  >(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_SCENARIO_KEY);
      if (
        savedId === 'scenario-1' ||
        savedId === 'scenario-2' ||
        savedId === 'scenario-3'
      ) {
        return savedId;
      }
    } catch {
      // ignore
    }
    return 'scenario-1';
  });

  const [langMode, setLangMode] = useState<LanguageMode>(() => {
    try {
      const saved = localStorage.getItem(LANG_MODE_KEY) as LanguageMode;
      if (['th', 'cn', 'en', 'cn_en', 'trilingual'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'trilingual';
  });

  const [styleMode, setStyleMode] = useState<DocumentStyleMode>(() => {
    try {
      const saved = localStorage.getItem(STYLE_MODE_KEY) as DocumentStyleMode;
      if (
        [
          'corporate_navy',
          'executive_minimal',
          'iso_formal',
          'modern_cards',
        ].includes(saved)
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'corporate_navy';
  });

  const [yearlyStats, setYearlyStats] = useState<YearlyManpowerStats[]>(() => {
    try {
      const saved = localStorage.getItem(YEARLY_STATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_YEARLY_STATS;
  });

  const [activeView, setActiveView] = useState<ViewMode>('document');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'direct' | 'other'>('all');
  const [signingRow, setSigningRow] = useState<ManpowerRow | null>(null);
  const [showPercentageCol, setShowPercentageCol] = useState<boolean>(true);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>(() =>
    new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper for UI language strings based on selected langMode
  const t = useMemo(() => {
    const isCn = langMode === 'cn';
    const isEn = langMode === 'en';
    if (isCn) {
      return {
        navDocument: '确认计划表 (Document)',
        navCompare: '方案 1·2·3 对比 (Compare)',
        navTrends: '月度趋势与统计 (Monthly Trend)',
        navAnalytics: '精简比例分析 (Analytics)',
        navAudit: '数据校验 (Data Audit)',
        printBtn: '打印 / 导出 PDF',
        scenarioHeader: '选择人力精简方案 (Scenarios 1 · 2 · 3)',
        scenarioSub: '· 可独立调整各方案的精简百分比与定编数据',
        lastSaved: '最近保存',
        saveAllBtn: '保存全部数据 (Save All)',
        signedCountLabel: '已签认',
        deptsUnit: '部门',
        reduceLabel: '精简',
        remainLabel: '保留',
        personUnit: '人',
        formulaBarTitle: '百分比联动计算公式',
        globalPctLabel: '全厂统一精简比例 (%) =',
        orTargetPerson: '或输入目标精简总人数:',
        basisDouble: '计算基准：双班定编',
        basisSingle: '计算基准：单班定编',
        roundStd: '标准四舍五入 (Round)',
        roundFloor: '向下取整 (Floor)',
        roundCeil: '向上取整 (Ceil)',
        searchPlaceholder: '搜索部门 (如 A线, 检验)...',
        filterAll: '全部',
        editAllOn: '完成编辑 (正在编辑)',
        editAllOff: '编辑全部内容 (Edit All)',
        docNo: '文件编号',
        effectiveDate: '生效日期',
        fiscalYear: '预算年度',
        revision: '版本状态',
        ackHeader: '人力精简计划确认与执行承诺 (Acknowledgment & Commitment):',
        preparedByLabel: '1. 编制人 (Prepared By)',
        reviewedByLabel: '2. 审核人 (Reviewed By)',
        approvedByLabel: '3. 批准人 (Approved By)',
        positionLabel: '职位',
        dateLabel: '日期',
        signLine: '签名 .......................................................',
        batchSignDemo: '一键模拟全部签字',
        clearAllSign: '清空全部签名',
        clickToSign: '点击签名',
      };
    }
    if (isEn) {
      return {
        navDocument: 'Acknowledgment Plan',
        navCompare: 'Compare Scenarios 1·2·3',
        navTrends: 'Monthly Trend & Stats',
        navAnalytics: 'Reduction Analytics',
        navAudit: 'Formula Audit',
        printBtn: 'Print / Save PDF',
        scenarioHeader: 'Manpower Reduction Scenarios (1 · 2 · 3)',
        scenarioSub: '· Independently configure linked % formulas and headcount per scenario',
        lastSaved: 'Last Saved',
        saveAllBtn: 'Save All Changes',
        signedCountLabel: 'Signed',
        deptsUnit: 'Depts',
        reduceLabel: 'Reduce',
        remainLabel: 'Remain',
        personUnit: 'MP',
        formulaBarTitle: 'Linked % Formula Calculator',
        globalPctLabel: 'Global Reduction (%) =',
        orTargetPerson: 'Or Target Total Reduction:',
        basisDouble: 'Basis: Double Shift Quota',
        basisSingle: 'Basis: Single Shift Quota',
        roundStd: 'Standard Round (≥ 0.5)',
        roundFloor: 'Round Down (Floor)',
        roundCeil: 'Round Up (Ceil)',
        searchPlaceholder: 'Search department (e.g. A Line, Inspection)...',
        filterAll: 'All',
        editAllOn: 'Finish Editing (Edit Mode ON)',
        editAllOff: 'Edit All Data',
        docNo: 'Document No.',
        effectiveDate: 'Effective Date',
        fiscalYear: 'Fiscal Year',
        revision: 'Revision',
        ackHeader: 'Manpower Reduction Acknowledgment & Execution Commitment:',
        preparedByLabel: '1. Prepared By',
        reviewedByLabel: '2. Reviewed By',
        approvedByLabel: '3. Approved By',
        positionLabel: 'Title',
        dateLabel: 'Date',
        signLine: 'Signature ...................................................',
        batchSignDemo: 'Simulate All Signatures',
        clearAllSign: 'Clear Signatures',
        clickToSign: 'Click to Sign',
      };
    }
    // Default Thai / Trilingual / CN_EN UI controls in clear Thai + English
    return {
      navDocument: 'เอกสารรับทราบ (Document)',
      navCompare: 'เปรียบเทียบแผน 1·2·3',
      navTrends: 'กราฟเทรนด์รายเดือน (2026+)',
      navAnalytics: 'วิเคราะห์สัดส่วน (Analytics)',
      navAudit: 'ตรวจสอบสูตร (Audit)',
      printBtn: 'พิมพ์เอกสาร / PDF',
      scenarioHeader: 'เลือกแผนสถานการณ์ลดกำลังคน (Scenarios 1 · 2 · 3)',
      scenarioSub: '· ผูกสูตรเปอร์เซ็นต์และบันทึกข้อมูลแยกอิสระได้ทั้ง 3 แผน',
      lastSaved: 'บันทึกล่าสุด',
      saveAllBtn: 'บันทึกข้อมูลทั้งหมด (Save All)',
      signedCountLabel: 'ลงนามแล้ว',
      deptsUnit: 'แผนก',
      reduceLabel: 'ปรับลด',
      remainLabel: 'คงเหลือ',
      personUnit: 'คน',
      formulaBarTitle: 'สูตรผูกเปอร์เซ็นต์ลดคนอัตโนมัติ',
      globalPctLabel: 'ลดทุกแผนก (%) =',
      orTargetPerson: 'หรือระบุยอดคนลดรวม:',
      basisDouble: 'ฐานคำนวณ: สองกะ (双班定编)',
      basisSingle: 'ฐานคำนวณ: กะเดียว (单班定编)',
      roundStd: 'ปัดเศษมาตรฐาน (Round ≥ 0.5)',
      roundFloor: 'ปัดเศษลงทั้งหมด (Floor)',
      roundCeil: 'ปัดเศษขึ้นทั้งหมด (Ceil)',
      searchPlaceholder: 'ค้นหาแผนก (เช่น A Line, 检验, ประตู)...',
      filterAll: 'ทั้งหมด',
      editAllOn: 'เสร็จสิ้นการแก้ไข (โหมดแก้ไขเปิดอยู่)',
      editAllOff: 'แก้ไขข้อมูลทั้งหมด (Edit All)',
      docNo: 'เลขที่เอกสาร (Doc No.)',
      effectiveDate: 'วันที่มีผล (Effective)',
      fiscalYear: 'ปีงบประมาณ (Year)',
      revision: 'ฉบับแก้ไข (Revision)',
      ackHeader:
        'บันทึกข้อตกลงและการรับทราบแผนการปรับลดอัตรากำลังคน (Acknowledgment & Execution Commitment):',
      preparedByLabel: '1. ผู้จัดทำแผน · Prepared By (编制)',
      reviewedByLabel: '2. ผู้ตรวจสอบ · Reviewed By (审核)',
      approvedByLabel: '3. ผู้อนุมัติสูงสุด · Approved By (批准)',
      positionLabel: 'ตำแหน่ง',
      dateLabel: 'วันที่',
      signLine: 'ลงชื่อ .......................................................',
      batchSignDemo: 'จำลองลงนามครบทุกแผนก',
      clearAllSign: 'ล้างลายเซ็นทั้งหมด',
      clickToSign: 'คลิกเพื่อลงนาม',
    };
  }, [langMode]);

  // Current active scenario object
  const activeScenario = useMemo(() => {
    return scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];
  }, [scenarios, activeScenarioId]);

  const rows = activeScenario.rows;
  const docConfig = activeScenario.docConfig;
  const totalMode = activeScenario.totalMode;
  const roundingMethod: RoundingMethod = activeScenario.roundingMethod || 'round';
  const formulaBasis = activeScenario.formulaBasis || 'double_shift';

  // Auto-persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
      localStorage.setItem(ACTIVE_SCENARIO_KEY, activeScenarioId);
      localStorage.setItem(LANG_MODE_KEY, langMode);
      localStorage.setItem(STYLE_MODE_KEY, styleMode);
      localStorage.setItem(YEARLY_STATS_KEY, JSON.stringify(yearlyStats));
    } catch {
      // ignore quota errors
    }
  }, [scenarios, activeScenarioId, langMode, styleMode, yearlyStats]);

  // Helper to update the currently active scenario
  const updateActiveScenario = (
    updater: (prev: ScenarioPlan) => ScenarioPlan
  ) => {
    const nowStr = new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    setScenarios((prevScenarios) =>
      prevScenarios.map((sc) =>
        sc.id === activeScenarioId
          ? { ...updater(sc), updatedAt: nowStr }
          : sc
      )
    );
  };

  // Explicit Save Action
  const handleManualSaveAll = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
      localStorage.setItem(ACTIVE_SCENARIO_KEY, activeScenarioId);
      localStorage.setItem(LANG_MODE_KEY, langMode);
      localStorage.setItem(STYLE_MODE_KEY, styleMode);
      const timeNow = new Date().toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSavedTime(timeNow);
      setSaveFeedback(
        `บันทึกข้อมูล โหมดภาษา และรูปแบบเอกสารทั้ง 3 แผนเรียบร้อยแล้ว (${timeNow})`
      );
      setTimeout(() => setSaveFeedback(null), 3500);
    } catch {
      setSaveFeedback('เกิดข้อผิดพลาดในการบันทึกข้อมูลลงเบราว์เซอร์');
    }
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesCategory =
        categoryFilter === 'all' || r.categoryGroup === categoryFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.deptCn.toLowerCase().includes(q) ||
        r.deptEn.toLowerCase().includes(q) ||
        r.deptTh.toLowerCase().includes(q) ||
        r.signature.signerName.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [rows, categoryFilter, searchQuery]);

  const directRows = useMemo(
    () => filteredRows.filter((r) => r.categoryGroup === 'direct'),
    [filteredRows]
  );
  const otherRows = useMemo(
    () => filteredRows.filter((r) => r.categoryGroup === 'other'),
    [filteredRows]
  );

  // Helper to compute sums for any scenario
  const computeScenarioMetrics = (sc: ScenarioPlan) => {
    const calc = sc.rows.reduce(
      (acc, r) => ({
        singleShiftQuota:
          acc.singleShiftQuota + (Number(r.singleShiftQuota) || 0),
        doubleShiftQuota:
          acc.doubleShiftQuota + (Number(r.doubleShiftQuota) || 0),
        reducePerson: acc.reducePerson + (Number(r.reducePerson) || 0),
        remainMp: acc.remainMp + (Number(r.remainMp) || 0),
      }),
      {
        singleShiftQuota: 0,
        doubleShiftQuota: 0,
        reducePerson: 0,
        remainMp: 0,
      }
    );
    const displaySingle =
      sc.totalMode === 'image_exact'
        ? sc.customExactTotals.singleShiftQuota
        : calc.singleShiftQuota;
    const displayDouble =
      sc.totalMode === 'image_exact'
        ? sc.customExactTotals.doubleShiftQuota
        : calc.doubleShiftQuota;
    const basisTotal =
      sc.formulaBasis === 'single_shift'
        ? calc.singleShiftQuota
        : calc.doubleShiftQuota;
    const pct =
      basisTotal > 0
        ? ((calc.reducePerson / basisTotal) * 100).toFixed(2)
        : '0.00';
    const signed = sc.rows.filter(
      (r) => r.signature.status === 'acknowledged'
    ).length;

    return {
      calc,
      displaySingle,
      displayDouble,
      reducePerson: calc.reducePerson,
      remainMp: calc.remainMp,
      pct,
      signed,
      totalDepts: sc.rows.length,
    };
  };

  const currentMetrics = useMemo(
    () => computeScenarioMetrics(activeScenario),
    [activeScenario]
  );

  const allScenarioMetrics = useMemo(() => {
    return scenarios.map((sc) => ({
      scenario: sc,
      metrics: computeScenarioMetrics(sc),
    }));
  }, [scenarios]);

  // ============================================================================
  // LINKED PERCENTAGE FORMULA HANDLERS
  // ============================================================================
  const handleGlobalLinkedPctChange = (
    newPctValue: number,
    customRounding?: RoundingMethod,
    customBasis?: 'double_shift' | 'single_shift'
  ) => {
    const clampedPct = Math.max(0, Math.min(100, Number(newPctValue) || 0));
    updateActiveScenario((sc) => {
      const activeRound = customRounding || sc.roundingMethod || 'round';
      const activeBasis = customBasis || sc.formulaBasis || 'double_shift';

      const updatedRows = sc.rows.map((r) => {
        const baseQuota =
          activeBasis === 'single_shift'
            ? r.singleShiftQuota
            : r.doubleShiftQuota;
        if (baseQuota <= 0) {
          return {
            ...r,
            reducePct: 0,
            reducePerson: 0,
            remainMp: r.doubleShiftQuota,
          };
        }
        const rawReduce = baseQuota * (clampedPct / 100);
        const calcPerson = Math.min(
          r.doubleShiftQuota,
          Math.max(0, applyRounding(rawReduce, activeRound))
        );
        return {
          ...r,
          reducePct: Number(clampedPct.toFixed(2)),
          reducePerson: calcPerson,
          remainMp: Math.max(0, r.doubleShiftQuota - calcPerson),
        };
      });

      const totalRed = updatedRows.reduce((sum, r) => sum + r.reducePerson, 0);
      return {
        ...sc,
        linkedGlobalPct: Number(clampedPct.toFixed(2)),
        roundingMethod: activeRound,
        formulaBasis: activeBasis,
        targetRateLabel: `-${clampedPct.toFixed(2)}% (${totalRed})`,
        rows: updatedRows,
      };
    });
  };

  const handleRowLinkedPctChange = (rowId: string, pctStr: string) => {
    const parsedPct = Math.max(0, Math.min(100, parseFloat(pctStr) || 0));
    updateActiveScenario((sc) => {
      const activeRound = sc.roundingMethod || 'round';
      const activeBasis = sc.formulaBasis || 'double_shift';

      const updatedRows = sc.rows.map((r) => {
        if (r.id !== rowId) return r;
        const baseQuota =
          activeBasis === 'single_shift'
            ? r.singleShiftQuota
            : r.doubleShiftQuota;
        const calcPerson =
          baseQuota > 0
            ? Math.min(
                r.doubleShiftQuota,
                Math.max(
                  0,
                  applyRounding(baseQuota * (parsedPct / 100), activeRound)
                )
              )
            : 0;
        return {
          ...r,
          reducePct: parsedPct,
          reducePerson: calcPerson,
          remainMp: Math.max(0, r.doubleShiftQuota - calcPerson),
        };
      });

      return {
        ...sc,
        rows: updatedRows,
      };
    });
  };

  const handleRowNumberChange = (
    rowId: string,
    field: 'singleShiftQuota' | 'doubleShiftQuota' | 'reducePerson' | 'remainMp',
    value: string
  ) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    updateActiveScenario((sc) => {
      const activeRound = sc.roundingMethod || 'round';
      const activeBasis = sc.formulaBasis || 'double_shift';

      return {
        ...sc,
        rows: sc.rows.map((r) => {
          if (r.id !== rowId) return r;
          const updated = { ...r, [field]: num };

          if (field === 'singleShiftQuota') {
            updated.doubleShiftQuota = num * 2;
            const baseQuota =
              activeBasis === 'single_shift' ? num : updated.doubleShiftQuota;
            updated.reducePerson = Math.min(
              updated.doubleShiftQuota,
              Math.max(
                0,
                applyRounding(
                  baseQuota * ((r.reducePct || 0) / 100),
                  activeRound
                )
              )
            );
            updated.remainMp = Math.max(
              0,
              updated.doubleShiftQuota - updated.reducePerson
            );
          } else if (field === 'doubleShiftQuota') {
            const baseQuota =
              activeBasis === 'single_shift' ? r.singleShiftQuota : num;
            updated.reducePerson = Math.min(
              num,
              Math.max(
                0,
                applyRounding(
                  baseQuota * ((r.reducePct || 0) / 100),
                  activeRound
                )
              )
            );
            updated.remainMp = Math.max(0, num - updated.reducePerson);
          } else if (field === 'reducePerson') {
            const cappedPerson = Math.min(r.doubleShiftQuota, num);
            updated.reducePerson = cappedPerson;
            updated.remainMp = Math.max(0, r.doubleShiftQuota - cappedPerson);
            const baseQuota =
              activeBasis === 'single_shift'
                ? r.singleShiftQuota
                : r.doubleShiftQuota;
            updated.reducePct =
              baseQuota > 0
                ? Number(((cappedPerson / baseQuota) * 100).toFixed(2))
                : 0;
          } else if (field === 'remainMp') {
            const cappedRemain = Math.min(r.doubleShiftQuota, num);
            updated.remainMp = cappedRemain;
            updated.reducePerson = Math.max(
              0,
              r.doubleShiftQuota - cappedRemain
            );
            const baseQuota =
              activeBasis === 'single_shift'
                ? r.singleShiftQuota
                : r.doubleShiftQuota;
            updated.reducePct =
              baseQuota > 0
                ? Number(((updated.reducePerson / baseQuota) * 100).toFixed(2))
                : 0;
          }
          return updated;
        }),
      };
    });
  };

  const handleTargetTotalPersonChange = (targetTotalStr: string) => {
    const targetTotal = Math.max(0, parseInt(targetTotalStr, 10) || 0);
    const basisSum =
      formulaBasis === 'single_shift'
        ? currentMetrics.calc.singleShiftQuota
        : currentMetrics.calc.doubleShiftQuota;
    if (basisSum <= 0) return;

    const impliedPct = (targetTotal / basisSum) * 100;
    handleGlobalLinkedPctChange(Number(impliedPct.toFixed(2)));
  };

  // Signature & Metadata Handlers
  const handleSaveSignature = (rowId: string, signature: SignatureRecord) => {
    updateActiveScenario((sc) => ({
      ...sc,
      rows: sc.rows.map((r) => (r.id === rowId ? { ...r, signature } : r)),
    }));
  };

  const handleBatchSignAllDemo = () => {
    const today = new Date().toISOString().split('T')[0];
    updateActiveScenario((sc) => ({
      ...sc,
      rows: sc.rows.map((r) => ({
        ...r,
        signature: {
          ...r.signature,
          signerName:
            r.signature.signerName ||
            (langMode === 'cn'
              ? `部门主管 (${r.deptCn})`
              : langMode === 'en'
              ? `Line Supervisor (${r.deptEn.split(' ')[0]})`
              : `หัวหน้าแผนก (${r.deptCn})`),
          signedAt: r.signature.signedAt || today,
          status: 'acknowledged',
        },
      })),
    }));
  };

  const handleClearAllSignatures = () => {
    updateActiveScenario((sc) => ({
      ...sc,
      rows: sc.rows.map((r) => ({
        ...r,
        signature: {
          ...r.signature,
          signerName: '',
          signedAt: '',
          signatureDataUrl: undefined,
          remark: '',
          status: 'pending',
        },
      })),
    }));
  };

  const handleRowTextChange = (
    rowId: string,
    field:
      | 'deptCn'
      | 'deptEn'
      | 'deptTh'
      | 'categoryCn'
      | 'categoryEn'
      | 'categoryTh',
    value: string
  ) => {
    updateActiveScenario((sc) => ({
      ...sc,
      rows: sc.rows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    }));
  };

  const handleDocConfigChange = <K extends keyof DocumentConfig>(
    key: K,
    value: DocumentConfig[K]
  ) => {
    updateActiveScenario((sc) => ({
      ...sc,
      docConfig: {
        ...sc.docConfig,
        [key]: value,
      },
    }));
  };

  const handleSignatoryChange = (
    role: 'preparedBy' | 'reviewedBy' | 'approvedBy',
    field: 'name' | 'title' | 'date' | 'signed',
    value: string | boolean
  ) => {
    updateActiveScenario((sc) => ({
      ...sc,
      docConfig: {
        ...sc.docConfig,
        [role]: {
          ...sc.docConfig[role],
          [field]: value,
        },
      },
    }));
  };

  const handleCopyFromScenario = (
    sourceId: 'scenario-1' | 'scenario-2' | 'scenario-3'
  ) => {
    const source = scenarios.find((s) => s.id === sourceId);
    if (!source || source.id === activeScenarioId) return;
    updateActiveScenario((sc) => ({
      ...sc,
      linkedGlobalPct: source.linkedGlobalPct,
      rows: source.rows.map((r) => ({
        ...r,
        signature: { ...r.signature },
      })),
    }));
    setSaveFeedback(
      `คัดลอกข้อมูลและสูตรจาก ${source.code} มายัง ${activeScenario.code} แล้ว`
    );
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleAddRow = (group: 'direct' | 'other') => {
    const newId = `custom-${Date.now()}`;
    const pct = activeScenario.linkedGlobalPct || 10;
    const doubleQ = 100;
    const redP = applyRounding(doubleQ * (pct / 100), roundingMethod);
    const newRow: ManpowerRow = {
      id: newId,
      categoryCn: group === 'direct' ? '一线' : '其它',
      categoryEn: group === 'direct' ? 'Direct Labor' : 'Other',
      categoryTh: group === 'direct' ? 'สายการผลิตโดยตรง' : 'อื่นๆ',
      categoryGroup: group,
      deptCn: '新增产线/部门',
      deptEn: 'New Production Line / Dept',
      deptTh: 'สายการผลิต / แผนกใหม่',
      singleShiftQuota: 50,
      doubleShiftQuota: doubleQ,
      reducePct: pct,
      reducePerson: redP,
      remainMp: doubleQ - redP,
      signature: {
        signerName: '',
        signerTitle: 'Supervisor',
        signedAt: '',
        status: 'pending',
      },
    };
    updateActiveScenario((sc) => ({
      ...sc,
      rows: [...sc.rows, newRow],
    }));
  };

  const handleDeleteRow = (rowId: string) => {
    updateActiveScenario((sc) => ({
      ...sc,
      rows: sc.rows.filter((r) => r.id !== rowId),
    }));
  };

  const handleResetAllScenarios = () => {
    setScenarios(INITIAL_SCENARIOS);
    setYearlyStats(INITIAL_YEARLY_STATS);
    setActiveScenarioId('scenario-1');
    setSearchQuery('');
    setCategoryFilter('all');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SCENARIOS));
    localStorage.setItem(YEARLY_STATS_KEY, JSON.stringify(INITIAL_YEARLY_STATS));
    setSaveFeedback(
      'รีเซ็ตข้อมูลทั้ง 3 สถานการณ์และสถิติรายเดือนกลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว'
    );
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Export JSON backup
  const handleExportJSONBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: '5.0',
      langMode,
      styleMode,
      scenarios,
      yearlyStats,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Manpower_Plan_2026_All_3_Scenarios_Backup.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportJSONBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        if (
          parsed &&
          Array.isArray(parsed.scenarios) &&
          parsed.scenarios.length === 3
        ) {
          setScenarios(parsed.scenarios);
          if (Array.isArray(parsed.yearlyStats)) {
            setYearlyStats(parsed.yearlyStats);
          }
          if (parsed.langMode) setLangMode(parsed.langMode);
          if (parsed.styleMode) setStyleMode(parsed.styleMode);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.scenarios));
          setSaveFeedback('นำเข้าและบันทึกข้อมูลทั้ง 3 แผนจากไฟล์สำเร็จแล้ว');
          setTimeout(() => setSaveFeedback(null), 3500);
        }
      } catch {
        setSaveFeedback('ไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ .json ที่ส่งอกจากระบบนี้');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export CSV
  const handleExportCSV = () => {
    const s1 = scenarios[0];
    const s2 = scenarios[1];
    const s3 = scenarios[2];

    const headers = [
      'Category (CN)',
      'Category (EN)',
      'Category (TH)',
      'Department (CN)',
      'Department (EN)',
      'Department (TH)',
      'Single Shift (单班定编)',
      'Double Shift (双班定编)',
      `[${activeScenario.code}] Linked Reduce %`,
      `[${activeScenario.code}] Reduce Person`,
      `[${activeScenario.code}] Remain MP`,
      'Scenario 1 %',
      'Scenario 1 Reduce',
      'Scenario 1 Remain',
      'Scenario 2 %',
      'Scenario 2 Reduce',
      'Scenario 2 Remain',
      'Scenario 3 %',
      'Scenario 3 Reduce',
      'Scenario 3 Remain',
      'Sign Status',
      'Signer Name',
      'Signed Date',
    ];

    const csvRows = rows.map((r, idx) => {
      const r1 = s1.rows[idx] || r;
      const r2 = s2.rows[idx] || r;
      const r3 = s3.rows[idx] || r;

      return [
        `"${r.categoryCn}"`,
        `"${r.categoryEn}"`,
        `"${r.categoryTh}"`,
        `"${r.deptCn}"`,
        `"${r.deptEn}"`,
        `"${r.deptTh}"`,
        r.singleShiftQuota,
        r.doubleShiftQuota,
        `${r.reducePct ?? 0}%`,
        r.reducePerson,
        r.remainMp,
        `${r1.reducePct ?? 0}%`,
        r1.reducePerson,
        r1.remainMp,
        `${r2.reducePct ?? 0}%`,
        r2.reducePerson,
        r2.remainMp,
        `${r3.reducePct ?? 0}%`,
        r3.reducePerson,
        r3.remainMp,
        r.signature.status === 'acknowledged' ? 'Signed' : 'Pending',
        `"${r.signature.signerName}"`,
        `"${r.signature.signedAt}"`,
      ].join(',');
    });

    const m1 = computeScenarioMetrics(s1);
    const m2 = computeScenarioMetrics(s2);
    const m3 = computeScenarioMetrics(s3);

    csvRows.push(
      [
        '"/"',
        '"Total"',
        '"รวมทั้งสิ้น"',
        '"总计"',
        '"Total"',
        '"รวมทั้งสิ้น"',
        currentMetrics.displaySingle,
        currentMetrics.displayDouble,
        `-${currentMetrics.pct}%`,
        currentMetrics.reducePerson,
        currentMetrics.remainMp,
        `-${m1.pct}%`,
        m1.reducePerson,
        m1.remainMp,
        `-${m2.pct}%`,
        m2.reducePerson,
        m2.remainMp,
        `-${m3.pct}%`,
        m3.reducePerson,
        m3.remainMp,
        `"${currentMetrics.signed}/${rows.length} Signed"`,
        '""',
        '""',
      ].join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${docConfig.docNumber}_${activeScenario.id}_Manpower_Plan_2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Dynamic Helpers for Language Rendering in Document
  const renderScenarioTitle = (sc: ScenarioPlan) => {
    if (langMode === 'th') return sc.nameTh;
    if (langMode === 'cn') return sc.nameCn || sc.nameTh;
    if (langMode === 'en') return sc.nameEn;
    if (langMode === 'cn_en') return `${sc.nameCn || sc.nameTh} · ${sc.nameEn}`;
    return sc.nameTh;
  };

  const renderPlantHeader = () => {
    if (langMode === 'th') {
      return `${docConfig.plantNameTh || docConfig.plantNameEn} · ${
        docConfig.departmentScopeTh || docConfig.departmentScopeEn
      }`;
    }
    if (langMode === 'cn') {
      return `${docConfig.plantNameCn || '制造运营事业部'} · ${
        docConfig.departmentScopeCn || '一线生产及辅助部门'
      }`;
    }
    if (langMode === 'en') {
      return `${docConfig.plantNameEn} · ${docConfig.departmentScopeEn}`;
    }
    if (langMode === 'cn_en') {
      return `${docConfig.plantNameCn || '制造运营事业部'} (${
        docConfig.plantNameEn
      })`;
    }
    return `${docConfig.plantNameTh || docConfig.plantNameEn} · ${
      docConfig.departmentScopeCn || ''
    } ${docConfig.departmentScopeEn}`;
  };

  const renderMainDocTitle = () => {
    if (langMode === 'th') return docConfig.documentTitleTh;
    if (langMode === 'cn')
      return docConfig.documentTitleCn || '2026年各部门定编及人力精简确认计划表';
    if (langMode === 'en')
      return (
        docConfig.documentTitleEn ||
        '2026 Workforce Quota & Manpower Reduction Acknowledgment Plan'
      );
    if (langMode === 'cn_en')
      return docConfig.documentTitleCn || '2026年各部门定编及人力精简确认计划表';
    return docConfig.documentTitleTh;
  };

  const renderSubDocTitle = () => {
    if (langMode === 'th')
      return 'เอกสารบันทึกข้อตกลงการบริหารอัตรากำลังคนประจำปีงบประมาณ 2026';
    if (langMode === 'cn')
      return `方案版本：${activeScenario.nameCn || activeScenario.code}`;
    if (langMode === 'en') return activeScenario.nameEn;
    if (langMode === 'cn_en')
      return (
        docConfig.documentTitleEn ||
        '2026 Workforce Quota & Manpower Reduction Acknowledgment Plan'
      );
    return `${
      docConfig.documentTitleCn || '2026年各部门定编及人力精简确认表'
    } · ${
      docConfig.documentTitleEn ||
      '2026 Workforce Quota & Manpower Reduction Acknowledgment Plan'
    }`;
  };

  // Dynamic Table Theme Classes based on `styleMode`
  const tableStyle = useMemo(() => {
    if (styleMode === 'executive_minimal') {
      return {
        sheetContainer:
          'bg-white border border-slate-200 rounded-2xl shadow-xs p-8 sm:p-12 print-sheet space-y-8',
        headerBorder: 'border-b border-slate-300 pb-6',
        tableBorder: 'w-full border-collapse text-xs sm:text-sm',
        theadRow1: 'bg-slate-900 text-white',
        theadRow2: 'bg-slate-800 text-slate-200 text-xs',
        thCell: 'border-b border-slate-700 px-3 py-3 text-center font-semibold',
        tdCell: 'border-b border-slate-200 px-3 py-3 text-center',
        totalRow: 'bg-slate-100 border-t-2 border-slate-900 font-bold text-slate-900',
        totalReduceCell: 'bg-amber-100 text-amber-950 font-bold',
        otherDeptCell: 'bg-slate-100 text-slate-900 font-medium',
      };
    }
    if (styleMode === 'iso_formal') {
      return {
        sheetContainer:
          'bg-white border-2 border-slate-950 rounded-none p-6 sm:p-10 print-sheet space-y-5',
        headerBorder: 'border-b-2 border-slate-950 pb-4',
        tableBorder:
          'w-full border-collapse border-2 border-slate-950 text-xs sm:text-sm',
        theadRow1: 'bg-slate-200 text-slate-950',
        theadRow2: 'bg-slate-100 text-slate-900 text-xs',
        thCell:
          'border border-slate-950 px-3 py-2 text-center font-bold text-slate-950',
        tdCell: 'border border-slate-950 px-3 py-2 text-center',
        totalRow: 'bg-slate-200 font-bold text-slate-950',
        totalReduceCell:
          'bg-slate-300 text-slate-950 font-extrabold underline decoration-2',
        otherDeptCell: 'bg-slate-100 text-slate-950 font-medium',
      };
    }
    if (styleMode === 'modern_cards') {
      return {
        sheetContainer:
          'bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 print-sheet space-y-6',
        headerBorder: 'border-b border-slate-200 pb-5',
        tableBorder:
          'w-full border-collapse border border-slate-200 rounded-xl overflow-hidden text-xs sm:text-sm',
        theadRow1: 'bg-[#0F172A] text-white',
        theadRow2: 'bg-[#1E293B] text-slate-200 text-xs',
        thCell: 'border border-slate-700 px-3 py-2.5 text-center font-semibold',
        tdCell: 'border border-slate-200 px-3 py-2.5 text-center',
        totalRow: 'bg-slate-900 text-white font-bold',
        totalReduceCell: 'bg-amber-400 text-slate-950 font-bold',
        otherDeptCell: 'bg-sky-50 text-sky-950 font-medium',
      };
    }
    // Default: corporate_navy (Matches original blue industrial look + executive polish)
    return {
      sheetContainer:
        'bg-white border border-slate-300 rounded-xl shadow-xs p-6 sm:p-10 print-sheet space-y-6',
      headerBorder: 'border-b-2 border-slate-900 pb-5',
      tableBorder:
        'w-full border-collapse border border-slate-900 text-xs sm:text-sm',
      theadRow1: 'bg-[#0B5394] text-white',
      theadRow2: 'bg-[#0F62AC] text-white text-xs',
      thCell: 'border border-slate-800 px-3 py-2.5 text-center font-semibold',
      tdCell: 'border border-slate-800 px-3 py-2 text-center',
      totalRow: 'bg-slate-100/90 font-bold text-slate-900',
      totalReduceCell: 'bg-[#FFFF00] text-slate-950 font-bold',
      otherDeptCell: 'bg-[#00B0F0] text-slate-950 font-medium',
    };
  }, [styleMode]);

  // Should we show 2 department columns (CN | EN/TH) or 1 unified department column?
  const hasSeparateCnColumn =
    langMode === 'trilingual' || langMode === 'cn_en';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Strictly 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200 no-print sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#document"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('document');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Manpower Plan 2026
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveView('document')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeView === 'document'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.navDocument}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('compare')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeView === 'compare'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.navCompare}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('trends')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeView === 'trends'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.navTrends}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('analytics')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeView === 'analytics'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.navAnalytics}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('audit')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeView === 'audit'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.navAudit}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.printBtn}</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Save Toast Notification if active */}
        {saveFeedback && (
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between shadow-md no-print">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveFeedback(null)}
              className="text-slate-400 hover:text-white text-xs ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* LANGUAGE MODE & PROFESSIONAL STYLE THEME BAR (โหมดภาษา ไทย·จีน·อังกฤษ & โหมดรูปแบบมืออาชีพ) */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 no-print">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            {/* Left: 5 Language Modes (TH, CN, EN, CN+EN, 3 ภาษา) */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Globe className="w-4 h-4 text-slate-700" />
                <span>
                  โหมดภาษาของเอกสารและระบบ (Language Mode: ไทย · จีน · อังกฤษ)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    { id: 'th', label: '🇹🇭 ภาษาไทย (TH)' },
                    { id: 'cn', label: '🇨🇳 ภาษาจีน (中文)' },
                    { id: 'en', label: '🇬🇧 อังกฤษ (EN)' },
                    { id: 'cn_en', label: '🇨🇳+🇬🇧 จีน-อังกฤษ (ตามภาพ)' },
                    { id: 'trilingual', label: '🌐 3 ภาษา (ไทย·จีน·อังกฤษ)' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLangMode(item.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      langMode === item.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: 4 Professional Document Style Modes */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <LayoutTemplate className="w-4 h-4 text-slate-700" />
                <span>
                  โหมดเปลี่ยนรูปแบบเอกสารมืออาชีพ (Professional Document Theme)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                {(
                  [
                    {
                      id: 'corporate_navy',
                      label: '1. Corporate Navy (มาตรฐานโรงงาน)',
                    },
                    {
                      id: 'executive_minimal',
                      label: '2. Executive Minimal (ผู้บริหาร)',
                    },
                    {
                      id: 'iso_formal',
                      label: '3. ISO 9001 Form (เอกสารควบคุม)',
                    },
                    {
                      id: 'modern_cards',
                      label: '4. Modern Matrix (พรีเมียมกราฟิก)',
                    },
                  ] as const
                ).map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setStyleMode(style.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      styleMode === style.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SCENARIO 1, 2, 3 SELECTOR SWITCHER BAR */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 no-print space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">
                {t.scenarioHeader}
              </h2>
              <span className="text-xs text-slate-500">{t.scenarioSub}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveView('trends')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeView === 'trends'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>📈 {t.navTrends}</span>
              </button>
              <span className="text-xs text-slate-500 font-mono-tabular">
                {t.lastSaved}: {lastSavedTime}
              </span>
              <button
                type="button"
                onClick={handleManualSaveAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t.saveAllBtn}</span>
              </button>
            </div>
          </div>

          {/* 3 Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {allScenarioMetrics.map(({ scenario, metrics }) => {
              const isSelected = scenario.id === activeScenarioId;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => {
                    setActiveScenarioId(scenario.id);
                    if (activeView === 'compare') {
                      setActiveView('document');
                    }
                  }}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 text-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-mono-tabular font-bold tracking-tight ${
                          isSelected ? 'text-amber-300' : 'text-slate-500'
                        }`}
                      >
                        {scenario.code} · -{scenario.linkedGlobalPct ?? metrics.pct}%
                      </span>
                      <span
                        className={`text-xs font-mono-tabular font-semibold ${
                          isSelected ? 'text-emerald-300' : 'text-slate-600'
                        }`}
                      >
                        {t.signedCountLabel} {metrics.signed}/{metrics.totalDepts}{' '}
                        {t.deptsUnit}
                      </span>
                    </div>
                    <div className="text-sm font-bold mt-1 line-clamp-1">
                      {renderScenarioTitle(scenario)}
                    </div>
                  </div>

                  <div
                    className={`pt-2 border-t flex items-center justify-between text-xs font-mono-tabular ${
                      isSelected ? 'border-slate-700' : 'border-slate-200'
                    }`}
                  >
                    <span>
                      {t.reduceLabel}:{' '}
                      <strong
                        className={
                          isSelected ? 'text-amber-300' : 'text-amber-700'
                        }
                      >
                        -{metrics.reducePerson.toLocaleString()} {t.personUnit} (-
                        {metrics.pct}%)
                      </strong>
                    </span>
                    <span>
                      {t.remainLabel}:{' '}
                      <strong
                        className={
                          isSelected ? 'text-emerald-300' : 'text-emerald-700'
                        }
                      >
                        {metrics.remainMp.toLocaleString()} {t.personUnit}
                      </strong>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* LIVE LINKED PERCENTAGE FORMULA BAR */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 no-print space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Link2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {t.formulaBarTitle} ({activeScenario.code}):
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-300 rounded-lg px-3 py-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  {t.globalPctLabel}
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={activeScenario.linkedGlobalPct ?? 9.69}
                  onChange={(e) =>
                    handleGlobalLinkedPctChange(parseFloat(e.target.value) || 0)
                  }
                  className="w-20 px-2 py-0.5 text-sm font-mono-tabular font-bold text-amber-900 bg-white border border-amber-400 rounded text-center focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-amber-900">%</span>
              </div>

              {/* Range Slider */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={0.1}
                  value={Math.min(50, activeScenario.linkedGlobalPct ?? 9.69)}
                  onChange={(e) =>
                    handleGlobalLinkedPctChange(parseFloat(e.target.value) || 0)
                  }
                  className="w-28 sm:w-36 accent-slate-900 cursor-pointer"
                />
              </div>

              {/* Quick % Presets */}
              <div className="flex items-center gap-1">
                {[
                  { label: '9.69%', val: 9.69 },
                  { label: '10%', val: 10 },
                  { label: '12%', val: 12 },
                  { label: '15%', val: 15 },
                  { label: '20%', val: 20 },
                  { label: '25%', val: 25 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleGlobalLinkedPctChange(preset.val)}
                    className={`px-2 py-1 text-[11px] font-mono-tabular font-semibold rounded border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      Math.abs(
                        (activeScenario.linkedGlobalPct ?? 0) - preset.val
                      ) < 0.05
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal-Seek by Total Person & Basis / Rounding */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-600">{t.orTargetPerson}</span>
                <input
                  type="number"
                  min={0}
                  max={currentMetrics.calc.doubleShiftQuota}
                  value={currentMetrics.reducePerson}
                  onChange={(e) => handleTargetTotalPersonChange(e.target.value)}
                  className="w-16 px-1.5 py-0.5 text-xs font-mono-tabular font-bold text-slate-900 bg-white border border-slate-300 rounded text-center"
                />
                <span className="text-slate-600">{t.personUnit}</span>
              </div>

              <select
                value={formulaBasis}
                onChange={(e) => {
                  const newBasis = e.target.value as
                    | 'double_shift'
                    | 'single_shift';
                  handleGlobalLinkedPctChange(
                    activeScenario.linkedGlobalPct ?? 9.69,
                    roundingMethod,
                    newBasis
                  );
                }}
                className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
              >
                <option value="double_shift">{t.basisDouble}</option>
                <option value="single_shift">{t.basisSingle}</option>
              </select>

              <select
                value={roundingMethod}
                onChange={(e) => {
                  const newRound = e.target.value as RoundingMethod;
                  handleGlobalLinkedPctChange(
                    activeScenario.linkedGlobalPct ?? 9.69,
                    newRound,
                    formulaBasis
                  );
                }}
                className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
              >
                <option value="round">{t.roundStd}</option>
                <option value="floor">{t.roundFloor}</option>
                <option value="ceil">{t.roundCeil}</option>
              </select>
            </div>
          </div>
        </section>

        {/* Secondary Toolbar (Search, Edit Mode, Total Mode, Export/Import) */}
        <section className="bg-white border border-slate-200 rounded-xl p-3.5 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 w-48 sm:w-56"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.filterAll} ({rows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('direct')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === 'direct'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Direct 一线
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('other')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === 'other'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Other 其它
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isEditMode
                    ? 'border-amber-600 bg-amber-500 text-slate-950 shadow-xs'
                    : 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isEditMode ? t.editAllOn : t.editAllOff}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  updateActiveScenario((sc) => ({
                    ...sc,
                    totalMode:
                      sc.totalMode === 'image_exact' ? 'auto_sum' : 'image_exact',
                  }))
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-slate-600" />
                <span>
                  Total:{' '}
                  {totalMode === 'image_exact'
                    ? `${activeScenario.customExactTotals.singleShiftQuota.toLocaleString()}/${activeScenario.customExactTotals.doubleShiftQuota.toLocaleString()}`
                    : `${currentMetrics.calc.singleShiftQuota.toLocaleString()}/${currentMetrics.calc.doubleShiftQuota.toLocaleString()}`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel (CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSONBackup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSONBackup}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleResetAllScenarios}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* VIEW 1: OFFICIAL ACKNOWLEDGMENT DOCUMENT */}
        {activeView === 'document' && (
          <div className={tableStyle.sheetContainer}>
            {/* ISO 9001 Controlled Document Boxed Header when styleMode === 'iso_formal' */}
            {styleMode === 'iso_formal' ? (
              <div className="border-2 border-slate-950">
                <div className="grid grid-cols-12 divide-x-2 divide-slate-950">
                  <div className="col-span-3 p-3 flex flex-col justify-center bg-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-950">
                      STANDARD FORM · ISO 9001
                    </div>
                    <div className="text-[11px] text-slate-700 mt-1">
                      {renderPlantHeader()}
                    </div>
                  </div>
                  <div className="col-span-6 p-3 flex flex-col items-center justify-center text-center">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-950">
                      {renderMainDocTitle()}
                    </h1>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">
                      {renderSubDocTitle()}
                    </p>
                  </div>
                  <div className="col-span-3 text-xs divide-y divide-slate-950 font-mono-tabular">
                    <div className="px-2.5 py-1 flex justify-between">
                      <span className="font-semibold">{t.docNo}:</span>
                      <span>{docConfig.docNumber}</span>
                    </div>
                    <div className="px-2.5 py-1 flex justify-between">
                      <span className="font-semibold">{t.effectiveDate}:</span>
                      <span>{docConfig.effectiveDate}</span>
                    </div>
                    <div className="px-2.5 py-1 flex justify-between">
                      <span className="font-semibold">{t.fiscalYear}:</span>
                      <span>{docConfig.fiscalYear}</span>
                    </div>
                    <div className="px-2.5 py-1 flex justify-between">
                      <span className="font-semibold">{t.revision}:</span>
                      <span>{docConfig.revision}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Corporate Navy / Executive Minimal / Modern Cards Header */
              <div
                className={`${tableStyle.headerBorder} flex flex-col lg:flex-row lg:items-end justify-between gap-4`}
              >
                <div className="flex-1 space-y-1">
                  {isEditMode ? (
                    <div className="space-y-2 max-w-2xl">
                      <input
                        type="text"
                        value={docConfig.documentTitleTh}
                        onChange={(e) =>
                          handleDocConfigChange('documentTitleTh', e.target.value)
                        }
                        placeholder="หัวข้อเอกสาร (ภาษาไทย)"
                        className="w-full px-2.5 py-1.5 text-sm font-bold border border-slate-300 rounded"
                      />
                      <input
                        type="text"
                        value={docConfig.documentTitleCn}
                        onChange={(e) =>
                          handleDocConfigChange('documentTitleCn', e.target.value)
                        }
                        placeholder="หัวข้อเอกสาร (ภาษาจีน 中文)"
                        className="w-full px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded"
                      />
                      <input
                        type="text"
                        value={docConfig.documentTitleEn}
                        onChange={(e) =>
                          handleDocConfigChange('documentTitleEn', e.target.value)
                        }
                        placeholder="Document Title (English)"
                        className="w-full px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>{renderPlantHeader()}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-900">
                          {activeScenario.code}
                        </span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                        {renderMainDocTitle()}
                      </h1>
                      <p className="text-sm font-semibold text-slate-600 mt-0.5">
                        {renderSubDocTitle()}
                      </p>
                    </>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs border border-slate-300 rounded-lg p-3 bg-slate-50/70 shrink-0 min-w-[320px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">{t.docNo}:</span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={docConfig.docNumber}
                        onChange={(e) =>
                          handleDocConfigChange('docNumber', e.target.value)
                        }
                        className="w-28 px-1.5 py-0.5 text-xs font-mono-tabular border border-slate-300 rounded bg-white text-right"
                      />
                    ) : (
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {docConfig.docNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">{t.effectiveDate}:</span>
                    {isEditMode ? (
                      <input
                        type="date"
                        value={docConfig.effectiveDate}
                        onChange={(e) =>
                          handleDocConfigChange('effectiveDate', e.target.value)
                        }
                        className="w-28 px-1.5 py-0.5 text-xs font-mono-tabular border border-slate-300 rounded bg-white"
                      />
                    ) : (
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {docConfig.effectiveDate}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">{t.fiscalYear}:</span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={docConfig.fiscalYear}
                        onChange={(e) =>
                          handleDocConfigChange('fiscalYear', e.target.value)
                        }
                        className="w-28 px-1.5 py-0.5 text-xs font-mono-tabular border border-slate-300 rounded bg-white text-right"
                      />
                    ) : (
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {docConfig.fiscalYear}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">{t.revision}:</span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={docConfig.revision}
                        onChange={(e) =>
                          handleDocConfigChange('revision', e.target.value)
                        }
                        className="w-28 px-1.5 py-0.5 text-xs font-mono-tabular border border-slate-300 rounded bg-white text-right"
                      />
                    ) : (
                      <span className="font-mono-tabular font-semibold text-slate-900">
                        {docConfig.revision}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Action & Formula Instruction Bar (Hidden in Print) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs no-print">
              <div className="flex items-center gap-2 text-slate-600">
                <Percent className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  <strong>{renderScenarioTitle(activeScenario)}</strong> ·
                  คลิกแก้ช่อง <strong>Ratio %</strong> หรือ{' '}
                  <strong>Person</strong> ในตารางเพื่อคำนวณอัตโนมัติ
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBatchSignAllDemo}
                  className="text-xs font-semibold text-slate-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.batchSignDemo}
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={handleClearAllSignatures}
                  className="text-xs text-slate-500 hover:text-red-600 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.clearAllSign}
                </button>
              </div>
            </div>

            {/* Official Manpower Reduction Table */}
            <div className="overflow-x-auto">
              <table className={tableStyle.tableBorder}>
                <thead>
                  <tr className={tableStyle.theadRow1}>
                    <th rowSpan={2} className={`${tableStyle.thCell} w-28`}>
                      {langMode === 'th' && <div>ประเภท</div>}
                      {langMode === 'cn' && <div>分类</div>}
                      {langMode === 'en' && <div>Category</div>}
                      {(langMode === 'cn_en' || langMode === 'trilingual') && (
                        <>
                          <div>分类</div>
                          <div className="text-[11px] font-normal opacity-85 mt-0.5">
                            {langMode === 'trilingual'
                              ? 'ประเภท / Category'
                              : 'Category'}
                          </div>
                        </>
                      )}
                    </th>
                    <th
                      rowSpan={2}
                      colSpan={hasSeparateCnColumn ? 2 : 1}
                      className={tableStyle.thCell}
                    >
                      {langMode === 'th' && (
                        <div>แผนก / สายการผลิต (Department)</div>
                      )}
                      {langMode === 'cn' && <div>部门名称</div>}
                      {langMode === 'en' && (
                        <div>Department / Production Line</div>
                      )}
                      {(langMode === 'cn_en' || langMode === 'trilingual') && (
                        <>
                          <div>部门 · Department</div>
                          {langMode === 'trilingual' && (
                            <div className="text-[11px] font-normal opacity-85 mt-0.5">
                              สายการผลิตและหน่วยงานรับผิดชอบ
                            </div>
                          )}
                        </>
                      )}
                    </th>
                    <th colSpan={2} className={tableStyle.thCell}>
                      {langMode === 'th' && 'อัตรากำลังปี 2026 (Quota)'}
                      {langMode === 'cn' && '(26年) 核定定编'}
                      {langMode === 'en' && '2026 Approved Quota'}
                      {langMode === 'cn_en' && '(26年)'}
                      {langMode === 'trilingual' && '(26年) อัตรากำลังปี 2026'}
                    </th>
                    <th
                      colSpan={showPercentageCol ? 4 : 3}
                      className={tableStyle.thCell}
                    >
                      {langMode === 'th' &&
                        'แผนปรับลดและรับทราบอัตรากำลัง (Reduce Manpower)'}
                      {langMode === 'cn' && '人力精简确认计划 (Reduce Manpower)'}
                      {langMode === 'en' && 'Reduce Manpower Plan'}
                      {langMode === 'cn_en' && 'Reduce Manpower'}
                      {langMode === 'trilingual' &&
                        'Reduce Manpower · แผนปรับลดกำลังคน'}
                    </th>
                    {isEditMode && (
                      <th
                        rowSpan={2}
                        className={`${tableStyle.thCell} w-12 no-print`}
                      >
                        ลบ
                      </th>
                    )}
                  </tr>

                  <tr className={tableStyle.theadRow2}>
                    {/* Single Shift Header */}
                    <th className={`${tableStyle.thCell} w-28`}>
                      {langMode === 'th' && <div>อัตรากะเดียว</div>}
                      {langMode === 'cn' && <div>单班定编</div>}
                      {langMode === 'en' && <div>Single Shift</div>}
                      {(langMode === 'cn_en' || langMode === 'trilingual') && (
                        <>
                          <div>单班定编</div>
                          <div className="text-[10px] font-normal opacity-85">
                            {langMode === 'trilingual'
                              ? 'กะเดียว (Single)'
                              : 'Single Shift'}
                          </div>
                        </>
                      )}
                    </th>

                    {/* Double Shift Header */}
                    <th className={`${tableStyle.thCell} w-28`}>
                      {langMode === 'th' && <div>อัตราสองกะ</div>}
                      {langMode === 'cn' && <div>双班定编</div>}
                      {langMode === 'en' && <div>Double Shift</div>}
                      {(langMode === 'cn_en' || langMode === 'trilingual') && (
                        <>
                          <div>双班定编</div>
                          <div className="text-[10px] font-normal opacity-85">
                            {langMode === 'trilingual'
                              ? 'สองกะ (Double)'
                              : 'Double Shift'}
                          </div>
                        </>
                      )}
                    </th>

                    {/* Ratio % Header */}
                    {showPercentageCol && (
                      <th className={`${tableStyle.thCell} w-28`}>
                        {langMode === 'th' && <div>สัดส่วนลด (%)</div>}
                        {langMode === 'cn' && <div>精简比例 (%)</div>}
                        {langMode === 'en' && <div>Reduce %</div>}
                        {(langMode === 'cn_en' ||
                          langMode === 'trilingual') && (
                          <>
                            <div>Ratio %</div>
                            <div className="text-[10px] font-normal opacity-85">
                              {langMode === 'trilingual'
                                ? 'สัดส่วนลด (%)'
                                : 'Reduce %'}
                            </div>
                          </>
                        )}
                      </th>
                    )}

                    {/* Reduce Person Header */}
                    <th className={`${tableStyle.thCell} w-28`}>
                      {langMode === 'th' && <div>จำนวนที่ลด (คน)</div>}
                      {langMode === 'cn' && <div>精简人数 (Person)</div>}
                      {langMode === 'en' && <div>Person</div>}
                      {(langMode === 'cn_en' || langMode === 'trilingual') && (
                        <>
                          <div>Person</div>
                          {langMode === 'trilingual' && (
                            <div className="text-[10px] font-normal opacity-85">
                              จำนวนที่ลด (คน)
                            </div>
                          )}
                        </>
                      )}
                    </th>

                    {/* Remain MP Header */}
                    <th className={`${tableStyle.thCell} w-28`}>
                      {langMode === 'th' && <div>คงเหลือสุทธิ (คน)</div>}
                      {langMode === 'cn' && <div>保留人力 (Remain)</div>}
                      {langMode === 'en' && <div>Remain MP</div>}
                      {(langMode === 'cn_en' || langMode === 'trilingual') && (
                        <>
                          <div>Remain MP</div>
                          {langMode === 'trilingual' && (
                            <div className="text-[10px] font-normal opacity-85">
                              คงเหลือสุทธิ (คน)
                            </div>
                          )}
                        </>
                      )}
                    </th>

                    {/* Sign Header */}
                    <th className={`${tableStyle.thCell} w-56`}>
                      {langMode === 'th' && <div>ลงชื่อรับทราบ (หัวหน้าแผนก)</div>}
                      {langMode === 'cn' && <div>签字确认 (Sign)</div>}
                      {langMode === 'en' && <div>Sign / Acknowledgment</div>}
                      {(langMode === 'cn_en' || langMode === 'trilingual') && (
                        <>
                          <div>Sign</div>
                          {langMode === 'trilingual' && (
                            <div className="text-[10px] font-normal opacity-85">
                              ลงชื่อรับทราบ (หัวหน้าแผนก)
                            </div>
                          )}
                        </>
                      )}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* Group 1: Direct Labor */}
                  {directRows.map((row, idx) => {
                    const effectivePct =
                      row.reducePct !== undefined
                        ? row.reducePct
                        : row.doubleShiftQuota > 0
                        ? Number(
                            (
                              (row.reducePerson / row.doubleShiftQuota) *
                              100
                            ).toFixed(2)
                          )
                        : 0;

                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/90 transition-colors"
                      >
                        {idx === 0 && (
                          <td
                            rowSpan={directRows.length}
                            className={`${tableStyle.tdCell} align-middle bg-slate-50/60 font-semibold text-slate-900`}
                          >
                            {langMode === 'th' && (
                              <div className="text-xs font-bold">
                                {row.categoryTh}
                              </div>
                            )}
                            {langMode === 'cn' && (
                              <div className="text-sm font-bold">
                                {row.categoryCn}
                              </div>
                            )}
                            {langMode === 'en' && (
                              <div className="text-xs font-bold">
                                {row.categoryEn}
                              </div>
                            )}
                            {(langMode === 'cn_en' ||
                              langMode === 'trilingual') && (
                              <>
                                <div className="text-sm font-bold">
                                  {row.categoryCn}
                                </div>
                                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                                  {row.categoryEn}
                                </div>
                                {langMode === 'trilingual' && (
                                  <div className="text-[11px] font-normal text-slate-500 mt-1">
                                    {row.categoryTh}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        )}

                        {/* Separate Chinese Column when in cn_en or trilingual */}
                        {hasSeparateCnColumn && (
                          <td
                            className={`${tableStyle.tdCell} font-medium text-slate-900 w-48`}
                          >
                            {isEditMode ? (
                              <input
                                type="text"
                                value={row.deptCn}
                                onChange={(e) =>
                                  handleRowTextChange(
                                    row.id,
                                    'deptCn',
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-center bg-white"
                              />
                            ) : (
                              <span>{row.deptCn}</span>
                            )}
                          </td>
                        )}

                        {/* Primary Department Name Column adapted to Language Mode */}
                        <td className={tableStyle.tdCell}>
                          {isEditMode ? (
                            <div className="space-y-1">
                              {!hasSeparateCnColumn && (
                                <input
                                  type="text"
                                  value={row.deptCn}
                                  onChange={(e) =>
                                    handleRowTextChange(
                                      row.id,
                                      'deptCn',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-center bg-white"
                                  placeholder="中文部门名称"
                                />
                              )}
                              <input
                                type="text"
                                value={row.deptEn}
                                onChange={(e) =>
                                  handleRowTextChange(
                                    row.id,
                                    'deptEn',
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-center bg-white"
                                placeholder="English Department Name"
                              />
                              <input
                                type="text"
                                value={row.deptTh}
                                onChange={(e) =>
                                  handleRowTextChange(
                                    row.id,
                                    'deptTh',
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 text-xs border border-slate-300 rounded text-center bg-white"
                                placeholder="ชื่อแผนกภาษาไทย"
                              />
                            </div>
                          ) : (
                            <div>
                              {langMode === 'th' && (
                                <div className="font-semibold text-slate-900">
                                  {row.deptTh}
                                </div>
                              )}
                              {langMode === 'cn' && (
                                <div className="font-semibold text-slate-900">
                                  {row.deptCn}
                                </div>
                              )}
                              {langMode === 'en' && (
                                <div className="font-semibold text-slate-900">
                                  {row.deptEn}
                                </div>
                              )}
                              {langMode === 'cn_en' && (
                                <div className="font-medium text-slate-900">
                                  {row.deptEn}
                                </div>
                              )}
                              {langMode === 'trilingual' && (
                                <>
                                  <div className="font-medium text-slate-900">
                                    {row.deptEn}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {row.deptTh}
                                  </div>
                                </>
                              )}

                              {/* Visual Progress Bar when styleMode === 'modern_cards' */}
                              {styleMode === 'modern_cards' &&
                                row.doubleShiftQuota > 0 && (
                                  <div className="w-48 mx-auto mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden flex no-print">
                                    <div
                                      className="bg-emerald-600 h-full"
                                      style={{
                                        width: `${
                                          (row.remainMp /
                                            row.doubleShiftQuota) *
                                          100
                                        }%`,
                                      }}
                                    />
                                    <div
                                      className="bg-amber-500 h-full"
                                      style={{
                                        width: `${
                                          (row.reducePerson /
                                            row.doubleShiftQuota) *
                                          100
                                        }%`,
                                      }}
                                    />
                                  </div>
                                )}
                            </div>
                          )}
                        </td>

                        {/* Single Shift */}
                        <td
                          className={`${tableStyle.tdCell} font-mono-tabular text-slate-800`}
                        >
                          {isEditMode ? (
                            <input
                              type="number"
                              min={0}
                              value={row.singleShiftQuota}
                              onChange={(e) =>
                                handleRowNumberChange(
                                  row.id,
                                  'singleShiftQuota',
                                  e.target.value
                                )
                              }
                              className="w-20 px-2 py-1 text-center font-mono-tabular border border-slate-300 rounded bg-white"
                            />
                          ) : (
                            row.singleShiftQuota.toLocaleString()
                          )}
                        </td>

                        {/* Double Shift */}
                        <td
                          className={`${tableStyle.tdCell} font-mono-tabular text-slate-900 font-medium`}
                        >
                          {isEditMode ? (
                            <input
                              type="number"
                              min={0}
                              value={row.doubleShiftQuota}
                              onChange={(e) =>
                                handleRowNumberChange(
                                  row.id,
                                  'doubleShiftQuota',
                                  e.target.value
                                )
                              }
                              className="w-20 px-2 py-1 text-center font-mono-tabular border border-slate-300 rounded bg-white"
                            />
                          ) : (
                            row.doubleShiftQuota.toLocaleString()
                          )}
                        </td>

                        {/* Linked Percentage Cell */}
                        {showPercentageCol && (
                          <td
                            className={`${tableStyle.tdCell} font-mono-tabular bg-sky-50/35`}
                          >
                            <div className="inline-flex items-center justify-center gap-0.5 no-print">
                              <span className="text-xs text-slate-400">-</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                value={effectivePct}
                                onChange={(e) =>
                                  handleRowLinkedPctChange(
                                    row.id,
                                    e.target.value
                                  )
                                }
                                className="w-16 px-1.5 py-1 text-center text-xs font-mono-tabular font-semibold text-sky-900 bg-white border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-slate-900"
                              />
                              <span className="text-xs text-slate-600">%</span>
                            </div>
                            <span className="hidden print-only font-mono-tabular text-xs">
                              -{effectivePct.toFixed(2)}%
                            </span>
                          </td>
                        )}

                        {/* Linked Reduce Person Cell */}
                        <td
                          className={`${tableStyle.tdCell} font-mono-tabular font-semibold text-slate-900 bg-amber-50/40`}
                        >
                          <div className="inline-flex items-center justify-center no-print">
                            <input
                              type="number"
                              min={0}
                              max={row.doubleShiftQuota}
                              value={row.reducePerson}
                              onChange={(e) =>
                                handleRowNumberChange(
                                  row.id,
                                  'reducePerson',
                                  e.target.value
                                )
                              }
                              className="w-18 px-1.5 py-1 text-center text-xs sm:text-sm font-mono-tabular font-bold text-slate-900 bg-white border border-amber-400 rounded focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                          </div>
                          <span className="hidden print-only font-mono-tabular font-bold">
                            {row.reducePerson.toLocaleString()}
                          </span>
                        </td>

                        {/* Remain MP Cell */}
                        <td
                          className={`${tableStyle.tdCell} font-mono-tabular font-semibold text-emerald-800`}
                        >
                          {isEditMode ? (
                            <input
                              type="number"
                              min={0}
                              value={row.remainMp}
                              onChange={(e) =>
                                handleRowNumberChange(
                                  row.id,
                                  'remainMp',
                                  e.target.value
                                )
                              }
                              className="w-20 px-2 py-1 text-center font-mono-tabular border border-slate-300 rounded bg-white"
                            />
                          ) : (
                            row.remainMp.toLocaleString()
                          )}
                        </td>

                        {/* Sign Cell */}
                        <td
                          onClick={() => setSigningRow(row)}
                          className={`${tableStyle.tdCell} align-middle cursor-pointer hover:bg-slate-100/80 transition-colors group`}
                        >
                          {row.signature.status === 'acknowledged' ? (
                            <div className="flex flex-col items-center justify-center min-h-[36px]">
                              {row.signature.signatureDataUrl ? (
                                <img
                                  src={row.signature.signatureDataUrl}
                                  alt={`Signature of ${row.signature.signerName}`}
                                  referrerPolicy="no-referrer"
                                  className="h-7 object-contain"
                                />
                              ) : (
                                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                  <span>{row.signature.signerName}</span>
                                </div>
                              )}
                              <div className="text-[10px] text-slate-500 font-mono-tabular leading-tight">
                                {row.signature.signerName} ·{' '}
                                {row.signature.signedAt}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2 min-h-[34px] px-1">
                              <span className="w-full border-b border-dotted border-slate-400 pt-3 text-[10px] text-slate-400 group-hover:text-slate-700 transition-colors">
                                <span className="no-print">
                                  {t.clickToSign} /{' '}
                                </span>
                                Sign ..............................
                              </span>
                            </div>
                          )}
                        </td>

                        {isEditMode && (
                          <td className={`${tableStyle.tdCell} no-print`}>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {/* Group 2: Other (其它) */}
                  {otherRows.map((row, idx) => {
                    const effectivePct =
                      row.reducePct !== undefined ? row.reducePct : 0;

                    return (
                      <tr key={row.id}>
                        {idx === 0 && (
                          <td
                            rowSpan={otherRows.length}
                            className={`${tableStyle.tdCell} align-middle bg-slate-50 font-semibold text-slate-900`}
                          >
                            {langMode === 'th' && <div>{row.categoryTh}</div>}
                            {langMode === 'cn' && <div>{row.categoryCn}</div>}
                            {langMode === 'en' && <div>{row.categoryEn}</div>}
                            {(langMode === 'cn_en' ||
                              langMode === 'trilingual') && (
                              <>
                                <div>{row.categoryCn}</div>
                                {langMode === 'trilingual' && (
                                  <div className="text-[11px] font-normal text-slate-500">
                                    {row.categoryTh} / {row.categoryEn}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        )}

                        {hasSeparateCnColumn && (
                          <td
                            className={`${tableStyle.tdCell} ${tableStyle.otherDeptCell}`}
                          >
                            <span>{row.deptCn}</span>
                          </td>
                        )}

                        <td
                          className={`${tableStyle.tdCell} ${tableStyle.otherDeptCell}`}
                        >
                          {langMode === 'th' && <div>{row.deptTh}</div>}
                          {langMode === 'cn' && <div>{row.deptCn}</div>}
                          {langMode === 'en' && <div>{row.deptEn}</div>}
                          {langMode === 'cn_en' && <div>{row.deptEn}</div>}
                          {langMode === 'trilingual' && (
                            <div>
                              <div>{row.deptEn}</div>
                              <div className="text-xs opacity-80">
                                {row.deptTh}
                              </div>
                            </div>
                          )}
                        </td>

                        <td
                          className={`${tableStyle.tdCell} font-mono-tabular text-slate-800`}
                        >
                          {row.singleShiftQuota.toLocaleString()}
                        </td>
                        <td
                          className={`${tableStyle.tdCell} font-mono-tabular text-slate-800`}
                        >
                          {row.doubleShiftQuota.toLocaleString()}
                        </td>

                        {showPercentageCol && (
                          <td
                            className={`${tableStyle.tdCell} font-mono-tabular text-xs text-slate-500`}
                          >
                            {effectivePct.toFixed(1)}%
                          </td>
                        )}

                        <td
                          className={`${tableStyle.tdCell} font-mono-tabular text-slate-800`}
                        >
                          {row.reducePerson.toLocaleString()}
                        </td>
                        <td
                          className={`${tableStyle.tdCell} font-mono-tabular text-slate-800`}
                        >
                          {row.remainMp.toLocaleString()}
                        </td>
                        <td
                          onClick={() => setSigningRow(row)}
                          className={`${tableStyle.tdCell} align-middle cursor-pointer`}
                        >
                          {row.signature.status === 'acknowledged' ? (
                            <div className="text-xs font-semibold text-slate-900">
                              {row.signature.signerName} (
                              {row.signature.signedAt})
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              -
                            </span>
                          )}
                        </td>
                        {isEditMode && (
                          <td className={`${tableStyle.tdCell} no-print`} />
                        )}
                      </tr>
                    );
                  })}

                  {/* Total Footer Row */}
                  <tr className={tableStyle.totalRow}>
                    <td className={tableStyle.tdCell}>/</td>
                    {hasSeparateCnColumn && (
                      <td className={tableStyle.tdCell}>总计</td>
                    )}
                    <td className={tableStyle.tdCell}>
                      {langMode === 'th' && 'รวมทั้งสิ้น'}
                      {langMode === 'cn' && '总计 (Total)'}
                      {langMode === 'en' && 'Total'}
                      {langMode === 'cn_en' && 'Total'}
                      {langMode === 'trilingual' && 'Total · รวมทั้งสิ้น'}
                    </td>

                    <td
                      className={`${tableStyle.tdCell} font-mono-tabular text-base`}
                    >
                      {currentMetrics.displaySingle.toLocaleString()}
                    </td>

                    <td
                      className={`${tableStyle.tdCell} font-mono-tabular text-base`}
                    >
                      {currentMetrics.displayDouble.toLocaleString()}
                    </td>

                    {showPercentageCol && (
                      <td
                        className={`${tableStyle.tdCell} font-mono-tabular text-xs`}
                      >
                        -{currentMetrics.pct}%
                      </td>
                    )}

                    <td
                      className={`${tableStyle.tdCell} ${tableStyle.totalReduceCell} font-mono-tabular text-base`}
                    >
                      {currentMetrics.reducePerson.toLocaleString()}
                    </td>

                    <td
                      className={`${tableStyle.tdCell} font-mono-tabular text-base`}
                    >
                      {currentMetrics.remainMp.toLocaleString()}
                    </td>

                    <td className={`${tableStyle.tdCell} text-xs font-medium`}>
                      {t.signedCountLabel} {currentMetrics.signed}/{rows.length}{' '}
                      {t.deptsUnit}
                    </td>
                    {isEditMode && (
                      <td className={`${tableStyle.tdCell} no-print`} />
                    )}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Add Row Buttons in Edit Mode */}
            {isEditMode && (
              <div className="flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAddRow('direct')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Direct Labor Row</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddRow('other')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Other Row</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleManualSaveAll}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.saveAllBtn}</span>
                </button>
              </div>
            )}

            {/* Official Acknowledgment Clause adapted to Language Mode */}
            <div className="border border-slate-300 rounded-lg p-4 bg-slate-50/50 space-y-1.5 print-break-inside-avoid">
              <div className="text-xs font-bold text-slate-900">
                {t.ackHeader}
              </div>
              {langMode === 'th' && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {docConfig.acknowledgmentStatementTh}
                </p>
              )}
              {langMode === 'cn' && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {docConfig.acknowledgmentStatementCn}
                </p>
              )}
              {langMode === 'en' && (
                <p className="text-xs text-slate-700 leading-relaxed">
                  {docConfig.acknowledgmentStatementEn}
                </p>
              )}
              {langMode === 'cn_en' && (
                <>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {docConfig.acknowledgmentStatementCn}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {docConfig.acknowledgmentStatementEn}
                  </p>
                </>
              )}
              {langMode === 'trilingual' && (
                <>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {docConfig.acknowledgmentStatementTh}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {docConfig.acknowledgmentStatementCn}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {docConfig.acknowledgmentStatementEn}
                  </p>
                </>
              )}
            </div>

            {/* Executive Sign-Off & Approval Block (3 Columns adapted to Language Mode) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 print-break-inside-avoid">
              {(
                [
                  { key: 'preparedBy', label: t.preparedByLabel },
                  { key: 'reviewedBy', label: t.reviewedByLabel },
                  { key: 'approvedBy', label: t.approvedByLabel },
                ] as const
              ).map(({ key, label }) => {
                const person = docConfig[key];
                const displaySignerName =
                  langMode === 'cn'
                    ? person.nameCn || person.name
                    : langMode === 'en'
                    ? person.nameEn || person.name
                    : person.name;
                const displaySignerTitle =
                  langMode === 'cn'
                    ? person.titleCn || person.title
                    : langMode === 'en'
                    ? person.titleEn || person.title
                    : person.title;

                return (
                  <div
                    key={key}
                    className={`border ${
                      styleMode === 'iso_formal'
                        ? 'border-slate-950 rounded-none'
                        : 'border-slate-300 rounded-lg'
                    } p-4 flex flex-col justify-between min-h-[136px]`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{label}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleSignatoryChange(key, 'signed', !person.signed)
                        }
                        className="text-[11px] text-slate-500 hover:text-slate-900 no-print cursor-pointer"
                      >
                        {person.signed ? '✓ Signed' : 'Sign'}
                      </button>
                    </div>

                    <div className="my-4 border-b border-dotted border-slate-400 pb-2 text-center">
                      {person.signed ? (
                        <span className="text-sm font-semibold text-slate-900">
                          {displaySignerName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {t.signLine}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>
                        {t.positionLabel}: {displaySignerTitle}
                      </span>
                      <span className="font-mono-tabular">
                        {t.dateLabel}: {person.date || '____/____/2026'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: SIDE-BY-SIDE SCENARIO 1, 2, 3 COMPARISON TABLE */}
        {activeView === 'compare' && (
          <div className={tableStyle.sheetContainer}>
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 font-medium">
                  Executive Multi-Scenario Comparison · 方案对比
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  ตารางเปรียบเทียบแผนการปรับลดอัตรากำลังคน (สถานการณ์ที่ 1 vs 2 vs 3)
                </h2>
              </div>
              <button
                type="button"
                onClick={handleManualSaveAll}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors no-print cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{t.saveAllBtn}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allScenarioMetrics.map(({ scenario, metrics }, scIdx) => (
                <div
                  key={scenario.id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono-tabular font-bold text-slate-900">
                      {scenario.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveScenarioId(scenario.id);
                        setActiveView('document');
                      }}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline no-print cursor-pointer"
                    >
                      เปิดเอกสารนี้ →
                    </button>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {renderScenarioTitle(scenario)}
                  </div>

                  <div className="flex items-center justify-between bg-white border border-slate-300 rounded-lg px-3 py-1.5 no-print">
                    <span className="text-xs font-medium text-slate-700">
                      สูตร % ลดทั้งแผน:
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={scenario.linkedGlobalPct ?? metrics.pct}
                        onChange={(e) => {
                          const newPct = Math.max(
                            0,
                            Math.min(100, parseFloat(e.target.value) || 0)
                          );
                          setScenarios((prev) =>
                            prev.map((s, idx) => {
                              if (idx !== scIdx) return s;
                              const updatedRows = s.rows.map((r) => {
                                if (r.doubleShiftQuota <= 0) return r;
                                const redP = applyRounding(
                                  r.doubleShiftQuota * (newPct / 100),
                                  s.roundingMethod || 'round'
                                );
                                return {
                                  ...r,
                                  reducePct: newPct,
                                  reducePerson: redP,
                                  remainMp: Math.max(
                                    0,
                                    r.doubleShiftQuota - redP
                                  ),
                                };
                              });
                              return {
                                ...s,
                                linkedGlobalPct: newPct,
                                rows: updatedRows,
                              };
                            })
                          );
                        }}
                        className="w-16 px-1.5 py-0.5 text-center text-xs font-mono-tabular font-bold border border-amber-400 rounded bg-amber-50/50"
                      />
                      <span className="text-xs font-bold text-slate-700">%</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono-tabular">
                    <span>
                      {t.reduceLabel}:{' '}
                      <strong className="text-amber-700">
                        -{metrics.reducePerson.toLocaleString()} (-{metrics.pct}%)
                      </strong>
                    </span>
                    <span>
                      {t.remainLabel}:{' '}
                      <strong className="text-emerald-700">
                        {metrics.remainMp.toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className={tableStyle.tableBorder}>
                <thead>
                  <tr className={tableStyle.theadRow1}>
                    <th
                      rowSpan={2}
                      className={`${tableStyle.thCell} text-left`}
                    >
                      部门 · Department
                    </th>
                    <th rowSpan={2} className={`${tableStyle.thCell} w-24`}>
                      双班定编
                    </th>
                    <th colSpan={3} className={tableStyle.thCell}>
                      SCENARIO 1
                    </th>
                    <th colSpan={3} className={tableStyle.thCell}>
                      SCENARIO 2
                    </th>
                    <th colSpan={3} className={tableStyle.thCell}>
                      SCENARIO 3
                    </th>
                  </tr>
                  <tr className="bg-slate-100 text-slate-900 font-semibold text-xs">
                    <th className="border border-slate-800 px-1.5 py-1.5 text-center">
                      %
                    </th>
                    <th className="border border-slate-800 px-2 py-1.5 text-center">
                      Person
                    </th>
                    <th className="border border-slate-800 px-2 py-1.5 text-center">
                      Remain
                    </th>
                    <th className="border border-slate-800 px-1.5 py-1.5 text-center">
                      %
                    </th>
                    <th className="border border-slate-800 px-2 py-1.5 text-center">
                      Person
                    </th>
                    <th className="border border-slate-800 px-2 py-1.5 text-center">
                      Remain
                    </th>
                    <th className="border border-slate-800 px-1.5 py-1.5 text-center">
                      %
                    </th>
                    <th className="border border-slate-800 px-2 py-1.5 text-center">
                      Person
                    </th>
                    <th className="border border-slate-800 px-2 py-1.5 text-center">
                      Remain
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios[0].rows.map((baseRow, rowIdx) => {
                    const r1 = scenarios[0].rows[rowIdx] || baseRow;
                    const r2 = scenarios[1].rows[rowIdx] || baseRow;
                    const r3 = scenarios[2].rows[rowIdx] || baseRow;

                    return (
                      <tr
                        key={baseRow.id}
                        className="border-b border-slate-300 hover:bg-slate-50"
                      >
                        <td className="border border-slate-800 px-3 py-2">
                          <div className="font-semibold text-slate-900">
                            {langMode === 'th'
                              ? baseRow.deptTh
                              : langMode === 'cn'
                              ? baseRow.deptCn
                              : langMode === 'en'
                              ? baseRow.deptEn
                              : `${baseRow.deptCn} · ${baseRow.deptEn}`}
                          </div>
                        </td>
                        <td className="border border-slate-800 px-2.5 py-2 text-center font-mono-tabular font-semibold">
                          {baseRow.doubleShiftQuota.toLocaleString()}
                        </td>
                        <td className="border border-slate-800 px-1.5 py-2 text-center font-mono-tabular text-xs">
                          -{r1.reducePct ?? 0}%
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono-tabular bg-amber-50/40 font-semibold">
                          -{r1.reducePerson}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono-tabular font-semibold text-emerald-800">
                          {r1.remainMp.toLocaleString()}
                        </td>
                        <td className="border border-slate-800 px-1.5 py-2 text-center font-mono-tabular text-xs">
                          -{r2.reducePct ?? 0}%
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono-tabular bg-amber-50/40 font-semibold">
                          -{r2.reducePerson}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono-tabular font-semibold text-emerald-800">
                          {r2.remainMp.toLocaleString()}
                        </td>
                        <td className="border border-slate-800 px-1.5 py-2 text-center font-mono-tabular text-xs">
                          -{r3.reducePct ?? 0}%
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono-tabular bg-amber-50/40 font-semibold">
                          -{r3.reducePerson}
                        </td>
                        <td className="border border-slate-800 px-2 py-2 text-center font-mono-tabular font-semibold text-emerald-800">
                          {r3.remainMp.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}

                  <tr className={tableStyle.totalRow}>
                    <td className="border border-slate-900 px-3 py-2.5">
                      Total · 总计
                    </td>
                    <td className="border border-slate-900 px-2.5 py-2.5 text-center font-mono-tabular">
                      {allScenarioMetrics[0].metrics.displayDouble.toLocaleString()}
                    </td>
                    {allScenarioMetrics.map(({ scenario, metrics }) => (
                      <React.Fragment key={scenario.id}>
                        <td className="border border-slate-900 px-1.5 py-2.5 text-center font-mono-tabular">
                          -{metrics.pct}%
                        </td>
                        <td
                          className={`border border-slate-900 px-2 py-2.5 text-center font-mono-tabular ${tableStyle.totalReduceCell}`}
                        >
                          -{metrics.reducePerson.toLocaleString()}
                        </td>
                        <td className="border border-slate-900 px-2 py-2.5 text-center font-mono-tabular">
                          {metrics.remainMp.toLocaleString()}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2.5: MONTHLY & MULTI-YEAR MANPOWER TREND & STATISTICS */}
        {activeView === 'trends' && (
          <ManpowerTrendView
            yearlyStats={yearlyStats}
            onChangeYearlyStats={setYearlyStats}
            scenarioTargets={{
              baseline: allScenarioMetrics[0].metrics.calc.doubleShiftQuota,
              s1Remain: allScenarioMetrics[0].metrics.remainMp,
              s2Remain: allScenarioMetrics[1].metrics.remainMp,
              s3Remain: allScenarioMetrics[2].metrics.remainMp,
            }}
            langMode={langMode}
            onSaveAll={handleManualSaveAll}
          />
        )}

        {/* VIEW 3: ANALYTICS */}
        {activeView === 'analytics' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {renderScenarioTitle(activeScenario)}
                </h2>
              </div>
              <div className="text-xs text-slate-600 font-mono-tabular">
                Total Reduction: <strong>-{currentMetrics.pct}%</strong> (-
                {currentMetrics.reducePerson.toLocaleString()} {t.personUnit})
              </div>
            </div>

            <div className="space-y-4">
              {rows
                .filter((r) => r.doubleShiftQuota > 0)
                .map((row) => {
                  const reducePct = (
                    (row.reducePerson / row.doubleShiftQuota) *
                    100
                  ).toFixed(2);
                  return (
                    <div
                      key={row.id}
                      className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="font-bold text-sm text-slate-900">
                          {langMode === 'th'
                            ? row.deptTh
                            : langMode === 'cn'
                            ? row.deptCn
                            : langMode === 'en'
                            ? row.deptEn
                            : `${row.deptCn} · ${row.deptEn} (${row.deptTh})`}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono-tabular">
                          <span className="text-slate-600">
                            Quota: <strong>{row.doubleShiftQuota}</strong>
                          </span>
                          <span className="text-amber-700 font-semibold">
                            {t.reduceLabel}: -{row.reducePerson} (-{reducePct}%)
                          </span>
                          <span className="text-emerald-700 font-semibold">
                            {t.remainLabel}: {row.remainMp}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="bg-slate-800 h-full"
                          style={{ width: `${(row.remainMp / 648) * 100}%` }}
                        />
                        <div
                          className="bg-amber-500 h-full"
                          style={{
                            width: `${(row.reducePerson / 648) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* VIEW 4: AUDIT */}
        {activeView === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                รายงานตรวจสอบความถูกต้องของสูตรคำนวณ (Spreadsheet Formula Audit Report)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    1. สูตรผูกเปอร์เซ็นต์ 2 ทาง (Two-Way Linked Percentage Formula)
                  </span>
                </div>
                <ul className="text-xs space-y-1.5 font-mono-tabular text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <li>
                    • เมื่อแก้ <strong>Ratio %</strong> →{' '}
                    <code>Person = Round(双班定编 × Ratio %)</code>
                  </li>
                  <li>
                    • เมื่อแก้ <strong>Person</strong> →{' '}
                    <code>Ratio % = (Person ÷ 双班定编) × 100</code>
                  </li>
                  <li>
                    • ยอดคงเหลืออัตโนมัติ →{' '}
                    <code>Remain MP = 双班定编 - Person</code>
                  </li>
                </ul>
              </div>
              <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>2. การสลับโหมดยอดรวม (1,532 / 2,791 vs 1,213 / 2,426)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  รองรับทั้งยอดรวมตามตารางต้นฉบับ (1,532 / 2,791) และยอดบวกตามแถวจริง (1,213 / 2,426)
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Digital Signature Modal */}
      <SignatureModal
        row={signingRow}
        onClose={() => setSigningRow(null)}
        onSave={handleSaveSignature}
      />
    </div>
  );
}
