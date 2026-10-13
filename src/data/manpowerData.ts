export interface SignatureRecord {
  signerName: string;
  signerTitle: string;
  signedAt: string;
  signatureDataUrl?: string;
  remark?: string;
  status: 'pending' | 'acknowledged';
}

export interface ManpowerRow {
  id: string;
  categoryCn: string;
  categoryEn: string;
  categoryTh: string;
  categoryGroup: 'direct' | 'other';
  deptCn: string;
  deptEn: string;
  deptTh: string;
  singleShiftQuota: number;
  doubleShiftQuota: number;
  reducePct: number; // Linked percentage (0 - 100)
  reducePerson: number; // Calculated or overridden person count
  remainMp: number; // doubleShiftQuota - reducePerson
  signature: SignatureRecord;
}

export interface SignatoryBlock {
  name: string;
  nameCn: string;
  nameEn: string;
  title: string;
  titleCn: string;
  titleEn: string;
  date: string;
  signed: boolean;
}

export interface DocumentConfig {
  documentTitleTh: string;
  documentTitleCn: string;
  documentTitleEn: string;
  docNumber: string;
  effectiveDate: string;
  fiscalYear: string;
  plantNameTh: string;
  plantNameCn: string;
  plantNameEn: string;
  departmentScopeTh: string;
  departmentScopeCn: string;
  departmentScopeEn: string;
  revision: string;
  acknowledgmentStatementTh: string;
  acknowledgmentStatementCn: string;
  acknowledgmentStatementEn: string;
  preparedBy: SignatoryBlock;
  reviewedBy: SignatoryBlock;
  approvedBy: SignatoryBlock;
}

export type RoundingMethod = 'round' | 'floor' | 'ceil';
export type LanguageMode = 'th' | 'cn' | 'en' | 'cn_en' | 'trilingual';
export type DocumentStyleMode =
  | 'corporate_navy'
  | 'executive_minimal'
  | 'iso_formal'
  | 'modern_cards';

export interface MonthlyStatRecord {
  monthIndex: number; // 1 - 12
  monthTh: string;
  monthCn: string;
  monthEn: string;
  baselineMp: number;
  scenario1Mp: number;
  scenario2Mp: number;
  scenario3Mp: number;
  actualMp: number | null; // null if future month not yet recorded
  phaseNote: string;
}

export interface YearlyManpowerStats {
  year: number;
  yearLabelTh: string;
  yearLabelCn: string;
  yearLabelEn: string;
  targetReductionNote: string;
  months: MonthlyStatRecord[];
}

export const MONTH_NAMES = [
  { index: 1, th: 'ม.ค.', fullTh: 'มกราคม', cn: '1月', en: 'Jan' },
  { index: 2, th: 'ก.พ.', fullTh: 'กุมภาพันธ์', cn: '2月', en: 'Feb' },
  { index: 3, th: 'มี.ค.', fullTh: 'มีนาคม', cn: '3月', en: 'Mar' },
  { index: 4, th: 'เม.ย.', fullTh: 'เมษายน', cn: '4月', en: 'Apr' },
  { index: 5, th: 'พ.ค.', fullTh: 'พฤษภาคม', cn: '5月', en: 'May' },
  { index: 6, th: 'มิ.ย.', fullTh: 'มิถุนายน', cn: '6月', en: 'Jun' },
  { index: 7, th: 'ก.ค.', fullTh: 'กรกฎาคม', cn: '7月', en: 'Jul' },
  { index: 8, th: 'ส.ค.', fullTh: 'สิงหาคม', cn: '8月', en: 'Aug' },
  { index: 9, th: 'ก.ย.', fullTh: 'กันยายน', cn: '9月', en: 'Sep' },
  { index: 10, th: 'ต.ค.', fullTh: 'ตุลาคม', cn: '10月', en: 'Oct' },
  { index: 11, th: 'พ.ย.', fullTh: 'พฤศจิกายน', cn: '11月', en: 'Nov' },
  { index: 12, th: 'ธ.ค.', fullTh: 'ธันวาคม', cn: '12月', en: 'Dec' },
];

