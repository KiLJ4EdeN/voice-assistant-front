import React, { useState, useEffect, useRef } from 'react';
import Recorder from 'recorder-js';
import './VoiceAssistant.css';

function VoiceAssistant() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [blob, setBlob] = useState(null);
  const recorderRef = useRef(null);

  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    recorderRef.current = new Recorder(audioContext, { numChannels: 1 });
  }, []);

  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        recorderRef.current.init(stream);
        recorderRef.current.start();
        setRecording(true);
      })
      .catch(err => console.log('Uh oh... unable to get stream...', err));
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop()
        .then(({ blob }) => {
          setAudioURL(URL.createObjectURL(blob));
          setBlob(blob);
          setRecording(false);
        });
    }
  };

  const handleSubmit = async () => {
    if (blob) {
      const formData = new FormData();
      formData.append('file', blob, 'recording.wav');
  
      // Replace 'YOUR_ENDPOINT' with your actual endpoint
      fetch(process.env.REACT_APP_API_URL, {
        method: 'POST',
        body: formData,
      })
      .then((response) => {
        if (response.ok) {
          return response.json(); // Parse the JSON in the response
        } else {
          console.error('Failed to upload audio');
        }
      })
      .then((data) => {
        if (data) {
          console.log(data.extracted_audio); // Log the extracted_text from response JSON
          console.log('Audio uploaded successfully');
        }
      })
      .catch((error) => {
        console.error('Error occurred:', error);
      });
    }
  };
  

  const download = () => {
    if (blob) {
      Recorder.download(blob, 'my-audio-file'); // downloads a .wav file
    }
  };

  return (
    <div className="voice-assistant-container">
      <h2>Voice Assistant</h2>
      <div className="voice-assistant-buttons">
        {!recording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <>
            <button onClick={stopRecording}>Stop Recording</button>
            <button disabled>Recording...</button>
          </>
        )}
        {audioURL && (
          <>
            <button onClick={handleSubmit}>Submit Recording</button>
            <button onClick={download}>Download Recording</button>
          </>
        )}
      </div>
      {audioURL && (
        <div className="audio-player">
          <audio controls src={audioURL} />
        </div>
      )}
    </div>
  );
}

export default VoiceAssistant;
