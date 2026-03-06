import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { setAuth } from '../utils/auth';

// Country codes for phone number validation
const countryCodes = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+7', country: 'RU', flag: '🇷🇺' },
  { code: '+55', country: 'BR', flag: '🇧🇷' }
];

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91',
    password: '',
    confirmPassword: '',
    role: 'candidate'
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Validation functions
  const validateName = (name: string): string => {
    if (!name.trim()) return 'Name is required';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name should contain only letters and spaces';
    if (name.trim().length < 2) return 'Name should be at least 2 characters long';
    return '';
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return 'Phone number is required';
    if (!/^\d{10}$/.test(phone)) return 'Phone number must be exactly 10 digits';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one digit';
    if (!/(?=.*[@$!%*?&])/.test(password)) return 'Password must contain at least one special character (@$!%*?&)';
    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For phone number, only allow digits
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: digitsOnly }));
      }
      return;
    }

    // For name, only allow letters and spaces
    if (name === 'name') {
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: lettersOnly }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    errors.name = validateName(formData.name);
    errors.email = validateEmail(formData.email);
    errors.phone = validatePhone(formData.phone);
    errors.password = validatePassword(formData.password);

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Remove empty errors
    Object.keys(errors).forEach(key => {
      if (!errors[key]) delete errors[key];
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      setError('Please fix the validation errors below');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, countryCode, ...signupData } = formData;
      // Combine country code and phone number
      const fullPhone = formData.countryCode + formData.phone;
      const dataToSend = { ...signupData, phone: fullPhone };

      const response = await api.post('/auth/register', dataToSend);
      
      // Check if OTP verification is required
      if (response.data.requiresVerification) {
        // Store email for OTP verification
        localStorage.setItem('pendingEmail', formData.email);
        // Redirect to OTP verification page
        navigate('/verify-otp');
      } else {
        // Direct registration (fallback)
        setAuth(response.data.token, response.data.user);
        
        // Redirect based on user role
        const userRole = response.data.user.role;
        if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else if (userRole === 'recruiter') {
          navigate('/recruiter/dashboard');
        } else {
          navigate('/candidate/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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
                  <h2 className="fw-bold text-primary">Join Hirefy</h2>
                  <p className="text-muted">Create your account to get started</p>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                      className="py-2"
                      isInvalid={!!validationErrors.name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      className="py-2"
                      isInvalid={!!validationErrors.email}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <InputGroup>
                      <Form.Select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleChange}
                        style={{ maxWidth: '120px' }}
                      >
                        {countryCodes.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.code}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="1234567890"
                        required
                        className="py-2"
                        isInvalid={!!validationErrors.phone}
                        maxLength={10}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.phone}
                      </Form.Control.Feedback>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Enter 10-digit phone number without country code
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>I am a</Form.Label>
                    <Form.Select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="py-2"
                    >
                      <option value="candidate">Job Seeker</option>
                      <option value="recruiter">Recruiter</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      required
                      className="py-2"
                      isInvalid={!!validationErrors.password}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.password}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      Password must contain: 8+ characters, uppercase, lowercase, digit, and special character (@$!%*?&)
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      className="py-2"
                      isInvalid={!!validationErrors.confirmPassword}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.confirmPassword}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 py-2 mb-3"
                    disabled={loading}
                    style={{ 
                      background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                      border: 'none'
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Form>

                <div className="text-center">
                  <p className="text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: '#fbbf24' }}>
                      Sign in here
                    </Link>
                  </p>
                  <Link to="/" className="text-muted text-decoration-none">
                    ← Back to Home
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Signup;
