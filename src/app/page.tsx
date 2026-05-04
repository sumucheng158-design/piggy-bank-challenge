"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/firestore";

const REWARDS = [
  { icon: "🏆", title: "理財小達人證書", desc: "完成全部30天挑戰" },
  { icon: "🎟️", title: "展覽門票", desc: "兌換親子理財博覽會入場券" },
  { icon: "⭐", title: "專屬成就徽章", desc: "數位收藏紀念品" },
];

const STEPS = [
  { num: "01", title: "輸入你的名字", desc: "建立你的挑戰帳號" },
  { num: "02", title: "每天完成任務", desc: "點擊日曆格子打卡" },
  { num: "03", title: "累積30天", desc: "挑戰完成，領取獎勵！" },
];

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("請輸入你的名字！");
      return;
    }
    if (trimmed.length > 20) {
      setError("名字太長了，請縮短一點。");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await createUser(trimmed);
      // cache userId in localStorage for convenience
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.name);
      router.push("/calendar");
    } catch {
      setError("發生錯誤，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  function handleExistingUser() {
    const userId = localStorage.getItem("userId");
    if (userId) {
      router.push("/calendar");
    } else {
      setShowForm(true);
    }
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
          {/* Floating coins */}
          <div className="flex justify-center gap-8 mb-8">
            <span className="text-5xl float" style={{ animationDelay: "0s" }}>🪙</span>
            <span className="text-6xl float" style={{ animationDelay: "0.5s" }}>🐷</span>
            <span className="text-5xl float" style={{ animationDelay: "1s" }}>💰</span>
          </div>

          <div className="inline-block bg-amber-400 text-amber-900 text-sm font-bold px-4 py-1 rounded-full mb-4 tracking-wide uppercase">
            2026 年 6 月挑戰活動
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
          {!showForm ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white font-extrabold text-xl px-10 py-4 rounded-2xl shadow-lg shadow-amber-200 transition-all duration-200 hover:-translate-y-1"
              >
                🚀 立即開始挑戰
              </button>
              <button
                onClick={handleExistingUser}
                className="bg-white hover:bg-amber-50 border-2 border-amber-300 text-amber-700 font-bold text-xl px-10 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-1"
              >
                📖 繼續我的挑戰
              </button>
            </div>
          ) : (
            /* Registration form */
            <div className="max-w-sm mx-auto bg-white rounded-3xl shadow-xl shadow-amber-100 p-8 border border-amber-100">
              <div className="text-4xl mb-3">👶</div>
              <h2 className="font-display text-2xl font-bold text-stone-800 mb-1">
                你叫什麼名字？
              </h2>
              <p className="text-stone-500 text-sm mb-6">輸入你的名字，開始你的挑戰！</p>
              <input
                type="text"
                placeholder="例如：小明、Amy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                maxLength={20}
                className="w-full border-2 border-amber-200 focus:border-amber-400 outline-none rounded-xl px-4 py-3 text-lg font-semibold text-stone-800 bg-amber-50 placeholder:text-stone-400 mb-3 transition-colors"
              />
              {error && (
                <p className="text-red-500 text-sm font-semibold mb-3">{error}</p>
              )}
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-extrabold text-lg py-3 rounded-xl shadow-md shadow-amber-200 transition-all duration-200"
              >
                {loading ? "建立中…" : "✨ 開始挑戰！"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-extrabold text-center text-stone-800 mb-10">
            如何參加？
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.num} className="text-center p-6 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="font-display text-5xl font-extrabold text-amber-300 mb-2">
                  {s.num}
                </div>
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
          <h2 className="font-display text-3xl font-extrabold text-center text-stone-800 mb-2">
            完成挑戰可獲得
          </h2>
          <p className="text-center text-stone-500 mb-10">完成全部30天打卡，即可兌換以下獎勵</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {REWARDS.map((r) => (
              <div
                key={r.title}
                className="bg-white rounded-3xl p-6 text-center shadow-lg shadow-amber-100 border border-amber-50 hover:-translate-y-1 transition-transform duration-200"
              >
                <div className="text-5xl mb-3">{r.icon}</div>
                <h3 className="font-bold text-stone-800 text-lg mb-1">{r.title}</h3>
                <p className="text-stone-500 text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center text-stone-400 text-sm border-t border-amber-100">
        <p>小小大富翁養成計畫 © 2026 ｜ 活動期間：2026/6/1 – 2026/6/30</p>
      </footer>
    </main>
  );
}
