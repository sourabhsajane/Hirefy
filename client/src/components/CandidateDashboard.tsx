import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, Alert, Nav, Tab, Form, Row, Col, InputGroup, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import api from '../utils/api';
import Navbar from './Navbar';
import './CandidateDashboard.css';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  employment_type: string;
  experience_required?: number;
  status: string;
  created_at: string;
  recruiter_id: string;
  requirements?: string;
  company?: {
    name: string;
    logo_url?: string;
  };
  recruiter?: {
    name: string;
    email: string;
  };
  company_profile?: {
    id: string;
    company_name: string;
    company_logo_url?: string;
    industry?: string;
    company_size?: string;
    founded_year?: number;
    website?: string;
    description?: string;
    mission_statement?: string;
    company_values?: string[];
    headquarters_address?: string;
    headquarters_city?: string;
    headquarters_state?: string;
    headquarters_country?: string;
    headquarters_pin_code?: string;
    contact_email?: string;
    contact_phone?: string;
    linkedin_url?: string;
    twitter_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    benefits?: string[];
    perks?: string[];
    work_culture?: string;
    remote_work_policy?: string;
    diversity_inclusion?: string;
    awards_recognition?: string[];
    certifications?: string[];
    is_verified?: boolean;
    verification_status?: string;
  };
}

const CandidateDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [activeTab, setActiveTab] = useState('apply-jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [applying, setApplying] = useState(false);
  const [success, setSuccess] = useState('');

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  // Fetch company profile for a recruiter
  const fetchCompanyProfile = async (recruiterId: string) => {
    try {
      const response = await api.get(`/jobs/company-profile/${recruiterId}`);
      return response.data.success ? response.data.company_profile : null;
    } catch (err) {
      console.error('Error fetching company profile:', err);
      return null;
    }
  };

  // Fetch all active jobs for candidates
  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/jobs');
      if (response.data.success) {
        const allJobs = response.data.jobs || [];
        
        // Filter out closed jobs - only show active jobs
        const activeJobs = allJobs.filter((job: Job) => job.status === 'active');
        
        // Fetch company profiles for each active job
        const jobsWithCompanyProfiles = await Promise.all(
          activeJobs.map(async (job: Job) => {
            const companyProfile = await fetchCompanyProfile(job.recruiter_id);
            return {
              ...job,
              company_profile: companyProfile
            };
          })
        );
        
        setJobs(jobsWithCompanyProfiles);
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  // Load jobs and applications when component mounts
  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  // Refetch applications when user ID changes
  useEffect(() => {
    if (user?.id) {
      fetchApplications();
    }
  }, [user?.id]);

  // Handle viewing job details
  const handleViewJobDetails = (job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  // Check if user has already applied for a job
  const hasAppliedForJob = (jobId: string) => {
    const hasApplied = applications.some(app => app.job_id === jobId);
    console.log(`Checking application for job ${jobId}:`, hasApplied, 'Applications:', applications);
    return hasApplied;
  };

  // Handle applying for a job
  const handleApplyForJob = (job: Job) => {
    setApplyingJob(job);
    setCoverLetter('');
    setShowApplyModal(true);
  };

  // Submit job application
  const handleSubmitApplication = async () => {
    if (!applyingJob || !user) return;

    setApplying(true);
    setError('');

    try {
      const response = await api.post('/applications/apply', {
        job_id: applyingJob.id,
        cover_letter: coverLetter
      });

      if (response.data.success) {
        console.log('Application submitted successfully:', response.data);
        setSuccess('Application submitted successfully!');
        setShowApplyModal(false);
        setApplyingJob(null);
        setCoverLetter('');
        
        // Refresh applications list
        await fetchApplications();
        
        // Auto-hide success message
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.data.message || 'Failed to submit application');
      }
    } catch (err: any) {
      console.error('Error applying for job:', err);
      setError(err.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  // Fetch user's applications
  const fetchApplications = async () => {
    if (!user) return;

    try {
      console.log('Fetching applications for user:', user.id);
      const response = await api.get(`/applications/candidate/${user.id}`);
      console.log('Applications response:', response.data);
      if (response.data.success) {
        const apps = response.data.applications || [];
        console.log('Setting applications:', apps);
        setApplications(apps);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const renderApplyForJobs = () => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>Apply for Jobs</h4>
        </div>
        
        {/* Search Section */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="g-3">
              <Col md={8}>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="fas fa-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search jobs, companies, skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={4}>
                <Button
                  variant="primary"
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                    border: 'none',
                    width: '100%'
                  }}
                  onClick={fetchJobs}
                >
                  <i className="fas fa-search me-1"></i>
                  Search Jobs
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Job Listings Section */}
        <div className="jobs-section">
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading ? (
            <div className="text-center py-5">
              <i className="fas fa-spinner fa-spin fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">Loading jobs...</h5>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-briefcase fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">No job listings found</h5>
                  <p className="text-muted">
                    {searchTerm 
                      ? 'Try adjusting your search criteria'
                      : 'No jobs are currently available. Check back later for new opportunities!'
                    }
                  </p>
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setSearchTerm('');
                      }}
                      className="mt-2"
                    >
                      <i className="fas fa-times me-2"></i>
                      Clear Search
                    </Button>
                  )}
            </div>
          ) : (
                <div className="job-cards-grid">
                  {jobs
                    .filter(job => {
                      // Filter by search term
                      if (searchTerm && !job.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
                          !job.description.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return false;
                      }
                      return true;
                    })
                    .map((job) => (
                  <div key={job.id} className="job-card">
                    <div className="job-card-header">
                      <h3 className="job-title">{job.title}</h3>
                      {(job.company || job.company_profile || job.recruiter) && (
                        <div className="job-company">
                          <i className="fas fa-building"></i>
                          <span>
                            {job.company?.name || job.company_profile?.company_name || job.recruiter?.name}
                          </span>
                        </div>
                      )}
                      <div className="job-meta">
                        <div className="job-meta-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{job.location}</span>
                        </div>
                        <div className="job-meta-item">
                          <i className="fas fa-briefcase"></i>
                          <span>{job.employment_type}</span>
                        </div>
                            {job.experience_required !== undefined && (
                              <div className="job-meta-item">
                                <i className="fas fa-user-tie"></i>
                                <span>
                                  {job.experience_required === 0 
                                    ? "Entry Level" 
                                    : `${job.experience_required}+ years`
                                  }
                                </span>
                              </div>
                            )}
                      </div>
                      {job.salary_min && job.salary_max && (
                        <div className="job-salary">
                          <i className="fas fa-rupee-sign"></i>
                          <span>₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="job-card-body">
                      <p className="job-description">
                        {job.description.length > 120 
                          ? `${job.description.substring(0, 120)}...` 
                          : job.description
                        }
                      </p>
                      
                      <div className="job-actions">
                        {hasAppliedForJob(job.id) ? (
                          <div className="applied-status">
                            <i className="fas fa-check-circle"></i>
                            <span>Applied</span>
                          </div>
                        ) : (
                          <button 
                            className="job-action-btn apply"
                            onClick={() => handleApplyForJob(job)}
                          >
                            <i className="fas fa-paper-plane"></i>
                            Apply Now
                          </button>
                        )}
                        <button 
                          className="job-action-btn view"
                          onClick={() => handleViewJobDetails(job)}
                        >
                          <i className="fas fa-eye"></i>
                          View Details
                        </button>
                      </div>
                    </div>
                    
                    <div className="job-footer">
                      <span className="job-date">
                        Posted: {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAppliedJobs = () => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4>Applied Jobs</h4>
          <Button 
            variant="outline-primary"
            onClick={() => setActiveTab('apply-jobs')}
            style={{ 
              borderColor: '#fbbf24',
              color: '#fbbf24'
            }}
          >
            <i className="fas fa-plus me-2"></i>
            Apply for More Jobs
          </Button>
        </div>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <div className="applied-jobs-section">
          {applications.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-clipboard-list fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">No Applications Yet</h5>
              <p className="text-muted">
                You haven't applied for any jobs yet. Browse available positions and apply to get started!
              </p>
              <Button 
                variant="primary"
                onClick={() => setActiveTab('apply-jobs')}
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                  border: 'none'
                }}
              >
                <i className="fas fa-search me-2"></i>
                Browse Jobs
              </Button>
            </div>
          ) : (
            <div className="job-cards-grid">
              {applications.map((application) => {
                const job = jobs.find(j => j.id === application.job_id);
                return (
                  <div key={application.id} className="job-card">
                    <div className="job-card-header">
                      <h3 className="job-title">
                        {job?.title || 'Job Title Not Found'}
                      </h3>
                      <div className="job-company">
                        <i className="fas fa-building"></i>
                        <span>
                          {job?.company?.name || job?.company_profile?.company_name || job?.recruiter?.name || 'Company Not Found'}
                        </span>
                      </div>
                      <div className="job-meta">
                        <div className="job-meta-item">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>{job?.location || 'Location Not Found'}</span>
                        </div>
                        <div className="job-meta-item">
                          <i className="fas fa-briefcase"></i>
                          <span>{job?.employment_type || 'N/A'}</span>
                        </div>
                        {job?.experience_required !== undefined && (
                          <div className="job-meta-item">
                            <i className="fas fa-user-tie"></i>
                            <span>
                              {job.experience_required === 0 
                                ? "Entry Level" 
                                : `${job.experience_required}+ years`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                      {job?.salary_min && job?.salary_max && (
                        <div className="job-salary">
                          <i className="fas fa-rupee-sign"></i>
                          <span>₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="job-card-body">
                      <p className="job-description">
                        {job?.description ? (
                          job.description.length > 120 
                            ? `${job.description.substring(0, 120)}...` 
                            : job.description
                        ) : 'No description available'}
                      </p>
                      
                      <div className="job-actions">
                        <div className="applied-status">
                          <i className="fas fa-check-circle"></i>
                          <span>Applied</span>
                        </div>
                        <button 
                          className="job-action-btn view"
                          onClick={() => {
                            if (job) {
                              setSelectedJob(job);
                              setShowJobDetails(true);
                            }
                          }}
                        >
                          <i className="fas fa-eye"></i>
                          View Details
                        </button>
                      </div>
                    </div>
                    
                    <div className="job-footer">
                      <span className="job-date">
                        Applied: {new Date(application.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="candidate-dashboard">
      <Navbar />

      <Container className="dashboard-container">
        <div className="dashboard-header">
          <h2>Welcome, {user?.name}!</h2>
          <p className="text-muted">Manage your job applications and profile</p>
        </div>

        <Card className="dashboard-card">
          <Card.Body>
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'apply-jobs')}>
              <Nav variant="tabs" className="dashboard-tabs">
                <Nav.Item>
                  <Nav.Link eventKey="apply-jobs">
                    <i className="fas fa-briefcase me-2"></i>
                    Apply for Jobs
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="applied-jobs">
                    <i className="fas fa-file-alt me-2"></i>
                    Applied Jobs
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content className="mt-4">
                <Tab.Pane eventKey="apply-jobs">
                  {renderApplyForJobs()}
                </Tab.Pane>
                <Tab.Pane eventKey="applied-jobs">
                  {renderAppliedJobs()}
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Card.Body>
        </Card>
      </Container>

      {/* Job Details Modal */}
      <Modal 
        show={showJobDetails} 
        onHide={() => setShowJobDetails(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="job-details-header">
          <Modal.Title>
            <i className="fas fa-briefcase me-2"></i>
            Job Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="job-details-body">
          {selectedJob && (
            <div>
              {/* Job Header */}
              <div className="job-details-header-section">
                <h2 className="job-details-title">{selectedJob.title}</h2>
                {(selectedJob.company || selectedJob.company_profile || selectedJob.recruiter) && (
                  <div className="job-details-company">
                    <i className="fas fa-building me-2"></i>
                    <span>
                      {selectedJob.company?.name || selectedJob.company_profile?.company_name || selectedJob.recruiter?.name}
                    </span>
                  </div>
                )}
                <div className="job-details-meta">
                  <div className="job-meta-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{selectedJob.location}</span>
                  </div>
                  <div className="job-meta-item">
                    <i className="fas fa-briefcase"></i>
                    <span>{selectedJob.employment_type}</span>
                  </div>
                  {selectedJob.experience_required !== undefined && (
                    <div className="job-meta-item">
                      <i className="fas fa-user-tie"></i>
                      <span>
                        {selectedJob.experience_required === 0 
                          ? "Entry Level (0 years)" 
                          : `${selectedJob.experience_required}+ years experience`
                        }
                      </span>
                    </div>
                  )}
                  {selectedJob.salary_min && selectedJob.salary_max && (
                    <div className="job-meta-item">
                      <i className="fas fa-rupee-sign"></i>
                      <span>₹{selectedJob.salary_min.toLocaleString()} - ₹{selectedJob.salary_max.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Description */}
              <div className="job-details-section">
                <h4><i className="fas fa-file-text me-2"></i>Job Description</h4>
                <p className="job-description-text">{selectedJob.description}</p>
              </div>

              {/* Requirements */}
              {selectedJob.requirements && (
                <div className="job-details-section">
                  <h4><i className="fas fa-list-check me-2"></i>Requirements</h4>
                  <p className="job-requirements-text">{selectedJob.requirements}</p>
                </div>
              )}

              {/* Recruiter Information */}
              {selectedJob.recruiter && (
                <div className="job-details-section">
                  <h4><i className="fas fa-user-tie me-2"></i>Recruiter Information</h4>
                  <div className="recruiter-info">
                    <div className="recruiter-item">
                      <i className="fas fa-user me-2"></i>
                      <span><strong>Name:</strong> {selectedJob.recruiter.name}</span>
                    </div>
                    <div className="recruiter-item">
                      <i className="fas fa-envelope me-2"></i>
                      <span><strong>Email:</strong> {selectedJob.recruiter.email}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Profile */}
              {selectedJob.company_profile && (
                <div className="job-details-section">
                  <h4><i className="fas fa-building me-2"></i>Company Profile</h4>
                  <div className="company-info">
                    <div className="company-item">
                      <i className="fas fa-building me-2"></i>
                      <span><strong>Company:</strong> {selectedJob.company_profile.company_name}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Status and Date */}
              <div className="job-details-section">
                <h4><i className="fas fa-info-circle me-2"></i>Job Information</h4>
                <div className="job-info">
                  <div className="job-info-item">
                    <i className="fas fa-calendar me-2"></i>
                    <span><strong>Posted:</strong> {new Date(selectedJob.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="job-info-item">
                    <i className="fas fa-tag me-2"></i>
                    <span><strong>Status:</strong> 
                      <span className={`job-status-badge ${selectedJob.status}`}>
                        {selectedJob.status}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="job-details-footer">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowJobDetails(false)}
          >
            Close
          </Button>
          {selectedJob && hasAppliedForJob(selectedJob.id) ? (
            <div className="applied-status-modal">
              <i className="fas fa-check-circle me-2"></i>
              <span>Already Applied</span>
            </div>
          ) : (
            <Button 
              variant="primary"
              onClick={() => {
                setShowJobDetails(false);
                if (selectedJob) {
                  handleApplyForJob(selectedJob);
                }
              }}
              style={{ 
                background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                border: 'none'
              }}
            >
              <i className="fas fa-paper-plane me-2"></i>
              Apply Now
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Application Modal */}
      <Modal 
        show={showApplyModal} 
        onHide={() => setShowApplyModal(false)}
        centered
      >
        <Modal.Header closeButton className="application-header">
          <Modal.Title>
            <i className="fas fa-paper-plane me-2"></i>
            Apply for Job
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="application-body">
          {applyingJob && (
            <div>
              <div className="job-summary mb-4">
                <h5>{applyingJob.title}</h5>
                <p className="text-muted mb-0">
                  {(applyingJob.company || applyingJob.company_profile || applyingJob.recruiter) && (
                    <span>
                      {applyingJob.company?.name || applyingJob.company_profile?.company_name || applyingJob.recruiter?.name}
                    </span>
                  )}
                  {applyingJob.location && <span> • {applyingJob.location}</span>}
                </p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label>Cover Letter (Optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Write a cover letter to introduce yourself and explain why you're interested in this position..."
                />
                <Form.Text className="text-muted">
                  A well-written cover letter can help you stand out from other candidates.
                </Form.Text>
              </Form.Group>

              <div className="application-info">
                <h6><i className="fas fa-info-circle me-2"></i>Application Information</h6>
                <ul className="list-unstyled">
                  <li><i className="fas fa-user me-2"></i><strong>Name:</strong> {user?.name}</li>
                  <li><i className="fas fa-envelope me-2"></i><strong>Email:</strong> {user?.email}</li>
                  <li><i className="fas fa-calendar me-2"></i><strong>Applied:</strong> {new Date().toLocaleDateString()}</li>
                </ul>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="application-footer">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowApplyModal(false)}
            disabled={applying}
          >
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmitApplication}
            disabled={applying}
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
              border: 'none'
            }}
          >
            {applying ? (
              <>
                <i className="fas fa-spinner fa-spin me-2"></i>
                Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane me-2"></i>
                Submit Application
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CandidateDashboard;