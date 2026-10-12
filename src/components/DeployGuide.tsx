import { useState, type ReactNode } from "react";
import { useApp } from "../state";
import { Reveal, SectionHead } from "./ui";
import {
  PhoneIcon, PrinterIcon, UsbIcon, WifiIcon, ArrowRightIcon, CopyIcon, DownloadIcon,
  BoltIcon, KeyIcon, CheckIcon, TerminalIcon, LockIcon,
} from "./Icons";

/* ================= naskah perintah & kode ================= */

const CMD_TERMUX = `# 1) pasang Termux dari F-Droid (versi Play Store sudah kedaluwarsa)
pkg update && pkg upgrade -y
pkg install python -y
pip install flask pillow

# 2) kunci proses biar gak mati saat layar HP terkunci
termux-wake-lock

# 3) siapkan folder kerja
mkdir -p ~/cetakyuk && cd ~/cetakyuk
#    salin folder dist/ (hasil build web ini) + server.py ke sini

# 4) nyalakan servernya
python server.py
#    -> web + API hidup di  http://192.168.43.1:3000
#       (IP hotspot bawaan Android — pas persis sama QR di atas)`;

const SERVER_PY = `#!/usr/bin/env python3
"""CETAKYUK! — server HP Android: Termux + Flask + RawBT (USB OTG -> Zebra GC420T)"""
import base64, io, urllib.request
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from PIL import Image

DIST  = Path(__file__).parent / "dist"   # hasil build website ini
OUT   = Path(__file__).parent / "out"    # cadangan .zpl kalau RawBT mati
RAWBT = "http://127.0.0.1:9100"          # HTTP server RawBT (mode raw)

app = Flask(__name__, static_folder=str(DIST))

@app.route("/")
def index():
    return send_from_directory(str(DIST), "index.html")

def png_to_zpl(png_bytes, caption, job_id):
    """PNG dither 640x640 -> ZPL ^GFA utk GC420T (label 100x100 mm, 8 dot/mm)"""
    img = Image.open(io.BytesIO(png_bytes)).convert("L")
    img = img.resize((640, 640), Image.NEAREST)
    px  = img.load()
    hexrows = []
    for y in range(640):
        row = []
        for xb in range(80):
            b = 0
            for bit in range(8):
                if px[xb * 8 + bit, y] < 128:
                    b |= 0x80 >> bit       # 0 = tinta hitam
            row.append(f"{b:02X}")
        hexrows.append("".join(row))
    cap = "".join(c for c in caption[:60] if 31 < ord(c) < 127) or "CETAKYUK!"
    return ("^XA^MMT^PW832^LL832^FO80,24^GFA,51200,51200,80,"
            + "".join(hexrows)
            + f"^FS^FO80,696^A0N,44,44^FD{cap}^FS"
            + f"^FO80,752^A0N,24,24^FDCETAKYUK {job_id} - 100x100mm^FS"
            + "^PQ1^XZ").encode("ascii")

@app.route("/api/print", methods=["POST"])
def cetak():
    d   = request.get_json(force=True)
    png = base64.b64decode(d["image"].split(",", 1)[1])
    zpl = png_to_zpl(png, d.get("caption", ""), d.get("id", ""))
    OUT.mkdir(exist_ok=True)
    (OUT / (d.get("id", "job").replace("#", "") + ".zpl")).write_bytes(zpl)
    try:
      req = urllib.request.Request(RAWBT, data=zpl, method="POST")
      urllib.request.urlopen(req, timeout=5)
      return jsonify(ok=true, via="rawbt-usb")
    except Exception:
      # printer/RawBT belum siap: job tetap aman sebagai file .zpl
      return jsonify(ok=true, via="file", note="RawBT belum nyala; ZPL di out/"), 202

if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    app.run(host="0.0.0.0", port=3000)   // wajib 0.0.0.0 supaya hotspot bisa akses`;