export function generatePhasedYearStats(
  year: number,
  baseline: number,
  s1Target: number,
  s2Target: number,
  s3Target: number,
  curveType: 'linear' | 'quarterly' | 'seasonal' = 'quarterly',
  includeDemoActualsUpToMonth: number = 10
): YearlyManpowerStats {
  const s1Diff = baseline - s1Target;
  const s2Diff = baseline - s2Target;
  const s3Diff = baseline - s3Target;

  const months: MonthlyStatRecord[] = MONTH_NAMES.map((m) => {
    let progress = m.index / 12;
    if (curveType === 'quarterly') {
      if (m.index <= 3) progress = 0.25;
      else if (m.index <= 6) progress = 0.55;
      else if (m.index <= 9) progress = 0.85;
      else progress = 1.0;
    } else if (curveType === 'seasonal') {
      // High season Q1-Q2 (less reduction), Low season Q3-Q4 (full reduction)
      const seasonalWeights = [
        0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.7, 0.85, 0.95, 1.0, 1.0, 1.0,
      ];
      progress = seasonalWeights[m.index - 1];
    }

    const s1Mp = Math.round(baseline - s1Diff * progress);
    const s2Mp = Math.round(baseline - s2Diff * progress);
    const s3Mp = Math.round(baseline - s3Diff * progress);

    let actualMp: number | null = null;
    if (m.index <= includeDemoActualsUpToMonth) {
      // Realistic actuals tracking close to Scenario 1 transition
      const variance = (m.index % 3 === 0 ? -4 : m.index % 2 === 0 ? 6 : 0);
      actualMp = Math.max(0, s1Mp + variance);
      if (m.index === 10) actualMp = s1Target; // Reached target in Oct 2026
    }

    const phaseNotes = [
      'เริ่มแผน Q1 · ทบทวนอัตรากำลัง',
      'ปรับสมดุลสายผลิต A/B',
      'ครบรอบประเมิน Q1',
      'เริ่มติดตั้งกึ่งอัตโนมัติ Q2',
      'ควบรวมจุดงานย่อย',
      'ครบรอบประเมินครึ่งปี (H1)',
      'ปรับลดช่วง Low Season Q3',
      'เพิ่มประสิทธิภาพ QC & วัตถุดิบ',
      'ครบรอบประเมิน Q3',
      'บรรลุเป้าหมายแผนปี 2026',
      'รักษากรอบอัตรากำลังคงเหลือ',
      'สรุปสถิติปลายปี (Year-End)',
    ];

    return {
      monthIndex: m.index,
      monthTh: m.th,
      monthCn: m.cn,
      monthEn: m.en,
      baselineMp: baseline,
      scenario1Mp: s1Mp,
      scenario2Mp: s2Mp,
      scenario3Mp: s3Mp,
      actualMp,
      phaseNote: phaseNotes[m.index - 1],
    };
  });

  return {
    year,
    yearLabelTh: `ปี ${year} (ม.ค. – ธ.ค. ${year})`,
    yearLabelCn: `${year}年度 (1月–12月)`,
    yearLabelEn: `Year ${year} (Jan – Dec ${year})`,
    targetReductionNote:
      year === 2026
        ? 'ปีเริ่มต้นแผนลดกำลังคน (Baseline 2,426 → เป้าหมาย 2,191 / 2,061 / 1,940 คน)'
        : `แผนต่อเนื่องประจำปี ${year} (Continuous Lean & Automation Roadmap)`,
    months,
  };
}

export const INITIAL_YEARLY_STATS: YearlyManpowerStats[] = [
  generatePhasedYearStats(2026, 2426, 2191, 2061, 1940, 'quarterly', 10),
  generatePhasedYearStats(2027, 2191, 2080, 1950, 1820, 'quarterly', 0),
  generatePhasedYearStats(2028, 2080, 1980, 1850, 1720, 'quarterly', 0),
];

export interface ScenarioPlan {
  id: 'scenario-1' | 'scenario-2' | 'scenario-3';
  code: string;
  nameTh: string;
  nameCn: string;
  nameEn: string;
  descriptionTh: string;
  descriptionCn: string;
  descriptionEn: string;
  linkedGlobalPct: number;
  roundingMethod: RoundingMethod;
  formulaBasis: 'double_shift' | 'single_shift';
  targetRateLabel: string;
  totalMode: 'image_exact' | 'auto_sum';
  customExactTotals: {
    singleShiftQuota: number;
    doubleShiftQuota: number;
  };
  rows: ManpowerRow[];
  docConfig: DocumentConfig;
  updatedAt: string;
}

export function applyRounding(
  value: number,
  method: RoundingMethod = 'round'
): number {
  if (method === 'floor') return Math.floor(value);
  if (method === 'ceil') return Math.ceil(value);
  return Math.round(value);
}

