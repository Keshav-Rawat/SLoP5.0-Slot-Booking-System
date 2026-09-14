import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Footer from '../components/ui/Footer';
import authAPI from '../services/authAPI';

/**
 * ResetPassword page — reached by clicking the link in the reset email.
 * URL format: /reset-password?token=<rawToken>&email=<encodedEmail>
 *
 * On success the API returns a JWT, so we log the user in immediately.
 */
const ResetPassword = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // If there's no token in the URL the link is broken/expired
  const isValidLink = Boolean(token);

  // Password strength helpers
  const checks = [
    { label: 'At least 6 characters', pass: password.length >= 6 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
  ];
  const strongEnough = password.length >= 6;

  useEffect(() => {
    if (!isValidLink) {
      setError('Invalid or missing reset token. Please request a new reset link.');
    }
  }, [isValidLink]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!strongEnough) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.resetPassword({ token, password });

      if (response.success) {
        // Auto-login: backend returns a JWT on successful reset
        if (response.data?.token && response.data?.user) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          if (onLogin) onLogin(response.data.user);
        }
        setSuccess(true);
        // Redirect to dashboard after short delay
        setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
      } else {
        setError(response.error || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again or request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex flex-wrap items-center justify-center pt-20">
      <div className="w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300">
            <KeyRound className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">New Password</h1>
          {email && (
            <p className="text-gray-600 text-sm">
              Resetting password for <strong>{email}</strong>
            </p>
          )}
        </div>

        <Card className="p-8">
          {/* Success state */}
          {success ? (
            <div className="space-y-6 text-center">
              <div className="inline-flex p-4 bg-green-100 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h2>
                <p className="text-gray-600 text-sm">
                  Your password has been reset successfully. You're now logged in and will be
                  redirected to the dashboard shortly.
                </p>
              </div>
              <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              {/* Invalid token guard */}
              {!isValidLink ? (
                <div className="space-y-6">
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-700 text-sm font-semibold mb-1">Invalid reset link</p>
                      <p className="text-red-600 text-sm">
                        This link is missing or malformed. Please request a new password reset.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg font-semibold text-sm hover:opacity-90 transition"
                  >
                    Request New Reset Link
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fadeIn">
                      <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {/* New password */}
                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="reset-password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-700 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Strength indicators */}
                  {password && (
                    <div className="space-y-1.5 -mt-2">
                      {checks.map(({ label, pass }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${pass ? 'bg-green-500' : 'bg-gray-200'}`} />
                          <span className={`text-xs ${pass ? 'text-green-700' : 'text-gray-500'}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Confirm password */}
                  <div className="relative">
                    <Input
                      label="Confirm New Password"
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      id="reset-confirm"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-700 transition-colors"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Match indicator */}
                  {confirmPassword && (
                    <div className="flex items-center gap-2 -mt-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${password === confirmPassword ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className={`text-xs ${password === confirmPassword ? 'text-green-700' : 'text-red-600'}`}>
                        {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                      </span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={loading || !strongEnough || password !== confirmPassword}
                    id="reset-submit"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              )}
            </>
          )}

          {!success && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                to="/forgot-password"
                className="flex items-center justify-center text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Request a new reset link
              </Link>
            </div>
          )}
        </Card>
      </div>
      <div className="w-full mt-4">
        <Footer />
      </div>
    </div>
  );
};

export default ResetPassword;
