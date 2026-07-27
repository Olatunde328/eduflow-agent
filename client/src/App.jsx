import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [apiStatus, setApiStatus] = useState({
    loading: true,
    online: false,
    message: "Checking EduFlow API...",
  });

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/health");

        setApiStatus({
          loading: false,
          online: response.data.success,
          message: `${response.data.service} is online`,
        });
      } catch (error) {
        console.error("API connection failed:", error);

        setApiStatus({
          loading: false,
          online: false,
          message: "EduFlow API is offline",
        });
      }
    };

    checkApi();
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="brand-badge">EduFlow Agent</div>

        <h1>Verified learning. Autonomous USDC payments.</h1>

        <p className="hero-copy">
          EduFlow uses policy-controlled agents to verify learning milestones
          and release authorized USDC payments on Arc.
        </p>

        <div className={`status-card ${apiStatus.online ? "online" : "offline"}`}>
          <span className="status-dot" />

          <div>
            <strong>
              {apiStatus.loading ? "Connecting..." : apiStatus.message}
            </strong>

            <p>
              {apiStatus.online
                ? "Frontend and backend are communicating successfully."
                : "Start the Express server on port 5000."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
