import React, { useState, useRef } from 'react';
import './Recorder.css';

function VoiceAssistant() { // Changed component name to VoiceAssistant
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const startRecording = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 44100, // Set sample rate to 44.1 kHz
            channelCount: 1, // Mono audio
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false
          }
        });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          setAudioURL(url);
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (err) {
        console.error('Error accessing microphone:', err);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmit = async () => {
    const audioBlob = await fetch(audioURL).then((res) => res.blob());

    const formData = new FormData();
    formData.append('audio', audioBlob);

    // Replace 'YOUR_ENDPOINT' with your actual endpoint
    fetch('YOUR_ENDPOINT', {
      method: 'POST',
      body: formData,
    }).then((response) => {
      if (response.ok) {
        console.log('Audio uploaded successfully');
      } else {
        console.error('Failed to upload audio');
      }
    });
  };

  return (
    <div className="voice-assistant-container"> {/* Changed class name to voice-assistant-container */}
      <h2>Voice Assistant</h2> {/* Changed header to Voice Assistant */}
      <div className="voice-assistant-buttons"> {/* Changed class name to voice-assistant-buttons */}
        {!recording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <>
            <button onClick={stopRecording}>Stop Recording</button>
            <button disabled>Recording...</button>
          </>
        )}
        {audioURL && (
          <button onClick={handleSubmit}>Submit Recording</button>
        )}
      </div>
      {audioURL && (
        <div className="audio-player">
          <audio ref={audioRef} controls src={audioURL} />
        </div>
      )}
    </div>
  );
}

export default VoiceAssistant; // Changed export default to VoiceAssistant
