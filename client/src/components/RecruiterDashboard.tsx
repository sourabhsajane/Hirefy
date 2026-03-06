import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Badge, Card, Form, Modal, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import api from '../utils/api';
import Navbar from './Navbar';
import './RecruiterDashboard.css';

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
  company?: {
    name: string;
    logo_url?: string;
  };
  recruiter?: {
    name: string;
    email: string;
  };
  company_profile?: {
    company_name: string;
    company_logo_url?: string;
  };
}

const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [activeSection, setActiveSection] = useState('view-jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applicationCounts, setApplicationCounts] = useState<{[key: string]: number}>({});
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJobApplications, setSelectedJobApplications] = useState<any[]>([]);
  const [selectedJobForApplications, setSelectedJobForApplications] = useState<Job | null>(null);
  
  // Mail Logs State
  const [autoMailsEnabled, setAutoMailsEnabled] = useState(false);
  const [loadingAutoMails, setLoadingAutoMails] = useState(false);
  
  // Add Job Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addJobForm, setAddJobForm] = useState({
    title: '',
    description: '',
    location: '',
    salary_min: '',
    salary_max: '',
    employment_type: 'full-time',
    experience_required: '0',
    skills_required: [] as string[]
  });
  const [currentSkill, setCurrentSkill] = useState('');
  
  // Edit Job Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editJobForm, setEditJobForm] = useState({
    title: '',
    description: '',
    location: '',
    salary_min: '',
    salary_max: '',
    employment_type: 'full-time',
    experience_required: '0',
    status: 'active'
  });

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  // Fetch application count for a specific job
  const fetchApplicationCount = async (jobId: string) => {
    try {
      console.log('🔍 Fetching application count for job:', jobId);
      const response = await api.get(`/applications/job/${jobId}`);
      console.log('📊 Application count response:', response.data);
      if (response.data.success) {
        const count = response.data.applications.length;
        console.log(`✅ Job ${jobId} has ${count} applications`);
        return count;
      }
      return 0;
    } catch (err) {
      console.error('❌ Error fetching application count:', err);
      return 0;
    }
  };

  // Fetch application counts for all jobs (optimized)
  const fetchAllApplicationCounts = async () => {
    if (jobs.length === 0) return;
    
    try {
      console.log('🔍 Fetching application counts for all jobs...');
      const counts: {[key: string]: number} = {};
      
      // Fetch all application counts in parallel for better performance
      const promises = jobs.map(async (job) => {
        try {
          const response = await api.get(`/applications/job/${job.id}`);
          if (response.data.success) {
            const count = response.data.applications.length;
            console.log(`✅ Job "${job.title}" has ${count} applications`);
            return { jobId: job.id, count };
          }
          return { jobId: job.id, count: 0 };
        } catch (err) {
          console.error(`❌ Error fetching count for job ${job.id}:`, err);
          return { jobId: job.id, count: 0 };
        }
      });
      
      const results = await Promise.all(promises);
      
      // Convert results to counts object
      results.forEach(({ jobId, count }) => {
        counts[jobId] = count;
      });
      
      console.log('📊 All application counts:', counts);
      setApplicationCounts(counts);
    } catch (error) {
      console.error('❌ Error fetching application counts:', error);
    }
  };

  // View applications for a specific job
  const handleViewApplications = async (job: Job) => {
    setSelectedJobForApplications(job);
    setLoading(true);
    try {
      console.log('🔍 Fetching applications for job:', job.id, job.title);
      const response = await api.get(`/applications/job/${job.id}`);
      console.log('📋 Applications response:', response.data);
      if (response.data.success) {
        const applications = response.data.applications || [];
        console.log(`✅ Found ${applications.length} applications for job "${job.title}"`);
        console.log('📋 Application data structure:', applications);
        if (applications.length > 0) {
          console.log('📋 First application structure:', applications[0]);
          console.log('📋 Candidate data:', applications[0].candidate);
        }
        setSelectedJobApplications(applications);
        setShowApplicationsModal(true);
      
      // Refresh application counts after viewing applications
      fetchAllApplicationCounts();
    } else {
      console.error('❌ Failed to fetch applications:', response.data);
      setError('Failed to fetch applications');
    }
  } catch (err: any) {
    console.error('❌ Error fetching applications:', err);
    setError(err.response?.data?.message || 'Failed to fetch applications');
  } finally {
    setLoading(false);
  }
};

      // View candidate's resume in browser
      const viewCandidateResume = async (candidateId: string, candidateName: string) => {
        try {
          setLoading(true);
          
          // Get the resume URL from the backend
          const response = await api.get(`/profile/resume-url/${candidateId}`);
          
          if (response.data.success && response.data.resumeUrl) {
            // Open resume in new tab for viewing
            const resumeUrl = `http://localhost:5000/api/profile${response.data.resumeUrl}`;
            window.open(resumeUrl, '_blank');
            
            setSuccess('Resume opened in new tab!');
            setTimeout(() => setSuccess(''), 3000);
          } else {
            setError('No resume found for this candidate');
          }
        } catch (err: any) {
          console.error('Error viewing resume:', err);
          if (err.response?.status === 404) {
            setError('No resume found for this candidate. The candidate may not have uploaded a resume yet.');
          } else if (err.response?.status === 403) {
            setError('Access denied. Only recruiters can view resumes.');
          } else {
            setError(err.response?.data?.message || 'Failed to view resume. Please try again.');
          }
        } finally {
          setLoading(false);
        }
      };

  // Handle application decision (accept/reject)
  const handleApplicationDecision = async (applicationId: string, decision: 'accepted' | 'rejected') => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log(`Processing ${decision} decision for application:`, applicationId);
      
      // Update application status
      const response = await api.put(`/applications/${applicationId}/status`, {
        status: decision
      });
      
      if (response.data.success) {
        const action = decision === 'accepted' ? 'accepted' : 'rejected';
        const message = decision === 'rejected' 
          ? 'Application rejected and removed from list. Email notification sent to candidate.'
          : 'Application accepted successfully! Email notification sent to candidate.';
        
        setSuccess(message);
        
        // Refresh applications list
        if (selectedJobForApplications) {
          await handleViewApplications(selectedJobForApplications);
        }
        
        // Refresh application counts
        await fetchAllApplicationCounts();
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
      } else {
        setError(response.data.message || `Failed to ${decision} application`);
      }
    } catch (error: any) {
      console.error(`Error ${decision} application:`, error);
      setError(error.response?.data?.message || `Failed to ${decision} application`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch auto-mails setting when component mounts
  const fetchAutoMailsSetting = async () => {
    try {
      const response = await api.get('/company/auto-mails');
      if (response.data.success) {
        setAutoMailsEnabled(response.data.auto_mails_enabled);
      }
    } catch (err) {
      console.error('Error fetching auto-mails setting:', err);
    }
  };

  // Update auto-mails setting
  const handleToggleAutoMails = async (enabled: boolean) => {
    setLoadingAutoMails(true);
    setError('');
    
    try {
      const response = await api.put('/company/auto-mails', {
        auto_mails_enabled: enabled
      });
      
      if (response.data.success) {
        setAutoMailsEnabled(enabled);
        setSuccess(`Auto mails ${enabled ? 'enabled' : 'disabled'} successfully! ${enabled ? 'Candidates will receive emails when you post new jobs.' : ''}`);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(response.data.message || 'Failed to update auto-mails setting');
      }
    } catch (err: any) {
      console.error('Error updating auto-mails:', err);
      setError(err.response?.data?.message || 'Failed to update auto-mails setting');
      // Revert the toggle on error
      setAutoMailsEnabled(!enabled);
    } finally {
      setLoadingAutoMails(false);
    }
  };

  // Fetch jobs when component mounts or when switching to view-jobs
  useEffect(() => {
    console.log('RecruiterDashboard mounted, user:', user);
    if (activeSection === 'view-jobs' || activeSection === 'modify-jobs') {
      fetchJobs();
    }
    
    // Fetch auto-mails setting on mount
    if (activeSection === 'mail-logs') {
      fetchAutoMailsSetting();
    }
  }, [activeSection, user?.id]);

  // Fetch application counts when jobs are loaded
  useEffect(() => {
    if (jobs.length > 0) {
      fetchAllApplicationCounts();
    }
  }, [jobs]); // Only depend on user.id, not the entire user object

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

  const fetchJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    try {
      console.log('Fetching jobs for user:', user);
      const response = await api.get(`/jobs/recruiter/${user.id}`);
      const jobs = response.data || [];
      
      // Fetch company profiles for each job
      const jobsWithCompanyProfiles = await Promise.all(
        jobs.map(async (job: Job) => {
          const companyProfile = await fetchCompanyProfile(job.recruiter_id);
          return {
            ...job,
            company_profile: companyProfile
          };
        })
      );
      
      setJobs(jobsWithCompanyProfiles);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const jobData = {
        ...addJobForm,
        salary_min: addJobForm.salary_min ? parseInt(addJobForm.salary_min) : null,
        salary_max: addJobForm.salary_max ? parseInt(addJobForm.salary_max) : null,
        experience_required: parseInt(addJobForm.experience_required),
        requirements: addJobForm.description, // Map description to requirements
      };
      
      const response = await api.post('/jobs', jobData);
      
      if (response.data.success) {
        setSuccess('Job created successfully! You can now view it in the "View Jobs" section.');
        
        // Clear the form
        setAddJobForm({
          title: '',
          description: '',
          location: '',
          salary_min: '',
          salary_max: '',
          employment_type: 'full-time',
          experience_required: '0',
          skills_required: []
        });
        setCurrentSkill('');
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
        
        // Refresh jobs list if we're in view-jobs or modify-jobs section
        if (activeSection === 'view-jobs' || activeSection === 'modify-jobs') {
          fetchJobs();
        }
      } else {
        setError(response.data.message || 'Failed to create job');
      }
    } catch (err: any) {
      console.error('Error creating job:', err);
      setError(err.response?.data?.message || 'Failed to create job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    
    setLoading(true);
    setError('');
    
    try {
      const jobData = {
        ...editJobForm,
        salary_min: editJobForm.salary_min ? parseInt(editJobForm.salary_min) : null,
        salary_max: editJobForm.salary_max ? parseInt(editJobForm.salary_max) : null,
        experience_required: parseInt(editJobForm.experience_required),
        requirements: editJobForm.description, // Map description to requirements
      };
      
      await api.put(`/jobs/${editingJob.id}`, jobData);
      setSuccess('Job updated successfully!');
      setShowEditModal(false);
      setEditingJob(null);
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    setLoading(true);
    setError('');
    
    try {
      await api.delete(`/jobs/${jobId}`);
      setSuccess('Job deleted successfully!');
      fetchJobs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete job');
    } finally {
      setLoading(false);
    }
  };


  const openEditModal = (job: Job) => {
    setEditingJob(job);
      setEditJobForm({
        title: job.title,
        description: job.description,
        location: job.location,
        salary_min: job.salary_min?.toString() || '',
        salary_max: job.salary_max?.toString() || '',
        employment_type: job.employment_type,
        experience_required: job.experience_required?.toString() || '0',
        status: job.status
      });
    setShowEditModal(true);
  };

  const sidebarItems = [
    { id: 'view-jobs', icon: 'fas fa-eye', label: 'View Jobs', badge: jobs.length },
    { id: 'modify-jobs', icon: 'fas fa-edit', label: 'Modify Jobs', badge: jobs.length },
    { id: 'add-jobs', icon: 'fas fa-plus-circle', label: 'Add Jobs', badge: null },
    { id: 'company-profile', icon: 'fas fa-building', label: 'Company Profile', badge: null },
    { id: 'mail-logs', icon: 'fas fa-envelope', label: 'Mail Logs', badge: 12 }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'view-jobs':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4>View Jobs</h4>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-primary"
                  onClick={() => setActiveSection('add-jobs')}
                  style={{ 
                    borderColor: '#fbbf24',
                    color: '#fbbf24'
                  }}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add New Job
                </Button>
              </div>
            </div>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            {loading ? (
              <div className="text-center py-5">
                <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
                <p className="text-muted mt-2">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-briefcase fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No jobs posted yet</h5>
                <p className="text-muted">Create your first job posting to get started.</p>
                <Button 
                  variant="primary"
                  onClick={() => setActiveSection('add-jobs')}
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                    border: 'none'
                  }}
                >
                  Post Your First Job
                </Button>
              </div>
            ) : (
              <div className="job-cards-grid">
                {jobs.map((job) => (
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
                        {job.experience_required && (
                          <div className="job-meta-item">
                            <i className="fas fa-user-tie"></i>
                            <span>{job.experience_required}+ years</span>
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
                        <Button 
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewApplications(job)}
                          style={{ 
                            borderColor: '#fbbf24',
                            color: '#fbbf24'
                          }}
                        >
                          <i className="fas fa-users me-1"></i>
                          View Applications ({applicationCounts[job.id] || 0})
                        </Button>
                      </div>
                    </div>
                    
                    <div className="job-footer">
                      <span className={`job-status ${job.status}`}>
                        {job.status}
                      </span>
                      <span className="job-date">
                        Posted: {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'modify-jobs':
        return (
          <div>
            <h4 className="mb-4">Modify Jobs</h4>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            {loading ? (
              <div className="text-center py-5">
                <i className="fas fa-spinner fa-spin fa-2x text-muted"></i>
                <p className="text-muted mt-2">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-edit fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No jobs to modify</h5>
                <p className="text-muted">Create some jobs first to edit them.</p>
              </div>
            ) : (
              <div className="job-cards-grid">
                {jobs.map((job) => (
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
                        {job.experience_required && (
                          <div className="job-meta-item">
                            <i className="fas fa-user-tie"></i>
                            <span>{job.experience_required}+ years</span>
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
                        <button 
                          className="job-action-btn edit"
                          onClick={() => openEditModal(job)}
                        >
                          <i className="fas fa-edit"></i>
                          Edit Job
                        </button>
                        <button 
                          className="job-action-btn delete"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          <i className="fas fa-trash"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="job-footer">
                      <span className={`job-status ${job.status}`}>
                        {job.status}
                      </span>
                      <span className="job-date">
                        Posted: {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'add-jobs':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4>Add New Job</h4>
              <Button 
                variant="outline-primary"
                onClick={() => setActiveSection('view-jobs')}
                style={{ 
                  borderColor: '#fbbf24',
                  color: '#fbbf24'
                }}
              >
                <i className="fas fa-eye me-2"></i>
                View All Jobs
              </Button>
            </div>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Alert variant="info" className="mb-4">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Tips for creating effective job postings:</strong>
              <ul className="mb-0 mt-2">
                <li>Use clear, specific job titles</li>
                <li>Write detailed job descriptions with requirements and responsibilities</li>
                <li>Include salary ranges in Indian Rupees to attract more candidates</li>
                <li>Be specific about location and work arrangements</li>
              </ul>
            </Alert>
            
            <Card>
              <Card.Header>
                <h6 className="mb-0">
                  <i className="fas fa-plus-circle me-2"></i>
                  Create New Job Posting
                </h6>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleAddJob}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Job Title *</Form.Label>
                        <Form.Control
                          type="text"
                          value={addJobForm.title}
                          onChange={(e) => setAddJobForm({...addJobForm, title: e.target.value})}
                          required
                          placeholder="e.g., Senior React Developer"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Location *</Form.Label>
                        <Form.Control
                          type="text"
                          value={addJobForm.location}
                          onChange={(e) => setAddJobForm({...addJobForm, location: e.target.value})}
                          required
                          placeholder="e.g., New York, NY"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Job Description *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={addJobForm.description}
                      onChange={(e) => setAddJobForm({...addJobForm, description: e.target.value})}
                      required
                      placeholder="Describe the role, responsibilities, and requirements..."
                    />
                  </Form.Group>
                  
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Employment Type</Form.Label>
                        <Form.Select
                          value={addJobForm.employment_type}
                          onChange={(e) => setAddJobForm({...addJobForm, employment_type: e.target.value})}
                        >
                          <option value="full-time">Full Time</option>
                          <option value="part-time">Part Time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Experience Required (Years)</Form.Label>
                        <Form.Select
                          value={addJobForm.experience_required}
                          onChange={(e) => setAddJobForm({...addJobForm, experience_required: e.target.value})}
                        >
                          <option value="0">Entry Level (0 years)</option>
                          <option value="1">1+ years</option>
                          <option value="2">2+ years</option>
                          <option value="3">3+ years</option>
                          <option value="5">5+ years</option>
                          <option value="7">7+ years</option>
                          <option value="10">10+ years</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Salary Range (Optional)</Form.Label>
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="number"
                            placeholder="Min"
                            value={addJobForm.salary_min}
                            onChange={(e) => setAddJobForm({...addJobForm, salary_min: e.target.value})}
                            min="0"
                            step="1000"
                          />
                          <Form.Control
                            type="number"
                            placeholder="Max"
                            value={addJobForm.salary_max}
                            onChange={(e) => setAddJobForm({...addJobForm, salary_max: e.target.value})}
                            min="0"
                            step="1000"
                          />
                        </div>
                        <Form.Text className="text-muted">
                          Enter salary in Indian Rupees (₹)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Required Skills for this Job</Form.Label>
                    <div className="d-flex gap-2 mb-2">
                      <Form.Control
                        type="text"
                        placeholder="Add a skill (e.g., JavaScript, React, Python)"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (currentSkill.trim() && !addJobForm.skills_required.includes(currentSkill.trim())) {
                              setAddJobForm({
                                ...addJobForm,
                                skills_required: [...addJobForm.skills_required, currentSkill.trim()]
                              });
                              setCurrentSkill('');
                            }
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        variant="outline-primary"
                        onClick={() => {
                          if (currentSkill.trim() && !addJobForm.skills_required.includes(currentSkill.trim())) {
                            setAddJobForm({
                              ...addJobForm,
                              skills_required: [...addJobForm.skills_required, currentSkill.trim()]
                            });
                            setCurrentSkill('');
                          }
                        }}
                        style={{
                          borderColor: '#fbbf24',
                          color: '#fbbf24'
                        }}
                      >
                        <i className="fas fa-plus"></i> Add
                      </Button>
                    </div>
                    <Form.Text className="text-muted">
                      These skills will be sent to candidates in the email as checkboxes
                    </Form.Text>
                    {addJobForm.skills_required.length > 0 && (
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        {addJobForm.skills_required.map((skill, index) => (
                          <span 
                            key={index}
                            className="badge bg-primary d-flex align-items-center gap-2"
                            style={{
                              background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                              padding: '8px 12px',
                              fontSize: '14px'
                            }}
                          >
                            {skill}
                            <i 
                              className="fas fa-times"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setAddJobForm({
                                  ...addJobForm,
                                  skills_required: addJobForm.skills_required.filter((_, i) => i !== index)
                                });
                              }}
                            ></i>
                          </span>
                        ))}
                      </div>
                    )}
                  </Form.Group>
                  
                  <div className="d-flex gap-3">
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={loading}
                      style={{ 
                        background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                        border: 'none'
                      }}
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Creating Job...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus me-2"></i>
                          Create Job
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline-secondary"
                      onClick={() => {
                        setAddJobForm({
                          title: '',
                          description: '',
                          location: '',
                          salary_min: '',
                          salary_max: '',
                          employment_type: 'full-time',
                          experience_required: '0',
                          skills_required: []
                        });
                        setCurrentSkill('');
                        setError('');
                        setSuccess('');
                      }}
                    >
                      <i className="fas fa-undo me-2"></i>
                      Reset Form
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>
        );
        
      case 'company-profile':
        return (
          <div>
            <h4 className="mb-4">Company Profile</h4>
            <div className="text-center py-5">
              <i className="fas fa-building fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">Company Information</h5>
              <p className="text-muted">Manage your company profile and showcase your organization.</p>
              <Button 
                variant="primary"
                onClick={() => navigate('/company-profile')}
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                  border: 'none'
                }}
              >
                <i className="fas fa-edit me-2"></i>
                Manage Company Profile
              </Button>
            </div>
          </div>
        );
        
      case 'mail-logs':
        return (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">Mail Logs</h4>
              <div className="d-flex gap-3 align-items-center">
                {/* Auto Mails Toggle */}
                <div className="auto-mails-toggle">
                  <Form.Check 
                    type="switch"
                    id="auto-mails-switch"
                    label=""
                    checked={autoMailsEnabled}
                    onChange={(e) => handleToggleAutoMails(e.target.checked)}
                    disabled={loadingAutoMails}
                    className="auto-mails-switch"
                  />
                  <div className="toggle-label">
                    <span className="toggle-caption">
                      {loadingAutoMails ? 'Updating...' : 'Auto Mails'}
                    </span>
                    <span className={`toggle-status ${autoMailsEnabled ? 'on' : 'off'}`}>
                      {autoMailsEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
                
                {/* Send Mail Button */}
                <Button 
                  variant="primary"
                  onClick={() => {
                    if (autoMailsEnabled) {
                      setSuccess('✅ Auto Mails is ON! Candidates will automatically receive emails with AMP interactive forms when you post new jobs.');
                    } else {
                      setSuccess('💡 Turn ON Auto Mails to automatically send job notifications to all candidates when you create a new job!');
                    }
                    setTimeout(() => setSuccess(''), 5000);
                  }}
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                    border: 'none'
                  }}
                >
                  <i className="fas fa-info-circle me-2"></i>
                  Email Info
                </Button>
              </div>
            </div>
            
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex align-items-start">
                  <div className="flex-shrink-0 me-3">
                    <i className="fas fa-bolt fa-3x" style={{ color: '#fbbf24' }}></i>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="mb-3">
                      <i className="fas fa-sparkles me-2" style={{ color: '#fbbf24' }}></i>
                      Google AMP Interactive Emails
                    </h5>
                    <p className="mb-2">
                      <strong>When Auto Mails is ON:</strong> Candidates receive interactive emails powered by Google AMP technology when you create new jobs.
                    </p>
                    <div className="ms-3">
                      <p className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        <strong>For Gmail users:</strong> Interactive forms embedded directly in emails - candidates can update their skills without leaving their inbox!
                      </p>
                      <p className="mb-2">
                        <i className="fas fa-link text-info me-2"></i>
                        <strong>For other email providers:</strong> Fallback HTML emails with direct links to update their profile on the Hirefy platform.
                      </p>
                      <p className="mb-0">
                        <i className="fas fa-users text-warning me-2"></i>
                        <strong>Sent to:</strong> All registered candidates automatically when you post a new job.
                      </p>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
            
            <div className="text-center py-5">
              <i className="fas fa-envelope fa-3x text-muted mb-3"></i>
              <h5 className="text-muted">Email Communications</h5>
              <p className="text-muted">
                {autoMailsEnabled 
                  ? '✅ Auto Mails is enabled. Candidates will receive job notifications automatically.' 
                  : '📭 Auto Mails is disabled. Enable it to start sending automatic notifications.'
                }
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="recruiter-dashboard">
      <Navbar />

      <div className="dashboard-content">
        <Container fluid>
          <Row>
            {/* Sidebar */}
            <Col md={3} className="sidebar-col">
              <div className="sidebar">
                <div className="sidebar-header">
                  <h6 className="text-muted mb-0">MENU</h6>
                </div>
                <nav className="sidebar-nav">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                      onClick={() => setActiveSection(item.id)}
                    >
                      <div className="sidebar-item-content">
                        <i className={`${item.icon} sidebar-icon`}></i>
                        <span className="sidebar-label">{item.label}</span>
                        {item.badge && (
                          <Badge bg="primary" className="sidebar-badge">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </Col>

            {/* Main Content */}
            <Col md={9} className="main-content-col">
              <div className="main-content">
                {renderContent()}
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Edit Job Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Job</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditJob}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editJobForm.title}
                    onChange={(e) => setEditJobForm({...editJobForm, title: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editJobForm.location}
                    onChange={(e) => setEditJobForm({...editJobForm, location: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Job Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={editJobForm.description}
                onChange={(e) => setEditJobForm({...editJobForm, description: e.target.value})}
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Employment Type</Form.Label>
                  <Form.Select
                    value={editJobForm.employment_type}
                    onChange={(e) => setEditJobForm({...editJobForm, employment_type: e.target.value})}
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Experience Required (Years)</Form.Label>
                  <Form.Select
                    value={editJobForm.experience_required}
                    onChange={(e) => setEditJobForm({...editJobForm, experience_required: e.target.value})}
                  >
                    <option value="0">Entry Level (0 years)</option>
                    <option value="1">1+ years</option>
                    <option value="2">2+ years</option>
                    <option value="3">3+ years</option>
                    <option value="5">5+ years</option>
                    <option value="7">7+ years</option>
                    <option value="10">10+ years</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={editJobForm.status}
                    onChange={(e) => setEditJobForm({...editJobForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Salary Range (₹)</Form.Label>
                  <div className="d-flex gap-1">
                    <Form.Control
                      type="number"
                      placeholder="Min"
                      value={editJobForm.salary_min}
                      onChange={(e) => setEditJobForm({...editJobForm, salary_min: e.target.value})}
                      min="0"
                      step="1000"
                    />
                    <Form.Control
                      type="number"
                      placeholder="Max"
                      value={editJobForm.salary_max}
                      onChange={(e) => setEditJobForm({...editJobForm, salary_max: e.target.value})}
                      min="0"
                      step="1000"
                    />
                  </div>
                  <Form.Text className="text-muted">
                    Enter salary in Indian Rupees (₹)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <div className="d-flex gap-2">
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                  border: 'none'
                }}
              >
                {loading ? 'Updating...' : 'Update Job'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Applications Modal */}
      <Modal 
        show={showApplicationsModal} 
        onHide={() => setShowApplicationsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="applications-header">
          <Modal.Title>
            <i className="fas fa-users me-2"></i>
            Applications for {selectedJobForApplications?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="applications-body">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          {selectedJobApplications.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-users fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">No Applications Yet</h5>
              <p className="text-muted">No candidates have applied for this job yet.</p>
            </div>
          ) : (
            <div className="applications-list">
              {selectedJobApplications.map((application) => (
                <div key={application.id} className="application-item">
                  <div className="application-header">
                    <div className="candidate-info">
                      <h5 className="candidate-name">
                        <i className="fas fa-user me-2"></i>
                        {application.candidate?.name || 'Unknown Candidate'}
                      </h5>
                      <p className="candidate-email">
                        <i className="fas fa-envelope me-2"></i>
                        {application.candidate?.email || 'No email provided'}
                      </p>
                      <p className="application-date">
                        <i className="fas fa-calendar me-2"></i>
                        Applied: {new Date(application.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {application.cover_letter && (
                    <div className="cover-letter">
                      <h6><i className="fas fa-file-text me-2"></i>Cover Letter</h6>
                      <p>{application.cover_letter}</p>
                    </div>
                  )}
                  
                  <div className="application-actions d-flex gap-2">
                    <Button 
                      variant="primary"
                      onClick={() => {
                        viewCandidateResume(application.candidate?.id || application.candidate_id, application.candidate?.name || 'Unknown Candidate');
                      }}
                      style={{ 
                        background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                        border: 'none'
                      }}
                    >
                      <i className="fas fa-eye me-2"></i>
                      View Resume
                    </Button>
                    
                    {application.status === 'pending' && (
                      <>
                        <Button 
                          variant="success"
                          onClick={() => handleApplicationDecision(application.id, 'accepted')}
                          disabled={loading}
                          style={{ 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none'
                          }}
                        >
                          <i className="fas fa-check me-2"></i>
                          Accept
                        </Button>
                        <Button 
                          variant="danger"
                          onClick={() => handleApplicationDecision(application.id, 'rejected')}
                          disabled={loading}
                          style={{ 
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            border: 'none'
                          }}
                        >
                          <i className="fas fa-times me-2"></i>
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {application.status !== 'pending' && (
                      <Badge 
                        bg={application.status === 'accepted' ? 'success' : 
                            application.status === 'rejected' ? 'danger' : 'info'}
                        className="d-flex align-items-center"
                      >
                        <i className={`fas fa-${application.status === 'accepted' ? 'check' : 
                                           application.status === 'rejected' ? 'times' : 'eye'} me-1`}></i>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="applications-footer">
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowApplicationsModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RecruiterDashboard;