export const INITIAL_MANPOWER_ROWS: ManpowerRow[] = [
  {
    id: 'line-a',
    categoryCn: '一线',
    categoryEn: 'Direct Labor',
    categoryTh: 'สายการผลิตโดยตรง',
    categoryGroup: 'direct',
    deptCn: 'A线',
    deptEn: 'A Line',
    deptTh: 'สายการผลิตหลัก A',
    singleShiftQuota: 310,
    doubleShiftQuota: 620,
    reducePct: 9.68,
    reducePerson: 60,
    remainMp: 560,
    signature: {
      signerName: '',
      signerTitle: 'Supervisor - Line A',
      signedAt: '',
      status: 'pending',
    },
  },
  {
    id: 'line-b',
    categoryCn: '一线',
    categoryEn: 'Direct Labor',
    categoryTh: 'สายการผลิตโดยตรง',
    categoryGroup: 'direct',
    deptCn: 'B线',
    deptEn: 'B Line',
    deptTh: 'สายการผลิตหลัก B',
    singleShiftQuota: 324,
    doubleShiftQuota: 648,
    reducePct: 9.72,
    reducePerson: 63,
    remainMp: 585,
    signature: {
      signerName: '',
      signerTitle: 'Supervisor - Line B',
      signedAt: '',
      status: 'pending',
    },
  },
  {
    id: 'door-a-shell',
    categoryCn: '一线',
    categoryEn: 'Direct Labor',
    categoryTh: 'สายการผลิตโดยตรง',
    categoryGroup: 'direct',
    deptCn: '门体A+门壳+底钢+后背',
    deptEn: 'Door A + Door Shell + Bottom Steel + Back Plate',
    deptTh: 'ประกอบประตู A + โครงประตู + เหล็กฐาน + แผ่นหลัง',
    singleShiftQuota: 132,
    doubleShiftQuota: 264,
    reducePct: 9.85,
    reducePerson: 26,
    remainMp: 238,
    signature: {
      signerName: '',
      signerTitle: 'Section Head - Door A & Metal',
      signedAt: '',
      status: 'pending',
    },
  },
  {
    id: 'door-c-pressing',
    categoryCn: '一线',
    categoryEn: 'Direct Labor',
    categoryTh: 'สายการผลิตโดยตรง',
    categoryGroup: 'direct',
    deptCn: '门体C+压合+门D',
    deptEn: 'Door C + Pressing + Door D',
    deptTh: 'ประกอบประตู C + งานอัดขึ้นรูป + ประตู D',
    singleShiftQuota: 98,
    doubleShiftQuota: 196,
    reducePct: 9.69,
    reducePerson: 19,
    remainMp: 177,
    signature: {
      signerName: '',
      signerTitle: 'Section Head - Door C/D & Pressing',
      signedAt: '',
      status: 'pending',
    },
  },
  {
    id: 'door-b-seal',
    categoryCn: '一线',
    categoryEn: 'Direct Labor',
    categoryTh: 'สายการผลิตโดยตรง',
    categoryGroup: 'direct',
    deptCn: '门体B+门封+假梁',
    deptEn: 'Door B + Door Seal + False Beam',
    deptTh: 'ประกอบประตู B + ซีลยางขอบประตู + คานกลาง',
    singleShiftQuota: 45,
    doubleShiftQuota: 90,
    reducePct: 10.0,
    reducePerson: 9,
    remainMp: 81,
    signature: {
      signerName: '',
      signerTitle: 'Supervisor - Door B & Sub-assembly',
      signedAt: '',
      status: 'pending',
    },
  },
  {
    id: 'vacuum-forming',
    categoryCn: '一线',
    categoryEn: 'Direct Labor',
    categoryTh: 'สายการผลิตโดยตรง',
    categoryGroup: 'direct',
    deptCn: '吸附（内胆+门衬+挤板+粉碎）',
    deptEn: 'Vacuum Forming (Inner Liner + Door Liner + Extruded Sheet + Crushing)',
    deptTh: 'งานขึ้นรูปสุญญากาศ (ตู้ใน + ซับในประตู + รีดแผ่น + บดพลาสติก)',
    singleShiftQuota: 52,
    doubleShiftQuota: 104,
    reducePct: 9.62,
    reducePerson: 10,
    remainMp: 94,
    signature: {
      signerName: '',
      signerTitle: 'Supervisor - Vacuum Forming',
      signedAt: '',
      status: 'pending',
    },
  },
  {
    id: 'injection-ih',
    categoryCn: '一线',
    categoryEn: 'Direct Labor',
    categoryTh: 'สายการผลิตโดยตรง',
    categoryGroup: 'direct',
    deptCn: '注塑+IH',
    deptEn: 'Injection Molding + IH',
    deptTh: 'งานฉีดพลาสติก (Injection Molding) + IH',
    singleShiftQuota: 100,
    doubleShiftQuota: 200,
    reducePct: 9.5,
    reducePerson: 19,
    remainMp: 181,
    signature: {
      signerName: '',
      signerTitle: 'Supervisor - Injection Molding',
      signedAt: '',
      status: 'pending',
    },
  },
  {
    id: 'inspection',
    categoryCn: '一线',
    categoryEn: 'Direct Labor',
    categoryTh: 'สายการผลิตโดยตรง',
    categoryGroup: 'direct',
    deptCn: '检验',
    deptEn: 'Inspection',
    deptTh: 'แผนกตรวจสอบคุณภาพ (Quality Inspection / QC)',
    singleShiftQuota: 89,
    doubleShiftQuota: 178,
    reducePct: 9.55,
    reducePerson: 17,
    remainMp: 161,
    signature: {
      signerName: '',
      signerTitle: 'QC / Inspection Supervisor',
      signedAt: '',
      status: 'pending',
    },
  },
  {
    id: 'material-delivery',
    categoryCn: '一线',
    categoryEn: 'Direct Labor',
    categoryTh: 'สายการผลิตโดยตรง',
    categoryGroup: 'direct',
    deptCn: '物料配送',
    deptEn: 'Material Delivery',
    deptTh: 'แผนกจัดส่งวัตถุดิบเข้าสายการผลิต (Material Delivery)',
    singleShiftQuota: 63,
    doubleShiftQuota: 126,
    reducePct: 9.52,
    reducePerson: 12,
    remainMp: 114,
    signature: {
      signerName: '',
      signerTitle: 'Warehouse & Material Supervisor',
      signedAt: '',
      status: 'pending',
    },
  },
  {
    id: 'temp-additional',
    categoryCn: '其它',
    categoryEn: 'Other',
    categoryTh: 'อื่นๆ',
    categoryGroup: 'other',
    deptCn: '临时新增人员',
    deptEn: 'Temporary Additional Manpower',
    deptTh: 'อัตรากำลังคนชั่วคราวเพิ่มเติม',
    singleShiftQuota: 0,
    doubleShiftQuota: 0,
    reducePct: 0,
    reducePerson: 0,
    remainMp: 0,
    signature: {
      signerName: '',
      signerTitle: 'HR / Workforce Planning',
      signedAt: '',
      status: 'pending',
    },
  },
];

