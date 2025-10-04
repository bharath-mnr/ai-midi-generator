
// // frontend/src/Components/TextMidiConverter.jsx
// import React, { useState } from 'react';
// import { Activity, AlertTriangle, FileText } from 'lucide-react';
// import { convertTextToMidi } from '../services/api';

// const TextToMidiConverter = () => {
//   const [input, setInput] = useState(`Tempo: 120
// TimeSig: 4/4

// Bar: 1
// C4:   X . . .   . . . .   . . . .   . . . .
// E4:   . . . .   X . . .   . . . .   . . . .
// G4:   . . . .   . . . .   X . . .   . . . .
// C5:   . . . .   . . . .   . . . .   X . . .`);
  
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [errors, setErrors] = useState([]);

//   // Function to validate subdivisions based on time signature
//   const validateSubdivisions = (inputText) => {
//     const errors = [];
//     const lines = inputText.trim().split('\n');
    
//     // Get time signature
//     const timeSigLine = lines.find(line => line.toLowerCase().startsWith('timesig:'));
//     if (!timeSigLine) {
//       errors.push('Missing TimeSig definition');
//       return errors;
//     }
    
//     const timeSigMatch = timeSigLine.match(/TimeSig:\s*(\d+)\/(\d+)/i);
//     if (!timeSigMatch) {
//       errors.push('Invalid TimeSig format. Use format like: TimeSig: 4/4');
//       return errors;
//     }
    
//     const numerator = parseInt(timeSigMatch[1]);
//     const denominator = parseInt(timeSigMatch[2]);
    
//     // Calculate subdivisions based on time signature
//     let expectedSubdivisions;
//     if (denominator === 4) {
//       // Simple time signatures
//       expectedSubdivisions = numerator * 4;
//     } else if (denominator === 8) {
//       // Compound time signatures
//       if (numerator === 6 || numerator === 12) {
//         expectedSubdivisions = 12;
//       } else {
//         expectedSubdivisions = numerator; // Fallback
//       }
//     } else {
//       // Default case
//       expectedSubdivisions = numerator * 4;
//     }
    
//     // Find all bars and check their subdivisions
//     let currentBar = null;
//     let currentBarPitches = new Map();
    
//     for (let i = 0; i < lines.length; i++) {
//       const line = lines[i].trim();
      
//       // Bar definition
//       if (line.startsWith('Bar:')) {
//         // Check previous bar if exists
//         if (currentBar !== null) {
//           checkBarSubdivisions(currentBar, currentBarPitches, expectedSubdivisions, errors);
//         }
        
//         const barMatch = line.match(/Bar:\s*(\d+)/);
//         currentBar = barMatch ? parseInt(barMatch[1]) : null;
//         currentBarPitches = new Map();
//         continue;
//       }
      
//       // Pitch line
//       if (currentBar !== null && line.match(/^[A-G][#b]?\d:/i)) {
//         const [pitch, ...patterns] = line.split(':');
//         const pattern = patterns.join(':').trim();
//         const subdivisions = pattern.split(/\s+/).filter(s => s.length > 0);
        
//         currentBarPitches.set(pitch.trim(), subdivisions.length);
//       }
//     }
    
//     // Check the last bar
//     if (currentBar !== null) {
//       checkBarSubdivisions(currentBar, currentBarPitches, expectedSubdivisions, errors);
//     }
    
//     return errors;
//   };
  
//   const checkBarSubdivisions = (barNumber, pitches, expected, errors) => {
//     for (const [pitch, count] of pitches.entries()) {
//       if (count !== expected) {
//         errors.push(`Bar ${barNumber} ${pitch}: Expected ${expected} subdivisions, got ${count}`);
//       }
//     }
//   };

//   const handleConvert = async () => {
//     try {
//       setIsProcessing(true);
//       setErrors([]);
      
//       // Frontend validation
//       const validationErrors = validateSubdivisions(input);
//       if (validationErrors.length > 0) {
//         setErrors(validationErrors);
//         setIsProcessing(false);
//         return;
//       }
      
//       const midiBlob = await convertTextToMidi(input);
      
//       // Create download link
//       const url = window.URL.createObjectURL(midiBlob);
//       const a = document.createElement('a');
//       a.style.display = 'none';
//       a.href = url;
//       a.download = 'converted.mid';
//       document.body.appendChild(a);
//       a.click();
//       window.URL.revokeObjectURL(url);
//       document.body.removeChild(a);
//     } catch (error) {
//       console.error('Conversion error:', error);
//       setErrors([error.response?.data?.error || 'Conversion failed']);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col p-4 md:p-6">
//       {/* Header */}
//       <div className="text-center mb-6 md:mb-10 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl">
//         <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
//           Text → MIDI Converter
//         </h1>
//         <p className="mt-2 md:mt-3 text-gray-400 text-sm md:text-lg">
//           Turn advanced notation into playable MIDI
//         </p>
//       </div>

