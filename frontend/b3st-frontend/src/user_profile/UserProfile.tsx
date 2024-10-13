import React, { useState } from 'react';
import styled from 'styled-components';

// User profile type definition
type UserProfile = {
    name: string;
    email: string;
    bio: string;
    skills: string;
    experience: string;
    education: string;
};

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 400px;
  min-width: 400px;
  margin: 0 auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Input = styled.input`
  margin-bottom: 15px;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
`;

const Textarea = styled.textarea`
  margin-bottom: 15px;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  resize: vertical;
`;

const SaveButton = styled.button`
  padding: 15px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #218838;
  }
`;

type UserProfileViewProps = {
    setUserDetails: any;
    setIsInterviewing: any;
};

const UserProfileView = ({setUserDetails, setIsInterviewing}: UserProfileViewProps) => {
    const [profile, setProfile] = useState<UserProfile>({
        name: 'Basia',
        email: 'basia@wp.pl',
        bio: 'Im a software developer intern',
        skills: 'Java, Spring',
        experience: 'None',
        education: 'Master of Computer Science',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile((prevProfile) => ({ ...prevProfile, [name]: value }));
    };

    const handleSave = () => {
        // Logic to save user profile, e.g., send to backend
        setUserDetails(profile);
        setIsInterviewing(true);
    };

    return (
        <Container>
            <Input
                type="text"
                name="name"
                placeholder="Name"
                value={profile.name}
                onChange={handleChange}
            />
            <Input
                type="email"
                name="email"
                placeholder="Email"
                value={profile.email}
                onChange={handleChange}
            />
            <Textarea
                name="bio"
                placeholder="Short bio"
                rows={5}
                value={profile.bio}
                onChange={handleChange}
            />
            <Textarea
                name="skills"
                placeholder="Skills (e.g., JavaScript, React, Node.js)"
                rows={3}
                value={profile.skills}
                onChange={handleChange}
            />
            <Textarea
                name="experience"
                placeholder="Work Experience"
                rows={5}
                value={profile.experience}
                onChange={handleChange}
            />
            <Textarea
                name="education"
                placeholder="Education"
                rows={4}
                value={profile.education}
                onChange={handleChange}
            />
            <SaveButton onClick={handleSave}>Start Interview</SaveButton>
        </Container>
    );
};

export default UserProfileView;