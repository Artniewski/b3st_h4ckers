import { useState, useRef } from 'react';
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
    flex-direction: row;
    margin: 0 auto;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const WebcamContainer = styled.div`
    margin-right: 20px;
    display: grid;
`;

const EndButton = styled.button`
    padding: 15px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.3s;

    &:hover {
        background: #c82333;
    }
`;

const ChatContainer = styled.div`
    flex: 2;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-height: 600px;
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
    min-width: 400px;
`;

const MyWebcam = styled(Webcam)`
    margin-bottom: 15px;
    border-radius: 10px;
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
    finish: any;
};

const MockInterviewView = ({ userDetails , finish}: MockInterviewViewProps) => {
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useState(async () => {
        if(transcripts.length > 0 || isLoading) {
            return;
        }
        setIsLoading(true);
        try {
            if(transcripts.length > 0) {
                return;
            }
            const response = await fetch("http://127.0.0.1:5000/details", {
                method: 'POST',
                body: JSON.stringify(userDetails),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const responseJson = await response.json();
            setTranscripts((prev) => [...prev, { text: responseJson.body.ai_response, isUser: false, audio: responseJson.body.audio }]);
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setIsLoading(false);
        }
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
                    try {
                        const response = await fetch("http://127.0.0.1:5000/process_audio", {
                            method: 'POST',
                            body: formData
                        });
                        const responseJson = await response.json();
                        setTranscripts((prev) => [
                            ...prev,
                            { text: responseJson.body.transcript, isUser: true },
                            { text: responseJson.body.ai_response, isUser: false, audio: responseJson.body.audio }
                        ]);
                    } catch (error) {
                        console.error('Error sending audio to server:', error);
                    } finally {
                        setIsLoading(false);
                    }
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (error) {
                console.error('Error accessing microphone:', error);
            }
        } else {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        }
    };

    const handleEndInterview = async () => {
        console.log('Interview ended');
        setIsLoading(true);
        const response = await fetch("http://127.0.0.1:5000/end_interview", {
            method: 'POST'
        });
        const responseJson = await response.json();
        console.log('Interview summary:', responseJson);
        finish(responseJson.summary);
    };

    return (
        <Container>
            <WebcamContainer>
                <MyWebcam />
                <EndButton onClick={handleEndInterview}>End Interview</EndButton>
            </WebcamContainer>
            <ChatContainer>
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
            </ChatContainer>
        </Container>
    );
};

export default MockInterviewView;