import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { setAuth } from '../utils/auth';

const OTPVerification: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from location state or localStorage
    const emailFromState = location.state?.email;
    const emailFromStorage = localStorage.getItem('pendingEmail');
    
    if (emailFromState) {
      setEmail(emailFromState);
      localStorage.setItem('pendingEmail', emailFromState);
    } else if (emailFromStorage) {
      setEmail(emailFromStorage);
    } else {
      // No email found, redirect to signup
      navigate('/signup');
    }

    // Start countdown timer
    setCountdown(60);
  }, [location.state, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp
      });
      
      // Store auth data
      setAuth(response.data.token, response.data.user);
      
      // Clear pending email
      localStorage.removeItem('pendingEmail');
      
      // Redirect based on user role
      const userRole = response.data.user.role;
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'recruiter') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/candidate/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');

    try {
      await api.post('/auth/resend-otp', { email });
      setCountdown(60);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light" style={{ paddingTop: '80px' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <i className="fas fa-envelope-open-text fa-3x text-primary"></i>
                  </div>
                  <h2 className="fw-bold text-primary">Verify Your Email</h2>
                  <p className="text-muted">
                    We've sent a 6-digit verification code to
                  </p>
                  <p className="fw-bold text-dark">{email}</p>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label>Enter Verification Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={otp}
                      onChange={handleOtpChange}
                      placeholder="000000"
                      className="text-center py-3"
                      style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                      maxLength={6}
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 py-2 mb-3"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Email'
                    )}
                  </Button>
                </Form>

                <div className="text-center">
                  <p className="text-muted mb-2">
                    Didn't receive the code?
                  </p>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleResendOtp}
                    disabled={resendLoading || countdown > 0}
                  >
                    {resendLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Sending...
                      </>
                    ) : countdown > 0 ? (
                      `Resend in ${countdown}s`
                    ) : (
                      'Resend Code'
                    )}
                  </Button>
                  
                  <div className="mt-3">
                    <Link to="/signup" className="text-muted text-decoration-none">
                      ← Back to Sign Up
                    </Link>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default OTPVerification;