//       {/* Main Content */}
//       <main className="flex flex-col lg:flex-row flex-1 overflow-hidden mt-0 gap-4 md:gap-6">
//         {/* Left - Editor */}
//         <section className="flex-1 overflow-y-auto">
//           <div className="bg-black/50 backdrop-blur-2xl rounded-2xl p-4 md:p-6 border border-slate-700 shadow-xl h-full flex flex-col">
//             <div className="flex items-center justify-between mb-4">
//               <h2 className="text-xl md:text-2xl font-semibold text-white flex items-center mb-3 md:mb-5">
//                 <FileText className="w-5 h-5 md:w-6 md:h-6 mr-2 text-purple-400" />
//                 Advanced Notation
//               </h2>
//             </div>

//             {/* Big Editor */}
//             <textarea
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder={`Tempo: 120\nTimeSig: 4/4\nKey: C\n\nBar: 1\nC4: X . . .   . . . .   . . . .   . . . .`}
//               className="w-full flex-1 h-64 md:h-[75vh] bg-slate-950/70 border border-slate-700 rounded-xl p-4 md:p-6 text-gray-100 font-mono resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-inner tracking-wide text-sm md:text-lg"
//               spellCheck={false}
//             />

//             {/* Convert Button */}
//             <div className="flex gap-3 mt-4 md:mt-6">
//               <button
//                 onClick={handleConvert}
//                 disabled={isProcessing}
//                 className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-white font-semibold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 text-sm md:text-base"
//               >
//                 {isProcessing ? (
//                   <>
//                     <svg
//                       className="animate-spin w-4 h-4 md:w-5 md:h-5"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                       ></path>
//                     </svg>
//                     Processing...
//                   </>
//                 ) : (
//                   <>
//                     <Activity className="w-4 h-4 md:w-5 md:h-5" />
//                     Convert to MIDI
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </section>

//         {/* Sidebar - Status Panel */}
//         <aside className="w-full lg:w-80 p-4 md:p-6 overflow-y-auto bg-black/30 border border-slate-800 backdrop-blur-2xl rounded-2xl shadow-xl mt-4 lg:mt-0">
//           <div className="bg-slate-900/70 rounded-xl p-4 md:p-6 border border-slate-700">
//             <h3 className="text-lg md:text-xl font-bold text-cyan-300 mb-3 md:mb-4 flex items-center">
//               <Activity className="w-4 h-4 md:w-5 md:h-5 mr-2" />
//               Status
//             </h3>

//             {errors.length > 0 && (
//               <div className="mb-4">
//                 <h4 className="font-semibold text-red-400 mb-2 flex items-center text-sm md:text-base">
//                   <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
//                   Errors:
//                 </h4>
//                 <ul className="text-red-300 text-xs md:text-sm space-y-1">
//                   {errors.map((error, i) => (
//                     <li key={i}>• {error}</li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {!errors.length && (
//               <p className="text-gray-400 text-xs md:text-sm">
//                 Enter notation and click{" "}
//                 <span className="text-cyan-400">"Convert to MIDI"</span> to begin.
//               </p>
//             )}
//           </div>
//         </aside>
//       </main>
//     </div>
//   );
// };

// export default TextToMidiConverter;









// frontend/src/Components/TextMidiConverter.jsx
import React, { useState } from 'react';
import { Activity, AlertTriangle, FileText } from 'lucide-react';
import { convertTextToMidi } from '../services/api';

