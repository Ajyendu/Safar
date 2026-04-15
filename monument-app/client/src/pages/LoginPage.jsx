import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getStableAuthMonumentPhoto } from "../data/monumentAuthPhotos.js";
import { SafarLogo } from "../components/SafarLogo.jsx";

function BackIcon() {
  return (
    <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function PhotoPanel({ photo }) {
  return (
    <div className="relative min-h-[180px] md:h-full md:min-h-0">
      <img src={photo.src} alt={photo.alt} className="absolute inset-0 h-full w-full object-cover" loading="eager" decoding="async" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/35" />
      <div className="relative flex h-full min-h-[180px] flex-col items-center justify-between p-5 md:min-h-full md:p-7">
        <div className="flex flex-col items-center gap-2 pt-2 text-white">
          <SafarLogo className="h-10 w-10 text-white drop-shadow-md" />
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/95">Safar</span>
        </div>
        <p className="max-w-[15rem] text-center text-xs font-medium leading-relaxed text-white/90 md:text-sm">
          Explore monuments around the world-one journey at a time.
        </p>
      </div>
    </div>
  );
}

function LoginFormPanel({
  closeModal,
  channel,
  setChannel,
  clearSelection,
  identifier,
  setIdentifier,
  otp,
  setOtp,
  otpSent,
  devOtp,
  error,
  loading,
  requestCode,
  verifyCode,
  resendCooldown,
  onGoogleSignIn,
}) {
  const idLabel = channel === "email" ? "Gmail address" : "Phone number";
  const idPlaceholder = channel === "email" ? "you@gmail.com" : "+91 98765 43210";
  const methodSelected = Boolean(channel);
  const canResend = resendCooldown <= 0;

  return (
    <div className="flex min-h-0 max-h-[min(78vh,calc(100vh-8rem))] flex-col overflow-hidden bg-white md:h-full md:max-h-none md:min-h-0">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-8 sm:px-10 sm:py-10 md:py-12">
        <button type="button" onClick={closeModal} className="-ml-1 mb-5 inline-flex w-fit items-center gap-2 rounded-full px-1 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
          <BackIcon />
          <span>Back</span>
        </button>

        <h1 id="auth-title" className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Log in
        </h1>
        <p className="mt-2 text-sm text-slate-600">Sign in with Google or your phone number.</p>

        <p className="mt-4 text-sm font-semibold tracking-wide text-slate-500" aria-live="polite">
          Coming soon
        </p>

        <form onSubmit={otpSent ? verifyCode : requestCode} className="mt-6 space-y-4">
          {!methodSelected ? (
            <div className="mx-auto w-full max-w-md py-3">
              <div className="space-y-8 text-center">
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="mx-auto w-full rounded-full border border-slate-200 px-4 py-4 text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-xs font-medium uppercase tracking-wide text-slate-400">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setChannel("phone")}
                  className="mx-auto w-full rounded-full border border-slate-200 px-4 py-4 text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  Continue with Phone number
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">
                  {channel === "email" ? "Gmail selected" : "Phone selected"}
                </span>
                {!otpSent && (
                  <button type="button" onClick={clearSelection} className="font-medium text-slate-500 hover:text-slate-800">
                    Change
                  </button>
                )}
              </div>
              <div>
                <label htmlFor="login-id" className="mb-1.5 block text-sm font-medium text-slate-500">
                  {idLabel}
                </label>
                <input
                  id="login-id"
                  type={channel === "email" ? "email" : "tel"}
                  required
                  className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                  placeholder={idPlaceholder}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </>
          )}

          {otpSent && (
            <div>
              <label htmlFor="login-otp" className="mb-1.5 block text-sm font-medium text-slate-500">
                OTP Code
              </label>
              <input
                id="login-otp"
                type="text"
                inputMode="numeric"
                required
                minLength={4}
                maxLength={8}
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm tracking-[0.22em] text-slate-900 outline-none ring-slate-900/10 placeholder:tracking-normal placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {devOtp && <p className="text-xs text-amber-600">Dev OTP: {devOtp}</p>}

          {otpSent && (
            <button type="submit" disabled={loading || !otp.trim()} className="w-full rounded-full bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60">
              {loading ? "..." : "Verify & Log in"}
            </button>
          )}

          {otpSent && (
            <button
              type="button"
              onClick={requestCode}
              disabled={loading || !canResend}
              className="w-full rounded-full border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {canResend ? "Resend OTP" : `Resend OTP in ${resendCooldown}s`}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

function AuthForm() {
  const { requestOtp, verifyOtp, googleAuth } = useAuth();
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [photo] = useState(() => getStableAuthMonumentPhoto());
  const [channel, setChannel] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const closeModal = () => {
    window.location.hash = "";
  };

  const buildPayload = () => {
    const clean = identifier.trim();
    return channel === "email"
      ? { channel, purpose: "login", email: clean }
      : { channel, purpose: "login", phone: clean };
  };

  const requestCode = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setError(null);
    if (!channel) {
      setError("Please choose Google or Phone first.");
      return;
    }
    setLoading(true);
    try {
      const data = await requestOtp(buildPayload());
      setOtpSent(true);
      setResendCooldown(30);
      setDevOtp(data.devOtp || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isIdentifierValid = () => {
    const v = identifier.trim();
    if (!v || !channel) return false;
    if (channel === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const digits = v.replace(/\D/g, "");
    return digits.length >= 7;
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = { ...buildPayload(), otp: otp.trim() };
      await verifyOtp(payload);
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-in is not configured.");
      return;
    }
    const gsi = window.google?.accounts?.id;
    if (!gsi) {
      setError("Google SDK not loaded. Refresh and try again.");
      return;
    }
    setLoading(true);
    try {
      await new Promise((resolve, reject) => {
        gsi.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          callback: async (response) => {
            try {
              await googleAuth(response.credential);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
        });
        gsi.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            reject(new Error("Google account chooser unavailable. Please allow popups and try again."));
          }
        });
      });
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = window.setInterval(() => {
      setResendCooldown((v) => (v <= 1 ? 0 : v - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (otpSent || loading) return;
    if (!isIdentifierValid()) return;
    const t = window.setTimeout(() => {
      requestCode();
    }, 550);
    return () => window.clearTimeout(t);
  }, [channel, identifier, otpSent, loading]);

  const common = {
    closeModal,
    channel,
    setChannel: (v) => {
      setChannel(v);
      setOtpSent(false);
      setOtp("");
      setResendCooldown(0);
      setDevOtp("");
      setError(null);
    },
    clearSelection: () => {
      setChannel("");
      setIdentifier("");
      setOtpSent(false);
      setOtp("");
      setResendCooldown(0);
      setDevOtp("");
      setError(null);
    },
    identifier,
    setIdentifier,
    otp,
    setOtp,
    otpSent,
    devOtp,
    error,
    loading,
    requestCode,
    verifyCode,
    resendCooldown,
    onGoogleSignIn: handleGoogleSignIn,
  };

  const form = <LoginFormPanel {...common} />;
  const photoPanel = <PhotoPanel photo={photo} />;

  return (
    <div className="fixed inset-0 z-[10] flex items-center justify-center overflow-y-auto overscroll-contain p-3 sm:p-5">
      <button type="button" className="absolute inset-0 z-0 bg-slate-950/50 backdrop-blur-md" aria-label="Close" onClick={closeModal} />
      <div className="relative z-10 my-auto w-full max-w-4xl overflow-hidden rounded-[1.5rem] bg-white shadow-2xl shadow-black/40 sm:rounded-[2rem] min-h-[500px] md:h-[620px] md:max-h-[82vh] md:min-h-0">
        <div className="grid h-full min-h-[500px] grid-cols-1 md:min-h-0 md:grid-cols-2">
          <div className="order-2 min-h-0 md:order-1">{form}</div>
          <div className="order-1 min-h-[180px] md:order-2 md:min-h-0">{photoPanel}</div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  return <AuthForm />;
}
