import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, Clock, MailCheck, ExternalLink } from 'lucide-react';
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
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate email
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
        // In development, if backend returns a token, use it
        // Otherwise, generate a mock token for development
        const token = response.data?.token || btoa(email + ':' + Date.now()).replace(/[^a-zA-Z0-9]/g, '');
        setResetToken(token);
        setSuccess(true);
      } else {
        setError(response.error || response.message || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      console.error('Error sending reset email:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600">
            {success 
              ? 'Check your email for reset instructions' 
              : 'Enter your email to receive reset instructions'}
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8 w-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fadeIn">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-fadeIn">
                <div className="flex items-start gap-3">
                  <MailCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-700 text-sm font-medium mb-1">
                      Reset link sent successfully!
                    </p>
                    <p className="text-green-600 text-sm">
                      Instructions have been sent to <strong>{email}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Follow these steps to reset your password:</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                      <span className="text-purple-600 text-xs font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <p className="text-sm font-medium text-gray-900">Check your email inbox</p>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">
                        Look for an email from us with the subject "Password Reset Request"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                      <span className="text-purple-600 text-xs font-bold">2</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <KeyRound className="w-4 h-4 text-gray-500" />
                        <p className="text-sm font-medium text-gray-900">Click the reset link</p>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">
                        The link will take you to a secure page where you can create a new password
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                      <span className="text-purple-600 text-xs font-bold">3</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-gray-500" />
                        <p className="text-sm font-medium text-gray-900">Create your new password</p>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">
                        Enter a strong password and confirm it. You'll then be able to log in with your new password.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Development Mode: Show reset link directly */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-3">
                  <KeyRound className="w-4 h-4 text-yellow-700 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-900 mb-1">Development Mode</p>
                    <p className="text-xs text-yellow-800 mb-3">
                      In development, the reset link is shown below. In production, this would be sent via email.
                    </p>
                    <Link
                      to={`/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Click here to reset your password
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Important Notes:</p>
                    <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                      <li>The reset link expires in 1 hour for security reasons</li>
                      <li>In production, check your email inbox for the reset link</li>
                      <li>If you don't see the email, check your spam/junk folder</li>
                      <li>Only the most recent reset link will be valid</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Back to Login
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 text-sm"
                >
                  Send another email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                name="email"
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
      <div className='w-full mt-4'>
        <Footer />
      </div>
    </div>
  );
};

export default ForgotPassword;

