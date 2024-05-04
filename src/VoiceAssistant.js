import React, { useState, useEffect, useRef } from 'react';
import Recorder from 'recorder-js';
import './VoiceAssistant.css';

const PersianCommands = {
  انتقال: 'transfer',
  شارژ: 'mobileCharge',
  چک: 'checkNumberValidation',
  موجودی: 'remainderCheck'
};

const commandDetailsSchema = {
  transfer: [
    { label: 'Source Account' },
    { label: 'Destination Account' },
    { label: 'Amount' }
  ],
  mobileCharge: [
    { label: 'Number' },
    { label: 'Amount' }
  ],
  checkNumberValidation: [
    { label: 'Check Number' }
  ],
  remainderCheck: [
    { label: 'Source Account' }
  ]
};

function VoiceAssistant() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [blob, setBlob] = useState(null);
  const [stage, setStage] = useState(0);
  const [extractedText, setExtractedText] = useState([]);
  const [commands, setCommands] = useState([]);
  const [commandDetails, setCommandDetails] = useState({});
  const [commandValid, setCommandValid] = useState(true);
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
      .catch(err => console.error('Error accessing microphone:', err));
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop()
        .then(({ blob }) => {
          setAudioURL(URL.createObjectURL(blob));
          setBlob(blob);
          setRecording(false);
        })
        .catch(err => console.error('Error stopping recording:', err));
    }
  };

  const handleSubmit = async () => {
    if (blob) {
      const formData = new FormData();
      formData.append('file', blob, 'recording.wav');

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}?is_command=${commands.length === 0}`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error('Failed to upload audio');
        }
        const data = await response.json();
        if (!data || !data.command) {
          throw new Error('No command extracted');
        }
        const englishCommand = PersianCommands[data.command];
        if (!englishCommand) {
          setCommandValid(false);
          return;
        }
        setExtractedText([...extractedText, data.extracted_audio]);
        setCommands([englishCommand]);
        setCommandDetails({ [englishCommand]: {} });
        setStage(0);
      } catch (error) {
        console.error('Error occurred:', error);
      }
    }
  };

  const handleNextStage = (value) => {
    const command = commands[0];
    const key = commandDetailsSchema[command][stage].label;
    setCommandDetails(prevState => ({
      ...prevState,
      [command]: { ...prevState[command], [key]: value }
    }));
    if (stage + 1 < commandDetailsSchema[command].length) {
      setStage(stage + 1);
    } else {
      setStage(0);
      setCommands([]);
      setCommandDetails({});
      setCommandValid(true);
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
            <button onClick={handleSubmit} disabled={commands.length > 0}>Submit Recording</button>
          </>
        )}
      </div>
      {audioURL && (
        <div className="audio-player">
          <audio controls src={audioURL} />
        </div>
      )}
      {extractedText.map((text, index) => (
        <p key={index}>
          Stage {index + 1}: {text}
        </p>
      ))}
      {!commandValid && (
        <p>
          Invalid command! Please record again.
        </p>
      )}
      {commands.length > 0 && commandValid && (
        <div>
          <p>{commandDetailsSchema[commands[0]][stage].label}:</p>
        </div>
      )}
    </div>
  );
}

export default VoiceAssistant;
