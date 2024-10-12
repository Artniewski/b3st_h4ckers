import { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactMarkdown from "react-markdown";
import Webcam from "react-webcam";

// Transcript type definition
type Transcript = {
    text: string;
    isUser: true;
} | {
    text: string;
    isUser: false;
    audio: string;
};

// Styled components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spin} 1s linear infinite;
  margin: 20px auto;
`;


const TranscriptContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    margin-bottom: 20px;
    padding: 10px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
`;

const Message = styled.div<{ isUser: boolean }>`
    margin: 10px 0;
    padding: 10px;
    background: ${(props) => (props.isUser ? '#d1ffd1' : '#e1e1e1')};
    border-radius: 10px;
    text-align: ${(props) => (props.isUser ? 'right' : 'left')};
`;

const RecordButton = styled.button`
    padding: 15px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.3s;

    &:hover {
        background: #0056b3;
    }
`;

type MockInterviewViewProps = {
    userDetails: any;
};

const MockInterviewView  = ({userDetails}: MockInterviewViewProps) => {
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Use useEffect for side effects (fetching data)
    useState(async () => {
        if (!userDetails) return; // Ensure userDetails is valid before fetching
        if(transcripts.length > 0) return; // Ensure we only fetch once
        setIsLoading(true);
        const fetchData = async () => {
            const response = await fetch("http://127.0.0.1:5000/details", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userDetails)
            });
            const responseJson = await response.json();
            console.log(responseJson);
            setIsLoading(false);
            setTranscripts((prev) => [...prev, { text: responseJson.body.ai_response, isUser: false, audio: responseJson.body.audio }]);
        };
    
        await fetchData();
    });

    const handleRecord = async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorderRef.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'audio.wav');
                    setIsLoading(true);
                    const response = await fetch("http://127.0.0.1:5000/process_audio", {
                        method: 'POST',
                        body: formData
                    });

                    const responseJson = await response.json();
                    console.log(responseJson);
                    setIsLoading(false);
                    setTranscripts((prev) => [
                        ...prev,
                        { text: responseJson.body.transcript, isUser: true },
                        { text: responseJson.body.ai_response, isUser: false, audio: responseJson.body.audio }
                    ]);
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (error) {
                console.error('Error accessing microphone:', error);
            }
            finally {
                setIsLoading(false);
            }
        } else {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        }
    };

    return (
        <Container>
            <Webcam/>
            <TranscriptContainer>
                {transcripts.map((transcript, index) => (
                    <Message key={index} isUser={transcript.isUser}>
                        <ReactMarkdown>
                            {transcript.text}
                        </ReactMarkdown>
                        {!transcript.isUser && <audio src={`http://127.0.0.1:5000/mp3/${transcript.audio}`} controls autoPlay={index === transcripts.length - 1} />}
                    </Message>
                ))}
                {isLoading && <LoadingSpinner />}
            </TranscriptContainer>
            <RecordButton onClick={handleRecord}>{isRecording ? 'Stop Recording' : 'Record Your Response'}</RecordButton>
        </Container>
    );
};

export default MockInterviewView;
