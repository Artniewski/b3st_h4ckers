import React from 'react';
import styled from 'styled-components';
import ReactMarkdown from "react-markdown";

// Summary type definition
type SummaryProps = {
  summaryText: string;
    summaryFlag: any;
};

// Styled components
const SummaryContainer = styled.div`
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: left;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  text-align: center;
  color: #333;
`;

const SummaryText = styled.div`
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 16px;
  line-height: 1.6;
    color:black;
    text-align: left;
`;

// Custom renderer to change text color
const renderers = {
    text: ({ children }: { children: React.ReactNode }) => (
        <span style={{ color: 'blue' }}>{children}</span>
    ),
};

const InterviewSummary: React.FC<SummaryProps> = ({ summaryText, summaryFlag}) => {
  return (
    <SummaryContainer>
      <Title>Interview Summary</Title>
      <SummaryText>
        <ReactMarkdown components={renderers}>{summaryText}</ReactMarkdown>
      </SummaryText>
      <button onClick={() => summaryFlag({isSet:false, text:""})}>Close</button>
    </SummaryContainer>
  );
};

export default InterviewSummary;