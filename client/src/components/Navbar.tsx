import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import './Navbar.css';

const NavbarComponent: React.FC = () => {
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();

  // Update user state when auth changes
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      setUser(event.detail.user);
    };

    const handleStorageChange = () => {
      setUser(getUser());
    };

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'recruiter':
        return '/recruiter/dashboard';
      case 'candidate':
        return '/candidate/dashboard';
      default:
        return '/';
    }
  };

  return (
    <Navbar 
      expand="lg" 
      className="navbar-modern"
      variant="dark"
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="navbar-brand">
          <span className="brand-text">Hirefy</span>
          <span className="brand-accent">.</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {!user ? (
              // Not logged in - show public navigation
              <>
                <Nav.Link as={Link} to="/" className="nav-link-custom">
                  <i className="fas fa-home me-1"></i>
                  Home
                </Nav.Link>
                <Nav.Link as={Link} to="/about" className="nav-link-custom">
                  <i className="fas fa-info-circle me-1"></i>
                  About Us
                </Nav.Link>
                <Nav.Link href="#features" className="nav-link-custom">
                  <i className="fas fa-star me-1"></i>
                  Features
                </Nav.Link>
                <Nav.Link href="#stats" className="nav-link-custom">
                  <i className="fas fa-chart-line me-1"></i>
                  Stats
                </Nav.Link>
                <div className="nav-divider"></div>
                <Nav.Link as={Link} to="/login" className="nav-button-outline">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/signup" className="nav-button-primary">
                  <i className="fas fa-rocket me-1"></i>
                  Get Started
                </Nav.Link>
              </>
            ) : (
              // Logged in - show user navigation
              <>
                <Nav.Link as={Link} to="/" className="nav-link-custom">
                  <i className="fas fa-home me-1"></i>
                  Home
                </Nav.Link>
                <Nav.Link as={Link} to="/about" className="nav-link-custom">
                  <i className="fas fa-info-circle me-1"></i>
                  About Us
                </Nav.Link>
                <Nav.Link as={Link} to={getDashboardLink()} className="nav-link-custom">
                  <i className="fas fa-tachometer-alt me-1"></i>
                  Dashboard
                </Nav.Link>
                <div className="nav-divider"></div>
                <Dropdown align="end">
                  <Dropdown.Toggle as={Nav.Link} className="nav-link-custom d-flex align-items-center">
                    <i className="fas fa-user-circle me-1"></i>
                    <div className="d-flex flex-column align-items-start">
                      <span>{user.name}</span>
                      <small className="role-tag">{user.role}</small>
                    </div>
                    <i className="fas fa-chevron-down ms-1"></i>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-menu-custom">
                    <Dropdown.Item as={Link} to="/profile">
                      <i className="fas fa-user me-2"></i>
                      Profile
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
