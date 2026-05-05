"use client";

import React from "react";

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundaryWrapper extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message ?? "未知錯誤" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-amber-100 p-10 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-8 h-8 text-red-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            <h1 className="font-display text-2xl font-extrabold text-stone-800 mb-2">
              發生了一點問題
            </h1>
            <p className="text-stone-500 text-sm mb-6 leading-relaxed">
              頁面載入時遇到錯誤，請確認網路連線正常後重新整理。
              若問題持續發生，請聯絡活動主辦單位。
            </p>

            {this.state.message && (
              <p className="text-xs text-stone-300 font-mono mb-6 break-all">
                {this.state.message}
              </p>
            )}

            <button
              onClick={() => window.location.reload()}
              className="bg-amber-500 hover:bg-amber-400 text-white font-extrabold px-8 py-3 rounded-xl shadow-md shadow-amber-200 transition-all duration-200 hover:-translate-y-0.5"
            >
              重新整理頁面
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
