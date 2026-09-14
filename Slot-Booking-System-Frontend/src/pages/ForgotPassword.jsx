import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, Clock, MailCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Footer from '../components/ui/Footer';
import authAPI from '../services/authAPI';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.forgotPassword(email.trim());

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error || response.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      // Surface a clear message if email/SMTP isn't configured yet
      const msg = err.message || '';
      if (msg.toLowerCase().includes('configured') || msg.toLowerCase().includes('gmail')) {
        setError('Email sending is not yet configured on this server. Please contact an administrator.');
      } else {
        setError(msg || 'Failed to send reset email. Please try again.');
      }
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">
            {success
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive a reset link'}
          </p>
        </div>

        <Card className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fadeIn">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              {/* Success banner */}
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-fadeIn">
                <div className="flex items-start gap-3">
                  <MailCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 text-sm font-semibold mb-1">
                      Reset link sent!
                    </p>
                    <p className="text-green-600 text-sm">
                      Instructions have been sent to <strong>{email}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">What to do next:</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Check your email inbox', detail: 'Look for an email from us with the subject "Password Reset Request".' },
                    { label: 'Click the reset link', detail: 'The link takes you to a secure page to create a new password.' },
                    { label: 'Create a new password', detail: "Enter and confirm your new password. You'll be logged in immediately." },
                  ].map((step, i) => {
                    const StepIcons = [Mail, KeyRound, CheckCircle2];
                    const StepIcon = StepIcons[i];
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                          <span className="text-purple-600 text-xs font-bold">{i + 1}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <StepIcon className="w-4 h-4 text-gray-500" />
                            <p className="text-sm font-medium text-gray-900">{step.label}</p>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">{step.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expiry note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">Important</p>
                  <ul className="text-xs text-blue-800 space-y-1 list-disc ml-4">
                    <li>The reset link expires in <strong>1 hour</strong></li>
                    <li>Check your spam/junk folder if you don't see it</li>
                    <li>Only the most recent reset link is valid</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => { setSuccess(false); setEmail(''); }}
                  className="w-full text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 text-sm"
                >
                  Didn't receive it? Send again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                name="email"
                id="forgot-email"
                placeholder="you@example.com"
                icon={Mail}
                value={email}
                onChange={handleChange}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
                id="forgot-submit"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/login"
              className="flex items-center justify-center text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </Card>
      </div>
      <div className="w-full mt-4">
        <Footer />
      </div>
    </div>
  );
};

export default ForgotPassword;
