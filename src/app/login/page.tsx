import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0b0e] p-4">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(45,123,255,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Fine grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 w-full max-w-[400px]">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <p className="mb-1 text-xs font-semibold tracking-[0.2em] text-white/40 uppercase">
            BUSINESS OS
          </p>
          <h1
            className="neon-glow text-4xl font-bold tracking-widest text-white uppercase"
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.15em" }}
          >
            EVOX
          </h1>
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-8">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-white/25">
          Secure workspace • Your data stays private
        </p>
      </div>
    </main>
  );
}