export const IMAGE_REPORTED_TOTALS = {
  singleShiftQuota: 1532,
  doubleShiftQuota: 2791,
  reducePerson: 235,
  remainMp: 2191,
};

export const INITIAL_DOC_CONFIG: DocumentConfig = {
  documentTitleTh: 'แผนเอกสารรับทราบการปรับลดอัตรากำลังคน ประจำปี 2026',
  documentTitleCn: '2026年各部门定编及人力精简确认计划表',
  documentTitleEn:
    '2026 Workforce Quota & Manpower Reduction Acknowledgment Plan',
  docNumber: 'HR-MP-2026-S1',
  effectiveDate: '2026-10-12',
  fiscalYear: '2026 (26年)',
  plantNameTh: 'ฝ่ายปฏิบัติการโรงงานผลิต · สายการผลิตหลัก',
  plantNameCn: '制造运营事业部 · 生产工厂',
  plantNameEn: 'Manufacturing Operations Division · Production Plant',
  departmentScopeTh: 'สายการผลิตโดยตรงและหน่วยงานสนับสนุน',
  departmentScopeCn: '一线生产及辅助部门',
  departmentScopeEn: 'Direct Labor & Production Support Departments',
  revision: 'Rev. 01 (Official)',
  acknowledgmentStatementTh:
    'ข้าพเจ้าในฐานะหัวหน้าหน่วยงาน/ผู้รับผิดชอบประจำสายการผลิต ได้ตรวจสอบและรับทราบแผนการปรับลดอัตรากำลังคนประจำปี 2026 (Reduce Manpower Plan) ตามตารางข้างต้นเรียบร้อยแล้ว และตกลงดำเนินการบริหารจัดการกำลังคนในแผนกให้อยู่ในกรอบอัตรากำลังคงเหลือ (Remain MP) ที่กำหนดโดยไม่กระทบต่อเป้าหมายการผลิตและมาตรฐานคุณภาพ',
  acknowledgmentStatementCn:
    '本人作为部门负责人已核对并确认上述2026年人力精简定编计划（Reduce Manpower Plan），承诺按照核定留存人力（Remain MP）执行排班与产线效率优化，确保生产目标与品质标准达成。',
  acknowledgmentStatementEn:
    'As Department Head / Line Supervisor, I hereby acknowledge and confirm the 2026 Manpower Reduction Plan above and commit to managing shift allocation within the approved Remaining Manpower (Remain MP) quota while maintaining production output and quality standards.',
  preparedBy: {
    name: 'ฝ่ายวางแผนอัตรากำลังคน (HRBP)',
    nameCn: '人力资源规划部 (HRBP)',
    nameEn: 'HR Workforce Planning (HRBP)',
    title: 'HR Workforce Planning',
    titleCn: '人力资源部主管',
    titleEn: 'HR Planning Supervisor',
    date: '2026-10-12',
    signed: true,
  },
  reviewedBy: {
    name: 'ผู้จัดการฝ่ายผลิต (Production Mgr.)',
    nameCn: '生产部经理 (Production Mgr.)',
    nameEn: 'Production Department Manager',
    title: 'Production Department Manager',
    titleCn: '制造部经理',
    titleEn: 'Production Manager',
    date: '2026-10-12',
    signed: false,
  },
  approvedBy: {
    name: 'ผู้อำนวยการโรงงาน (Plant Director)',
    nameCn: '工厂总经理 (Plant Director)',
    nameEn: 'General Manager / Plant Director',
    title: 'General Manager / Plant Director',
    titleCn: '工厂总经理',
    titleEn: 'Plant Director',
    date: '',
    signed: false,
  },
};

