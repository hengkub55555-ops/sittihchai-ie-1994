import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check, PenTool, UserCheck } from 'lucide-react';
import { ManpowerRow, SignatureRecord } from '../data/manpowerData';

interface SignatureModalProps {
  row: ManpowerRow | null;
  onClose: () => void;
  onSave: (rowId: string, signature: SignatureRecord) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  row,
  onClose,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [signedAt, setSignedAt] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (row) {
      setSignerName(row.signature.signerName || '');
      setSignerTitle(row.signature.signerTitle || '');
      setSignedAt(
        row.signature.signedAt || new Date().toISOString().split('T')[0]
      );
      setRemark(row.signature.remark || '');
      setHasDrawn(Boolean(row.signature.signatureDataUrl));

      // Initialize canvas
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (row.signature.signatureDataUrl) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = row.signature.signatureDataUrl;
        }
      }, 30);
    }
  }, [row]);

  if (!row) return null;

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const dataUrl =
      hasDrawn && canvas ? canvas.toDataURL('image/png') : undefined;

    onSave(row.id, {
      signerName: signerName.trim() || 'Department Representative',
      signerTitle: signerTitle.trim(),
      signedAt: signedAt || new Date().toISOString().split('T')[0],
      signatureDataUrl: dataUrl,
      remark: remark.trim(),
      status: 'acknowledged',
    });
    onClose();
  };

  const handleResetPending = () => {
    onSave(row.id, {
      signerName: '',
      signerTitle: row.signature.signerTitle,
      signedAt: '',
      signatureDataUrl: undefined,
      remark: '',
      status: 'pending',
    });
    onClose();
  };

  const reductionPct =
    row.doubleShiftQuota > 0
      ? ((row.reducePerson / row.doubleShiftQuota) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 no-print">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ลงนามรับทราบแผนปรับลดกำลังคน · Sign Acknowledgment
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {row.deptCn} · {row.deptEn}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Banner */}
        <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">อัตรากำลัง 2 กะ (双班定编): </span>
            <span className="font-mono-tabular font-semibold text-slate-900">
              {row.doubleShiftQuota.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-500">จำนวนที่ปรับลด (Reduce): </span>
            <span className="font-mono-tabular font-bold text-amber-700">
              -{row.reducePerson.toLocaleString()} คน ({reductionPct}%)
            </span>
          </div>
          <div>
            <span className="text-slate-500">คงเหลือ (Remain MP): </span>
            <span className="font-mono-tabular font-bold text-emerald-700">
              {row.remainMp.toLocaleString()} คน
            </span>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อผู้ลงนามรับทราบ (Signer Name / 签字人) *
              </label>
              <input
                type="text"
                required
                placeholder="เช่น สมชาย ใจดี / Zhang Wei"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ตำแหน่ง (Position / 职位)
              </label>
              <input
                type="text"
                placeholder="Supervisor / Section Manager"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ลงนาม (Date / 日期)
              </label>
              <input
                type="date"
                value={signedAt}
                onChange={(e) => setSignedAt(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุแผนก (Remark / 备注)
              </label>
              <input
                type="text"
                placeholder="เช่น ปรับลดตามแผน Automation Q4"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Signature Pad */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <PenTool className="w-3.5 h-3.5 text-slate-500" />
                <span>ลายมือชื่อดิจิทัล (Digital Signature Pad / 手写签名)</span>
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>ล้างลายเซ็น (Clear)</span>
              </button>
            </div>
            <div className="border border-slate-300 rounded-lg bg-slate-50/60 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={460}
                height={130}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[130px] cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                  วาดลายเซ็นที่นี่ด้วยเมาส์หรือนิ้วมือ (หรือเว้นว่างเพื่อใช้ชื่อพิมพ์แทน)
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            {row.signature.status === 'acknowledged' ? (
              <button
                type="button"
                onClick={handleResetPending}
                className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                ยกเลิกการลงนาม (Reset)
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>ยืนยันรับทราบ (Confirm & Sign)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
