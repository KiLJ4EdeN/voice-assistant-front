import React, { useState, useEffect, useRef } from 'react';
import Recorder from 'recorder-js';
import './VoiceAssistant.css';

// Mapping Persian commands to English
const PersianCommands = {
  انتقال: 'transfer',
  شارژ: 'mobileCharge',
  چک: 'checkNumberValidation',
  موجودی: 'remainderCheck'
};

// Mapping commands to their details
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
  const [command, setCommand] = useState('');
  const [extractedText, setExtractedText] = useState([]);
  const [commandValid, setCommandValid] = useState(true);
  const recorderRef = useRef(null);

  useEffect(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    recorderRef.current = new Recorder(audioContext, { numChannels: 1 });
  }, []);

  useEffect(() => {
    if (command !== '') {
      console.log(`command locked: ${command}`);
    }
  }, [command]);

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
      
      if (stage === 0){
        console.log(`stage ${stage}: setting command interface...`)
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}?is_command=true`, {
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
          console.log(`raw text: ${data.extracted_audio}`)
          console.log(`command extracted: ${data.command}`)
          console.log(`command english: ${PersianCommands[data.command]}`)
          if (!englishCommand) {
            setCommandValid(false);
            return;
          } else {
            setCommand(PersianCommands[data.command]);
            setStage(1)
            return;
          }
        } catch (error) {
          console.error('Error occurred:', error);
        }
      } else {
        console.log(`command is set, gathering info @stage: ${stage}`)
        let query = commandDetailsSchema[command][stage-1].label
        const response = await fetch(`${process.env.REACT_APP_API_URL}?is_command=false`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error('Failed to upload audio');
        }
        const data = await response.json();
        if (!data) {
          throw new Error('No data extracted');
        }
        setExtractedText([...extractedText, data.extracted_audio]);
        console.log(`text for query: ${query} : ${data.extracted_audio}`)
        setStage(stage+1)
        return;
      }
    }
  };

  return (
    <div className="voice-assistant-container">
      <h2>Voice Assistant</h2>
      <div className="voice-assistant-buttons">
        {!recording ? (
          <button onClick={startRecording} disabled={command && (stage - 1 >= (commandDetailsSchema[command] || []).length)}>Start Recording</button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
        {audioURL && (
          <button onClick={handleSubmit} disabled={command && (stage - 1 >= (commandDetailsSchema[command] || []).length)}>Submit Recording</button>
        )}
      </div>
      {audioURL && (
        <div className="audio-player">
          <audio controls src={audioURL} />
        </div>
      )}
      {command !== '' && (
        <div>
          <p>Command selected: {command}</p>
          {stage > 0 && stage <= commandDetailsSchema[command].length && (
            <p>Say This: {commandDetailsSchema[command][stage - 1].label}</p>
          )}
        </div>
      )}
      {!commandValid && (
        <p>
          Invalid command! Please record again.
        </p>
      )}
      {extractedText.length > 0 && (
        <div>
          <h3>Extracted Texts:</h3>
          <ul>
            {extractedText.map((text, index) => (
              <li key={index}>
                {commandDetailsSchema[command][index].label}: {text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VoiceAssistant;
