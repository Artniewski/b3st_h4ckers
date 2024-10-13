import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactMarkdown from "react-markdown";

// Interview type definition
type Interview = {
    snapshot_id: string;
    title: string;
};

// Styled components
const ListContainer = styled.div`
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  margin-bottom: 20px;
  text-align: center;
  color: #333;
`;

const ListItem = styled.div`
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #f1f1f1;
  }
`;

const SummaryContainer = styled.div`
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: left;
`;

const SummaryText = styled.div`
  padding: 10px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 16px;
  line-height: 1.6;
`;

const InterviewListView: React.FC = () => {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [selectedInterview, setSelectedInterview] = useState<string | null>(null);
    const [interviewDetails, setInterviewDetails] = useState<string | null>(null);

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/interviews');
                const data = await response.json();
                setInterviews(data);
            } catch (error) {
                console.error('Error fetching interviews:', error);
            }
        };
        fetchInterviews();
    }, []);

    const handleInterviewClick = async (interviewId: string) => {
        setSelectedInterview(interviewId);
        try {
            const response = await fetch(`http://127.0.0.1:5000/interviews/${interviewId}`);
            const data = await response.json();
            setInterviewDetails(JSON.stringify(data));
        } catch (error) {
            console.error('Error fetching interview details:', error);
        }
    };

    return (
        <>
            {!selectedInterview ? (
                <ListContainer>
                    <Title>Interview List</Title>
                    {interviews.map((interview) => (
                        <ListItem key={interview.snapshot_id} onClick={() => handleInterviewClick(interview.snapshot_id)}>
                            {interview.title}
                        </ListItem>
                    ))}
                </ListContainer>
            ) : (
                interviewDetails && (
                    <SummaryContainer>
                        <Title>Interview Details</Title>
                        <SummaryText>
                        <ReactMarkdown >{JSON.parse(interviewDetails)["title"]}</ReactMarkdown>
                        <ReactMarkdown >{JSON.parse(interviewDetails)["ai_summary"]}</ReactMarkdown>
                        <ReactMarkdown >{JSON.parse(interviewDetails)["questions"]}</ReactMarkdown>
                        </SummaryText>
                        {/* button that toggles selectedInterview */}
                        <button onClick={() => setSelectedInterview(null)}>Back</button>
                    </SummaryContainer>
                )
            )}
        </>
    );
};

export default InterviewListView;