const KOTLIN_SKEL = `// kerangka app Kotlin — USB Host API + embedded HTTP (NanoHTTPD / Ktor)
// AndroidManifest.xml:
//   <uses-feature android:name="android.hardware.usb.host" />

val usb   = getSystemService(UsbManager::class.java)
val zebra = usb.deviceList.values.first { it.vendorId == 0x0A5F }  // VID Zebra
val conn  = usb.openDevice(zebra)
val intf  = zebra.getInterface(0)
val outEp = (0 until intf.endpointCount)
    .map(intf::getEndpoint)
    .first { it.direction == UsbConstants.USB_DIR_OUT }

conn.claimInterface(intf, true)          // minta izin USB dulu (ACTION_USB_PERMISSION)

fun cetak(zpl: String) {
    val data = zpl.toByteArray(Charsets.US_ASCII)
    conn.bulkTransfer(outEp, data, data.size, 3000)   // timeout ms
}

// HTTP server (NanoHTTPD) di port 3000, satu proses sama app:
//   POST /api/print -> terima PNG dither -> susun ZPL ^GFA -> cetak(zpl)
//   GET  /*         -> sajikan isi folder dist/ (web kiosk-nya)`;

const CMD_DRY = `# jalur paling ringan: sajikan webnya saja, tanpa printer dulu
cd ~/cetakyuk
python -m http.server 3000 -d dist

# kiriman user tetap masuk antrean di Ruang Kontrol (mode "antre lokal"),
# dan setiap job bisa diunduh sebagai file .zpl siap cetak —
# ditembak ke GC420T kapan saja dari perangkat lain yang punya akses.`;

/* ================= blok kode interaktif ================= */