const TextToMidiConverter = () => {
  const [input, setInput] = useState(`Tempo: 120
TimeSig: 4/4

Bar: 1
C4:   X . . .   . . . .   . . . .   . . . .
E4:   . . . .   X . . .   . . . .   . . . .
G4:   . . . .   . . . .   X . . .   . . . .
C5:   . . . .   . . . .   . . . .   X . . .`);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState([]);

  // Function to validate subdivisions based on time signature
  const validateSubdivisions = (inputText) => {
    const errors = [];
    const lines = inputText.trim().split('\n');
    
    // Get time signature
    const timeSigLine = lines.find(line => line.toLowerCase().startsWith('timesig:'));
    if (!timeSigLine) {
      errors.push('Missing TimeSig definition');
      return errors;
    }
    
    const timeSigMatch = timeSigLine.match(/TimeSig:\s*(\d+)\/(\d+)/i);
    if (!timeSigMatch) {
      errors.push('Invalid TimeSig format. Use format like: TimeSig: 4/4');
      return errors;
    }
    
    const numerator = parseInt(timeSigMatch[1]);
    const denominator = parseInt(timeSigMatch[2]);
    
    // Calculate subdivisions using formula: numerator * (16 / denominator)
    if (![4, 8].includes(denominator)) { // Limit to standard for now
      errors.push(`Unsupported denominator: ${denominator}. Only 4 or 8 supported.`);
      return errors;
    }
    const expectedSubdivisions = numerator * (16 / denominator);
    if (!Number.isInteger(expectedSubdivisions)) {
      errors.push(`Invalid time signature: ${numerator}/${denominator} results in non-integer subdivisions.`);
      return errors;
    }
    
    // Find all bars and check their subdivisions
    let currentBar = null;
    let currentBarPitches = new Map();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Bar definition
      if (line.startsWith('Bar:')) {
        // Check previous bar if exists
        if (currentBar !== null) {
          checkBarSubdivisions(currentBar, currentBarPitches, expectedSubdivisions, errors);
        }
        
        const barMatch = line.match(/Bar:\s*(\d+)/);
        currentBar = barMatch ? parseInt(barMatch[1]) : null;
        currentBarPitches = new Map();
        continue;
      }
      
      // Pitch line
      if (currentBar !== null && line.match(/^[A-G][#b]?\d:/i)) {
        const [pitch, ...patterns] = line.split(':');
        const pattern = patterns.join(':').trim();
        const subdivisions = pattern.split(/\s+/).filter(s => s.length > 0);
        
        currentBarPitches.set(pitch.trim(), subdivisions.length);
      }
    }
    
    // Check the last bar
    if (currentBar !== null) {
      checkBarSubdivisions(currentBar, currentBarPitches, expectedSubdivisions, errors);
    }
    
    return errors;
  };
  
  const checkBarSubdivisions = (barNumber, pitches, expected, errors) => {
    for (const [pitch, count] of pitches.entries()) {
      if (count !== expected) {
        errors.push(`Bar ${barNumber} ${pitch}: Expected ${expected} subdivisions, got ${count}`);
      }
    }
  };

  const handleConvert = async () => {
    try {
      setIsProcessing(true);
      setErrors([]);
      
      // Frontend validation
      const validationErrors = validateSubdivisions(input);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsProcessing(false);
        return;
      }
      
      const midiBlob = await convertTextToMidi(input);
      
      // Create download link
      const url = window.URL.createObjectURL(midiBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'converted.mid';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Conversion error:', error);
      setErrors([error.response?.data?.error || 'Conversion failed']);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-slate-900 to-black flex flex-col p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-6 md:mb-10 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl">
        <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
          Text → MIDI Converter
        </h1>
        <p className="mt-2 md:mt-3 text-gray-400 text-sm md:text-lg">
          Turn advanced notation into playable MIDI
        </p>
      </div>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden mt-0 gap-4 md:gap-6">
        {/* Left - Editor */}
        <section className="flex-1 overflow-y-auto">
          <div className="bg-black/50 backdrop-blur-2xl rounded-2xl p-4 md:p-6 border border-slate-700 shadow-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-white flex items-center mb-3 md:mb-5">
                <FileText className="w-5 h-5 md:w-6 md:h-6 mr-2 text-purple-400" />
                Advanced Notation
              </h2>
            </div>

            {/* Big Editor */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Tempo: 120\nTimeSig: 4/4\nKey: C\n\nBar: 1\nC4: X . . .   . . . .   . . . .   . . . .`}
              className="w-full flex-1 h-64 md:h-[75vh] bg-slate-950/70 border border-slate-700 rounded-xl p-4 md:p-6 text-gray-100 font-mono resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-inner tracking-wide text-sm md:text-lg"
              spellCheck={false}
            />

            {/* Convert Button */}
            <div className="flex gap-3 mt-4 md:mt-6">
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-white font-semibold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 text-sm md:text-base"
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4 md:w-5 md:h-5"
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
                    <Activity className="w-4 h-4 md:w-5 md:h-5" />
                    Convert to MIDI
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Sidebar - Status Panel */}
        <aside className="w-full lg:w-80 p-4 md:p-6 overflow-y-auto bg-black/30 border border-slate-800 backdrop-blur-2xl rounded-2xl shadow-xl mt-4 lg:mt-0">
          <div className="bg-slate-900/70 rounded-xl p-4 md:p-6 border border-slate-700">
            <h3 className="text-lg md:text-xl font-bold text-cyan-300 mb-3 md:mb-4 flex items-center">
              <Activity className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Status
            </h3>

            {errors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-red-400 mb-2 flex items-center text-sm md:text-base">
                  <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Errors:
                </h4>
                <ul className="text-red-300 text-xs md:text-sm space-y-1">
                  {errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {!errors.length && (
              <p className="text-gray-400 text-xs md:text-sm">
                Enter notation and click{" "}
                <span className="text-cyan-400">"Convert to MIDI"</span> to begin.
              </p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default TextToMidiConverter;