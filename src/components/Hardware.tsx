import { Reveal, SectionHead, MonoChip } from "./ui";
import { UsbIcon, WifiIcon, BoltIcon, PhoneIcon, PrinterIcon, SparkIcon } from "./Icons";

export default function Hardware() {
  return (
    <section id="mesin" className="relative overflow-hidden border-b-2 border-ink bg-pine-deep text-paper">
      <div className="halftone-paper absolute inset-0 opacity-[0.07]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <SectionHead
            tone="dark"
            kicker="jeroan mesin"
            title={
              <>
                Servernya? <span className="text-tang">HP Android doang.</span> Printer nyolok OTG.
              </>
            }
            sub="Nggak ada PC, nggak ada router tambahan. HP Android jadi hotspot sekaligus server, dan Zebra GC420T ngantre perintah lewat satu kabel USB."
          />
        </Reveal>

        <div className="grid items-start gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          {/* ---------- ilustrasi ---------- */}
          <Reveal>
            {/* alur ringkas utk layar kecil */}
            <div className="space-y-2.5 sm:hidden">
              {[
                { icon: <PhoneIcon size={22} className="text-tang" />, t: "HP ANDROID", d: "server + hotspot • :3000" },
                { icon: <UsbIcon size={22} className="text-leaf" />, t: "USB OTG", d: "ZPL ^GFA ngalir di kabel ini" },
                { icon: <PrinterIcon size={22} className="text-mint" />, t: "ZEBRA GC420T", d: "203 dpi • 8 dot/mm" },
              ].map((r, i) => (
                <div key={r.t}>
                  {i > 0 && (
                    <p className="py-0.5 text-center font-mono text-lg font-bold text-leaf" aria-hidden>
                      ⭣
                    </p>
                  )}
                  <div className="sticker-sm flex items-center gap-3 rounded-xl bg-pine px-4 py-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-pine-deep">
                      {r.icon}
                    </span>
                    <span>
                      <span className="block font-display text-sm font-extrabold">{r.t}</span>
                      <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-mint/80">
                        {r.d}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="sticker-lg hidden rounded-2xl bg-pine p-4 sm:block sm:p-6">
              <svg viewBox="0 0 900 360" className="w-full" role="img" aria-label="HP Android terhubung USB OTG ke printer Zebra GC420T">
                {/* meja */}
                <line x1="30" y1="318" x2="870" y2="318" stroke="#123f30" strokeWidth="6" strokeLinecap="round" />

                {/* ---- HP Android ---- */}
                <g>
                  <rect x="70" y="78" width="180" height="236" rx="26" fill="#fbf6ea" stroke="#1e2b22" strokeWidth="4" />
                  <rect x="84" y="100" width="152" height="186" rx="10" fill="#bce3ce" stroke="#1e2b22" strokeWidth="3" />
                  <rect x="136" y="88" width="48" height="6" rx="3" fill="#1e2b22" opacity="0.7" />
                  <circle cx="160" cy="299" r="7" fill="none" stroke="#1e2b22" strokeWidth="3" />
                  {/* isi layar */}
                  <rect x="96" y="112" width="52" height="52" rx="6" fill="#fbf6ea" stroke="#1e2b22" strokeWidth="2.5" />
                  <g fill="#123f30">
                    <rect x="102" y="118" width="12" height="12" /><rect x="130" y="118" width="12" height="12" />
                    <rect x="102" y="146" width="12" height="12" /><rect x="118" y="132" width="8" height="8" />
                    <rect x="130" y="138" width="6" height="6" /><rect x="120" y="150" width="6" height="6" />
                  </g>
                  <rect x="156" y="116" width="72" height="9" rx="4.5" fill="#1e2b22" opacity="0.75" />
                  <rect x="156" y="132" width="56" height="7" rx="3.5" fill="#1e2b22" opacity="0.4" />
                  <rect x="96" y="178" width="128" height="26" rx="13" fill="#f5873c" stroke="#1e2b22" strokeWidth="2.5" />
                  <text x="160" y="196" textAnchor="middle" fontFamily="Space Mono, monospace" fontWeight="700" fontSize="13" fill="#1e2b22">UPLOAD ↥</text>
                  <circle cx="103" cy="262" r="5" fill="#7cc24b" stroke="#1e2b22" strokeWidth="2">
                    <animate attributeName="opacity" values="1;0.25;1" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                  <text x="114" y="266" fontFamily="Space Mono, monospace" fontWeight="700" fontSize="11" fill="#1e2b22">SERVER ON • 192.168.43.1</text>
                  <text x="160" y="338" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="15" fill="#fbf6ea">HP ANDROID — server + hotspot</text>
                </g>

                {/* ---- kabel OTG ---- */}
                <g fill="none" strokeLinecap="round">
                  <path d="M250 230 C 340 230, 360 170, 440 170 S 560 210, 585 210" stroke="#1e2b22" strokeWidth="9" />
                  <path d="M250 230 C 340 230, 360 170, 440 170 S 560 210, 585 210" stroke="#7cc24b" strokeWidth="4" className="anim-dash" />
                  <rect x="240" y="220" width="22" height="20" rx="4" fill="#f5873c" stroke="#1e2b22" strokeWidth="3" />
                  <rect x="578" y="200" width="22" height="20" rx="4" fill="#f5873c" stroke="#1e2b22" strokeWidth="3" />
                  <text x="420" y="140" textAnchor="middle" fontFamily="Space Mono, monospace" fontWeight="700" fontSize="13" fill="#bce3ce">USB OTG</text>
                  <text x="420" y="156" textAnchor="middle" fontFamily="Space Mono, monospace" fontSize="10" fill="#bce3ce" opacity="0.8">ZPL ^GFA ngalir di sini</text>
                </g>

                {/* ---- Zebra GC420T ---- */}
                <g>
                  {/* label keluar (animasi) */}
                  <clipPath id="labelClip"><rect x="640" y="40" width="150" height="150" /></clipPath>
                  <g clipPath="url(#labelClip)">
                    <g className="anim-feed">
                      <rect x="652" y="70" width="126" height="126" rx="4" fill="#fbf6ea" stroke="#1e2b22" strokeWidth="3.5" />
                      <g fill="#1e2b22">
                        <rect x="664" y="82" width="102" height="70" opacity="0.9" />
                        <rect x="664" y="82" width="102" height="70" fill="#fbf6ea" opacity="0.25" />
                        <rect x="670" y="88" width="8" height="8" /><rect x="686" y="88" width="8" height="8" />
                        <rect x="702" y="96" width="8" height="8" /><rect x="718" y="88" width="8" height="8" />
                        <rect x="734" y="104" width="8" height="8" /><rect x="750" y="88" width="8" height="8" />
                        <rect x="678" y="112" width="8" height="8" /><rect x="694" y="120" width="8" height="8" />
                        <rect x="710" y="112" width="8" height="8" /><rect x="726" y="128" width="8" height="8" />
                        <rect x="742" y="120" width="8" height="8" /><rect x="758" y="112" width="8" height="8" />
                        <rect x="670" y="136" width="8" height="8" /><rect x="702" y="140" width="8" height="8" />
                        <rect x="734" y="140" width="8" height="8" /><rect x="750" y="132" width="8" height="8" />
                      </g>
                      <text x="715" y="172" textAnchor="middle" fontFamily="Caveat, cursive" fontWeight="700" fontSize="17" fill="#1e2b22">buatanmu :)</text>
                    </g>
                  </g>
                  {/* badan printer */}
                  <path d="M600 190 h230 a16 16 0 0 1 16 16 v86 a16 16 0 0 1 -16 16 h-230 a16 16 0 0 1 -16 -16 v-86 a16 16 0 0 1 16 -16 Z" fill="#f2e8cf" stroke="#1e2b22" strokeWidth="4" />
                  <path d="M600 190 h230 a16 16 0 0 1 16 16 v22 h-262 v-22 a16 16 0 0 1 16 -16 Z" fill="#1e2b22" />
                  <rect x="640" y="182" width="150" height="12" rx="6" fill="#123f30" stroke="#1e2b22" strokeWidth="3" />
                  <circle cx="818" cy="262" r="6" fill="#7cc24b" stroke="#1e2b22" strokeWidth="2.5">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="818" cy="282" r="6" fill="#f5873c" stroke="#1e2b22" strokeWidth="2.5" />
                  <text x="622" y="268" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="20" fill="#1e2b22">ZEBRA</text>
                  <text x="622" y="288" fontFamily="Space Mono, monospace" fontWeight="700" fontSize="12" fill="#1e2b22" opacity="0.7">GC420T • 203dpi</text>
                  <text x="715" y="338" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight="800" fontSize="15" fill="#fbf6ea">ZEBRA GC420T — thermal transfer</text>
                </g>
              </svg>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                ["203 dpi • 8 dot/mm", BoltIcon],
                ["lebar cetak maks 104 mm", PrinterIcon],
                ["media 100×100 mm", SparkIcon],
                ["ZPL ^GFA 640×640", UsbIcon],
                ["hotspot tanpa internet", WifiIcon],
                ["baterai = UPS gratis", PhoneIcon],
              ].map(([t, I]) => (
                <MonoChip key={t as string} className="border-mint/40 bg-pine text-mint">
                  {(() => {
                    const Ic = I as typeof BoltIcon;
                    return <Ic size={13} className="text-leaf" />;
                  })()}
                  {t as string}
                </MonoChip>
              ))}
            </div>
          </Reveal>

          {/* ---------- tiket alasan ---------- */}
          <Reveal delay={140}>
            <div className="sticker-lg rotate-1 rounded-xl bg-paper p-6 text-ink transition-transform duration-300 hover:rotate-0">
              <p className="sticker-sm -mt-10 mb-5 inline-block -rotate-3 rounded-md bg-tang px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em]">
                kenapa harus ringkas?
              </p>
              <h3 className="font-display text-2xl font-extrabold leading-tight">
                Kiosk ini bisa nongkrong di mana aja: pasar malam, CFD, nikahan temen.
              </h3>
              <ul className="mt-5 space-y-4">
                {[
                  ["Termux + server Node ringan", "HP Android bekas pun kuat. Nyalain hotspot, server jalan, QR langsung hidup."],
                  ["Satu kabel doang", "USB OTG ke GC420T. Nggak butuh adaptor aneh, nggak butuh driver PC."],
                  ["Data nggak kemana-mana", "Foto cuma wara-wiri di jaringan lokal antara dua HP. Hapus file? Otomatis."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3.5">
                    <span className="sticker-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-leaf font-display text-sm font-extrabold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-display text-base font-extrabold">{t}</p>
                      <p className="text-sm font-medium leading-relaxed text-ink/65">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t-2 border-dashed border-ink/15 pt-4 text-center font-hand text-2xl font-semibold text-pine">
                “kalau HP-nya mati, ya kiosk-nya tutup. se-simple itu.”
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
