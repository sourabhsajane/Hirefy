import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './AboutUs.css';

const AboutUs: React.FC = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero-section">
        <div className="about-hero-background"></div>
        <Container className="position-relative">
          <Row className="align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
            <Col lg={10} className="text-white text-center">
              <Badge bg="warning" className="mb-3 px-3 py-2 rounded-pill">
                💼 About Hirefy
              </Badge>
              <h1 className="display-3 fw-bold mb-4 about-hero-title">
                Connecting Talent with
                <span className="text-gradient"> Opportunity</span>
              </h1>
              <p className="lead mb-5 about-hero-subtitle">
                Hirefy is a modern hiring platform that bridges the gap between exceptional talent 
                and visionary companies, creating meaningful career opportunities through AI-powered matching.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Mission & Values Combined Section */}
      <section className="mission-section py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col lg={8} className="mx-auto">
              <h2 className="display-5 fw-bold mb-4">Our Mission & Values</h2>
              <p className="lead text-muted">
                We believe finding the right job shouldn't be a challenge. Our platform leverages 
                cutting-edge technology to create perfect matches between candidates and employers.
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col lg={3} md={6}>
              <Card className="h-100 border-0 shadow-lg value-card">
                <Card.Body className="text-center p-4">
                  <div className="value-icon mb-3">
                    <i className="fas fa-rocket"></i>
                  </div>
                  <Card.Title className="h5 mb-3">Innovation</Card.Title>
                  <Card.Text className="text-muted">
                    Using AI to match the right talent with the right opportunities.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6}>
              <Card className="h-100 border-0 shadow-lg value-card">
                <Card.Body className="text-center p-4">
                  <div className="value-icon mb-3">
                    <i className="fas fa-star"></i>
                  </div>
                  <Card.Title className="h5 mb-3">Excellence</Card.Title>
                  <Card.Text className="text-muted">
                    Striving for the highest quality in everything we deliver.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6}>
              <Card className="h-100 border-0 shadow-lg value-card">
                <Card.Body className="text-center p-4">
                  <div className="value-icon mb-3">
                    <i className="fas fa-users"></i>
                  </div>
                  <Card.Title className="h5 mb-3">People First</Card.Title>
                  <Card.Text className="text-muted">
                    Your success is our priority, every step of the way.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={3} md={6}>
              <Card className="h-100 border-0 shadow-lg value-card">
                <Card.Body className="text-center p-4">
                  <div className="value-icon mb-3">
                    <i className="fas fa-globe"></i>
                  </div>
                  <Card.Title className="h5 mb-3">Global Reach</Card.Title>
                  <Card.Text className="text-muted">
                    Connecting professionals and companies worldwide.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="about-cta-section">
        <Container>
          <Row className="text-center">
            <Col lg={8} className="mx-auto">
              <div className="about-cta-content">
                <h2 className="display-5 fw-bold mb-4 text-white">
                  Ready to Get Started?
                </h2>
                <p className="lead text-white-75 mb-5">
                  Join thousands of professionals and companies who trust Hirefy for their career journey.
                </p>
                <div className="d-flex gap-4 justify-content-center flex-wrap">
                  <Link to="/signup">
                    <button className="btn btn-light btn-lg px-5 py-3 rounded-pill shadow-lg about-btn-hover">
                      <i className="fas fa-rocket me-2"></i>
                      Get Started
                    </button>
                  </Link>
                  <Link to="/">
                    <button className="btn btn-outline-light btn-lg px-5 py-3 rounded-pill about-btn-hover">
                      <i className="fas fa-home me-2"></i>
                      Back to Home
                    </button>
                  </Link>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default AboutUs;

