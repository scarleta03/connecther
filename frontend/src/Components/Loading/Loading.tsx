import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiService } from "../../services/api.service";
import type { CheckInRequest } from "../../types/api";
import "./Loading.css";

/** Key used in sessionStorage to allow access to the loading page. */
export const REPORT_SUBMITTED_KEY = "connecther-report-submitted";

interface LocationState {
  checkInData: CheckInRequest;
}

export default function Loading() {
  const navigate = useNavigate();
  const location = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const submitted = sessionStorage.getItem(REPORT_SUBMITTED_KEY);
    if (!submitted) {
      navigate("/", { replace: true });
      return;
    }
    setAllowed(true);

    // Make API call and navigate to recommendations
    const state = location.state as LocationState;
    if (state?.checkInData) {
      apiService.submitCheckIn(state.checkInData)
        .then((response) => {
          // Clear the session storage flag
          sessionStorage.removeItem(REPORT_SUBMITTED_KEY);

          // Navigate to recommendations with the response
          navigate("/recommendations", {
            replace: true,
            state: {
              recommendations: response.recommendations,
              aiMessage: response.ai_message,
              checkInId: response.check_in_id,
            }
          });
        })
        .catch((error) => {
          console.error("Check-in error:", error);
          // On error, redirect back to symptom checker
          sessionStorage.removeItem(REPORT_SUBMITTED_KEY);
          navigate("/symptom-checker", { replace: true });
        });
    }
  }, [navigate, location.state]);

  if (allowed !== true) {
    return null;
  }

  return (
    <div className="loading-page">
      <div className="loading-dots" aria-hidden="true">
        <span className="loading-dot" />
        <span className="loading-dot" />
        <span className="loading-dot" />
      </div>
      <h2 className="loading-heading">Creating your tailored picks ✨</h2>
      <p className="loading-text">
        We’re building personalized video recommendations just for you based on your symptoms. Almost there!
      </p>
    </div>
  );
}
