"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startChallenge, recoverByNameAndPin } from "@/lib/auth";

// ── Static data ────────────────────────────────────────────────────────────

const REWARDS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
      </svg>
    ),
    title: "理財小達人證書",
    desc: "完成全部 30 天挑戰",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 0 .375 5.456v.467A2.625 2.625 0 0 0 5.25 17.625h13.5a2.625 2.625 0 0 0 2.625-2.496v-.467a3 3 0 0 0 .375-5.456V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
      </svg>
    ),
    title: "展覽門票",
    desc: "兌換親子理財博覽會入場券",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
    title: "專屬成就徽章",
    desc: "數位收藏紀念品",
  },
];

const STEPS = [
  {
    num: "01",
    title: "輸入你的名字",
    desc: "建立你的挑戰帳號",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "每天完成任務",
    desc: "點擊日曆格子打卡",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "累積 30 天",
    desc: "挑戰完成，領取獎勵！",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
];

// ── Types ──────────────────────────────────────────────────────────────────

type Mode = "idle" | "new" | "recover";
type Step = "namePin" | "goal"; // #11 — 新增目標設定步驟

// ── Component ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [step, setStep] = useState<Step>("namePin");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  // #5 — 頁面載入時先檢查 localStorage，已登入直接跳轉
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      router.replace("/calendar");
    } else {
      setCheckingSession(false);
    }
  }, [router]);

  function handleClose() {
    setMode("idle");
    setStep("namePin");
    setName("");
    setPin("");
    setGoal("");
    setError("");
  }

  function validateNamePin(): string {
    const trimmed = name.trim();
    if (!trimmed) return "請輸入你的名字！";
    if (trimmed.length > 20) return "名字太長了，請縮短一點。";
    if (!/^\d{4}$/.test(pin)) return "請輸入4位數字密碼！";
    return "";
  }

  // 新帳號：先填名字+PIN，按下一步再填目標
  function handleNextStep() {
    const err = validateNamePin();
    if (err) { setError(err); return; }
    setError("");
    setStep("goal");
  }

  async function handleStart() {
    setError("");
    setLoading(true);
    try {
      const { userId, userName, goal: savedGoal } = await startChallenge(
        name.trim(),
        pin,
        goal.trim() || undefined
      );
      localStorage.setItem("userId", userId);
      localStorage.setItem("userName", userName);
      if (savedGoal) localStorage.setItem("userGoal", savedGoal);
      router.push("/calendar");
    } catch (err) {
      console.error("Firebase 錯誤 [handleStart]：", err);
      setError("發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecover() {
    const err = validateNamePin();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      const result = await recoverByNameAndPin(name.trim(), pin);
      if (!result) {
        setError("找不到符合的帳號，請確認名字和密碼是否正確。");
        return;
      }
      localStorage.setItem("userId", result.userId);
      localStorage.setItem("userName", result.userName);
      if (result.goal) localStorage.setItem("userGoal", result.goal);
      router.push("/calendar");
    } catch (err) {
      console.error("Firebase 錯誤 [handleRecover]：", err);
      setError("發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  const isFormOpen = mode === "new" || mode === "recover";

  // 等待 session 檢查完成，避免首頁閃爍再跳轉
  if (checkingSession) {
    return <div className="min-h-screen bg-amber-50" />;
  }

  return (
    <main className="min-h-screen bg-amber-50 overflow-x-hidden">
      {/* ── Decorative background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-amber-200 rounded-full opacity-40 blur-3xl" />
        <div className="absolute top-40 right-20 w-48 h-48 bg-yellow-200 rounded-full opacity-30 blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-green-200 rounded-full opacity-30 blur-3xl" />
        <div className="absolute bottom-40 right-10 w-24 h-24 bg-sky-200 rounded-full opacity-40 blur-3xl" />
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-16 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center gap-8 mb-8">
            <span className="float text-amber-400" style={{ animationDelay: "0s" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="float text-amber-500" style={{ animationDelay: "0.5s" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
              </svg>
            </span>
            <span className="float text-yellow-500" style={{ animationDelay: "1s" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
              </svg>
            </span>
          </div>

          <div className="inline-block bg-amber-400 text-amber-900 text-sm font-bold px-4 py-1 rounded-full mb-4 tracking-wide uppercase">
            2026年6月挑戰活動
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-amber-900 leading-tight mb-4">
            <span className="coin-shimmer">小小大富翁</span>
            <br />
            <span className="text-stone-800">養成計畫</span>
          </h1>

          <p className="text-xl sm:text-2xl font-bold text-amber-700 mb-3">
            ——我的第一筆夢想基金——
          </p>

          <p className="text-stone-600 text-lg max-w-xl mx-auto leading-relaxed mb-10">
            讓孩子透過每日存錢任務，學習
            <strong className="text-amber-700"> 等待、規劃與累積</strong>，
            建立正確的理財觀念。30天挑戰，從小種下財富的種子！
          </p>

          {/* CTA area */}
          {!isFormOpen ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => { setMode("new"); setStep("namePin"); }}
                className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white font-extrabold text-xl px-10 py-4 rounded-2xl shadow-lg shadow-amber-200 transition-all duration-200 hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
                立即開始挑戰
              </button>
              <button
                onClick={() => { setMode("recover"); setStep("namePin"); }}
                className="bg-white hover:bg-amber-50 border-2 border-amber-300 text-amber-700 font-bold text-xl px-10 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0Zm8-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-6.938 8.298A4 4 0 0 1 6 12.5h8a4 4 0 0 1 2.938 1.298A7.974 7.974 0 0 1 10 18a7.974 7.974 0 0 1-6.938-2.702Z" clipRule="evenodd" />
                </svg>
                繼續我的挑戰
              </button>
            </div>
          ) : (
            <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-xl shadow-amber-100 p-8 border border-amber-100 relative">
              <button
                onClick={handleClose}
                aria-label="關閉"
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>

              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                {mode === "new" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-amber-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-amber-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                )}
              </div>

              {/* ── 新帳號步驟一：名字 + PIN ── */}
              {mode === "new" && step === "namePin" && (
                <>
                  <h2 className="font-display text-2xl font-bold text-stone-800 mb-1">你叫什麼名字？</h2>
                  <p className="text-stone-500 text-sm mb-6">輸入名字和4位數密碼，開始你的挑戰！</p>

                  <label htmlFor="user-name" className="block text-left text-sm font-semibold text-stone-600 mb-1">名字</label>
                  <input
                    id="user-name"
                    type="text"
                    placeholder="例如：小明、Amy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    className="w-full border-2 border-amber-200 focus:border-amber-400 outline-none rounded-xl px-4 py-3 text-lg font-semibold text-stone-800 bg-amber-50 placeholder:text-stone-400 mb-3 transition-colors"
                  />

                  <label htmlFor="user-pin" className="block text-left text-sm font-semibold text-stone-600 mb-1">
                    4位數密碼
                    <span className="text-stone-400 font-normal ml-1">（記住它，換裝置時需要）</span>
                  </label>
                  <input
                    id="user-pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="請輸入4位數字"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    onKeyDown={(e) => e.key === "Enter" && handleNextStep()}
                    maxLength={4}
                    className="w-full border-2 border-amber-200 focus:border-amber-400 outline-none rounded-xl px-4 py-3 text-lg font-semibold text-stone-800 bg-amber-50 placeholder:text-stone-400 mb-3 transition-colors tracking-widest"
                  />

                  {error && <p role="alert" className="text-red-500 text-sm font-semibold mb-3">{error}</p>}

                  <button
                    onClick={handleNextStep}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-lg py-3 rounded-xl shadow-md shadow-amber-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    下一步：設定目標
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              )}

              {/* ── 新帳號步驟二：設定存錢目標 (#11) ── */}
              {mode === "new" && step === "goal" && (
                <>
                  <h2 className="font-display text-2xl font-bold text-stone-800 mb-1">你的夢想目標是？</h2>
                  <p className="text-stone-500 text-sm mb-6">設定一個存錢目標，讓自己更有動力！（可跳過）</p>

                  <label htmlFor="user-goal" className="block text-left text-sm font-semibold text-stone-600 mb-1">我想存錢買⋯⋯</label>
                  <input
                    id="user-goal"
                    type="text"
                    placeholder="例如：一台遙控車、去迪士尼樂園"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
                    maxLength={30}
                    className="w-full border-2 border-amber-200 focus:border-amber-400 outline-none rounded-xl px-4 py-3 text-lg font-semibold text-stone-800 bg-amber-50 placeholder:text-stone-400 mb-3 transition-colors"
                  />

                  {error && <p role="alert" className="text-red-500 text-sm font-semibold mb-3">{error}</p>}

                  <button
                    onClick={handleStart}
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-extrabold text-lg py-3 rounded-xl shadow-md shadow-amber-200 transition-all duration-200 flex items-center justify-center gap-2 mb-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                        </svg>
                        建立中…
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clipRule="evenodd" />
                        </svg>
                        開始挑戰！
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setStep("namePin")}
                    className="w-full text-stone-400 hover:text-stone-600 text-sm font-semibold py-2 transition-colors"
                  >
                    ← 返回修改名字
                  </button>
                </>
              )}

              {/* ── 找回帳號：名字 + PIN ── */}
              {mode === "recover" && (
                <>
                  <h2 className="font-display text-2xl font-bold text-stone-800 mb-1">找回我的帳號</h2>
                  <p className="text-stone-500 text-sm mb-6">輸入你之前使用的名字和密碼來找回進度。</p>

                  <label htmlFor="recover-name" className="block text-left text-sm font-semibold text-stone-600 mb-1">名字</label>
                  <input
                    id="recover-name"
                    type="text"
                    placeholder="例如：小明、Amy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    className="w-full border-2 border-amber-200 focus:border-amber-400 outline-none rounded-xl px-4 py-3 text-lg font-semibold text-stone-800 bg-amber-50 placeholder:text-stone-400 mb-3 transition-colors"
                  />

                  <label htmlFor="recover-pin" className="block text-left text-sm font-semibold text-stone-600 mb-1">4 位數密碼</label>
                  <input
                    id="recover-pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="請輸入當初設定的密碼"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    onKeyDown={(e) => e.key === "Enter" && handleRecover()}
                    maxLength={4}
                    className="w-full border-2 border-amber-200 focus:border-amber-400 outline-none rounded-xl px-4 py-3 text-lg font-semibold text-stone-800 bg-amber-50 placeholder:text-stone-400 mb-3 transition-colors tracking-widest"
                  />

                  {error && <p role="alert" className="text-red-500 text-sm font-semibold mb-3">{error}</p>}

                  <button
                    onClick={handleRecover}
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-extrabold text-lg py-3 rounded-xl shadow-md shadow-amber-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
                        </svg>
                        處理中…
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                        </svg>
                        找回帳號
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-extrabold text-center text-stone-800 mb-10">如何參加？</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="text-center p-6 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="font-display text-5xl font-extrabold text-amber-300 mb-3">{s.num}</div>
                <div className="flex justify-center mb-2">{s.icon}</div>
                <h3 className="font-bold text-stone-800 text-lg mb-1">{s.title}</h3>
                <p className="text-stone-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rewards ── */}
      <section className="relative py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-extrabold text-center text-stone-800 mb-2">完成挑戰可獲得</h2>
          <p className="text-center text-stone-500 mb-10">完成全部30天打卡，即可兌換以下獎勵</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {REWARDS.map((r) => (
              <div
                key={r.title}
                className="bg-white rounded-3xl p-6 text-center shadow-lg shadow-amber-100 border border-amber-50 hover:-translate-y-1 transition-transform duration-200"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                  {r.icon}
                </div>
                <h3 className="font-bold text-stone-800 text-lg mb-1">{r.title}</h3>
                <p className="text-stone-500 text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center text-stone-400 text-sm border-t border-amber-100">
        <p>小小大富翁養成計畫 ©2026 ｜ 活動期間：2026/6/1 – 2026/6/30</p>
      </footer>
    </main>
  );
}
