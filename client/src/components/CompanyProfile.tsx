import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Badge, Tab, Nav, Modal, Image, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import api from '../utils/api';
import Navbar from './Navbar';
import './CompanyProfile.css';

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

interface CompanyProfile {
  company_name: string;
  company_logo_url?: string;
  industry: string;
  company_size: string;
  founded_year: number;
  website: string;
  description: string;
  mission_statement: string;
  company_values: string[];
  headquarters_address: string;
  headquarters_city: string;
  headquarters_state: string;
  headquarters_country: string;
  headquarters_pin_code: string;
  contact_email: string;
  contact_phone: string;
  contact_phone_country_code: string;
  linkedin_url: string;
  twitter_url: string;
  facebook_url: string;
  instagram_url: string;
  benefits: string[];
  perks: string[];
  work_culture: string;
  remote_work_policy: string;
  diversity_inclusion: string;
}

interface Office {
  office_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  phone: string;
  email: string;
  is_headquarters: boolean;
  office_type: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
  image_caption: string;
  image_type: string;
}

const CompanyProfile: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [activeTab, setActiveTab] = useState('basic-info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabSuccess, setTabSuccess] = useState<{[key: string]: string}>({});
  const [tabError, setTabError] = useState<{[key: string]: string}>({});

  // Company profile data
  const [companyData, setCompanyData] = useState<CompanyProfile | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  // Form states
  const [formData, setFormData] = useState<CompanyProfile>({
    company_name: '',
    industry: '',
    company_size: '',
    founded_year: 0,
    website: '',
    description: '',
    mission_statement: '',
    company_values: [],
    headquarters_address: '',
    headquarters_city: '',
    headquarters_state: '',
    headquarters_country: '',
    headquarters_pin_code: '',
    contact_email: '',
    contact_phone: '',
    contact_phone_country_code: '+91',
    linkedin_url: '',
    twitter_url: '',
    facebook_url: '',
    instagram_url: '',
    benefits: [],
    perks: [],
    work_culture: '',
    remote_work_policy: '',
    diversity_inclusion: ''
  });

  const [newOffice, setNewOffice] = useState<Office>({
    office_name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    pin_code: '',
    phone: '',
    email: '',
    is_headquarters: false,
    office_type: 'branch'
  });

  const [newValue, setNewValue] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newPerk, setNewPerk] = useState('');

  // Modals
  const [showOfficeModal, setShowOfficeModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  useEffect(() => {
    loadCompanyProfile();
  }, []);

  const loadCompanyProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/company/profile');
      
      if (response.data.success && response.data.data) {
        const { company, offices: office, gallery } = response.data.data;
        setCompanyData(company);
        setOffices(office || []);
        setGalleryImages(gallery || []);
        
        // Parse phone number to separate country code and number
        let phoneNumber = '';
        let countryCode = '+91'; // default
        
        if (company.contact_phone) {
          // Try to extract country code from phone number
          const phoneStr = company.contact_phone.toString();
          const countryCodeMatch = countryCodes.find(cc => phoneStr.startsWith(cc.code));
          if (countryCodeMatch) {
            countryCode = countryCodeMatch.code;
            phoneNumber = phoneStr.substring(countryCodeMatch.code.length);
          } else {
            // If no country code found, assume it's just the number
            phoneNumber = phoneStr;
          }
        }

        // Update form data with null safety
        setFormData(prev => ({
          ...prev,
          ...company,
          // Ensure all fields have proper default values
          company_name: company.company_name || '',
          industry: company.industry || '',
          company_size: company.company_size || '',
          founded_year: company.founded_year || 0,
          website: company.website || '',
          description: company.description || '',
          mission_statement: company.mission_statement || '',
          company_values: company.company_values || [],
          headquarters_address: company.headquarters_address || '',
          headquarters_city: company.headquarters_city || '',
          headquarters_state: company.headquarters_state || '',
          headquarters_country: company.headquarters_country || '',
          headquarters_pin_code: company.headquarters_pin_code || '',
          contact_email: company.contact_email || '',
          contact_phone: phoneNumber || '',
          contact_phone_country_code: countryCode || '+91',
          linkedin_url: company.linkedin_url || '',
          twitter_url: company.twitter_url || '',
          facebook_url: company.facebook_url || '',
          instagram_url: company.instagram_url || '',
          benefits: company.benefits || [],
          perks: company.perks || [],
          work_culture: company.work_culture || '',
          remote_work_policy: company.remote_work_policy || '',
          diversity_inclusion: company.diversity_inclusion || ''
        }));
      }
    } catch (error: any) {
      console.error('Error loading company profile:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load company profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || '' // Ensure we never set null/undefined values
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log('File selected:', file);
    }
  };

  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTabError(prev => ({ ...prev, 'basic-info': '' }));
    
    try {
      const formDataToSend = new FormData();
      
      // Combine country code and phone number
      const fullPhone = formData.contact_phone ? 
        formData.contact_phone_country_code + formData.contact_phone : '';
      
      // Create a copy of formData with combined phone number
      const dataToSend = {
        ...formData,
        contact_phone: fullPhone
      };
      
      // Remove the separate country code field
      delete (dataToSend as any).contact_phone_country_code;
      
      // Add all form fields
      Object.entries(dataToSend).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          // Handle null/undefined values safely
          const stringValue = value !== null && value !== undefined ? value.toString() : '';
          formDataToSend.append(key, stringValue);
        }
      });

      // Add logo file if selected
      const logoFile = (document.getElementById('company_logo') as HTMLInputElement)?.files?.[0];
      if (logoFile) {
        formDataToSend.append('company_logo', logoFile);
      }

      await api.post('/company/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setTabSuccess(prev => ({ ...prev, 'basic-info': 'Company profile saved successfully!' }));
      setTimeout(() => {
        setTabSuccess(prev => ({ ...prev, 'basic-info': '' }));
      }, 3000);
      
      loadCompanyProfile();
    } catch (error: any) {
      console.error('Error saving company profile:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save company profile';
      setTabError(prev => ({ ...prev, 'basic-info': errorMessage }));
    } finally {
      setLoading(false);
    }
  };


  const handleSaveOffices = async () => {
    try {
      setLoading(true);
      setTabError(prev => ({ ...prev, 'offices': '' }));
      
      await api.post('/company/offices', {
        offices
      });

      setTabSuccess(prev => ({ ...prev, 'offices': 'Offices updated successfully!' }));
      setTimeout(() => {
        setTabSuccess(prev => ({ ...prev, 'offices': '' }));
      }, 3000);
    } catch (error) {
      console.error('Error updating offices:', error);
      setTabError(prev => ({ ...prev, 'offices': 'Failed to update offices' }));
    } finally {
      setLoading(false);
    }
  };



  const handleTabChange = (tabKey: string | null) => {
    if (tabKey) {
      setActiveTab(tabKey);
      setTabSuccess({});
      setTabError({});
    }
  };

  // Handle adding and removing company values
  const addValue = () => {
    if (newValue.trim()) {
      setFormData(prev => ({
        ...prev,
        company_values: [...prev.company_values, newValue.trim()]
      }));
      setNewValue('');
    }
  };

  const removeValue = (index: number) => {
    setFormData(prev => ({
      ...prev,
      company_values: prev.company_values.filter((_, i) => i !== index)
    }));
  };

  // Handle adding and removing benefits
  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  // Handle adding and removing perks
  const addPerk = () => {
    if (newPerk.trim()) {
      setFormData(prev => ({
        ...prev,
        perks: [...prev.perks, newPerk.trim()]
      }));
      setNewPerk('');
    }
  };

  const removePerk = (index: number) => {
    setFormData(prev => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index)
    }));
  };

  // Handle office management
  const addOffice = () => {
    if (newOffice.office_name.trim()) {
      setOffices(prev => [...prev, { ...newOffice }]);
      setNewOffice({
        office_name: '',
        address: '',
        city: '',
        state: '',
        country: '',
        pin_code: '',
        phone: '',
        email: '',
        is_headquarters: false,
        office_type: 'branch'
      });
      setShowOfficeModal(false);
    }
  };

  const removeOffice = (index: number) => {
    setOffices(prev => prev.filter((_, i) => i !== index));
  };

  const handleOfficeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewOffice(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Test database tables
  const testDatabaseTables = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Testing company profile database tables...');
      
      const response = await api.get('/company/test-tables');
      console.log('Database test response:', response.data);
      
      if (response.data.success) {
        setSuccess('✅ All database tables exist and are working correctly!');
      } else {
        setError(`❌ Database issue: ${response.data.message}`);
      }
      
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
    } catch (error: any) {
      console.error('Database test error:', error);
      setError(`❌ Database test failed: ${error.response?.data?.message || error.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };


  const renderBasicInfo = () => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5>Basic Company Information</h5>
          <Button 
            variant="outline-info" 
            size="sm"
            onClick={testDatabaseTables}
            disabled={loading}
          >
            <i className="fas fa-database me-1"></i>
            Test Database
          </Button>
        </div>

        {tabSuccess['basic-info'] && <Alert variant="success">{tabSuccess['basic-info']}</Alert>}
        {tabError['basic-info'] && <Alert variant="danger">{tabError['basic-info']}</Alert>}

        <Form onSubmit={handleSaveBasicInfo}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Company Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter company name"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Company Logo</Form.Label>
                <Form.Control
                  type="file"
                  id="company_logo"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {companyData?.company_logo_url && (
                  <div className="mt-2">
                    <Image 
                      src={`http://localhost:5000/api/company${companyData.company_logo_url}`} 
                      alt="Company Logo" 
                      style={{ maxHeight: '100px' }}
                      rounded
                    />
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Industry *</Form.Label>
                <Form.Select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Industry</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Company Size *</Form.Label>
                <Form.Select
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Founded Year</Form.Label>
                <Form.Control
                  type="number"
                  name="founded_year"
                  value={formData.founded_year}
                  onChange={handleInputChange}
                  placeholder="e.g., 2020"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Company Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Describe your company, what you do, and your mission..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mission Statement</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="mission_statement"
              value={formData.mission_statement}
              onChange={handleInputChange}
              placeholder="What is your company's mission?"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Company Values</Form.Label>
            <div className="d-flex gap-2 mb-2">
              <Form.Control
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Add a company value"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
              />
              <Button variant="outline-primary" onClick={addValue}>
                <i className="fas fa-plus"></i>
              </Button>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {formData.company_values.map((value, index) => (
                <Badge key={index} bg="primary" className="d-flex align-items-center gap-1">
                  {value}
                  <i 
                    className="fas fa-times cursor-pointer" 
                    onClick={() => removeValue(index)}
                    style={{ cursor: 'pointer' }}
                  ></i>
                </Badge>
              ))}
            </div>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Website</Form.Label>
                <Form.Control
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourcompany.com"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contact Email *</Form.Label>
                <Form.Control
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleInputChange}
                  required
                  placeholder="contact@yourcompany.com"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contact Phone</Form.Label>
                <InputGroup>
                  <Form.Select
                    name="contact_phone_country_code"
                    value={formData.contact_phone_country_code}
                    onChange={handleInputChange}
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
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      if (digitsOnly.length <= 10) {
                        setFormData(prev => ({ ...prev, contact_phone: digitsOnly }));
                      }
                    }}
                    placeholder="1234567890"
                    maxLength={10}
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Enter 10-digit phone number without country code
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Remote Work Policy</Form.Label>
                <Form.Select
                  name="remote_work_policy"
                  value={formData.remote_work_policy}
                  onChange={handleInputChange}
                >
                  <option value="">Select Policy</option>
                  <option value="fully-remote">Fully Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="office-only">Office Only</option>
                  <option value="flexible">Flexible</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
              border: 'none'
            }}
          >
            {loading ? 'Saving...' : 'Save Company Profile'}
          </Button>
        </Form>
      </div>
    );
  };


  const renderOffices = () => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5>Office Locations</h5>
          <Button
            variant="primary"
            onClick={() => setShowOfficeModal(true)}
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
              border: 'none'
            }}
          >
            <i className="fas fa-plus me-2"></i>
            Add Office
          </Button>
        </div>

        {tabSuccess['offices'] && <Alert variant="success">{tabSuccess['offices']}</Alert>}
        {tabError['offices'] && <Alert variant="danger">{tabError['offices']}</Alert>}

        <Row>
          {offices.map((office, index) => (
            <Col md={6} key={index} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-1">
                        {office.office_name}
                        {office.is_headquarters && <Badge bg="primary" className="ms-2">HQ</Badge>}
                      </h6>
                      <p className="text-muted mb-1">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        {office.address}, {office.city}, {office.state} {office.pin_code}
                      </p>
                      <p className="text-muted mb-1">
                        <i className="fas fa-flag me-1"></i>
                        {office.country}
                      </p>
                      {office.phone && (
                        <p className="text-muted mb-1">
                          <i className="fas fa-phone me-1"></i>
                          {office.phone}
                        </p>
                      )}
                      {office.email && (
                        <p className="text-muted mb-1">
                          <i className="fas fa-envelope me-1"></i>
                          {office.email}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeOffice(index)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {offices.length > 0 && (
          <div className="mt-3">
            <Button
              variant="success"
              onClick={handleSaveOffices}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Offices'}
            </Button>
          </div>
        )}

        {/* Office Modal */}
        <Modal show={showOfficeModal} onHide={() => setShowOfficeModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Add Office Location</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Office Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={newOffice.office_name}
                      onChange={(e) => setNewOffice(prev => ({ ...prev, office_name: e.target.value }))}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Office Type</Form.Label>
                    <Form.Select
                      value={newOffice.office_type}
                      onChange={(e) => setNewOffice(prev => ({ ...prev, office_type: e.target.value }))}
                    >
                      <option value="headquarters">Headquarters</option>
                      <option value="branch">Branch</option>
                      <option value="remote-hub">Remote Hub</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Address *</Form.Label>
                <Form.Control
                  type="text"
                  value={newOffice.address}
                  onChange={(e) => setNewOffice(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </Form.Group>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>City *</Form.Label>
                    <Form.Control
                      type="text"
                      value={newOffice.city}
                      onChange={(e) => setNewOffice(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      type="text"
                      value={newOffice.state}
                      onChange={(e) => setNewOffice(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Country *</Form.Label>
                    <Form.Control
                      type="text"
                      value={newOffice.country}
                      onChange={(e) => setNewOffice(prev => ({ ...prev, country: e.target.value }))}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pin Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={newOffice.pin_code}
                      onChange={(e) => setNewOffice(prev => ({ ...prev, pin_code: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      type="tel"
                      value={newOffice.phone}
                      onChange={(e) => setNewOffice(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={newOffice.email}
                  onChange={(e) => setNewOffice(prev => ({ ...prev, email: e.target.value }))}
                />
              </Form.Group>
              <Form.Check
                type="checkbox"
                label="This is the headquarters"
                checked={newOffice.is_headquarters}
                onChange={(e) => setNewOffice(prev => ({ ...prev, is_headquarters: e.target.checked }))}
              />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowOfficeModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={addOffice}
              style={{ 
                background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                border: 'none'
              }}
            >
              Add Office
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  };


  const renderBenefits = () => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5>Benefits & Perks</h5>
        </div>

        {tabSuccess['benefits'] && <Alert variant="success">{tabSuccess['benefits']}</Alert>}
        {tabError['benefits'] && <Alert variant="danger">{tabError['benefits']}</Alert>}

        <Row>
          <Col md={6}>
            <Card>
              <Card.Header>
                <h6>Benefits</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex gap-2 mb-2">
                  <Form.Control
                    type="text"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add a benefit"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  />
                  <Button variant="outline-primary" onClick={addBenefit}>
                    <i className="fas fa-plus"></i>
                  </Button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {formData.benefits.map((benefit, index) => (
                    <Badge key={index} bg="success" className="d-flex align-items-center gap-1">
                      {benefit}
                      <i 
                        className="fas fa-times cursor-pointer" 
                        onClick={() => removeBenefit(index)}
                        style={{ cursor: 'pointer' }}
                      ></i>
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Header>
                <h6>Perks</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex gap-2 mb-2">
                  <Form.Control
                    type="text"
                    value={newPerk}
                    onChange={(e) => setNewPerk(e.target.value)}
                    placeholder="Add a perk"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPerk())}
                  />
                  <Button variant="outline-primary" onClick={addPerk}>
                    <i className="fas fa-plus"></i>
                  </Button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {formData.perks.map((perk, index) => (
                    <Badge key={index} bg="info" className="d-flex align-items-center gap-1">
                      {perk}
                      <i 
                        className="fas fa-times cursor-pointer" 
                        onClick={() => removePerk(index)}
                        style={{ cursor: 'pointer' }}
                      ></i>
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Form.Group className="mb-3 mt-4">
          <Form.Label>Work Culture</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            name="work_culture"
            value={formData.work_culture}
            onChange={handleInputChange}
            placeholder="Describe your company's work culture, values, and environment..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Diversity & Inclusion</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="diversity_inclusion"
            value={formData.diversity_inclusion}
            onChange={handleInputChange}
            placeholder="Describe your commitment to diversity and inclusion..."
          />
        </Form.Group>

        <Button
          variant="success"
          onClick={handleSaveBasicInfo}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Benefits & Culture'}
        </Button>
      </div>
    );
  };

  return (
    <div className="company-profile">
      <Navbar />

      <Container className="profile-container">
        <div className="profile-header">
          <div className="d-flex align-items-center mb-3">
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/recruiter/dashboard')}
              className="me-3"
              style={{
                borderColor: '#fbbf24',
                color: '#fbbf24'
              }}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Dashboard
            </Button>
          </div>
          <h2>Company Profile</h2>
          <p className="text-muted">Manage your company information and showcase your organization</p>
        </div>

        <Card className="profile-card">
          <Card.Body>
            <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
              <Nav variant="tabs" className="profile-tabs">
                <Nav.Item>
                  <Nav.Link eventKey="basic-info">
                    <i className="fas fa-building me-2"></i>
                    Basic Info
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="offices">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Offices
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="benefits">
                    <i className="fas fa-gift me-2"></i>
                    Benefits
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content className="mt-4">
                <Tab.Pane eventKey="basic-info">
                  {renderBasicInfo()}
                </Tab.Pane>
                <Tab.Pane eventKey="offices">
                  {renderOffices()}
                </Tab.Pane>
                <Tab.Pane eventKey="benefits">
                  {renderBenefits()}
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default CompanyProfile;
