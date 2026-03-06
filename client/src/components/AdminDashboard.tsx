import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Modal, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../utils/api';
import './AdminDashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  phone?: string;
  location?: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  employment_type: string;
  status: string;
  created_at: string;
  recruiter: {
    name: string;
    email: string;
  };
}

interface Application {
  id: string;
  job: {
    title: string;
  };
  candidate: {
    name: string;
    email: string;
  };
  status: string;
  applied_at: string;
  cover_letter: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [recruiters, setRecruiters] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalRecruiters: 0,
    totalJobs: 0,
    totalApplications: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [growthData, setGrowthData] = useState({
    candidatesGrowth: { labels: [], data: [] },
    recruitersGrowth: { labels: [], data: [] }
  });
  const [recentItems, setRecentItems] = useState({
    recentCandidates: [],
    recentRecruiters: [],
    recentApplications: []
  });
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add', 'edit', 'delete'
  const [modalData, setModalData] = useState<any>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalFormData, setModalFormData] = useState<any>({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Modal handlers
  const handleOpenModal = (type: string, data?: any, section?: string) => {
    setModalType(type);
    setModalData(data);
    setError('');
    setSuccess('');
    
    if (type === 'add') {
      setModalTitle(`Add New ${section?.slice(0, -1) || 'Item'}`);
      setModalFormData(getDefaultFormData(section));
    } else if (type === 'edit') {
      setModalTitle(`Edit ${section?.slice(0, -1) || 'Item'}`);
      setModalFormData({ ...data });
    } else if (type === 'delete') {
      setModalTitle(`Delete ${section?.slice(0, -1) || 'Item'}`);
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalType('');
    setModalData(null);
    setModalTitle('');
    setModalFormData({});
    setError('');
    setSuccess('');
  };

  const getDefaultFormData = (section: string | undefined) => {
    if (!section) return {};
    
    switch (section) {
      case 'candidates':
        return { name: '', email: '', password: '', role: 'candidate', phone: '', location: '' };
      case 'recruiters':
        return { name: '', email: '', password: '', role: 'recruiter', phone: '', location: '' };
      case 'jobs':
        return { 
          title: '', 
          description: '', 
          requirements: '', 
          location: '', 
          salary_min: '', 
          salary_max: '', 
          employment_type: 'full-time',
          remote_work: false,
          recruiter_id: '',
          skills_required: [],
          experience_required: 0
        };
      default:
        return {};
    }
  };

  const handleFormSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      let endpoint = '';
      let method = '';
      let data = {};

      if (activeSection === 'candidates' || activeSection === 'recruiters') {
        endpoint = '/admin/users';
        if (modalType === 'add') {
          method = 'POST';
          data = modalFormData;
        } else if (modalType === 'edit') {
          method = 'PUT';
          endpoint += `/${modalData.id}`;
          data = modalFormData;
        } else if (modalType === 'delete') {
          method = 'DELETE';
          endpoint += `/${modalData.id}`;
        }
      } else if (activeSection === 'jobs') {
        endpoint = '/admin/jobs';
        if (modalType === 'add') {
          method = 'POST';
          data = modalFormData;
        } else if (modalType === 'edit') {
          method = 'PUT';
          endpoint += `/${modalData.id}`;
          data = modalFormData;
        } else if (modalType === 'delete') {
          method = 'DELETE';
          endpoint += `/${modalData.id}`;
        }
      } else if (activeSection === 'applications') {
        if (modalType === 'delete') {
          endpoint = `/admin/applications/${modalData.id}`;
          method = 'DELETE';
        }
      }

      const response = await api({
        method,
        url: endpoint,
        data: method !== 'DELETE' ? data : undefined
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        
        // Refresh the current section
        if (activeSection === 'candidates') {
          fetchCandidates();
        } else if (activeSection === 'recruiters') {
          fetchRecruiters();
        } else if (activeSection === 'jobs') {
          fetchJobs();
        } else if (activeSection === 'applications') {
          fetchApplications();
        }
        
        // Refresh stats
        fetchStats();
        
        // Close modal after a short delay
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      } else {
        setError(response.data.message || 'Operation failed');
      }
    } catch (error: any) {
      console.error('Error performing operation:', error);
      setError(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is admin
    if (user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [user.role, navigate]);

  useEffect(() => {
    if (activeSection === 'candidates') {
      fetchCandidates();
    } else if (activeSection === 'recruiters') {
      fetchRecruiters();
    } else if (activeSection === 'jobs') {
      fetchJobs();
    } else if (activeSection === 'applications') {
      fetchApplications();
    }
  }, [activeSection]);

  const fetchStats = async () => {
    try {
      const [candidatesRes, recruitersRes, jobsRes, applicationsRes, growthRes, recentRes] = await Promise.all([
        api.get('/admin/users?role=candidate'),
        api.get('/admin/users?role=recruiter'),
        api.get('/admin/jobs'),
        api.get('/admin/applications'),
        api.get('/admin/growth-data'),
        api.get('/admin/recent-items')
      ]);

      setStats({
        totalCandidates: candidatesRes.data.users?.length || 0,
        totalRecruiters: recruitersRes.data.users?.length || 0,
        totalJobs: jobsRes.data.jobs?.length || 0,
        totalApplications: applicationsRes.data.applications?.length || 0
      });

      setGrowthData({
        candidatesGrowth: growthRes.data.candidatesGrowth || { labels: [], data: [] },
        recruitersGrowth: growthRes.data.recruitersGrowth || { labels: [], data: [] }
      });

      setRecentItems({
        recentCandidates: recentRes.data.recentCandidates || [],
        recentRecruiters: recentRes.data.recentRecruiters || [],
        recentApplications: recentRes.data.recentApplications || []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users?role=candidate');
      setCandidates(response.data.users || []);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecruiters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users?role=recruiter');
      setRecruiters(response.data.users || []);
    } catch (error) {
      console.error('Error fetching recruiters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/jobs');
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/applications');
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecruiters = recruiters.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(a => 
    a.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderOverview = () => {
    // Chart data for Candidates Growth
    const candidatesChartData = {
      labels: growthData.candidatesGrowth.labels,
      datasets: [
        {
          label: 'Candidates',
          data: growthData.candidatesGrowth.data,
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };

    // Chart data for Recruiters Growth
    const recruitersChartData = {
      labels: growthData.recruitersGrowth.labels,
      datasets: [
        {
          label: 'Recruiters',
          data: growthData.recruitersGrowth.data,
          backgroundColor: 'rgba(240, 147, 251, 0.8)',
          borderColor: 'rgba(240, 147, 251, 1)',
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
    };

    return (
      <div>
        <h2 className="mb-4">Admin Overview</h2>
        
        {/* Stats Cards */}
        <Row className="g-4 mb-4">
          <Col lg={3} md={6}>
            <Card className="stat-card stat-card-1">
              <Card.Body>
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">{stats.totalCandidates}</h3>
                  <p className="stat-label">Total Candidates</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="stat-card stat-card-2">
              <Card.Body>
                <div className="stat-icon">
                  <i className="fas fa-user-tie"></i>
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">{stats.totalRecruiters}</h3>
                  <p className="stat-label">Total Recruiters</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="stat-card stat-card-3">
              <Card.Body>
                <div className="stat-icon">
                  <i className="fas fa-briefcase"></i>
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">{stats.totalJobs}</h3>
                  <p className="stat-label">Total Jobs</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6}>
            <Card className="stat-card stat-card-4">
              <Card.Body>
                <div className="stat-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">{stats.totalApplications}</h3>
                  <p className="stat-label">Total Applications</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Growth Charts */}
        <Row className="g-4 mb-4">
          <Col md={6}>
            <Card className="chart-card">
              <Card.Body>
                <h5 className="chart-title">
                  <i className="fas fa-chart-bar me-2"></i>
                  Candidates Growth (Last 6 Months)
                </h5>
                <div style={{ height: '300px' }}>
                  <Bar data={candidatesChartData} options={chartOptions} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="chart-card">
              <Card.Body>
                <h5 className="chart-title">
                  <i className="fas fa-chart-bar me-2"></i>
                  Recruiters Growth (Last 6 Months)
                </h5>
                <div style={{ height: '300px' }}>
                  <Bar data={recruitersChartData} options={chartOptions} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Items */}
        <Row className="g-4">
          {/* Top 3 Recent Candidates */}
          <Col md={4}>
            <Card className="recent-card">
              <Card.Body>
                <h5 className="recent-title">
                  <i className="fas fa-users me-2"></i>
                  Recent Candidates
                </h5>
                {recentItems.recentCandidates.length > 0 ? (
                  <div className="recent-list">
                    {recentItems.recentCandidates.map((candidate: any) => (
                      <div key={candidate.id} className="recent-item">
                        <div className="recent-item-icon candidate-icon">
                          <i className="fas fa-user"></i>
                        </div>
                        <div className="recent-item-content">
                          <div className="recent-item-name">{candidate.name}</div>
                          <div className="recent-item-meta">{candidate.email}</div>
                          <div className="recent-item-date">
                            <i className="far fa-clock me-1"></i>
                            {new Date(candidate.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">No candidates yet</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Top 3 Recent Recruiters */}
          <Col md={4}>
            <Card className="recent-card">
              <Card.Body>
                <h5 className="recent-title">
                  <i className="fas fa-user-tie me-2"></i>
                  Recent Recruiters
                </h5>
                {recentItems.recentRecruiters.length > 0 ? (
                  <div className="recent-list">
                    {recentItems.recentRecruiters.map((recruiter: any) => (
                      <div key={recruiter.id} className="recent-item">
                        <div className="recent-item-icon recruiter-icon">
                          <i className="fas fa-briefcase"></i>
                        </div>
                        <div className="recent-item-content">
                          <div className="recent-item-name">{recruiter.name}</div>
                          <div className="recent-item-meta">{recruiter.email}</div>
                          <div className="recent-item-date">
                            <i className="far fa-clock me-1"></i>
                            {new Date(recruiter.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">No recruiters yet</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Top 3 Recent Applications */}
          <Col md={4}>
            <Card className="recent-card">
              <Card.Body>
                <h5 className="recent-title">
                  <i className="fas fa-file-alt me-2"></i>
                  Recent Applications
                </h5>
                {recentItems.recentApplications.length > 0 ? (
                  <div className="recent-list">
                    {recentItems.recentApplications.map((application: any) => (
                      <div key={application.id} className="recent-item">
                        <div className="recent-item-icon application-icon">
                          <i className="fas fa-paper-plane"></i>
                        </div>
                        <div className="recent-item-content">
                          <div className="recent-item-name">{application.candidate?.name}</div>
                          <div className="recent-item-meta">{application.job?.title}</div>
                          <div className="recent-item-date">
                            <i className="far fa-clock me-1"></i>
                            {new Date(application.applied_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">No applications yet</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderCandidates = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>All Candidates</h2>
        <div className="d-flex gap-2">
          <Button 
            variant="success" 
            onClick={() => handleOpenModal('add', null, 'candidates')}
            style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none'
            }}
          >
            <i className="fas fa-plus me-2"></i>
            Add Candidate
          </Button>
          <Form.Control
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Card className="data-card">
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <tr key={candidate.id}>
                      <td>{candidate.name}</td>
                      <td>{candidate.email}</td>
                      <td>{candidate.phone || 'N/A'}</td>
                      <td>{candidate.location || 'N/A'}</td>
                      <td>{new Date(candidate.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal('edit', candidate, 'candidates')}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleOpenModal('delete', candidate, 'candidates')}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      No candidates found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );

  const renderRecruiters = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>All Recruiters</h2>
        <div className="d-flex gap-2">
          <Button 
            variant="success" 
            onClick={() => handleOpenModal('add', null, 'recruiters')}
            style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none'
            }}
          >
            <i className="fas fa-plus me-2"></i>
            Add Recruiter
          </Button>
          <Form.Control
            type="text"
            placeholder="Search recruiters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Card className="data-card">
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecruiters.length > 0 ? (
                  filteredRecruiters.map((recruiter) => (
                    <tr key={recruiter.id}>
                      <td>{recruiter.name}</td>
                      <td>{recruiter.email}</td>
                      <td>{recruiter.phone || 'N/A'}</td>
                      <td>{recruiter.location || 'N/A'}</td>
                      <td>{new Date(recruiter.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal('edit', recruiter, 'recruiters')}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleOpenModal('delete', recruiter, 'recruiters')}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      No recruiters found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );

  const renderJobs = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>All Jobs</h2>
        <div className="d-flex gap-2">
          <Button 
            variant="success" 
            onClick={() => handleOpenModal('add', null, 'jobs')}
            style={{ 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none'
            }}
          >
            <i className="fas fa-plus me-2"></i>
            Add Job
          </Button>
          <Form.Control
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Card className="data-card">
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Location</th>
                  <th>Salary</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Posted By</th>
                  <th>Posted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td>{job.title}</td>
                      <td>{job.location}</td>
                      <td>₹{job.salary_min?.toLocaleString()} - ₹{job.salary_max?.toLocaleString()}</td>
                      <td>{job.employment_type}</td>
                      <td>
                        <Badge bg={job.status === 'active' ? 'success' : job.status === 'closed' ? 'danger' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </td>
                      <td>{job.recruiter?.name || 'N/A'}</td>
                      <td>{new Date(job.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal('edit', job, 'jobs')}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleOpenModal('delete', job, 'jobs')}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-muted">
                      No jobs found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );

  const renderApplications = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>All Applications</h2>
        <Form.Control
          type="text"
          placeholder="Search applications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Card className="data-card">
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job Title</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((application) => (
                    <tr key={application.id}>
                      <td>
                        <div>{application.candidate.name}</div>
                        <small className="text-muted">{application.candidate.email}</small>
                      </td>
                      <td>{application.job.title}</td>
                      <td>
                        <Badge bg={
                          application.status === 'accepted' ? 'success' : 
                          application.status === 'rejected' ? 'danger' : 
                          application.status === 'reviewed' ? 'info' : 'warning'
                        }>
                          {application.status}
                        </Badge>
                      </td>
                      <td>{new Date(application.applied_at).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleOpenModal('delete', application, 'applications')}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      No applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h4 className="text-white mb-0">
            <i className="fas fa-shield-alt me-2"></i>
            Admin Panel
          </h4>
        </div>
        <div className="sidebar-menu">
          <div 
            className={`menu-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('overview');
              setSearchTerm('');
            }}
          >
            <i className="fas fa-chart-line"></i>
            <span>Overview</span>
          </div>
          <div 
            className={`menu-item ${activeSection === 'candidates' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('candidates');
              setSearchTerm('');
            }}
          >
            <i className="fas fa-users"></i>
            <span>All Candidates</span>
            <Badge bg="primary" className="ms-auto">{stats.totalCandidates}</Badge>
          </div>
          <div 
            className={`menu-item ${activeSection === 'recruiters' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('recruiters');
              setSearchTerm('');
            }}
          >
            <i className="fas fa-user-tie"></i>
            <span>All Recruiters</span>
            <Badge bg="primary" className="ms-auto">{stats.totalRecruiters}</Badge>
          </div>
          <div 
            className={`menu-item ${activeSection === 'jobs' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('jobs');
              setSearchTerm('');
            }}
          >
            <i className="fas fa-briefcase"></i>
            <span>All Jobs</span>
            <Badge bg="primary" className="ms-auto">{stats.totalJobs}</Badge>
          </div>
          <div 
            className={`menu-item ${activeSection === 'applications' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('applications');
              setSearchTerm('');
            }}
          >
            <i className="fas fa-file-alt"></i>
            <span>All Applications</span>
            <Badge bg="primary" className="ms-auto">{stats.totalApplications}</Badge>
          </div>
          <div className="menu-item logout-item" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="user-info">
            <i className="fas fa-user-circle fa-2x text-white mb-2"></i>
            <div className="text-white">
              <small className="d-block">{user.name}</small>
              <small className="text-white-50">{user.email}</small>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <Container fluid className="py-4">
          {activeSection === 'overview' && renderOverview()}
          {activeSection === 'candidates' && renderCandidates()}
          {activeSection === 'recruiters' && renderRecruiters()}
          {activeSection === 'jobs' && renderJobs()}
          {activeSection === 'applications' && renderApplications()}
        </Container>
      </div>

      {/* CRUD Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          {modalType === 'delete' ? (
            <div>
              <p>Are you sure you want to delete this {activeSection.slice(0, -1)}?</p>
              {activeSection === 'candidates' || activeSection === 'recruiters' ? (
                <div>
                  <strong>Name:</strong> {modalData?.name}<br />
                  <strong>Email:</strong> {modalData?.email}
                </div>
              ) : activeSection === 'jobs' ? (
                <div>
                  <strong>Job Title:</strong> {modalData?.title}<br />
                  <strong>Location:</strong> {modalData?.location}
                </div>
              ) : activeSection === 'applications' ? (
                <div>
                  <strong>Candidate:</strong> {modalData?.candidate?.name}<br />
                  <strong>Job:</strong> {modalData?.job?.title}
                </div>
              ) : null}
            </div>
          ) : (
            <Form>
              {(activeSection === 'candidates' || activeSection === 'recruiters') && (
                <>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Full Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={modalFormData.name || ''}
                          onChange={(e) => setModalFormData({...modalFormData, name: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email *</Form.Label>
                        <Form.Control
                          type="email"
                          value={modalFormData.email || ''}
                          onChange={(e) => setModalFormData({...modalFormData, email: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Password {modalType === 'add' ? '*' : '(leave blank to keep current)'}</Form.Label>
                        <Form.Control
                          type="password"
                          value={modalFormData.password || ''}
                          onChange={(e) => setModalFormData({...modalFormData, password: e.target.value})}
                          required={modalType === 'add'}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Role *</Form.Label>
                        <Form.Select
                          value={modalFormData.role || activeSection.slice(0, -1)}
                          onChange={(e) => setModalFormData({...modalFormData, role: e.target.value})}
                          required
                        >
                          <option value="candidate">Candidate</option>
                          <option value="recruiter">Recruiter</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          value={modalFormData.phone || ''}
                          onChange={(e) => setModalFormData({...modalFormData, phone: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                          type="text"
                          value={modalFormData.location || ''}
                          onChange={(e) => setModalFormData({...modalFormData, location: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
              
              {activeSection === 'jobs' && (
                <>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Job Title *</Form.Label>
                        <Form.Control
                          type="text"
                          value={modalFormData.title || ''}
                          onChange={(e) => setModalFormData({...modalFormData, title: e.target.value})}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                          type="text"
                          value={modalFormData.location || ''}
                          onChange={(e) => setModalFormData({...modalFormData, location: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Employment Type</Form.Label>
                        <Form.Select
                          value={modalFormData.employment_type || 'full-time'}
                          onChange={(e) => setModalFormData({...modalFormData, employment_type: e.target.value})}
                        >
                          <option value="full-time">Full Time</option>
                          <option value="part-time">Part Time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Min Salary (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          value={modalFormData.salary_min || ''}
                          onChange={(e) => setModalFormData({...modalFormData, salary_min: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Max Salary (₹)</Form.Label>
                        <Form.Control
                          type="number"
                          value={modalFormData.salary_max || ''}
                          onChange={(e) => setModalFormData({...modalFormData, salary_max: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          value={modalFormData.status || 'active'}
                          onChange={(e) => setModalFormData({...modalFormData, status: e.target.value})}
                        >
                          <option value="active">Active</option>
                          <option value="closed">Closed</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Recruiter ID *</Form.Label>
                        <Form.Control
                          type="text"
                          value={modalFormData.recruiter_id || ''}
                          onChange={(e) => setModalFormData({...modalFormData, recruiter_id: e.target.value})}
                          required
                          placeholder="Enter recruiter user ID"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Description *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={modalFormData.description || ''}
                      onChange={(e) => setModalFormData({...modalFormData, description: e.target.value})}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Requirements *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={modalFormData.requirements || ''}
                      onChange={(e) => setModalFormData({...modalFormData, requirements: e.target.value})}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Remote Work Available"
                      checked={modalFormData.remote_work || false}
                      onChange={(e) => setModalFormData({...modalFormData, remote_work: e.target.checked})}
                    />
                  </Form.Group>
                </>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button 
            variant={modalType === 'delete' ? 'danger' : 'primary'} 
            onClick={handleFormSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {modalType === 'delete' ? 'Deleting...' : 'Saving...'}
              </>
            ) : (
              modalType === 'delete' ? 'Delete' : modalType === 'add' ? 'Create' : 'Update'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
