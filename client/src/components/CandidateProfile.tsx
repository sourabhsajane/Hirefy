import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Badge, Nav, Tab, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import api from '../utils/api';
import Navbar from './Navbar';
import './CandidateProfile.css';

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

const CandidateProfile: React.FC = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [activeTab, setActiveTab] = useState('personal-info');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Info
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    countryCode: '+91',
    state: '',
    city: '',
    country: '',
    pinCode: '',
    bio: '',
    // Skills
    skills: [] as string[],
    newSkill: '',
    // Experience
    experiences: [] as Array<{
      id: string;
      companyName: string;
      jobRole: string;
      yearsOfWork: string;
      startDate: string;
      endDate: string;
      currentlyWorking: boolean;
    }>,
    newExperience: {
      companyName: '',
      jobRole: '',
      yearsOfWork: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false
    },
    // Fresher option
    isFresher: false,
    // Education
    educations: [] as Array<{
      id: string;
      degree: string;
      institution: string;
      fieldOfStudy: string;
      startDate: string;
      endDate: string;
      currentlyStudying: boolean;
      gpa: string;
      description: string;
    }>,
    newEducation: {
      degree: '',
      institution: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      currentlyStudying: false,
      gpa: '',
      description: ''
    },
    // Resume
    resume: null as File | null
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tabSuccess, setTabSuccess] = useState<{[key: string]: string}>({});
  const [tabError, setTabError] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<{
    user: any;
    skills: string[];
    experiences: any[];
    educations: any[];
    profileCompletion: number;
    progressBreakdown?: {
      personalInfo: number;
      skills: number;
      experience: number;
      education: number;
      total: number;
      earnedPoints: number;
      totalPoints: number;
    };
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Ensure form data always has user values as fallback
  const getFormValue = (field: string, fallback: string = ''): string => {
    const formValue = formData[field as keyof typeof formData];
    const userValue = user?.[field as keyof typeof user] as string;
    
    console.log(`getFormValue(${field}): formValue=${formValue}, userValue=${userValue}, fallback=${fallback}`);
    
    if (formValue === '' || formValue === null || formValue === undefined) {
      const result = userValue || fallback;
      console.log(`getFormValue(${field}) returning userValue/fallback:`, result);
      return result;
    }
    
    console.log(`getFormValue(${field}) returning formValue:`, formValue);
    return formValue as string;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        resume: e.target.files![0]
      }));
    }
  };

  const handleAddSkill = () => {
    if (formData.newSkill.trim() && !formData.skills.includes(formData.newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill.trim()],
        newSkill: ''
      }));
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Function to calculate experience duration
  const calculateExperience = (startDate: string, endDate: string, currentlyWorking: boolean): string => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const end = currentlyWorking ? new Date() : new Date(endDate);
    
    if (!endDate && !currentlyWorking) return '';
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years === 0 && months === 0) {
      return '1 month';
    } else if (years === 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else if (months === 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
    }
  };

  const handleExperienceInputChange = (field: string, value: string | boolean) => {
    console.log(`Experience field ${field} changed to:`, value);
    
    setFormData(prev => {
      const updatedExperience = {
        ...prev.newExperience,
        [field]: value
      };
      
      // Auto-calculate years of work when dates change
      if (field === 'startDate' || field === 'endDate' || field === 'currentlyWorking') {
        const startDate = field === 'startDate' ? value as string : prev.newExperience.startDate;
        const endDate = field === 'endDate' ? value as string : prev.newExperience.endDate;
        const currentlyWorking = field === 'currentlyWorking' ? value as boolean : prev.newExperience.currentlyWorking;
        
        if (startDate && (endDate || currentlyWorking)) {
          updatedExperience.yearsOfWork = calculateExperience(startDate, endDate, currentlyWorking);
        }
      }
      
      console.log('Updated newExperience:', updatedExperience);
      
      return {
        ...prev,
        newExperience: updatedExperience
      };
    });
  };

  const handleAddExperience = () => {
    console.log('Adding experience:', formData.newExperience);
    
    if (formData.newExperience.companyName.trim() && formData.newExperience.jobRole.trim()) {
      const newExp = {
        id: Date.now().toString(),
        ...formData.newExperience,
        companyName: formData.newExperience.companyName.trim(),
        jobRole: formData.newExperience.jobRole.trim()
      };
      
      console.log('New experience object:', newExp);
      
      setFormData(prev => {
        const updatedExperiences = [...prev.experiences, newExp];
        console.log('Updated experiences array:', updatedExperiences);
        
        return {
          ...prev,
          experiences: updatedExperiences,
          newExperience: {
            companyName: '',
            jobRole: '',
            yearsOfWork: '',
            startDate: '',
            endDate: '',
            currentlyWorking: false
          }
        };
      });
    } else {
      console.log('Missing required fields for experience');
    }
  };

  const handleRemoveExperience = (experienceId: string) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== experienceId)
    }));
  };

  const handleEducationInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      newEducation: {
        ...prev.newEducation,
        [field]: value
      }
    }));
  };

  const handleAddEducation = () => {
    if (formData.newEducation.degree.trim() && formData.newEducation.institution.trim()) {
      const newEdu = {
        id: Date.now().toString(),
        ...formData.newEducation,
        degree: formData.newEducation.degree.trim(),
        institution: formData.newEducation.institution.trim(),
        fieldOfStudy: formData.newEducation.fieldOfStudy.trim()
      };
      
      setFormData(prev => ({
        ...prev,
        educations: [...prev.educations, newEdu],
        newEducation: {
          degree: '',
          institution: '',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          currentlyStudying: false,
          gpa: '',
          description: ''
        }
      }));
    }
  };

  const handleRemoveEducation = (educationId: string) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations.filter(edu => edu.id !== educationId)
    }));
  };

  // Load profile data on component mount
  useEffect(() => {
    const initializeProfile = async () => {
      // Check for skills parameter FIRST
      const urlParams = new URLSearchParams(window.location.search);
      const skillsParam = urlParams.get('skills');
      
      // Load profile data
      try {
        setLoading(true);
        const response = await api.get('/profile');
        const data = response.data;
        
        // Get existing skills from the API response
        const existingSkills = data.skills || [];
        
        // If there are skills in URL, add them
        if (skillsParam) {
          const decodedSkills = decodeURIComponent(skillsParam);
          const skillsArray = decodedSkills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
          
          if (skillsArray.length > 0) {
            console.log('Existing skills from DB:', existingSkills);
            console.log('New skills from URL:', skillsArray);
            
            // Filter out skills that already exist (case-insensitive)
            const existingSkillsLower = existingSkills.map((s: string) => s.toLowerCase());
            const newSkills = skillsArray.filter(skill => !existingSkillsLower.includes(skill.toLowerCase()));
            
            console.log('Skills to add (filtered):', newSkills);
            
            if (newSkills.length > 0) {
              // Merge new skills with existing
              const allSkills = [...existingSkills, ...newSkills];
              
              // Update formData with merged skills
              setFormData(prev => ({
                ...prev,
                name: data.name || prev.name || user?.name || '',
                email: data.email || prev.email || user?.email || '',
                phone: data.phone || prev.phone || '',
                state: data.state || prev.state || '',
                city: data.city || prev.city || '',
                country: data.country || prev.country || '',
                pinCode: data.pin_code || prev.pinCode || '',
                bio: data.bio || prev.bio || '',
                skills: allSkills,
                experiences: data.experiences || prev.experiences || [],
                educations: data.educations || prev.educations || []
              }));
              
              setProfileData({
                user: data,
                skills: allSkills,
                experiences: data.experiences || [],
                educations: data.educations || [],
                profileCompletion: data.profileCompletion || 0
              });
              
              // Automatically save the NEW skills to the database
              handleSaveSkillsFromEmail(newSkills);
              
              // Switch to skills tab
              setActiveTab('skills');
              
              console.log('Skills merged successfully!');
            } else {
              console.log('All skills already exist in profile');
              // Load normal profile data
              loadProfileDataFromResponse(data);
            }
            
            // Clear the URL parameter
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          // No skills in URL, just load normal profile data
          loadProfileDataFromResponse(data);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    initializeProfile();
  }, []);

  // Also load profile data on component mount as backup
  useEffect(() => {
    loadProfileData();
  }, []);
  
  const loadProfileDataFromResponse = (data: any) => {
    setFormData(prev => ({
      ...prev,
      name: data.name || prev.name || user?.name || '',
      email: data.email || prev.email || user?.email || '',
      phone: data.phone || prev.phone || '',
      state: data.state || prev.state || '',
      city: data.city || prev.city || '',
      country: data.country || prev.country || '',
      pinCode: data.pin_code || prev.pinCode || '',
      bio: data.bio || prev.bio || '',
      skills: data.skills || prev.skills || [],
      experiences: data.experiences || prev.experiences || [],
      educations: data.educations || prev.educations || []
    }));
    
    setProfileData({
      user: data,
      skills: data.skills || [],
      experiences: data.experiences || [],
      educations: data.educations || [],
      profileCompletion: data.profileCompletion || 0
    });
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile');
      
      console.log('Profile API response:', response.data);
      
      if (response.data.success) {
        const { user, skills, experiences, educations, profileCompletion } = response.data.data;
        
        console.log('Loaded user data:', user);
        console.log('Loaded skills:', skills);
        console.log('Loaded experiences:', experiences);
        console.log('Loaded educations:', educations);
        console.log('User fields - phone:', user.phone, 'state:', user.state, 'city:', user.city, 'country:', user.country, 'pin_code:', user.pin_code, 'bio:', user.bio);
        
        setProfileData(response.data.data);
        
        // Parse phone number to separate country code and number
        let phoneNumber = '';
        let countryCode = '+91'; // default
        
        if (user.phone) {
          // Try to extract country code from phone number
          const phoneStr = user.phone.toString();
          const countryCodeMatch = countryCodes.find(cc => phoneStr.startsWith(cc.code));
          if (countryCodeMatch) {
            countryCode = countryCodeMatch.code;
            phoneNumber = phoneStr.substring(countryCodeMatch.code.length);
          } else {
            // If no country code found, assume it's just the number
            phoneNumber = phoneStr;
          }
        }

        // Update form data with loaded data
        setFormData(prev => {
          const updatedFormData = {
            ...prev,
            name: user.name || prev.name || '',
            email: user.email || prev.email || '',
            phone: phoneNumber || prev.phone || '',
            countryCode: countryCode || prev.countryCode || '+91',
            state: user.state || prev.state || '',
            city: user.city || prev.city || '',
            country: user.country || prev.country || '',
            pinCode: user.pin_code || prev.pinCode || '',
            bio: user.bio || prev.bio || '',
            skills: skills || prev.skills || [],
            experiences: experiences || prev.experiences || [],
            educations: educations || prev.educations || [],
            isFresher: user.is_fresher || false
          };
          
          console.log('Updated formData:', updatedFormData);
          return updatedFormData;
        });
      } else {
        console.error('API returned success: false', response.data);
        setError('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Combine country code and phone number
      const fullPhone = formData.phone ? formData.countryCode + formData.phone : '';
      
      const updateData = {
        name: formData.name,
        phone: fullPhone,
        state: formData.state,
        city: formData.city,
        country: formData.country,
        pinCode: formData.pinCode,
        bio: formData.bio
      };
      
      console.log('Submitting profile update:', updateData);
      
      const response = await api.put('/profile/personal-info', updateData);
      
      console.log('Profile update response:', response.data);

      setSuccess('Personal Info saved! Moving to Skills...');
      setIsEditing(false);
      // Reload profile data to update progress
      await loadProfileData();
      
      // Auto-navigate to Skills tab after a brief delay
      setTimeout(() => {
        setActiveTab('skills');
        setSuccess('');
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSkills = async () => {
    try {
      setLoading(true);
      setTabError(prev => ({ ...prev, skills: '' }));
      await api.put('/profile/skills', {
        skills: formData.skills
      });
      setTabSuccess(prev => ({ ...prev, skills: 'Skills saved! Moving to Experience...' }));
      // Reload profile data to update progress
      loadProfileData();
      
      // Auto-navigate to Experience tab after a brief delay
      setTimeout(() => {
        setActiveTab('experience');
        setTabSuccess(prev => ({ ...prev, skills: '' }));
      }, 1500);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTabSuccess(prev => ({ ...prev, skills: '' }));
      }, 3000);
    } catch (error) {
      console.error('Error updating skills:', error);
      setTabError(prev => ({ ...prev, skills: 'Failed to update skills' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSkillsFromEmail = async (newSkills: string[]) => {
    try {
      setLoading(true);
      setTabError(prev => ({ ...prev, skills: '' }));
      
      // Add new skills to existing skills
      const updatedSkills = [...formData.skills, ...newSkills];
      
      await api.put('/profile/skills', {
        skills: updatedSkills
      });
      
      setTabSuccess({ skills: `Skills added from email successfully! Added: ${newSkills.join(', ')}` });
      
      // Reload profile data to update progress
      loadProfileData();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setTabSuccess({ skills: '' });
      }, 5000);
    } catch (error) {
      console.error('Error saving skills from email:', error);
      setTabError({ skills: 'Failed to save skills from email' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExperiences = async () => {
    try {
      setLoading(true);
      setTabError(prev => ({ ...prev, experience: '' }));
      
      console.log('Saving experiences:', formData.experiences);
      console.log('Is fresher:', formData.isFresher);
      
      const response = await api.put('/profile/experiences', {
        experiences: formData.experiences,
        isFresher: formData.isFresher
      });
      
      console.log('Experience save response:', response.data);
      
      const successMessage = formData.isFresher 
        ? 'Fresher profile saved! Moving to Education...' 
        : 'Experience saved! Moving to Education...';
      
      setTabSuccess(prev => ({ ...prev, experience: successMessage }));
      // Reload profile data to update progress
      await loadProfileData();
      
      // Auto-navigate to Education tab after a brief delay
      setTimeout(() => {
        setActiveTab('education');
        setTabSuccess(prev => ({ ...prev, experience: '' }));
      }, 1500);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTabSuccess(prev => ({ ...prev, experience: '' }));
      }, 3000);
    } catch (error: any) {
      console.error('Error updating experiences:', error);
      
      // Show more specific error message
      let errorMessage = 'Failed to update experiences';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // If it's a database column error, show helpful message
      if (errorMessage.includes('is_fresher') || errorMessage.includes('column')) {
        errorMessage = 'Database setup required. Please run the migration in Supabase first.';
      }
      
      setTabError(prev => ({ ...prev, experience: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEducations = async () => {
    try {
      setLoading(true);
      setTabError(prev => ({ ...prev, education: '' }));
      await api.put('/profile/educations', {
        educations: formData.educations
      });
      setTabSuccess(prev => ({ ...prev, education: 'Education saved! Moving to Resume...' }));
      // Reload profile data to update progress
      loadProfileData();
      
      // Auto-navigate to Resume tab after a brief delay
      setTimeout(() => {
        setActiveTab('resume');
        setTabSuccess(prev => ({ ...prev, education: '' }));
      }, 1500);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTabSuccess(prev => ({ ...prev, education: '' }));
      }, 3000);
    } catch (error) {
      console.error('Error updating education:', error);
      setTabError(prev => ({ ...prev, education: 'Failed to update education' }));
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('resume', file);

      const response = await api.post('/profile/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess('Resume uploaded successfully!');
        // Reload profile data to get updated resume URL
        loadProfileData();
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      setError('Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    try {
      setLoading(true);
      setTabError(prev => ({ ...prev, resume: '' }));
      console.log('🚀 Generating resume...');
      const response = await api.post('/profile/generate-resume');
      console.log('📄 Generate resume response:', response.data);
      
      if (response.data.success) {
        setTabSuccess(prev => ({ ...prev, resume: 'Resume generated successfully!' }));
        // Reload profile data to get updated resume URL
        loadProfileData();
        // Clear success message after 3 seconds
        setTimeout(() => {
          setTabSuccess(prev => ({ ...prev, resume: '' }));
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Error generating resume:', error);
      setTabError(prev => ({ ...prev, resume: 'Failed to generate resume' }));
    } finally {
      setLoading(false);
    }
  };

    const handleViewResume = () => {
      console.log('👁️ Viewing resume, profileData:', profileData?.user?.resume_url);
      if (profileData?.user?.resume_url) {
        const resumeUrl = `http://localhost:5000/api/profile${profileData.user.resume_url}`;
        console.log('🔗 Opening resume URL:', resumeUrl);
        // Open PDF in new tab
        window.open(resumeUrl, '_blank');
      } else {
        console.log('❌ No resume URL found');
        setTabError(prev => ({ ...prev, resume: 'No resume found. Please generate a resume first.' }));
      }
    };

  const handleSaveResume = async () => {
    try {
      if (!profileData?.user?.resume_url) {
        setTabError(prev => ({ ...prev, resume: 'No resume found. Please generate a resume first.' }));
        return;
      }

      setLoading(true);
      setTabError(prev => ({ ...prev, resume: '' }));
      const resumeUrl = `http://localhost:5000/api/profile${profileData.user.resume_url}`;
      console.log('💾 Downloading resume from URL:', resumeUrl);
      
      // Fetch the resume content
      const response = await fetch(resumeUrl);
      console.log('📥 Fetch response status:', response.status);
      const resumeContent = await response.blob();
      
      // Create a blob and download it
      const url = window.URL.createObjectURL(resumeContent);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profileData.user.name || 'Resume'}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setTabSuccess(prev => ({ ...prev, resume: 'PDF resume downloaded successfully!' }));
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTabSuccess(prev => ({ ...prev, resume: '' }));
      }, 3000);
    } catch (error) {
      console.error('Error saving resume:', error);
      setTabError(prev => ({ ...prev, resume: 'Failed to save resume' }));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const handleTabChange = (tabKey: string | null) => {
    if (tabKey) {
      setActiveTab(tabKey);
      // Clear any existing tab messages when switching tabs
      setTabSuccess({});
      setTabError({});
    }
  };

  const renderPersonalInfo = () => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5>Personal Information</h5>
          <Button
            variant={isEditing ? "outline-secondary" : "primary"}
            onClick={() => setIsEditing(!isEditing)}
            style={isEditing ? {} : { 
              background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
              border: 'none'
            }}
          >
            <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'} me-2`}></i>
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        {success && <Alert variant="success">{success}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={getFormValue('name', '')}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={getFormValue('email', '')}
                  onChange={handleInputChange}
                  disabled={true}
                  readOnly
                  required
                  style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                />
                <Form.Text className="text-muted">
                  <i className="fas fa-lock me-1"></i>
                  Email cannot be changed for security reasons
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Phone Number</Form.Label>
                <InputGroup>
                  <Form.Select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
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
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      if (digitsOnly.length <= 10) {
                        setFormData(prev => ({ ...prev, phone: digitsOnly }));
                      }
                    }}
                    disabled={!isEditing}
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
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  name="country"
                  value={getFormValue('country', '')}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your country"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>State</Form.Label>
                <Form.Control
                  type="text"
                  name="state"
                  value={getFormValue('state', '')}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your state"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>City</Form.Label>
                <Form.Control
                  type="text"
                  name="city"
                  value={getFormValue('city', '')}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your city"
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
                  name="pinCode"
                  value={getFormValue('pinCode', '')}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your pin code"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              {/* Empty column for spacing */}
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Bio</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="bio"
              value={getFormValue('bio', '')}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Tell us about yourself..."
            />
          </Form.Group>

          {isEditing && (
            <Button
              type="submit"
              variant="primary"
              style={{ 
                background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                border: 'none'
              }}
            >
              <i className="fas fa-save me-2"></i>
              Save Changes
            </Button>
          )}
        </Form>
      </div>
    );
  };

  const renderSkills = () => {
    return (
      <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Skills</h5>
              <Button
                variant={isEditing ? "outline-secondary" : "primary"}
                onClick={() => setIsEditing(!isEditing)}
                style={isEditing ? {} : { 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                  border: 'none'
                }}
              >
                <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'} me-2`}></i>
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            {tabSuccess.skills && <Alert variant="success">{tabSuccess.skills}</Alert>}
            {tabError.skills && <Alert variant="danger">{tabError.skills}</Alert>}

        <div className="skills-section">
          {/* Display Current Skills */}
          <div className="mb-4">
            <h6>Your Skills</h6>
            {formData.skills.length > 0 ? (
              <div className="skills-container">
                {formData.skills.map((skill, index) => (
                  <Badge
                    key={index}
                    bg="primary"
                    className="skill-badge"
                    style={{ 
                      background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                      border: 'none',
                      margin: '0.25rem',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem'
                    }}
                  >
                    {skill}
                    {isEditing && (
                      <button
                        type="button"
                        className="skill-remove-btn"
                        onClick={() => handleRemoveSkill(skill)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          marginLeft: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="no-skills">
                <p className="text-muted">No skills added yet. Add your first skill below!</p>
              </div>
            )}
          </div>

          {/* Add New Skill */}
          {isEditing && (
            <div className="add-skill-section">
              <h6>Add New Skill</h6>
              <div className="d-flex gap-2 mb-3">
                <Form.Control
                  type="text"
                  placeholder="Enter a skill (e.g., JavaScript, React, Python)"
                  value={formData.newSkill}
                  onChange={(e) => setFormData(prev => ({ ...prev, newSkill: e.target.value }))}
                  onKeyPress={handleSkillKeyPress}
                  style={{ flex: 1 }}
                />
                <Button
                  variant="primary"
                  onClick={handleAddSkill}
                  disabled={!formData.newSkill.trim()}
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                    border: 'none'
                  }}
                >
                  <i className="fas fa-plus"></i>
                </Button>
              </div>
              <Form.Text className="text-muted">
                Press Enter or click the + button to add a skill
              </Form.Text>
            </div>
          )}

          {/* Save Button */}
          {isEditing && (
            <div className="mt-4">
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveSkills}
                disabled={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                  border: 'none'
                }}
              >
                <i className="fas fa-save me-2"></i>
                {loading ? 'Saving...' : 'Save Skills'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExperience = () => {
    return (
      <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Work Experience</h5>
              <Button
                variant={isEditing ? "outline-secondary" : "primary"}
                onClick={() => setIsEditing(!isEditing)}
                style={isEditing ? {} : { 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                  border: 'none'
                }}
              >
                <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'} me-2`}></i>
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            {tabSuccess.experience && <Alert variant="success">{tabSuccess.experience}</Alert>}
            {tabError.experience && <Alert variant="danger">{tabError.experience}</Alert>}

        <div className="experience-section">
          {/* Display Current Experiences */}
          <div className="mb-4">
            <h6>Your Work Experience</h6>
            {formData.experiences.length > 0 ? (
              <div className="experiences-container">
                {formData.experiences.map((exp, index) => (
                  <Card key={exp.id} className="experience-card mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{exp.jobRole}</h6>
                          <p className="text-primary mb-1 fw-bold">{exp.companyName}</p>
                          <div className="experience-details">
                            <small className="text-muted d-block">
                              <i className="fas fa-calendar me-1"></i>
                              {exp.startDate} - {exp.currentlyWorking ? 'Present' : exp.endDate}
                            </small>
                            {exp.yearsOfWork && (
                              <small className="text-muted d-block">
                                <i className="fas fa-clock me-1"></i>
                                {exp.yearsOfWork} years
                              </small>
                            )}
                            {exp.currentlyWorking && (
                              <Badge bg="success" className="mt-1">
                                <i className="fas fa-check-circle me-1"></i>
                                Currently Working
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isEditing && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveExperience(exp.id)}
                            className="ms-2"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="no-experience">
                <p className="text-muted">No work experience added yet. Add your first experience below!</p>
              </div>
            )}
          </div>

          {/* Add New Experience */}
          {isEditing && (
            <div className="add-experience-section">
              {/* Fresher Option */}
              <div className="fresher-option-section mb-4">
                <Card className="border-info">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <Form.Check
                        type="checkbox"
                        id="fresher-checkbox"
                        checked={formData.isFresher}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            isFresher: e.target.checked,
                            // Clear experiences if marking as fresher
                            experiences: e.target.checked ? [] : prev.experiences,
                            newExperience: {
                              companyName: '',
                              jobRole: '',
                              yearsOfWork: '',
                              startDate: '',
                              endDate: '',
                              currentlyWorking: false
                            }
                          }));
                        }}
                        className="me-3"
                      />
                      <div>
                        <h6 className="mb-1 text-info">
                          <i className="fas fa-graduation-cap me-2"></i>
                          I'm a Fresher
                        </h6>
                        <p className="text-muted mb-0 small">
                          Check this if you're a fresh graduate with no work experience. 
                          This will count as 20 points towards your resume completion.
                        </p>
                      </div>
                    </div>
                    {formData.isFresher && (
                      <Alert variant="success" className="mt-3 mb-0">
                        <i className="fas fa-check-circle me-2"></i>
                        Great! As a fresher, you've earned 20 points towards your resume. 
                        Focus on completing your education and skills sections.
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </div>

              {!formData.isFresher && (
                <>
                  <h6>Add New Work Experience</h6>
                  <Card className="add-experience-form">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Name *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter company name"
                          value={formData.newExperience.companyName}
                          onChange={(e) => handleExperienceInputChange('companyName', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Job Role *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter your job title/role"
                          value={formData.newExperience.jobRole}
                          onChange={(e) => handleExperienceInputChange('jobRole', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.newExperience.startDate}
                          onChange={(e) => handleExperienceInputChange('startDate', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>End Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.newExperience.endDate}
                          onChange={(e) => handleExperienceInputChange('endDate', e.target.value)}
                          disabled={formData.newExperience.currentlyWorking}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Years of Work (Auto-calculated)</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Will be calculated automatically"
                          value={formData.newExperience.yearsOfWork}
                          readOnly
                          className="bg-light"
                        />
                        <Form.Text className="text-muted">
                          This field is automatically calculated based on start and end dates
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Currently Working Here"
                          checked={formData.newExperience.currentlyWorking}
                          onChange={(e) => {
                            handleExperienceInputChange('currentlyWorking', e.target.checked);
                            if (e.target.checked) {
                              handleExperienceInputChange('endDate', '');
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={handleAddExperience}
                      disabled={!formData.newExperience.companyName.trim() || !formData.newExperience.jobRole.trim()}
                      style={{ 
                        background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                        border: 'none'
                      }}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Add Experience
                    </Button>
                  </div>
                </Card.Body>
              </Card>
                </>
              )}
            </div>
          )}

          {/* Save Button */}
          {isEditing && (
            <div className="mt-4">
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveExperiences}
                disabled={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                  border: 'none'
                }}
              >
                <i className="fas fa-save me-2"></i>
                {loading ? 'Saving...' : 'Save Experience'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEducation = () => {
    return (
      <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5>Education</h5>
              <Button
                variant={isEditing ? "outline-secondary" : "primary"}
                onClick={() => setIsEditing(!isEditing)}
                style={isEditing ? {} : { 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                  border: 'none'
                }}
              >
                <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'} me-2`}></i>
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            {tabSuccess.education && <Alert variant="success">{tabSuccess.education}</Alert>}
            {tabError.education && <Alert variant="danger">{tabError.education}</Alert>}

        <div className="education-section">
          {/* Display Current Education */}
          <div className="mb-4">
            <h6>Your Education</h6>
            {formData.educations.length > 0 ? (
              <div className="educations-container">
                {formData.educations.map((edu, index) => (
                  <Card key={edu.id} className="education-card mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{edu.degree}</h6>
                          <p className="text-primary mb-1 fw-bold">{edu.institution}</p>
                          {edu.fieldOfStudy && (
                            <p className="text-muted mb-1">{edu.fieldOfStudy}</p>
                          )}
                          <div className="education-details">
                            <small className="text-muted d-block">
                              <i className="fas fa-calendar me-1"></i>
                              {edu.startDate} - {edu.currentlyStudying ? 'Present' : edu.endDate}
                            </small>
                            {edu.gpa && (
                              <small className="text-muted d-block">
                                <i className="fas fa-star me-1"></i>
                                GPA: {edu.gpa}
                              </small>
                            )}
                            {edu.currentlyStudying && (
                              <Badge bg="info" className="mt-1">
                                <i className="fas fa-graduation-cap me-1"></i>
                                Currently Studying
                              </Badge>
                            )}
                            {edu.description && (
                              <small className="text-muted d-block mt-2">
                                {edu.description}
                              </small>
                            )}
                          </div>
                        </div>
                        {isEditing && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveEducation(edu.id)}
                            className="ms-2"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="no-education">
                <p className="text-muted">No education added yet. Add your first education below!</p>
              </div>
            )}
          </div>

          {/* Add New Education */}
          {isEditing && (
            <div className="add-education-section">
              <h6>Add New Education</h6>
              <Card className="add-education-form">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Degree *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., Bachelor of Science, Master of Arts"
                          value={formData.newEducation.degree}
                          onChange={(e) => handleEducationInputChange('degree', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Institution *</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter institution name"
                          value={formData.newEducation.institution}
                          onChange={(e) => handleEducationInputChange('institution', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Field of Study</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., Computer Science, Business Administration"
                          value={formData.newEducation.fieldOfStudy}
                          onChange={(e) => handleEducationInputChange('fieldOfStudy', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>GPA</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., 3.8/4.0, 8.5/10"
                          value={formData.newEducation.gpa}
                          onChange={(e) => handleEducationInputChange('gpa', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.newEducation.startDate}
                          onChange={(e) => handleEducationInputChange('startDate', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>End Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.newEducation.endDate}
                          onChange={(e) => handleEducationInputChange('endDate', e.target.value)}
                          disabled={formData.newEducation.currentlyStudying}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Currently Studying"
                          checked={formData.newEducation.currentlyStudying}
                          onChange={(e) => {
                            handleEducationInputChange('currentlyStudying', e.target.checked);
                            if (e.target.checked) {
                              handleEducationInputChange('endDate', '');
                            }
                          }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      {/* Empty column for spacing */}
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Relevant coursework, projects, achievements, etc."
                      value={formData.newEducation.description}
                      onChange={(e) => handleEducationInputChange('description', e.target.value)}
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={handleAddEducation}
                      disabled={!formData.newEducation.degree.trim() || !formData.newEducation.institution.trim()}
                      style={{ 
                        background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                        border: 'none'
                      }}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Add Education
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}

          {/* Save Button */}
          {isEditing && (
            <div className="mt-4">
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveEducations}
                disabled={loading}
                style={{ 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                  border: 'none'
                }}
              >
                <i className="fas fa-save me-2"></i>
                {loading ? 'Saving...' : 'Save Education'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResume = () => {
    const completionPercentage = profileData?.profileCompletion || 0;
    const progressBreakdown = profileData?.progressBreakdown as {
      personalInfo: number;
      skills: number;
      experience: number;
      education: number;
      total: number;
      earnedPoints: number;
      totalPoints: number;
    } | undefined;
    const isProfileComplete = completionPercentage >= 80; // Consider 80%+ as complete for resume generation

    const getProgressColor = (percentage: number) => {
      if (percentage >= 90) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; // Green
      if (percentage >= 70) return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'; // Yellow
      if (percentage >= 50) return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'; // Orange
      return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'; // Red
    };

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5>Resume Management</h5>
        </div>

        {tabSuccess.resume && <Alert variant="success">{tabSuccess.resume}</Alert>}
        {tabError.resume && <Alert variant="danger">{tabError.resume}</Alert>}

        {/* Enhanced Profile Completion Progress */}
        <div className="profile-completion-section mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">Profile Completion</h6>
            <span className="badge bg-primary">
              {progressBreakdown?.earnedPoints || 0}/{progressBreakdown?.totalPoints || 100} points
            </span>
          </div>
          
          {/* Main Progress Bar */}
          <div className="progress mb-4" style={{ height: '30px' }}>
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ 
                width: `${completionPercentage}%`,
                background: getProgressColor(completionPercentage),
                transition: 'width 0.5s ease, background 0.3s ease',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              aria-valuenow={completionPercentage} 
              aria-valuemin={0} 
              aria-valuemax={100}
            >
              {loading ? 'Updating...' : `${completionPercentage}% Complete`}
            </div>
          </div>

          {/* Section-wise Progress */}
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="progress-section-card p-3 border rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="fw-bold">Personal Info</small>
                  {progressBreakdown && (
                    <span className={`badge ${progressBreakdown.personalInfo >= 90 ? 'bg-success' : progressBreakdown.personalInfo >= 70 ? 'bg-warning' : 'bg-danger'}`}>
                      {progressBreakdown.personalInfo}%
                    </span>
                  )}
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${progressBreakdown?.personalInfo || 0}%`,
                      background: getProgressColor(progressBreakdown?.personalInfo || 0)
                    }}
                  ></div>
                </div>
                <small className="text-muted">Name, Contact, Location, Bio</small>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="progress-section-card p-3 border rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="fw-bold">Skills</small>
                  {progressBreakdown && (
                    <span className={`badge ${progressBreakdown.skills >= 90 ? 'bg-success' : progressBreakdown.skills >= 70 ? 'bg-warning' : 'bg-danger'}`}>
                      {progressBreakdown.skills}%
                    </span>
                  )}
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${progressBreakdown?.skills || 0}%`,
                      background: getProgressColor(progressBreakdown?.skills || 0)
                    }}
                  ></div>
                </div>
                <small className="text-muted">Technical & Soft Skills</small>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="progress-section-card p-3 border rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="fw-bold">Experience</small>
                  {progressBreakdown && (
                    <span className={`badge ${progressBreakdown.experience >= 90 ? 'bg-success' : progressBreakdown.experience >= 70 ? 'bg-warning' : 'bg-danger'}`}>
                      {progressBreakdown.experience}%
                    </span>
                  )}
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${progressBreakdown?.experience || 0}%`,
                      background: getProgressColor(progressBreakdown?.experience || 0)
                    }}
                  ></div>
                </div>
                <small className="text-muted">Work Experience</small>
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="progress-section-card p-3 border rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="fw-bold">Education</small>
                  {progressBreakdown && (
                    <span className={`badge ${progressBreakdown.education >= 90 ? 'bg-success' : progressBreakdown.education >= 70 ? 'bg-warning' : 'bg-danger'}`}>
                      {progressBreakdown.education}%
                    </span>
                  )}
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${progressBreakdown?.education || 0}%`,
                      background: getProgressColor(progressBreakdown?.education || 0)
                    }}
                  ></div>
                </div>
                <small className="text-muted">Academic Background</small>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className={`mb-0 ${isProfileComplete ? 'text-success fw-bold' : 'text-muted'}`}>
              {isProfileComplete 
                ? '🎉 Your profile is 80%+ complete! You can now generate your resume.' 
                : `Keep going! Complete at least 80% of your profile to generate your resume.`
              }
            </p>
          </div>
        </div>

        {/* Resume Actions */}
        <div className="resume-actions-section">
          <Row>
            <Col md={4}>
              <Card className="resume-action-card h-100">
                <Card.Body className="text-center">
                  <i className="fas fa-magic fa-3x text-primary mb-3"></i>
                    <h6>Generate PDF Resume</h6>
                    <p className="text-muted small">Auto-generate PDF from your profile data</p>
                  <Button
                    variant="primary"
                    onClick={handleGenerateResume}
                    disabled={!isProfileComplete || loading}
                    style={{ 
                      background: isProfileComplete ? 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)' : '#6b7280',
                      border: 'none',
                      width: '100%'
                    }}
                  >
                    <i className="fas fa-magic me-2"></i>
                      {loading ? 'Generating PDF...' : 'Generate PDF Resume'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="resume-action-card h-100">
                <Card.Body className="text-center">
                  <i className="fas fa-eye fa-3x text-info mb-3"></i>
                    <h6>View PDF Resume</h6>
                    <p className="text-muted small">Preview your generated PDF resume</p>
                  <Button
                    variant="outline-info"
                    onClick={handleViewResume}
                    disabled={!profileData?.user?.resume_url || loading}
                    style={{ 
                      borderColor: '#fbbf24', 
                      color: '#fbbf24',
                      width: '100%'
                    }}
                  >
                      <i className="fas fa-eye me-2"></i>
                      View PDF Resume
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="resume-action-card h-100">
                <Card.Body className="text-center">
                  <i className="fas fa-download fa-3x text-success mb-3"></i>
                    <h6>Download PDF Resume</h6>
                    <p className="text-muted small">Download your resume as PDF</p>
                  <Button
                    variant="outline-success"
                    onClick={handleSaveResume}
                    disabled={!profileData?.user?.resume_url || loading}
                    style={{ 
                      borderColor: '#fbbf24', 
                      color: '#fbbf24',
                      width: '100%'
                    }}
                  >
                      <i className="fas fa-download me-2"></i>
                      Download PDF
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Resume Status */}
        {profileData?.user?.resume_url && (
          <div className="resume-status mt-4">
            <Alert variant="success">
              <i className="fas fa-check-circle me-2"></i>
                <strong>PDF Resume Generated!</strong> Your professional PDF resume is ready. You can view or download it anytime.
            </Alert>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="candidate-profile">
      <Navbar />

      <Container className="profile-container">
        <div className="profile-header">
          <h2>My Profile</h2>
          <p className="text-muted">Manage your personal information and professional details</p>
        </div>

        <Row>
          <Col lg={4}>
            <Card className="profile-card">
              <Card.Body className="text-center">
                <div className="profile-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <h5 className="mt-3">{user?.name}</h5>
                <p className="text-muted">{user?.email}</p>
                <Badge 
                  bg="primary" 
                  style={{ 
                    background: 'linear-gradient(135deg, #fbbf24 0%, #1f2937 100%)',
                    border: 'none'
                  }}
                >
                  {user?.role}
                </Badge>
                
                <div className="profile-stats mt-4">
                  <div className="stat-item">
                    <h6>0</h6>
                    <small>Applications</small>
                  </div>
                  <div className="stat-item">
                    <h6>0</h6>
                    <small>Interviews</small>
                  </div>
                  <div className="stat-item">
                    <h6>0</h6>
                    <small>Offers</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Card className="profile-form-card">
              <Card.Body>
                <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
                  <Nav variant="tabs" className="profile-tabs">
                    <Nav.Item>
                      <Nav.Link eventKey="personal-info">
                        <i className="fas fa-user me-2"></i>
                        Personal Info
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="skills">
                        <i className="fas fa-code me-2"></i>
                        Skills
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="experience">
                        <i className="fas fa-briefcase me-2"></i>
                        Experience
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="education">
                        <i className="fas fa-graduation-cap me-2"></i>
                        Education
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="resume">
                        <i className="fas fa-file-alt me-2"></i>
                        Resume
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content className="mt-4">
                    <Tab.Pane eventKey="personal-info">
                      {renderPersonalInfo()}
                    </Tab.Pane>
                    <Tab.Pane eventKey="skills">
                      {renderSkills()}
                    </Tab.Pane>
                    <Tab.Pane eventKey="experience">
                      {renderExperience()}
                    </Tab.Pane>
                    <Tab.Pane eventKey="education">
                      {renderEducation()}
                    </Tab.Pane>
                    <Tab.Pane eventKey="resume">
                      {renderResume()}
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CandidateProfile;
