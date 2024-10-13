import './App.css'
import MockInterviewView from "./interview/InterviewView.tsx";
import InterviewListView from "./interview/InterviewListView.tsx";
import InterviewSummary from "./interview/InterviewSummary.tsx";
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

    const [summary, setSummary] = useState({isSet:false, text:""});

    const [isInterviewing, setIsInterviewing] = useState(false);

    const finishInterview = (summary:string) => {
        setSummary({isSet:true, text:summary});
        setIsInterviewing(false);
    }

    return (
      <>
          {isInterviewing ? (
              <MockInterviewView userDetails={userDetails} finish={finishInterview}/>
          ) : (
              (summary.isSet) ? (
                      <InterviewSummary summaryText={summary.text} summaryFlag={setSummary}/>
                  ) : (
                      <>
                          <UserProfileView setUserDetails={setUserDetails} setIsInterviewing={setIsInterviewing}/>
                          <InterviewListView/>
                      </>
              )
          )}
      </>
    )
  }

export default App;
