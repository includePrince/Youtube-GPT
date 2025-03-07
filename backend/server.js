const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(MONGO_URI, {   // Replace your MongoDb Connection String with MONGO_URI
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

// Q&A Schema
const qaSchema = new mongoose.Schema({
  videoId: { type: String, required: true, index: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const QA = mongoose.model("QA", qaSchema);

// New Video Schema for Video History
const videoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Video = mongoose.model("Video", videoSchema);

//  API to Handle Questions
app.post("/api/ask", async (req, res) => {
  const { videoId, videoTitle, question } = req.body;

  try {
    console.log("Received Question:", question);

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill",
      { inputs: question },
      { 
          headers: { Authorization: `Bearer HUGGINGFACE_API_KEY` },   // Replace your Huggingface api key to HUGGINGFACE_API_KEY 
          params: { max_length: 512 },
      }
    );

    console.log("Hugging Face Response:", response.data);

    const answer = response.data[0]?.generated_text || "No response from AI";

    // Save Q&A to Database
    const newQA = new QA({ videoId, question, answer });
    await newQA.save();

    // Save Video History if Not Already Stored
    const existingVideo = await Video.findOne({ videoId });
    if (!existingVideo) {
      const newVideo = new Video({ videoId, title: videoTitle });
      await newVideo.save();
    }

    res.json({ question, answer });
  } catch (error) {
    console.error("Error fetching response:", error.response?.data || error.message);
    res.status(500).json({ error: "Error fetching response from Hugging Face" });
  }
});

//  API to Get Saved Q&A for a Video
app.get("/api/qa/:videoId", async (req, res) => {
  const { videoId } = req.params;
  const qaList = await QA.find({ videoId });
  res.json(qaList);
});

//  New API to Fetch Saved Video History
app.get("/api/videos", async (req, res) => {
  const videos = await Video.find().sort({ createdAt: -1 });
  res.json(videos);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
