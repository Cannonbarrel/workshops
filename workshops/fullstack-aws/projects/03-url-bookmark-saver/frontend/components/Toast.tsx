'use client';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

export default function Toast({ message, type }: ToastProps) {
  const isSuccess = type === 'success';

  return (
    <div className={`
      fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl
      shadow-xl border animate-slide-in max-w-sm pointer-events-none
      ${isSuccess
        ? 'bg-zinc-900 border-zinc-700 text-white'
        : 'bg-red-950 border-red-800 text-red-100'}
    `}>
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
        ${isSuccess ? 'bg-emerald-500/20' : 'bg-red-500/20'}
      `}>
        {isSuccess ? (
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
