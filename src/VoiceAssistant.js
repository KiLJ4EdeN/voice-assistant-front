import React, { useState, useEffect, useRef } from 'react';
import Recorder from 'recorder-js';
import './VoiceAssistant.css';

function VoiceAssistant() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [blob, setBlob] = useState(null);
  const [stage, setStage] = useState(1);
  const [extractedText, setExtractedText] = useState([]);
  const [commands, setCommands] = useState([]);
  const [commandDetails, setCommandDetails] = useState({
    transfer: { sourceAccount: '', destinationAccount: '', amount: '' },
    mobileCharge: { number: '', amount: '' },
    checkNumberValidation: { checkNumber: '' },
    remainderCheck: { sourceAccount: '' }
  });
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

      fetch(`${process.env.REACT_APP_API_URL}?is_command=true`, {
        method: 'POST',
        body: formData,
      })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          console.error('Failed to upload audio');
        }
      })
      .then((data) => {
        if (data) {
          console.log('Command extracted:', data.command);
          console.log('Voice extracted:', data.extracted_audio);
          setExtractedText([...extractedText, data.extracted_audio]);
          console.log('Audio uploaded successfully');
          if (!['transfer', 'mobileCharge', 'checkNumberValidation', 'remainderCheck'].includes(data.command)) {
            console.error('Invalid command:', data.command);
            alert('Invalid command! Please record again.');
            return;
          }
          const newCommands = [...commands];
          newCommands.push(data.command);
          setCommands(newCommands);
          setCommandDetails(prevState => ({
            ...prevState,
            [data.command]: data.details
          }));
          setStage(stage + 1);
        }
      })
      .catch((error) => {
        console.error('Error occurred:', error);
      });
    }
  };

  const download = () => {
    if (blob) {
      Recorder.download(blob, 'my-audio-file'); 
    }
  };

  const handleCommandStages = (command) => {
    switch (command) {
      case 'transfer':
        if (stage === 1) {
          return `Provide source account name: ${commandDetails[command].sourceAccount}`;
        } else if (stage === 2) {
          return `Provide destination account: ${commandDetails[command].destinationAccount}, and amount: ${commandDetails[command].amount}`;
        }
        break;
      case 'mobileCharge':
        if (stage === 1) {
          return `Provide number: ${commandDetails[command].number}, and amount: ${commandDetails[command].amount}`;
        }
        break;
      case 'checkNumberValidation':
        if (stage === 1) {
          return `Provide check number: ${commandDetails[command].checkNumber}`;
        }
        break;
      case 'remainderCheck':
        if (stage === 1) {
          return `Provide source account name: ${commandDetails[command].sourceAccount}`;
        }
        break;
      default:
        return '';
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
      {extractedText.map((text, index) => (
        <p key={index}>
          Stage {index + 1}: {text}
        </p>
      ))}
      {stage <= 3 && (
        <p>
          {handleCommandStages(commands[commands.length - 1])}
        </p>
      )}
      {stage > 3 && (
        <p>
          All stages completed. Thank you!
        </p>
      )}
    </div>
  );
}

export default VoiceAssistant;
