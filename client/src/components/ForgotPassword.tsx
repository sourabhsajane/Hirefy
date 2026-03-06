import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './ForgotPassword.css';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.requiresVerification) {
        setSuccess(response.data.message);
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-reset-otp', { email, otp });
      
      if (response.data.verified) {
        setSuccess(response.data.message);
        setStep('reset');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/reset-password', { 
        email, 
        password: newPassword, 
        otp 
      });
      
      setSuccess(response.data.message);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <Card className="forgot-password-card">
      <Card.Body className="p-5">
        <div className="text-center mb-4">
          <div className="forgot-password-icon">
            <i className="fas fa-lock"></i>
          </div>
          <h3 className="forgot-password-title">Forgot Password?</h3>
          <p className="forgot-password-subtitle">
            No worries! Enter your email address and we'll send you a verification code to reset your password.
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleEmailSubmit}>
          <Form.Group className="mb-4">
            <Form.Label className="form-label">Email Address</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-envelope"></i>
              </span>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="form-control-custom"
              />
            </div>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-100 forgot-password-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                Sending Code...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane me-2"></i>
                Send Reset Code
              </>
            )}
          </Button>
        </Form>

        <div className="text-center mt-4">
          <p className="text-muted">
            Remember your password?{' '}
            <Link to="/login" className="forgot-password-link">
              Back to Login
            </Link>
          </p>
        </div>
      </Card.Body>
    </Card>
  );

  const renderOtpStep = () => (
    <Card className="forgot-password-card">
      <Card.Body className="p-5">
        <div className="text-center mb-4">
          <div className="forgot-password-icon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h3 className="forgot-password-title">Verify Your Email</h3>
          <p className="forgot-password-subtitle">
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleOtpSubmit}>
          <Form.Group className="mb-4">
            <Form.Label className="form-label">Verification Code</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-key"></i>
              </span>
              <Form.Control
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
                className="form-control-custom text-center"
                style={{ fontSize: '1.2rem', letterSpacing: '0.5rem' }}
              />
            </div>
            <Form.Text className="text-muted">
              Enter the 6-digit code sent to your email
            </Form.Text>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-100 forgot-password-btn"
            disabled={loading || otp.length !== 6}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                Verifying...
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Verify Code
              </>
            )}
          </Button>
        </Form>

        <div className="text-center mt-4">
          <p className="text-muted">
            Didn't receive the code?{' '}
            <Button
              variant="link"
              className="forgot-password-link p-0"
              onClick={() => setStep('email')}
            >
              Try again
            </Button>
          </p>
        </div>
      </Card.Body>
    </Card>
  );

  const renderResetStep = () => (
    <Card className="forgot-password-card">
      <Card.Body className="p-5">
        <div className="text-center mb-4">
          <div className="forgot-password-icon">
            <i className="fas fa-key"></i>
          </div>
          <h3 className="forgot-password-title">Reset Your Password</h3>
          <p className="forgot-password-subtitle">
            Create a new password for your account
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handlePasswordReset}>
          <Form.Group className="mb-3">
            <Form.Label className="form-label">New Password</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-lock"></i>
              </span>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="form-control-custom"
              />
            </div>
            <Form.Text className="text-muted">
              Password must be at least 6 characters long
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="form-label">Confirm New Password</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-lock"></i>
              </span>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="form-control-custom"
              />
            </div>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-100 forgot-password-btn"
            disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                Resetting Password...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Reset Password
              </>
            )}
          </Button>
        </Form>

        <div className="text-center mt-4">
          <p className="text-muted">
            Remember your password?{' '}
            <Link to="/login" className="forgot-password-link">
              Back to Login
            </Link>
          </p>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <div className="forgot-password-page" style={{ paddingTop: '80px' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            {step === 'email' && renderEmailStep()}
            {step === 'otp' && renderOtpStep()}
            {step === 'reset' && renderResetStep()}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ForgotPassword;
