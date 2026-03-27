import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

/**
 * Full-screen QR scanner using device camera; decodes text and calls onScan(qrId).
 */
export function QRScannerModal({ open, onClose, onScan, monumentSlug }) {
  const [err, setErr] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (!open) return undefined;

    const elId = "qr-reader-inline";
    let html5;

    const start = async () => {
      try {
        setErr(null);
        html5 = new Html5Qrcode(elId);
        await html5.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            const trimmed = decodedText.trim();
            if (trimmed) onScan(trimmed, monumentSlug);
          },
          () => {}
        );
        started.current = true;
      } catch (e) {
        setErr(e?.message || "Could not start camera");
      }
    };

    start();

    return () => {
      if (html5 && started.current) {
        html5
          .stop()
          .then(() => html5.clear())
          .catch(() => {});
      }
      started.current = false;
    };
  }, [open, onScan, monumentSlug]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-zinc-300 hover:text-white"
        >
          Close
        </button>
        <span className="text-sm text-zinc-500">Point at QR checkpoint</span>
        <span className="w-12" />
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center p-4">
        <div
          id="qr-reader-inline"
          className="w-full max-w-md overflow-hidden rounded-2xl bg-zinc-900"
        />
        {err && (
          <p className="mt-4 max-w-md text-center text-sm text-red-400">{err}</p>
        )}
      </div>
    </div>
  );
}
