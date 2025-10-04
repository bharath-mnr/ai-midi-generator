// D:\Project\midi-converter-project\frontend\src\Components\MidiToTextConverter.jsx
import React, { useState, useRef } from 'react';
import { Upload, Copy, Music, FileText, Activity, AlertTriangle } from 'lucide-react';
import { convertMidiToText } from '../services/api';

const MidiToTextConverter = () => {
  const [midiFile, setMidiFile] = useState(null);
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().match(/\.(mid|midi)$/)) {
      setErrors(['Please upload a MIDI file (.mid or .midi)']);
      return;
    }
    
    setErrors([]);
    setMidiFile(file);
  };

  const handleMidiToText = async () => {
    if (!midiFile) {
      setErrors(['Please select a MIDI file first']);
      return;
    }
    
    try {
      setIsProcessing(true);
      setErrors([]);
      
      const result = await convertMidiToText(midiFile);
      setOutput(result.text);
    } catch (error) {
      console.error('Conversion error:', error);
      setErrors([error.response?.data?.error || 'Conversion failed']);
      setOutput('');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output).then(() => {
        // Optional: Show success message
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-900 to-black p-6 flex flex-col">
      {/* Header */}
      <div className="text-center mb-10 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-700 shadow-xl">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
          MIDI to Text Converter
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          Upload your MIDI files and instantly convert them into Text notation
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 h-full">
        {/* Input Section */}
        <div className="flex flex-col h-full">
          <div className="flex-1 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20 shadow-xl flex flex-col">
            <h2 className="text-2xl font-semibold text-white flex items-center mb-5">
              <FileText className="w-6 h-6 mr-2 text-purple-400" />
              MIDI File Upload
            </h2>

            <div
              className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-purple-500/60 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 flex-1 flex items-center justify-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".mid,.midi"
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-purple-500/20 rounded-full">
                  <Upload className="w-8 h-8 text-purple-400" />
                </div>
                {midiFile ? (
                  <>
                    <p className="font-medium text-white">{midiFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {Math.round(midiFile.size / 1024)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-300">Drag & drop a MIDI file here</p>
                    <p className="text-sm text-gray-400">or click to browse</p>
                    <p className="text-xs text-gray-500">
                      Supported formats: .mid, .midi
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleMidiToText}
                disabled={isProcessing || !midiFile}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-xl flex items-center gap-2 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Convert to Text
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Output + Status */}
        <div className="flex flex-col h-full space-y-6">
          {/* Text Output */}
          <div className="flex-1 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-semibold text-white flex items-center">
                <Music className="w-6 h-6 mr-2 text-blue-400" />
                Text Notation Output
              </h2>
              {output && (
                <button
                  onClick={copyOutput}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              )}
            </div>

            <textarea
              value={output}
              readOnly
              className="flex-1 w-full min-h-[400px] bg-black/60 border border-gray-700 rounded-lg p-6 text-gray-100 font-mono resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg leading-relaxed"
              placeholder="Upload a MIDI file and convert to see Text notation here..."
            />
          </div>

          {/* Status */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-4 border border-green-500/20 shadow-xl">
            {errors.length > 0 ? (
              <div>
                <h4 className="font-semibold text-red-400 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Errors
                </h4>
                <ul className="text-red-300 text-sm space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-green-400" />
                {midiFile ? (
                  <p className="text-green-300">
                    File selected: {midiFile.name}
                  </p>
                ) : (
                  <p className="text-gray-400">
                    Upload a MIDI file to convert to Text notation
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MidiToTextConverter;