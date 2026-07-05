// src/pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { supabase } from '../api/supabase';
import { motion } from 'framer-motion';

// ─── Validation helpers ───────────────────────────────────────────
const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
const validatePassword = (pwd) => pwd.length >= 6;

const initialForm = { email: '', password: '' };
const initialErrors = { email: '', password: '', general: '' };

export function Login() {
  const {
    loginWithEmail,
    isAuthenticated,
    profile,
    isOperationLoading,
    authError,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [showPassword, setShowPassword] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const emailInputRef = useRef(null);

  // ─── Redirect if already authenticated ──────────────────────────
  useEffect(() => {
    if (isAuthenticated && profile) {
      const from = location.state?.from?.pathname || '/intern';
      const destination = profile.role === 'admin' ? '/admin' : from;
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, profile, navigate, location]);

  // ─── Sync external auth error ──────────────────────────────────
  useEffect(() => {
    if (authError) {
      setErrors((prev) => ({ ...prev, general: authError }));
    }
  }, [authError]);

  // ─── Form handlers ──────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: '' }));
  };

  const validateForm = () => {
    const newErrors = { email: '', password: '', general: '' };
    let isValid = true;

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!validatePassword(form.password)) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors(initialErrors);
    setResendMessage('');

    if (!validateForm()) {
      if (errors.email) emailInputRef.current?.focus();
      return;
    }

    const result = await loginWithEmail(form.email, form.password);

    if (!result.success) {
      const errorMsg = result.error || 'Login failed. Please try again.';
      if (errorMsg.toLowerCase().includes('verify')) {
        setErrors((prev) => ({
          ...prev,
          general: 'Please verify your email before logging in.',
        }));
      } else {
        setErrors((prev) => ({ ...prev, general: errorMsg }));
      }
    }
  };

  // ─── Resend verification ────────────────────────────────────────
  const handleResendVerification = async () => {
    if (!form.email) {
      setErrors((prev) => ({
        ...prev,
        general: 'Please enter your email address first.',
      }));
      return;
    }

    setIsResending(true);
    setResendMessage('');
    setErrors((prev) => ({ ...prev, general: '' }));

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: form.email,
      });

      if (error) {
        if (error.message.includes('already confirmed')) {
          setErrors((prev) => ({
            ...prev,
            general: 'This email is already confirmed. Please try logging in.',
          }));
        } else {
          throw error;
        }
      } else {
        setResendMessage(
          '✅ Verification email resent! Please check your inbox and spam folder.',
        );
      }
    } catch (err) {
      console.error('Resend error:', err);
      setErrors((prev) => ({
        ...prev,
        general: 'Failed to resend verification email. Please try again later.',
      }));
    } finally {
      setIsResending(false);
    }
  };

  // ─── Inline SVG icons ───────────────────────────────────────────
  const EnvelopeIcon = (props) => (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  const LockIcon = (props) => (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );

  const EyeIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeSlashIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  const ArrowRightIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );

  const ArrowLeftIcon = (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#f8f7f9]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card padding="lg" className="shadow-xl border border-slate-200/80 relative">
          {/* 🔙 Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0080c8]"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-500" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#0080c8]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-2 ring-[#0080c8]/20">
              <EnvelopeIcon className="w-7 h-7 text-[#0080c8]" />
            </div>
            <h1 className="text-2xl font-bold text-[#2b2d42] mb-1">
              Welcome Back
            </h1>
            <p className="text-sm text-slate-500">
              Sign in to continue your internship journey
            </p>
          </div>

          {/* Error / Success messages */}
          {errors.general && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-red-700">{errors.general}</p>
                  {errors.general.includes('verify') && (
                    <button
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="text-xs text-red-600 hover:underline mt-1 font-medium disabled:opacity-50"
                    >
                      {isResending ? 'Sending...' : 'Resend verification email'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {resendMessage && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{resendMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              ref={emailInputRef}
              label="Email Address"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@company.com"
              autoComplete="email"
              disabled={isOperationLoading}
              icon={({ className }) => <EnvelopeIcon className={className} />}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Enter your password"
                  disabled={isOperationLoading}
                  className="pr-12"
                  icon={({ className }) => <LockIcon className={className} />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0080c8] rounded-full p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="mt-1 text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#0080c8] hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full group"
              size="lg"
              isLoading={isOperationLoading}
              disabled={isOperationLoading}
            >
              <span className="flex items-center justify-center gap-2">
                {isOperationLoading ? 'Signing in...' : 'Sign In'}
                {!isOperationLoading && (
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </span>
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              Invite‑only platform. Contact your administrator for access.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}