function buildScaledRows(pct: number): ManpowerRow[] {
  return INITIAL_MANPOWER_ROWS.map((row) => {
    if (row.doubleShiftQuota === 0) {
      return { ...row, reducePct: 0, signature: { ...row.signature } };
    }
    const reduced = Math.round(row.doubleShiftQuota * (pct / 100));
    const actualPct = Number(((reduced / row.doubleShiftQuota) * 100).toFixed(2));
    return {
      ...row,
      reducePct: actualPct,
      reducePerson: reduced,
      remainMp: Math.max(0, row.doubleShiftQuota - reduced),
      signature: { ...row.signature },
    };
  });
}

export const INITIAL_SCENARIOS: ScenarioPlan[] = [
  {
    id: 'scenario-1',
    code: 'SCENARIO 1',
    nameTh: 'สถานการณ์ที่ 1: แผนมาตรฐานตามตารางต้นฉบับ (Baseline -9.69%)',
    nameCn: '方案一：基准定编精简计划（按原表标准 -9.69%）',
    nameEn: 'Scenario 1: Baseline Target Plan (-235 MP / -9.69%)',
    descriptionTh:
      'แผนปรับลดอัตรากำลังคนตามเป้าหมายมาตรฐานจากเอกสารต้นฉบับ ลดรวม 235 คน คงเหลืออัตรากำลังสายการผลิต 2,191 คน',
    descriptionCn:
      '按原始定编表基准方案执行人力精简，合计精简 235 人，核定保留双班人力 2,191 人。',
    descriptionEn:
      'Baseline workforce optimization plan matching source schedule: total reduction of 235 persons, retaining 2,191 manpower.',
    linkedGlobalPct: 9.69,
    roundingMethod: 'round',
    formulaBasis: 'double_shift',
    targetRateLabel: '-9.69% (235)',
    totalMode: 'image_exact',
    customExactTotals: {
      singleShiftQuota: 1532,
      doubleShiftQuota: 2791,
    },
    rows: INITIAL_MANPOWER_ROWS.map((r) => ({
      ...r,
      signature: { ...r.signature },
    })),
    docConfig: {
      ...INITIAL_DOC_CONFIG,
      docNumber: 'HR-MP-2026-S1',
      documentTitleTh:
        'แผนเอกสารรับทราบการปรับลดอัตรากำลังคน ประจำปี 2026 (สถานการณ์ที่ 1 - แผนมาตรฐาน)',
      documentTitleCn:
        '2026年各部门定编及人力精简确认计划表（方案一：基准计划）',
      documentTitleEn:
        '2026 Workforce Quota & Manpower Reduction Acknowledgment Plan (Scenario 1 - Baseline)',
    },
    updatedAt: '2026-10-12 09:00',
  },
  {
    id: 'scenario-2',
    code: 'SCENARIO 2',
    nameTh: 'สถานการณ์ที่ 2: แผนเพิ่มประสิทธิภาพกึ่งอัตโนมัติ (Moderate -15.0%)',
    nameCn: '方案二：精益产线平衡与半自动化优化计划（中度精简 -15.0%）',
    nameEn: 'Scenario 2: Moderate Lean & Automation Plan (-365 MP / -15.05%)',
    descriptionTh:
      'แผนจำลองกรณีปรับปรุงกระบวนการผลิต (Lean Line Balancing) ปรับลดลงประมาณ 15% ของอัตรากำลังสองกะ (ลดรวม 365 คน คงเหลือ 2,061 คน)',
    descriptionCn:
      '通过精益工位平衡与局部自动化改善，按双班定编精简 15%（合计精简 365 人，保留 2,061 人）。',
    descriptionEn:
      'Moderate optimization via Lean line balancing & semi-automation, targeting 15% reduction (-365 MP, retaining 2,061 MP).',
    linkedGlobalPct: 15.0,
    roundingMethod: 'round',
    formulaBasis: 'double_shift',
    targetRateLabel: '-15.05% (365)',
    totalMode: 'image_exact',
    customExactTotals: {
      singleShiftQuota: 1532,
      doubleShiftQuota: 2791,
    },
    rows: buildScaledRows(15),
    docConfig: {
      ...INITIAL_DOC_CONFIG,
      docNumber: 'HR-MP-2026-S2',
      revision: 'Rev. 01 (Scenario 2)',
      documentTitleTh:
        'แผนเอกสารรับทราบการปรับลดอัตรากำลังคน ประจำปี 2026 (สถานการณ์ที่ 2 - ปรับลดระดับกลาง 15%)',
      documentTitleCn:
        '2026年各部门定编及人力精简确认计划表（方案二：精益优化 15%）',
      documentTitleEn:
        '2026 Workforce Quota & Manpower Reduction Acknowledgment Plan (Scenario 2 - Moderate 15%)',
    },
    updatedAt: '2026-10-12 09:00',
  },
  {
    id: 'scenario-3',
    code: 'SCENARIO 3',
    nameTh: 'สถานการณ์ที่ 3: แผนรัดเข็มขัดและควบรวมสายการผลิต (Aggressive -20.0%)',
    nameCn: '方案三：深度结构调整与产线整合计划（高强度精简 -20.0%）',
    nameEn: 'Scenario 3: Intensive Restructuring Plan (-486 MP / -20.03%)',
    descriptionTh:
      'แผนรองรับกรณีคำสั่งซื้อชะลอตัว (Low Season) หรือใช้ระบบ Automation เต็มรูปแบบ ปรับลดกำลังคนลง 20% ของอัตรากำลังสองกะ (ลดรวม 486 คน คงเหลือ 1,940 คน)',
    descriptionCn:
      '应对淡季订单波动及全全面自动化升级，按双班定编深度精简 20%（合计精简 486 人，保留 1,940 人）。',
    descriptionEn:
      'Intensive line consolidation & full automation restructuring targeting 20% reduction (-486 MP, retaining 1,940 MP).',
    linkedGlobalPct: 20.0,
    roundingMethod: 'round',
    formulaBasis: 'double_shift',
    targetRateLabel: '-20.03% (486)',
    totalMode: 'image_exact',
    customExactTotals: {
      singleShiftQuota: 1532,
      doubleShiftQuota: 2791,
    },
    rows: buildScaledRows(20),
    docConfig: {
      ...INITIAL_DOC_CONFIG,
      docNumber: 'HR-MP-2026-S3',
      revision: 'Rev. 01 (Scenario 3)',
      documentTitleTh:
        'แผนเอกสารรับทราบการปรับลดอัตรากำลังคน ประจำปี 2026 (สถานการณ์ที่ 3 - ปรับโครงสร้างเข้มข้น 20%)',
      documentTitleCn:
        '2026年各部门定编及人力精简确认计划表（方案三：深度精简 20%）',
      documentTitleEn:
        '2026 Workforce Quota & Manpower Reduction Acknowledgment Plan (Scenario 3 - Intensive 20%)',
    },
    updatedAt: '2026-10-12 09:00',
  },
];