function CodeBlock({
  code,
  label,
  filename,
  dark = true,
}: {
  code: string;
  label: string;
  filename?: string;
  dark?: boolean;
}) {
  const { toast } = useApp();
  return (
    <div className={`overflow-hidden rounded-xl border-2 border-ink ${dark ? "bg-pine-deep" : "bg-cream"}`}>
      <div className={`flex items-center justify-between gap-2 border-b-2 border-ink px-3.5 py-2 ${dark ? "bg-pine" : "bg-mint"}`}>
        <span className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-berry" />
            <span className="h-2.5 w-2.5 rounded-full bg-tang" />
            <span className="h-2.5 w-2.5 rounded-full bg-leaf" />
          </span>
          <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${dark ? "text-mint" : "text-ink/70"}`}>
            {label}
          </span>
        </span>
        <span className="flex gap-1.5">
          <button
            onClick={() =>
              navigator.clipboard?.writeText(code).then(
                () => toast("Tersalin! Tempel di Termux (tahan → paste).", "ok"),
                () => toast("Gagal nyalin — salin manual aja ya.", "err")
              )
            }
            className={`press sticker-sm inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-display text-[11px] font-extrabold ${dark ? "bg-leaf" : "bg-paper"}`}
          >
            <CopyIcon size={12} /> Salin
          </button>
          {filename && (
            <button
              onClick={() => {
                const url = URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 4000);
                toast(`${filename} meluncur ke folder download.`, "ok");
              }}
              className="press sticker-sm inline-flex items-center gap-1 rounded-md bg-tang px-2.5 py-1 font-display text-[11px] font-extrabold"
            >
              <DownloadIcon size={12} /> {filename}
            </button>
          )}
        </span>
      </div>
      <pre className={`overflow-x-auto p-4 font-mono text-[11px] leading-relaxed sm:text-[12px] ${dark ? "text-mint" : "text-ink"}`}>
        {code}
      </pre>
    </div>
  );
}

/* ================= panduan utama ================= */

type TabId = "termux" | "kotlin" | "dry";

const TABS: { id: TabId; label: string; badge?: string }[] = [
  { id: "termux", label: "Termux + RawBT", badge: "dianjurkan" },
  { id: "kotlin", label: "App Kotlin Native" },
  { id: "dry", label: "Dry-Run" },
];

export default function DeployGuide() {
  const { user, canAccess } = useApp();
  
  // Hanya tampilkan untuk superuser
  if (!canAccess("super")) {
    return null;
  }

  const [tab, setTab] = useState<TabId>("termux");

  const flow: { icon: ReactNode; t: string; d: string }[] = [
    { icon: <PhoneIcon size={17} />, t: "HP pengunjung", d: "scan QR" },
    { icon: <WifiIcon size={17} />, t: "hotspot Wi-Fi", d: "192.168.43.x" },
    { icon: <TerminalIcon size={17} />, t: "Termux :3000", d: "web + API" },
    { icon: <KeyIcon size={17} />, t: "RawBT :9100", d: "jembatan USB" },
    { icon: <UsbIcon size={17} />, t: "OTG", d: "ZPL ^GFA" },
    { icon: <PrinterIcon size={17} />, t: "GC420T", d: "label keluar" },
  ];

  return (
    <section id="panduan" className="relative overflow-hidden border-b-2 border-ink bg-pine text-paper">
      <div className="halftone-paper absolute inset-0 opacity-[0.06]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <SectionHead
            tone="dark"
            kicker="bawa pulang"
            title={
              <>
                Biar beneran nyala <span className="text-tang">di HP Android-mu.</span>
              </>
            }
            sub="Browser Android nggak boleh nyentuh USB OTG langsung, jadi butuh satu lapis kecil: Termux buat jadi server, dan RawBT (atau app Kotlin bikinanmu) buat jadi sopir printer-nya."
          />
        </Reveal>

        {/* alur data */}
        <Reveal>
          <div className="sticker-lg rounded-2xl bg-pine-deep p-4 sm:p-5">
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-mint/70">
              alur datanya (semua di jaringan lokal)
            </p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2.5">
              {flow.map((f, i) => (
                <span key={f.t} className="flex items-center gap-1.5">
                  <span className="sticker-sm flex items-center gap-2 rounded-lg bg-pine px-3 py-2 transition-transform hover:-translate-y-0.5">
                    <span className="text-tang">{f.icon}</span>
                    <span>
                      <span className="block font-display text-xs font-extrabold leading-tight">{f.t}</span>
                      <span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-mint/70">
                        {f.d}
                      </span>
                    </span>
                  </span>
                  {i < flow.length - 1 && <ArrowRightIcon size={15} className="shrink-0 text-leaf" />}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* tab jalur */}
        <Reveal delay={100}>
          <div className="mt-10 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`press sticker-sm rounded-full px-4 py-2.5 font-display text-sm font-extrabold transition-colors ${
                  tab === t.id ? "bg-tang text-ink" : "bg-pine-deep text-mint hover:bg-pine-deep/70"
                }`}
              >
                {t.label}
                {t.badge && (
                  <span className={`ml-2 rounded-full px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-widest ${tab === t.id ? "bg-ink text-tang" : "bg-leaf text-ink"}`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* ------- kolom langkah ------- */}
          <Reveal delay={140}>
            {tab === "termux" && (
              <ol className="space-y-3.5">
                {[
                  {
                    t: "Pasang Termux (dari F-Droid) di HP yang jadi server",
                    d: "HP ini yang bakal dicolok printer. Versi Play Store sudah nggak di-update, ambil dari f-droid.org.",
                  },
                  {
                    t: "Pasang RawBT, colok GC420T via OTG",
                    d: "Buka RawBT → tambah printer → USB → pilih Zebra → print test page. Kalau test page keluar, jalur printer sudah hidup.",
                  },
                  {
                    t: "Nyalakan HTTP server RawBT",
                    d: "Di pengaturan RawBT aktifkan HTTP server (port 9100, mode raw). server.py nanti nembak ZPL ke alamat ini.",
                  },
                  {
                    t: "Nyalakan hotspot HP server",
                    d: "HP pengunjung wajib connect ke hotspot ini. Alamat server default-nya 192.168.43.1:3000 — pas sama QR di atas.",
                  },
                  {
                    t: "Taruh dist/ + server.py, jalankan python server.py",
                    d: "Perintah lengkap & script-nya ada di sebelah. Web kiosk dan endpoint /api/print langsung hidup di satu proses.",
                  },
                ].map((s, i) => (
                  <li key={s.t} className="sticker-sm flex gap-3.5 rounded-xl bg-paper p-4 text-ink">
                    <span className="sticker-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tang font-display text-sm font-extrabold">
                      {i + 1}
                    </span>
                    <span>
                      <span className="block font-display text-[15px] font-extrabold leading-tight">{s.t}</span>
                      <span className="mt-1 block text-[13px] font-medium leading-relaxed text-ink/65">{s.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {tab === "kotlin" && (
              <div className="space-y-3.5">
                {[
                  {
                    t: "Jalur mandiri total, tanpa app pihak ketiga",
                    d: "Satu app Android kecil yang isinya dua hal: server HTTP (NanoHTTPD/Ktor) yang menyajikan dist/ dan /api/print, plus USB Host API yang nulis ZPL langsung ke GC420T.",
                  },
                  {
                    t: "USB Host minta izin eksplisit",
                    d: "Pasang PendingIntent buat ACTION_USB_PERMISSION; begitu user mengizinkan, simpan device-nya dan buka bulk endpoint OUT.",
                  },
                  {
                    t: "Vendor ID Zebra = 0x0A5F",
                    d: "Filter deviceList pakai VID ini supaya nggak salah ambil device OTG lain (flashdisk, misalnya).",
                  },
                  {
                    t: "Kirim ZPL = bulkTransfer doang",
                    d: "GC420T nerima ZPL sebagai teks ASCII biasa. Satu bulkTransfer per label, timeout 3 detik sudah lebih dari cukup.",
                  },
                ].map((s) => (
                  <div key={s.t} className="sticker-sm rounded-xl bg-paper p-4 text-ink">
                    <p className="flex items-start gap-2 font-display text-[15px] font-extrabold leading-tight">
                      <CheckIcon size={17} className="mt-0.5 shrink-0 text-pine" /> {s.t}
                    </p>
                    <p className="mt-1 pl-6 text-[13px] font-medium leading-relaxed text-ink/65">{s.d}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === "dry" && (
              <div className="space-y-3.5">
                {[
                  {
                    t: "Cuma mau nyoba kiosk-nya dulu?",
                    d: "Jalankan python -m http.server dari folder yang ada dist/-nya. Web, QR, dan editor jalan penuh — kiriman masuk antrean sebagai job lokal.",
                  },
                  {
                    t: "Semua job tetap bisa jadi .zpl",
                    d: "Dari Ruang Kontrol, tiap job punya tombol Unduh .zpl. Kumpulin file-nya, terus tembak ke GC420T kapan pun ada perangkat yang nyolok.",
                  },
                  {
                    t: "Naik kelas kapan saja",
                    d: "Begitu RawBT atau app Kotlin-nya siap, cukup ganti server python-nya dengan server.py — frontend-nya nggak perlu diubah sama sekali.",
                  },
                ].map((s) => (
                  <div key={s.t} className="sticker-sm rounded-xl bg-paper p-4 text-ink">
                    <p className="flex items-start gap-2 font-display text-[15px] font-extrabold leading-tight">
                      <BoltIcon size={17} className="mt-0.5 shrink-0 text-tang-deep" /> {s.t}
                    </p>
                    <p className="mt-1 pl-6 text-[13px] font-medium leading-relaxed text-ink/65">{s.d}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="sticker-sm mt-5 flex gap-3 rounded-xl bg-tang p-4 text-ink">
              <BoltIcon size={19} className="mt-0.5 shrink-0" />
              <p className="text-[13px] font-bold leading-relaxed">
                Colok HP server ke charger selama jadi kiosk, dan aktifkan <span className="underline decoration-2">termux-wake-lock</span> —
                Android doyan banget ngebunuh proses latar.
              </p>
            </div>
          </Reveal>

          {/* ------- kolom terminal ------- */}
          <Reveal delay={200}>
            <div className="space-y-5">
              {tab === "termux" && (
                <>
                  <CodeBlock code={CMD_TERMUX} label="termux — sekali pasang" />
                  <CodeBlock code={SERVER_PY} label="server.py — web + API + jembatan RawBT" filename="server.py" />
                </>
              )}
              {tab === "kotlin" && (
                <CodeBlock code={KOTLIN_SKEL} label="PrintService.kt — kerangka USB Host" filename="PrintService.kt.txt" />
              )}
              {tab === "dry" && <CodeBlock code={CMD_DRY} label="termux — mode tanpa printer" />}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}