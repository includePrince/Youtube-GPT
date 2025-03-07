import React, { useState, useEffect } from "react";
import YouTube from "react-youtube";
import axios from "axios";

function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [qaList, setQaList] = useState([]);
  const [videoHistory, setVideoHistory] = useState([]);
  const [visibleAnswers, setVisibleAnswers] = useState({});

  useEffect(() => {
    fetchVideoHistory();
  }, []);

  const extractVideoId = (url) => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/);
    return match ? match[1] : null;
  };

  const handleLoadVideo = () => {
    const id = extractVideoId(videoUrl);
    if (id) {
      setVideoId(id);
      fetchQAs(id);
      fetchVideoTitle(id);
    }
  };

  const fetchQAs = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/qa/${id}`);
      setQaList(res.data);
    } catch (error) {
      console.error("Error fetching Q&A", error);
    }
  };

  const fetchVideoTitle = async (id) => {
    try {
      const res = await axios.get(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
      setVideoTitle(res.data.title || "Unknown Video");
    } catch (error) {
      console.error("Error fetching video title", error);
      setVideoTitle("Unknown Video");
    }
  };

  const fetchVideoHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/videos");
      setVideoHistory(res.data);
    } catch (error) {
      console.error("Error fetching video history", error);
    }
  };

  const handleAsk = async () => {
    if (!videoId || !question.trim()) {
      alert("Please enter a question and load a valid video.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/ask", { videoId, videoTitle, question });

      if (res.data.answer) {
        setAnswer(res.data.answer);
        setQaList([...qaList, { question, answer: res.data.answer }]);
        fetchVideoHistory();
      } else {
        setAnswer("No response from AI.");
      }
    } catch (error) {
      setAnswer("Failed to get a response.");
    }
  };

  const toggleAnswerVisibility = (index) => {
    setVisibleAnswers((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "20px", height: "100vh", padding: "20px", background: "#f8f9fa" }}>
      
      {/* Left Section - Video History */}
      <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", overflowY: "auto" }}>
        <h3>Video History</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {videoHistory.map((video) => (
            <li key={video.videoId} style={{ cursor: "pointer", marginBottom: "10px", padding: "10px", background: "#f4f4f4", borderRadius: "5px" }}
                onClick={() => { setVideoId(video.videoId); fetchQAs(video.videoId); }}>
              {video.title}
            </li>
          ))}
        </ul>
      </div>

      {/* Middle Section - Video & Q&A Input */}
      <div style={{ textAlign: "center", padding: "20px", background: "white", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}>
        <h2>YouTube + ChatGPT Q&A</h2>
        <input
          type="text"
          placeholder="Paste YouTube URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          style={{ width: "80%", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <button onClick={handleLoadVideo} style={{ padding: "10px", borderRadius: "5px", background: "#007bff", color: "white", border: "none" }}>
          Load Video
        </button>
        {videoId && <YouTube videoId={videoId} style={{ marginTop: "20px" }} />}
        
        <div style={{ marginTop: "20px" }}>
          <input
            type="text"
            placeholder="Ask a question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ width: "80%", padding: "10px", marginBottom: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          />
          <button onClick={handleAsk} style={{ padding: "10px", borderRadius: "5px", background: "#28a745", color: "white", border: "none" }}>
            Ask
          </button>
        </div>
        {answer && (
          <div style={{ marginTop: "20px", background: "#f4f4f4", padding: "10px", borderRadius: "5px" }}>
            <h4>Answer:</h4>
            <p>{answer}</p>
          </div>
        )}
      </div>

      {/* Right Section - Previous Q&A with Toggle Answer */}
      <div style={{ background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", overflowY: "auto" }}>
        <h3>Previous Q&A</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {qaList.map((qa, index) => (
            <li key={index} style={{ marginBottom: "15px", padding: "10px", background: "#f4f4f4", borderRadius: "5px" }}>
              <strong>Q:</strong> {qa.question} <br />
              <button 
                onClick={() => toggleAnswerVisibility(index)} 
                style={{
                  marginTop: "5px",
                  padding: "5px",
                  borderRadius: "5px",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {visibleAnswers[index] ? "Hide Answer" : "Show Answer"}
              </button>
              {visibleAnswers[index] && (
                <p style={{ marginTop: "10px" }}>
                  <strong>A:</strong> {qa.answer}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}

export default App;
