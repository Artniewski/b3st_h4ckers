import { useState, useRef } from 'react';
import styled from 'styled-components';
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

const MockInterviewView  = ({userDetails}:MockInterviewViewProps) => {
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    useState(async () => {
        const response = await fetch("http://127.0.0.1:5000/details", {
            method: 'POST',
            body: JSON.stringify(userDetails)
        });
        const responseJson = await response.json()
        console.log(responseJson)
        setTranscripts((prev) => [...prev, { text: responseJson.body.transcript, isUser: false, audio: responseJson.body.audio}]);
    })
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

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
                    const formData = new FormData()
                    formData.append('file', audioBlob, 'audio.wav')
                   const response = await fetch("http://127.0.0.1:5000/process_audio", {
                       method: 'POST',
                       body:formData
                   })
                    const responseJson = await response.json()
                    console.log(responseJson)
                    setTranscripts((prev) => [...prev, { text: responseJson.body.transcript, isUser: true }, {text: responseJson.body.ai_response, isUser: false, audio: responseJson.body.audio}]);

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

    return (
        <Container>
            <Webcam/>
            <TranscriptContainer>
                {transcripts.map((transcript, index) => (
                    <Message key={index} isUser={transcript.isUser}>
                        <ReactMarkdown>
                            {transcript.text}
                        </ReactMarkdown>
                                        {!transcript.isUser && <audio src={`http://127.0.0.1:5000/mp3/${transcript.audio}`} controls autoPlay={index == transcripts.length-1} />}
                                    </Message>
                ))}
            </TranscriptContainer>
            <RecordButton onClick={handleRecord}>{isRecording ? 'Stop Recording' : 'Record Your Response'}</RecordButton>
        </Container>
    );
};

export default MockInterviewView;