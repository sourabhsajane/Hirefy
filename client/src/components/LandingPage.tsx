import React from 'react';
import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background"></div>
        <Container className="position-relative">
          <Row className="align-items-center min-vh-100 justify-content-center">
            <Col lg={8} className="text-white text-center">
              <h1 className="display-3 fw-bold mb-4 hero-title">
                Your Dream Career
                <span className="text-gradient"> Awaits</span>
              </h1>
              <p className="lead mb-4 hero-subtitle">
                Connect with top companies and discover opportunities that match your skills. 
                From startups to Fortune 500, find your perfect match.
              </p>
              <div className="mb-4 text-center">
                <Link to="/signup">
                  <Button variant="light" size="lg" className="px-5 py-3 rounded-pill shadow-lg btn-hover">
                    Start Your Journey
                  </Button>
                </Link>
              </div>
              <div className="d-flex gap-4 text-white-50 justify-content-center">
                <div className="text-center">
                  <h4 className="fw-bold text-white">50K+</h4>
                  <small>Active Jobs</small>
                </div>
                <div className="text-center">
                  <h4 className="fw-bold text-white">2K+</h4>
                  <small>Companies</small>
                </div>
                <div className="text-center">
                  <h4 className="fw-bold text-white">98%</h4>
                  <small>Success Rate</small>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col lg={8} className="mx-auto">
              <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill">
                ✨ Features
              </Badge>
              <h2 className="display-4 fw-bold mb-4">Why Choose Hirefy?</h2>
              <p className="lead text-muted">
                Experience the next generation of job hunting and recruitment with our cutting-edge platform.
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col lg={4} md={6}>
              <Card className="h-100 border-0 shadow-lg feature-card">
                <Card.Body className="text-center p-5">
                  <div className="feature-icon mb-4">
                    <div className="icon-wrapper">
                      <i className="fas fa-magic"></i>
                    </div>
                  </div>
                  <Card.Title className="h4 mb-3">AI-Powered Matching</Card.Title>
                  <Card.Text className="text-muted">
                    Our advanced AI algorithm analyzes your skills, experience, and preferences to match you with the perfect job opportunities.
                  </Card.Text>
                  <div className="feature-highlight">
                    <small className="text-primary fw-bold">95% Match Accuracy</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="h-100 border-0 shadow-lg feature-card">
                <Card.Body className="text-center p-5">
                  <div className="feature-icon mb-4">
                    <div className="icon-wrapper">
                      <i className="fas fa-users"></i>
                    </div>
                  </div>
                  <Card.Title className="h4 mb-3">Elite Talent Network</Card.Title>
                  <Card.Text className="text-muted">
                    Connect with top-tier professionals and discover exceptional talent from our curated network of industry leaders.
                  </Card.Text>
                  <div className="feature-highlight">
                    <small className="text-primary fw-bold">10,000+ Verified Profiles</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6}>
              <Card className="h-100 border-0 shadow-lg feature-card">
                <Card.Body className="text-center p-5">
                  <div className="feature-icon mb-4">
                    <div className="icon-wrapper">
                      <i className="fas fa-rocket"></i>
                    </div>
                  </div>
                  <Card.Title className="h4 mb-3">Lightning Fast Process</Card.Title>
                  <Card.Text className="text-muted">
                    Get hired faster with our streamlined application process and real-time communication tools.
                  </Card.Text>
                  <div className="feature-highlight">
                    <small className="text-primary fw-bold">3x Faster Hiring</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section py-5">
        <Container>
          <Row className="g-4 text-center">
            <Col md={3}>
              <div className="stat-item">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Active Jobs</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-item">
                <div className="stat-number">2K+</div>
                <div className="stat-label">Companies</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-item">
                <div className="stat-number">100K+</div>
                <div className="stat-label">Professionals</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-item">
                <div className="stat-number">98%</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <Container>
          <Row className="text-center">
            <Col lg={8} className="mx-auto">
              <div className="cta-content">
                <h2 className="display-4 fw-bold mb-4 text-white">
                  Ready to Transform Your Career?
                </h2>
                <p className="lead text-white-75 mb-5">
                  Join over 100,000 professionals who have already found their dream jobs through Hirefy.
                </p>
                <div className="d-flex gap-4 justify-content-center flex-wrap">
                  <Link to="/signup">
                    <Button variant="light" size="lg" className="px-5 py-3 rounded-pill shadow-lg btn-hover">
                      <i className="fas fa-user-plus me-2"></i>
                      Find Your Dream Job
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="outline-light" size="lg" className="px-5 py-3 rounded-pill btn-hover">
                      <i className="fas fa-building me-2"></i>
                      Hire Top Talent
                    </Button>
                  </Link>
                </div>
                <div className="mt-4">
                  <small className="text-white-50">
                    <i className="fas fa-shield-alt me-1"></i>
                    Free to join • No hidden fees • Cancel anytime
                  </small>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <Container>
          <Row className="g-4">
            <Col lg={4}>
              <div className="footer-brand">
                <h4 className="fw-bold text-white mb-3">Hirefy</h4>
                <p className="text-white-75 mb-4">
                  The future of hiring is here. Connect with opportunities that matter.
                </p>
                <div className="social-links">
                  <a href="#" className="social-link"><i className="fab fa-twitter"></i></a>
                  <a href="#" className="social-link"><i className="fab fa-linkedin"></i></a>
                  <a href="#" className="social-link"><i className="fab fa-facebook"></i></a>
                  <a href="#" className="social-link"><i className="fab fa-instagram"></i></a>
                </div>
              </div>
            </Col>
            <Col lg={2} md={6}>
              <div className="footer-links">
                <h6 className="text-white mb-3">For Candidates</h6>
                <ul className="list-unstyled">
                  <li><a href="#" className="text-white-75">Find Jobs</a></li>
                  <li><a href="#" className="text-white-75">Career Advice</a></li>
                  <li><a href="#" className="text-white-75">Salary Insights</a></li>
                  <li><a href="#" className="text-white-75">Company Reviews</a></li>
                </ul>
              </div>
            </Col>
            <Col lg={2} md={6}>
              <div className="footer-links">
                <h6 className="text-white mb-3">For Employers</h6>
                <ul className="list-unstyled">
                  <li><a href="#" className="text-white-75">Post Jobs</a></li>
                  <li><a href="#" className="text-white-75">Find Talent</a></li>
                  <li><a href="#" className="text-white-75">Pricing</a></li>
                  <li><a href="#" className="text-white-75">Recruiting Tools</a></li>
                </ul>
              </div>
            </Col>
            <Col lg={2} md={6}>
              <div className="footer-links">
                <h6 className="text-white mb-3">Company</h6>
                <ul className="list-unstyled">
                  <li><Link to="/about" className="text-white-75">About Us</Link></li>
                  <li><a href="#" className="text-white-75">Careers</a></li>
                  <li><a href="#" className="text-white-75">Press</a></li>
                  <li><a href="#" className="text-white-75">Contact</a></li>
                </ul>
              </div>
            </Col>
            <Col lg={2} md={6}>
              <div className="footer-links">
                <h6 className="text-white mb-3">Support</h6>
                <ul className="list-unstyled">
                  <li><a href="#" className="text-white-75">Help Center</a></li>
                  <li><a href="#" className="text-white-75">Privacy Policy</a></li>
                  <li><a href="#" className="text-white-75">Terms of Service</a></li>
                  <li><a href="#" className="text-white-75">Security</a></li>
                </ul>
              </div>
            </Col>
          </Row>
          <hr className="my-4 border-secondary" />
          <Row className="align-items-center">
            <Col md={6}>
              <p className="text-white-75 mb-0">
                © 2025 Hirefy. All rights reserved. Made with ❤️ for professionals worldwide.
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <p className="text-white-75 mb-0">
                <i className="fas fa-globe me-1"></i>
                Available in 50+ countries
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;
