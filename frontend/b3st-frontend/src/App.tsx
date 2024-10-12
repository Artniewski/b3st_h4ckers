import './App.css'
import MockInterviewView from "./interview/InterviewView.tsx";
import {useState} from "react";
import UserProfileView from "./user_profile/UserProfile.tsx";

function App() {

    const [userDetails, setUserDetails] = useState({
        name: '',
        email: '',
        bio: '',
        skills: '',
        experience: '',
        education: '',
    });

    const [isInterviewing, setIsInterviewing] = useState(false);

  return (
    <>
        {isInterviewing ? (
            <MockInterviewView userDetails={userDetails}/>
        ) : (
        <UserProfileView setUserDetails={setUserDetails} setIsInterviewing={setIsInterviewing} />
        )}
    </>
  )
}

export default App
