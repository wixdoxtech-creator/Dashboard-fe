
export default function InteractiveLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex w-full h-[10vh] items-center justify-center gap-3" role="status" aria-live="polite">
      <p className="text-lg text-gray-500">{label}</p>
      <div className="flex items-end gap-2">
        <span className="block w-2 h-2 rounded-full bg-gray-400 dot" style={{ animationDelay: "0s" }} />
        <span className="block w-2 h-2 rounded-full bg-gray-400 dot" style={{ animationDelay: "0.12s" }} />
        <span className="block w-2 h-2 rounded-full bg-gray-400 dot" style={{ animationDelay: "0.24s" }} />
      </div>

      <style>{`
        .dot {
          animation: upDown 0.8s ease-in-out infinite;
          transform-origin: center bottom;
        }
        @keyframes upDown {
          0%, 80%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          40% { transform: translateY(-6px) scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
