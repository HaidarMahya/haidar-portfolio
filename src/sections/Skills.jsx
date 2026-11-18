import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import * as Icons from "lucide-react";
import { Reveal } from "../components/ui";

// Sesuaikan data ini jika Anda mengambilnya dari file external
const interests = [
  "Technology",
  "Design",
  "Creative Thinking",
  "Islamic Values",
];

const { ChevronLeft, ChevronRight, X } = Icons;

/* ───────────────────────── constants & helpers ───────────────────────── */

const TOTAL_LEAVES = 5; // Jumlah lembar buku (1 cover + 4 isi)
const EASE = [0.645, 0.045, 0.355, 1];

const paperBg = (c = "var(--color-cream)") => ({
  backgroundColor: c,
  backgroundImage: "radial-gradient(rgba(10,22,3,0.1) 1px, transparent 1px)",
  backgroundSize: "16px 16px",
});

const useMedia = (q) => {
  const [m, setM] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia(q).matches,
  );
  useEffect(() => {
    const mq = matchMedia(q),
      f = () => setM(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
};

/* ───────────────────────── small paper props ───────────────────────── */

const Tape = ({ className = "" }) => (
  <i aria-hidden className={`absolute bg-ink/80 ${className}`} />
);

const Sheet = ({ tone = "var(--color-cream)", children }) => (
  <div
    className="relative h-full w-full overflow-hidden text-ink"
    style={paperBg(tone)}
  >
    {children}
  </div>
);

/* ───────────────────────── 3D leaf ───────────────────────── */

const Face = ({ back, shade, children }) => (
  <div
    className="absolute inset-0"
    style={{
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
      transform: back ? "rotateY(180deg)" : "rotateY(0deg)",
      transformStyle: "preserve-3d",
    }}
  >
    {children}
    {/* Shadow / Depth Gradient */}
    <i
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 w-[14%] from-black/20 to-transparent ${
        back ? "right-0 bg-gradient-to-l" : "left-0 bg-gradient-to-r"
      }`}
    />
    {/* Ambient shadow saat membalik halaman */}
    <motion.i
      aria-hidden
      style={{ opacity: shade }}
      className={`pointer-events-none absolute inset-0 from-black/40 via-black/5 to-transparent ${
        back ? "bg-gradient-to-l" : "bg-gradient-to-r"
      }`}
    />
  </div>
);

// Komponen lembaran buku (Leaf) yang menangani animasi 3D rotasi
const Leaf = ({ index, currentPage, spread }) => {
  const isFlipped = currentPage > index;
  const zIndex = isFlipped ? index : TOTAL_LEAVES - index;

  return (
    <motion.div
      className="absolute right-0 top-0 bottom-0 origin-left"
      style={{
        width: spread ? "50%" : "100%",
        zIndex,
        transformStyle: "preserve-3d",
      }}
      initial={false}
      animate={{ rotateY: isFlipped ? -180 : 0 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {/* Sisi Depan (Kosong) */}
      <Face back={false} shade={isFlipped ? 1 : 0}>
        <Sheet tone={index === 0 ? "#e0dcd3" : "var(--color-cream)"} />
      </Face>

      {/* Sisi Belakang (Kosong) */}
      <Face back={true} shade={isFlipped ? 0 : 1}>
        <Sheet tone={index === 0 ? "#e0dcd3" : "var(--color-cream)"} />
      </Face>
    </motion.div>
  );
};

/* ───────────────────────── the notebook ───────────────────────── */

const CtrlBtn = ({ label, className = "", ...p }) => (
  <button
    type="button"
    aria-label={label}
    {...p}
    className={`grid h-12 w-12 place-items-center bg-white border border-ink/10 text-ink transition hover:bg-ink hover:text-cream disabled:pointer-events-none disabled:opacity-30 ${className}`}
  />
);

function Notebook() {
  const spread = useMedia("(min-width: 768px)");
  const reduced = useReducedMotion();
  const rootRef = useRef(null);

  // State untuk halaman buku (0 = tutup, 1 = halaman 1, dst)
  const [page, setPage] = useState(0);

  const width = spread
    ? "max(28rem, min(100%, 52rem, calc((100svh - 6rem) * 1.5)))"
    : "max(15rem, min(100%, 24rem, calc((100svh - 11rem) * .75)))";

  const edge = { top: "-.6em", bottom: "-.6em" };
  const boardCls = "absolute bg-ink/90";

  const goNext = () => setPage((p) => Math.min(p + 1, TOTAL_LEAVES));
  const goPrev = () => setPage((p) => Math.max(p - 1, 0));
  const closeBook = () => setPage(0);

  return (
    <div ref={rootRef} className="flex flex-col items-center">
      <div
        className="relative touch-pan-y"
        style={{ containerType: "inline-size", width }}
      >
        <motion.div
          aria-hidden="true"
          className="relative w-full"
          initial={false}
          style={{
            aspectRatio: spread ? "3 / 2" : "3 / 4",
            fontSize: spread ? "2.08cqw" : "4.16cqw",
          }}
          // Geser buku ke kanan di mobile jika halaman dibuka agar konten terlihat
          animate={{ x: !spread && page > 0 ? "50%" : "0%" }}
          transition={{
            duration: reduced ? 0 : 0.8,
            ease: EASE,
          }}
        >
          {/* Base board hitam di belakang buku */}
          <div
            className={boardCls}
            style={{ ...edge, left: spread ? "50%" : "-.4em", right: "-.6em" }}
          />
          {spread && (
            <motion.div
              className={boardCls}
              style={{ ...edge, left: "-.6em", width: "50%" }}
              initial={false}
              animate={{ opacity: page > 0 ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Wrapper 3D untuk menampung lembaran buku */}
          <div
            className="absolute inset-0 flex justify-end"
            style={{ perspective: "2600px", transformStyle: "preserve-3d" }}
          >
            {/* Generate Lembar Kosong */}
            {Array.from({ length: TOTAL_LEAVES }).map((_, i) => (
              <Leaf key={i} index={i} currentPage={page} spread={spread} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Kontrol Navigasi Buku */}
      <div className="mt-12 flex min-h-12 flex-wrap items-center justify-center gap-3 relative z-10">
        <CtrlBtn
          label="Tutup buku"
          onClick={closeBook}
          disabled={page === 0}
          className="rounded-full"
        >
          <X size={20} />
        </CtrlBtn>

        <div className="flex gap-2">
          <CtrlBtn
            label="Halaman sebelumnya"
            onClick={goPrev}
            disabled={page === 0}
            className="rounded-l-full pl-2"
          >
            <ChevronLeft size={24} />
          </CtrlBtn>
          <CtrlBtn
            label="Halaman selanjutnya"
            onClick={goNext}
            disabled={page === TOTAL_LEAVES}
            className="rounded-r-full pr-2"
          >
            <ChevronRight size={24} />
          </CtrlBtn>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── evidence board pieces ───────────────────────── */

function Float({
  progress,
  depth = 1,
  rot = 0,
  delay = 0,
  reduced,
  className = "",
  children,
}) {
  const y = useTransform(
    progress,
    [0, 1],
    reduced || !depth ? [0, 0] : [34 * depth, -34 * depth],
  );
  return (
    <motion.div style={{ y }} className={className}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: rot - 8 }}
        whileInView={{ opacity: 1, scale: 1, rotate: rot }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ rotate: rot + 3, scale: 1.04 }}
      >
        <motion.div
          animate={reduced ? undefined : { y: [0, -6, 0] }}
          transition={{
            duration: 5 + delay * 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

const Snap = ({
  src,
  cap,
  pos = "50% 25%",
  tape = "-top-3 left-1/2 -translate-x-1/2",
}) => (
  <div className="relative bg-white p-2.5 pb-10 text-ink shadow-lg">
    <img
      src={src}
      alt=""
      loading="lazy"
      className="aspect-[4/5] w-full object-cover"
      style={{ objectPosition: pos }}
    />
    <p className="absolute inset-x-3 bottom-2 font-mono font-bold uppercase text-[.7em] leading-none text-ink/80 bg-sun px-2 py-1">
      {cap}
    </p>
    <Tape className={`h-4 w-12 ${tape}`} />
  </div>
);

const Sticky = () => (
  <div className="relative w-44 bg-butter p-4 pt-6 text-ink shadow-md">
    <i
      aria-hidden
      className="absolute -top-3 left-1/2 h-4 w-4 -translate-x-1/2 bg-ink/80"
    />
    <p className="font-mono text-[1.1em] font-bold uppercase leading-[1.2]">
      ask "what if?" before asking "how?"
    </p>
    <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-ink bg-white px-2 py-1 w-fit">
      — Haidar
    </p>
  </div>
);

const Scrap = () => (
  <div className="w-44">
    <div className="relative px-5 py-7 text-ink bg-white shadow-md">
      <p className="font-serif text-[1.8em] font-bold uppercase leading-[1.05]">
        6 Files.
        <br />1 Mind.
      </p>
      <p className="mt-3 text-[10px] font-mono font-bold uppercase tracking-widest text-cream bg-ink px-2 py-1 w-fit">
        No. 001—006
      </p>
    </div>
  </div>
);

const RoundStamp = () => (
  <div className="grid h-28 w-28 place-items-center rounded-full bg-sun text-center text-ink shadow-sm">
    <div>
      <p className="text-[8px] font-bold uppercase tracking-[.25em]">
        Verified
      </p>
      <p className="my-1 font-serif text-2xl font-bold leading-none">001—006</p>
      <p className="text-[8px] font-bold uppercase tracking-[.25em]">
        Vol. 01 · 2026
      </p>
    </div>
  </div>
);

/* ───────────────────────── section ───────────────────────── */

export default function Skills() {
  const reduced = useReducedMotion();
  const stage = useRef(null);
  const { scrollYProgress } = useScroll({
    target: stage,
    offset: ["start end", "end start"],
  });
  const f = { progress: scrollYProgress, reduced };

  return (
    <section
      id="skills"
      data-nav="dark"
      aria-label="My interests and skills"
      className="relative overflow-hidden bg-cream text-ink"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[1]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(10,22,3,0.1) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      <header className="relative mx-auto max-w-[1500px] px-5 pt-20 md:px-10 lg:px-28">
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
          <div>
            <h1 className="mt-2 text-[clamp(2.5rem,8vw,7rem)] font-serif font-extrabold uppercase leading-[0.85] tracking-tighter text-ink">
              Mahya
            </h1>
          </div>
          <Reveal delay={0.25} className="pl-4">
            <p className="font-mono text-[.9rem] font-bold uppercase leading-snug text-ink bg-sun px-2 py-1 w-fit mb-2">
              System Log
            </p>
            <p className="font-serif text-lg md:text-2xl font-bold uppercase leading-tight text-ink/90">
              A record of tools, methods, and creative disciplines.
            </p>
            <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-ink/40">
              [ {interests.join(" · ").toUpperCase()} ]
            </p>
          </Reveal>
        </div>
      </header>

      <div
        ref={stage}
        className="relative mx-auto max-w-[1500px] px-4 pb-24 pt-14 md:px-10 lg:px-28 lg:pb-32 lg:pt-20"
      >
        <div className="mb-10 flex items-start justify-center gap-6 lg:hidden">
          <Float {...f} depth={0} rot={-4} className="scale-90 sm:scale-100">
            <Sticky />
          </Float>
          <Float
            {...f}
            depth={0}
            rot={5}
            delay={0.15}
            className="hidden sm:block"
          >
            <RoundStamp />
          </Float>
        </div>

        <div aria-hidden className="hidden lg:block">
          <Float
            {...f}
            depth={1.2}
            rot={-6}
            className="absolute left-[1%] top-[3%] z-0 w-40"
          >
            <Snap src="/images/haidar-2.jpg" cap="Ref 01" pos="50% 20%" />
          </Float>
          <Float
            {...f}
            depth={0.8}
            rot={4}
            delay={0.1}
            className="absolute right-[2%] top-[6%] z-0"
          >
            <Sticky />
          </Float>
          <Float
            {...f}
            depth={1.4}
            rot={-3}
            delay={0.2}
            className="absolute bottom-[7%] left-[1.5%] z-0"
          >
            <Scrap />
          </Float>
          <Float
            {...f}
            depth={1}
            rot={5}
            delay={0.3}
            className="absolute bottom-[4%] right-[1%] z-0 w-40"
          >
            <Snap
              src="/images/haidar-3.jpg"
              cap="est. ’26"
              pos="50% 15%"
              tape="-top-3 left-1/2 -translate-x-1/2"
            />
          </Float>
          <Float
            {...f}
            depth={0.6}
            rot={-8}
            delay={0.35}
            className="absolute left-[3%] top-[47%] z-0"
          >
            <RoundStamp />
          </Float>
        </div>

        {/* Buku dengan halaman kosong */}
        <Notebook />
      </div>
    </section>
  );
}
