import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../services/api";

function LessonPlayer() {
  const { lessonId } = useParams();

  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const response = await api.get(`/content/lessons/${lessonId}/play`);

        setVideoUrl(response.data.videoUrl);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Unable to load video");
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      loadVideo();
    }
  }, [lessonId]);

  if (loading) {
    return <p>Loading lesson...</p>;
  }

  if (!videoUrl) {
    return <p>Video is not available or access is denied.</p>;
  }

  return (
    <div className="lesson-player-page">
      <h1>Course Lesson</h1>

      <div className="video-container">
        <video src={videoUrl} controls playsInline preload="metadata">
          Your browser does not support video playback.
        </video>
      </div>
    </div>
  );
}

export default LessonPlayer;
