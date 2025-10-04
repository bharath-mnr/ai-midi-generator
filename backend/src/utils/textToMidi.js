// //backend/src/utils/textToMidi.js
// const noteMap = {
//   'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3,
//   'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8,
//   'A': 9, 'A#': 10, 'BB': 10, 'B': 11
// };

// class TextToMidiConverter {

//   // Accurate MIDI pitch validation
//   static validateMidiPitch(pitch, transposition) {
//     const midiNote = this.convertPitchToMidi(pitch, transposition);
//     if (midiNote < 0 || midiNote > 127) {
//       throw new Error(`Pitch ${pitch} with transposition ${transposition} results in MIDI note ${midiNote}, which is out of range (0-127)`);
//     }
//     return midiNote;
//   }

//   // Strict velocity validation
//   static validateVelocity(velocity) {
//     const val = Math.max(1, Math.min(127, Math.round(velocity)));
//     return val;
//   }

//   // Updated note symbol parser for clean rules (XR/XE/XO system only)
//   static parseNoteSymbol(symbol, defaultVelocity = 100) {
//     let velocity = defaultVelocity;
//     let timingOffset = 0; // XR percentage
//     let durationPercent = null; // XE percentage
//     let restOffset = null; // XO percentage
//     let restDuration = null; // XE after XO
//     let isNoteOn = false;
//     let isSustain = false;
//     let isRest = false;
//     let sustainCutoff = null;

//     const originalSymbol = symbol;
//     symbol = symbol.toUpperCase();

//     // Check for pure rest
//     if (originalSymbol === '.') {
//       return { 
//         isNoteOn: false, 
//         velocity, 
//         timingOffset: 0, 
//         durationPercent: null,
//         restOffset: null,
//         restDuration: null,
//         isSustain: false, 
//         isRest: true,
//         sustainCutoff: null
//       };
//     }

//     // Check for sustain symbols (~ or ~0-100)
//     const sustainMatch = symbol.match(/^~(\d+)?$/);
//     if (sustainMatch) {
//       isSustain = true;
//       if (sustainMatch[1]) {
//         sustainCutoff = parseInt(sustainMatch[1]);
//         if (sustainCutoff < 0 || sustainCutoff > 100) {
//           throw new Error(`Sustain cutoff ${sustainCutoff} must be between 0-100`);
//         }
//       }
//       return { 
//         isNoteOn: false, 
//         velocity, 
//         timingOffset: 0, 
//         durationPercent: null,
//         restOffset: null,
//         restDuration: null,
//         isSustain: true, 
//         isRest: false,
//         sustainCutoff
//       };
//     }

//     // Check for positioned rest (XO...XE...)
//     const positionedRestMatch = symbol.match(/^XO(\d+)XE(\d+)$/);
//     if (positionedRestMatch) {
//       restOffset = parseInt(positionedRestMatch[1]);
//       restDuration = parseInt(positionedRestMatch[2]);
      
//       if (restOffset < 0 || restOffset > 100) {
//         throw new Error(`Rest offset ${restOffset} must be between 0-100`);
//       }
//       if (restDuration < 0 || restDuration > 100) {
//         throw new Error(`Rest duration ${restDuration} must be between 0-100`);
//       }
//       if (restOffset + restDuration > 100) {
//         throw new Error(`Rest position ${restOffset} + duration ${restDuration} exceeds 100%`);
//       }

//       return { 
//         isNoteOn: true, // Positioned rest creates a note
//         velocity: 100, // Default velocity for positioned notes
//         timingOffset: restOffset, 
//         durationPercent: restDuration,
//         restOffset,
//         restDuration,
//         isSustain: false, 
//         isRest: false,
//         sustainCutoff: null
//       };
//     }

//     // Check for note-on symbols (X, X60, X80XR25, etc.)
//     if (symbol.startsWith('X')) {
//       isNoteOn = true;
      
//       // Extract velocity
//       const velocityMatch = symbol.match(/^X(\d+)/);
//       if (velocityMatch) {
//         velocity = parseInt(velocityMatch[1]);
//         if (velocity < 1 || velocity > 127) {
//           throw new Error(`Velocity ${velocity} must be between 1-127`);
//         }
//         symbol = symbol.replace(/^X\d+/, '');
//       } else {
//         symbol = symbol.replace(/^X/, '');
//       }

//       // Extract right offset (XR)
//       const rightOffsetMatch = symbol.match(/XR(\d+)/);
//       if (rightOffsetMatch) {
//         timingOffset = parseInt(rightOffsetMatch[1]);
//         if (timingOffset < 0 || timingOffset > 100) {
//           throw new Error(`Right offset ${timingOffset} must be between 0-100`);
//         }
//         symbol = symbol.replace(/XR\d+/, '');
//       }

//       // Extract left offset (XL) - early timing
//       const leftOffsetMatch = symbol.match(/XL(\d+)/);
//       if (leftOffsetMatch) {
//         timingOffset = -parseInt(leftOffsetMatch[1]);
//         symbol = symbol.replace(/XL\d+/, '');
//       }

//       // Extract duration from start (XE or just E)
//       const durationMatch = symbol.match(/E(\d+)/) || symbol.match(/^(\d+)$/);
//       if (durationMatch) {
//         durationPercent = parseInt(durationMatch[1]);
//         if (durationPercent < 0 || durationPercent > 100) {
//           throw new Error(`Duration percent ${durationPercent} must be between 0-100`);
//         }
//         symbol = symbol.replace(/E?\d+/, '');
//       }

//       // Check for invalid combinations
//       if (timingOffset !== 0 && durationPercent !== null) {
//         throw new Error(`Cannot combine XR offset with XE duration in symbol: ${originalSymbol}`);
//       }
//     }

//     return { 
//       isNoteOn,
//       velocity: this.validateVelocity(velocity), 
//       timingOffset,
//       durationPercent,
//       restOffset,
//       restDuration,
//       isSustain: false, 
//       isRest: false,
//       sustainCutoff: null
//     };
//   }

//   // Parse compound symbols (e.g., XE30XE50, XO25XE25XO25XE25)
//   static parseCompoundSymbol(symbol) {
//     const parts = [];
    
//     // Check for stacked short notes (XE...XE...)
//     const shortNoteMatches = [...symbol.matchAll(/X(\d+)?E(\d+)/gi)];
//     if (shortNoteMatches.length > 1) {
//       let totalPercent = 0;
//       let currentStart = 0;
      
//       for (const match of shortNoteMatches) {
//         const vel = match[1] ? parseInt(match[1]) : 100;
//         const duration = parseInt(match[2]);
//         totalPercent += duration;
        
//         if (totalPercent > 100) {
//           throw new Error(`Stacked short notes exceed 100% in symbol: ${symbol}`);
//         }

//         parts.push({
//           isNoteOn: true,
//           velocity: this.validateVelocity(vel),
//           timingOffset: (currentStart / 100) * 100, // Convert to percentage
//           durationPercent: duration,
//           restOffset: null,
//           restDuration: null,
//           isSustain: false,
//           isRest: false,
//           sustainCutoff: null
//         });
        
//         currentStart += duration;
//       }
      
//       return parts;
//     }

//     // Check for positioned rest patterns (XO...XE... combinations)
//     const complexRestMatch = symbol.match(/^((?:XO\d+XE\d+|XE\d+)+)$/);
//     if (complexRestMatch) {
//       const segments = [...symbol.matchAll(/(XO\d+XE\d+|XE\d+)/g)];
//       let currentPos = 0;
      
//       for (const segment of segments) {
//         const segmentStr = segment[0];
        
//         if (segmentStr.startsWith('XO')) {
//           // Positioned rest + note
//           const posMatch = segmentStr.match(/^XO(\d+)XE(\d+)$/);
//           if (posMatch) {
//             const restOffset = parseInt(posMatch[1]);
//             const noteDuration = parseInt(posMatch[2]);
            
//             parts.push({
//               isNoteOn: true,
//               velocity: 100,
//               timingOffset: restOffset,
//               durationPercent: noteDuration,
//               restOffset,
//               restDuration: noteDuration,
//               isSustain: false,
//               isRest: false,
//               sustainCutoff: null
//             });
//           }
//         } else if (segmentStr.startsWith('XE')) {
//           // Short note from current position
//           const durationMatch = segmentStr.match(/^XE(\d+)$/);
//           if (durationMatch) {
//             const duration = parseInt(durationMatch[1]);
            
//             parts.push({
//               isNoteOn: true,
//               velocity: 100,
//               timingOffset: (currentPos / 100) * 100,
//               durationPercent: duration,
//               restOffset: null,
//               restDuration: null,
//               isSustain: false,
//               isRest: false,
//               sustainCutoff: null
//             });
            
//             currentPos += duration;
//           }
//         }
//       }
      
//       return parts;
//     }

//     // Single symbol
//     return [this.parseNoteSymbol(symbol)];
//   }

//   // Enhanced advanced mode parser with flexible Bar header support
//   static parseTextToMidi(textInput) {
//     const lines = textInput.trim().split('\n').filter(line => line.trim());
//     const metadata = {};
//     const errors = [];
//     const tracks = {};
//     let currentBar = 0;
    
//     // Parse metadata with better validation
//     const metadataLines = lines.filter(line => line.includes(':') && !line.includes('Bar:') && !line.match(/^[A-G]/i));
//     metadataLines.forEach(line => {
//       const colonIndex = line.indexOf(':');
//       if (colonIndex > 0) {
//         const key = line.substring(0, colonIndex).trim().toLowerCase();
//         const value = line.substring(colonIndex + 1).trim();
//         metadata[key] = value;
//       }
//     });

//     const tempo = parseInt(metadata.tempo) || 120;
//     const timeSig = metadata.timesig || '4/4';
//     const [numStr, denStr] = timeSig.split('/').map(s => s.trim());
//     const numerator = parseInt(numStr) || 4;
//     const denominator = parseInt(denStr) || 4;
//     const instrument = 'Piano';
//     const legato = metadata.legato?.toLowerCase() === 'on';
//     const key = (metadata.key || 'C').toUpperCase();

//     // Validate metadata
//     if (tempo < 20 || tempo > 300) {
//       errors.push(`Tempo ${tempo} must be between 20-300 BPM`);
//     }
//     if (![1, 2, 3, 4, 6, 8, 9, 12, 16].includes(numerator)) {
//       errors.push(`Invalid time signature numerator: ${numerator}`);
//     }
//     if (![2, 4, 8, 16].includes(denominator)) {
//       errors.push(`Invalid time signature denominator: ${denominator}`);
//     }
//     if (!(key in noteMap)) {
//       errors.push(`Invalid key: ${key}. Use C, C#, D, Eb, etc.`);
//     }

//     // Calculate subdivisions based on time signature
//     let subdivisionsPerBar;
//     if (numerator === 4 && denominator === 4) {
//       subdivisionsPerBar = 16; // 4/4 time
//     } else if (numerator === 3 && denominator === 4) {
//       subdivisionsPerBar = 12; // 3/4 time
//     } else if (numerator === 2 && denominator === 4) {
//       subdivisionsPerBar = 8; // 2/4 time
//     } else if (numerator === 6 && denominator === 8) {
//       subdivisionsPerBar = 12; // 6/8 time
//     } else if (numerator === 12 && denominator === 8) {
//       subdivisionsPerBar = 12; // 12/8 time
//     } else {
//       subdivisionsPerBar = numerator * 4; // Default to 16th notes
//     }

//     // Parse bars and notes with improved error handling
//     let isParsingNotes = false;
//     let currentBarData = {};

//     const noteLines = lines.filter(line => line.startsWith('Bar:') || line.match(/^[A-G][#Bb]?[0-9]:/i));
    
//     noteLines.forEach((line, lineIndex) => {
//       try {
//         if (line.startsWith('Bar:')) {
//           // Save previous bar if exists
//           if (isParsingNotes && Object.keys(currentBarData).length > 0) {
//             tracks[currentBar] = { ...currentBarData };
//             currentBarData = {};
//           }
          
//           // Enhanced bar number extraction
//           const barContent = line.split('Bar:')[1].trim();
//           const firstPart = barContent.split(/\s+/)[0];
//           const barNum = parseInt(firstPart);
          
//           if (isNaN(barNum) || barNum <= 0) {
//             errors.push(`Invalid bar number: ${firstPart} (must be a positive integer)`);
//           } else {
//             currentBar = barNum;
//             isParsingNotes = true;
//           }
//         } else if (isParsingNotes && line.match(/^[A-G][#Bb]?[0-9]:/i)) {
//           const colonIndex = line.indexOf(':');
//           if (colonIndex <= 0) {
//             errors.push(`Invalid pitch line format on line ${lineIndex + 1}: ${line}`);
//             return;
//           }
          
//           const pitch = line.substring(0, colonIndex).trim().toUpperCase();
//           const pattern = line.substring(colonIndex + 1).trim();
          
//           // Validate pitch format
//           if (!pitch.match(/^[A-G][#Bb]?[0-9]$/)) {
//             errors.push(`Invalid pitch format "${pitch}" on line ${lineIndex + 1}`);
//             return;
//           }
          
//           const symbols = pattern.split(/\s+/).filter(s => s.length > 0);
//           if (symbols.length !== subdivisionsPerBar) {
//             errors.push(`Bar ${currentBar}, ${pitch}: expected ${subdivisionsPerBar} subdivisions, got ${symbols.length}`);
//           }
          
//           currentBarData[pitch] = symbols;
//         }
//       } catch (error) {
//         errors.push(`Error parsing line ${lineIndex + 1}: ${error.message}`);
//       }
//     });

//     // Save last bar
//     if (isParsingNotes && Object.keys(currentBarData).length > 0) {
//       tracks[currentBar] = { ...currentBarData };
//     }

//     return {
//       metadata: { tempo, timeSig, numerator, denominator, instrument, legato, key, subdivisionsPerBar },
//       tracks,
//       errors
//     };
//   }

//   // Accurate pitch to MIDI conversion
//   static convertPitchToMidi(pitch, transposition) {
//     const match = pitch.match(/^([A-G][#Bb]?)(\d+)$/i);
//     if (!match) {
//       throw new Error(`Invalid pitch format: ${pitch}`);
//     }
//     const [, noteName, octave] = match;
//     const noteNameUpper = noteName.toUpperCase();
//     const octaveValue = parseInt(octave);
    
//     if (!(noteNameUpper in noteMap)) {
//       throw new Error(`Unknown note name: ${noteNameUpper}`);
//     }
//     if (octaveValue < 0 || octaveValue > 9) {
//       throw new Error(`Octave ${octaveValue} out of range (0-9)`);
//     }
    
//     const noteValue = noteMap[noteNameUpper];
//     return (octaveValue + 1) * 12 + noteValue + transposition;
//   }

//   // Updated conversion logic for clean rules
//   static convertToMidiEvents(parsedData) {
//     const { metadata, tracks } = parsedData;
//     const transposition = noteMap[metadata.key] || 0;
//     const ticksPerQuarter = 480;
//     const subdivisionsPerBar = metadata.subdivisionsPerBar || 16;
//     const ticksPerSubdivision = (ticksPerQuarter * 4 * metadata.numerator / metadata.denominator) / subdivisionsPerBar;
//     const barTicks = (ticksPerQuarter * 4) * (metadata.numerator / metadata.denominator);

//     const noteEvents = [];
//     const activeNotes = new Map(); // Track active notes across bars

//     const barNumbers = Object.keys(tracks).map(n => parseInt(n)).sort((a, b) => a - b);

//     for (let b = 0; b < barNumbers.length; b++) {
//       const barNum = barNumbers[b];
//       const barData = tracks[barNum];
//       const barStartTick = barTicks * (barNum - 1);

//       // End active notes for pitches not present in this bar
//       const currentPitches = new Set(Object.keys(barData));
//       for (const [noteId, noteStart] of [...activeNotes.entries()]) {
//         if (!currentPitches.has(noteStart.pitchName)) {
//           const endTick = barStartTick;
//           const duration = endTick - noteStart.startTick;
//           if (duration > 0) {
//             noteEvents.push({
//               type: 'note',
//               pitch: noteStart.pitch,
//               velocity: noteStart.velocity,
//               startTick: noteStart.startTick,
//               durationTicks: duration,
//             });
//           }
//           activeNotes.delete(noteId);
//         }
//       }

//       // Process each pitch track in this bar
//       Object.entries(barData).forEach(([pitch, symbols]) => {
//         const midiPitch = this.validateMidiPitch(pitch, transposition);
//         const noteId = `${midiPitch}`;

//         // Check if we have an active note from previous bars
//         let currentActiveNote = activeNotes.get(noteId);

//         for (let i = 0; i < symbols.length; i++) {
//           const symbol = symbols[i];
//           const baseTick = barStartTick + (i * ticksPerSubdivision);

//           try {
//             // Parse symbol (handles compound symbols too)
//             const parsedSymbols = this.parseCompoundSymbol(symbol);

//             for (const parsedSymbol of parsedSymbols) {
//               const offsetTicks = (parsedSymbol.timingOffset / 100) * ticksPerSubdivision;
//               const actualTick = Math.max(0, baseTick + offsetTicks);

//               if (parsedSymbol.isNoteOn) {
//                 // NEW NOTE START
                
//                 // End previous note if active
//                 if (currentActiveNote) {
//                   let endTick = baseTick;
//                   if (metadata.legato) {
//                     endTick += 10; // Small overlap for legato
//                   }
//                   const duration = endTick - currentActiveNote.startTick;
//                   if (duration > 0) {
//                     noteEvents.push({
//                       type: 'note',
//                       pitch: currentActiveNote.pitch,
//                       velocity: currentActiveNote.velocity,
//                       startTick: currentActiveNote.startTick,
//                       durationTicks: duration,
//                     });
//                   }
//                   activeNotes.delete(noteId);
//                   currentActiveNote = null;
//                 }

//                 // Start new note
//                 currentActiveNote = {
//                   startTick: actualTick,
//                   pitch: midiPitch,
//                   velocity: parsedSymbol.velocity,
//                   pitchName: pitch
//                 };
//                 activeNotes.set(noteId, currentActiveNote);

//                 // Check for immediate end with duration percent
//                 if (parsedSymbol.durationPercent !== null) {
//                   const durationTicks = (parsedSymbol.durationPercent / 100) * ticksPerSubdivision;
//                   const endTick = actualTick + durationTicks;
                  
//                   noteEvents.push({
//                     type: 'note',
//                     pitch: midiPitch,
//                     velocity: parsedSymbol.velocity,
//                     startTick: actualTick,
//                     durationTicks: durationTicks,
//                   });
                  
//                   activeNotes.delete(noteId);
//                   currentActiveNote = null;
//                 }

//               } else if (parsedSymbol.isSustain) {
//                 // SUSTAIN - keep note active or end with cutoff
//                 if (currentActiveNote) {
//                   if (parsedSymbol.sustainCutoff !== null) {
//                     const cutoffTicks = (parsedSymbol.sustainCutoff / 100) * ticksPerSubdivision;
//                     const endTick = baseTick + cutoffTicks;
//                     const duration = endTick - currentActiveNote.startTick;
                    
//                     if (duration > 0) {
//                       noteEvents.push({
//                         type: 'note',
//                         pitch: currentActiveNote.pitch,
//                         velocity: currentActiveNote.velocity,
//                         startTick: currentActiveNote.startTick,
//                         durationTicks: duration,
//                       });
//                     }
//                     activeNotes.delete(noteId);
//                     currentActiveNote = null;
//                   }
//                   // else: sustain full subdivision, do nothing
//                 }

//               } else if (parsedSymbol.isRest) {
//                 // SILENCE - end note if active
//                 if (currentActiveNote) {
//                   const duration = baseTick - currentActiveNote.startTick;
//                   if (duration > 0) {
//                     noteEvents.push({
//                       type: 'note',
//                       pitch: currentActiveNote.pitch,
//                       velocity: currentActiveNote.velocity,
//                       startTick: currentActiveNote.startTick,
//                       durationTicks: duration,
//                     });
//                   }
//                   activeNotes.delete(noteId);
//                   currentActiveNote = null;
//                 }
//               }
//             }
//           } catch (error) {
//             console.error(`Error processing symbol "${symbol}" in bar ${barNum}, ${pitch}:`, error.message);
//           }
//         }
//       });
//     }

//     // End all remaining active notes at the final bar end
//     const finalBarTick = barNumbers.length * barTicks;
//     for (const [noteId, noteStart] of activeNotes.entries()) {
//       const duration = finalBarTick - noteStart.startTick;
//       if (duration > 0) {
//         noteEvents.push({
//           type: 'note',
//           pitch: noteStart.pitch,
//           velocity: noteStart.velocity,
//           startTick: noteStart.startTick,
//           durationTicks: duration,
//         });
//       }
//     }

//     // Convert to MIDI events (note-on/note-off pairs)
//     const midiEvents = [];
//     noteEvents.forEach(event => {
//       midiEvents.push({
//         tick: event.startTick,
//         type: 'on',
//         pitch: event.pitch,
//         velocity: event.velocity
//       });
//       midiEvents.push({
//         tick: event.startTick + event.durationTicks,
//         type: 'off',
//         pitch: event.pitch,
//         velocity: 0
//       });
//     });

//     // Sort events properly
//     midiEvents.sort((a, b) => {
//       if (a.tick !== b.tick) return a.tick - b.tick;

//       // Ensure note-off events come before note-on events at the same tick
//       if (a.type === 'off' && b.type === 'on') return -1;
//       if (a.type === 'on' && b.type === 'off') return 1;

//       // For same event types, sort by pitch
//       if (a.pitch !== b.pitch) return a.pitch - b.pitch;

//       return 0;
//     });

//     return midiEvents;
//   }
  
//   // Corrected MIDI variable-length encoding
//   static writeVariableLength(value) {
//     let buffer = value & 0x7F;
//     const bytes = [];
    
//     while ((value >>= 7) > 0) {
//       buffer <<= 8;
//       buffer |= (value & 0x7F) | 0x80;
//     }
    
//     while (true) {
//       bytes.push(buffer & 0xFF);
//       if (buffer & 0x80) {
//         buffer >>= 8;
//       } else {
//         break;
//       }
//     }
    
//     return bytes;
//   }

//   // Fixed MIDI byte generation with correct tempo encoding
//   static generateMidiBytes(events, metadata) {
//     const data = [];
    
//     // Helper functions
//     const writeBytes = (bytes) => bytes.forEach(b => data.push(b & 0xFF));
//     const writeInt = (value, numBytes) => {
//       for (let i = numBytes - 1; i >= 0; i--) {
//         data.push((value >> (8 * i)) & 0xFF);
//       }
//     };

//     // MIDI Header
//     writeBytes([0x4D, 0x54, 0x68, 0x64]); // "MThd"
//     writeInt(6, 4); // Header length
//     writeInt(0, 2); // Format 0 (single track)
//     writeInt(1, 2); // Number of tracks
//     writeInt(480, 2); // Ticks per quarter note

//     // Track data
//     const trackData = [];
    
//     // Add tempo meta event with proper delta time
//     const tempoDeltaTime = this.writeVariableLength(0);
//     trackData.push(...tempoDeltaTime);
//     trackData.push(0xFF, 0x51, 0x03); // Meta event: Set Tempo
    
//     // Fixed tempo calculation: microseconds per quarter note = 60,000,000 / BPM
//     const microsecondsPerQuarter = Math.round(60000000 / metadata.tempo);
//     trackData.push((microsecondsPerQuarter >> 16) & 0xFF);
//     trackData.push((microsecondsPerQuarter >> 8) & 0xFF);
//     trackData.push(microsecondsPerQuarter & 0xFF);
    
//     // Set time signature with proper delta time
//     const timeSigDeltaTime = this.writeVariableLength(0);
//     trackData.push(...timeSigDeltaTime);
//     trackData.push(0xFF, 0x58, 0x04); // Meta event: Time Signature
//     trackData.push(metadata.numerator || 4);
//     trackData.push(Math.log2(metadata.denominator || 4));
//     trackData.push(24); // MIDI clocks per metronome tick
//     trackData.push(8); // 32nd notes per quarter note

//     // Add program change for instrument (Piano = 0)
//     const programDeltaTime = this.writeVariableLength(0);
//     trackData.push(...programDeltaTime);
//     trackData.push(0xC0, 0x00);

//     // Add MIDI events with proper delta time calculation
//     let lastTick = 0;
//     events.forEach(event => {
//       const deltaTime = Math.max(0, Math.round(event.tick - lastTick));
//       const deltaBytes = this.writeVariableLength(deltaTime);
//       trackData.push(...deltaBytes);
      
//       if (event.type === 'on') {
//         trackData.push(0x90, event.pitch & 0x7F, event.velocity & 0x7F);
//       } else {
//         trackData.push(0x80, event.pitch & 0x7F, 0x40); // Standard note-off with velocity 64
//       }
//       lastTick += deltaTime;
//     });

//     // End of track
//     const endBytes = this.writeVariableLength(0);
//     trackData.push(...endBytes);
//     trackData.push(0xFF, 0x2F, 0x00);

//     // Write track header and data
//     writeBytes([0x4D, 0x54, 0x72, 0x6B]); // "MTrk"
//     writeInt(trackData.length, 4);
//     writeBytes(trackData);

//     return new Uint8Array(data);
//   }

//   static processTextNotation(text) {
//     try {
//       const parsed = this.parseTextToMidi(text);
      
//       if (parsed.errors.length > 0) {
//         return { success: false, errors: parsed.errors };
//       }
      
//       const events = this.convertToMidiEvents(parsed);
//       const midiBytes = this.generateMidiBytes(events, parsed.metadata);
      
//       return { success: true, data: Buffer.from(midiBytes) };
//     } catch (error) {
//       return { success: false, errors: [error.message] };
//     }
//   }
// }

// module.exports = TextToMidiConverter;







// backend/src/utils/textToMidi.js
const noteMap = {
  'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3,
  'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8,
  'A': 9, 'A#': 10, 'BB': 10, 'B': 11
};

class TextToMidiConverter {

  static calculateSubdivisions(timeSig) {
    const numerator = timeSig.numerator;
    const denominator = timeSig.denominator;
    const subdivisions = numerator * (16 / denominator);
    if (!Number.isInteger(subdivisions)) {
      throw new Error(`Invalid time signature: ${numerator}/${denominator} results in non-integer subdivisions.`);
    }
    return subdivisions;
  }

  // Accurate MIDI pitch validation
  static validateMidiPitch(pitch, transposition) {
    const midiNote = this.convertPitchToMidi(pitch, transposition);
    if (midiNote < 0 || midiNote > 127) {
      throw new Error(`Pitch ${pitch} with transposition ${transposition} results in MIDI note ${midiNote}, which is out of range (0-127)`);
    }
    return midiNote;
  }

  // Strict velocity validation
  static validateVelocity(velocity) {
    const val = Math.max(1, Math.min(127, Math.round(velocity)));
    return val;
  }

  // Updated note symbol parser for clean rules (XR/XE/XO system only)
  static parseNoteSymbol(symbol, defaultVelocity = 100) {
    let velocity = defaultVelocity;
    let timingOffset = 0; // XR percentage
    let durationPercent = null; // XE percentage
    let restOffset = null; // XO percentage
    let restDuration = null; // XE after XO
    let isNoteOn = false;
    let isSustain = false;
    let isRest = false;
    let sustainCutoff = null;

    const originalSymbol = symbol;
    symbol = symbol.toUpperCase();

    // Check for pure rest
    if (originalSymbol === '.') {
      return { 
        isNoteOn: false, 
        velocity, 
        timingOffset: 0, 
        durationPercent: null,
        restOffset: null,
        restDuration: null,
        isSustain: false, 
        isRest: true,
        sustainCutoff: null
      };
    }

    // Check for sustain symbols (~ or ~0-100)
    const sustainMatch = symbol.match(/^~(\d+)?$/);
    if (sustainMatch) {
      isSustain = true;
      if (sustainMatch[1]) {
        sustainCutoff = parseInt(sustainMatch[1]);
        if(sustainCutoff < 0){
          sustainCutoff = 0;
        }
        if(sustainCutoff > 100){
          sustainCutoff = 100;
        }
        // if (sustainCutoff < 0 || sustainCutoff > 100) {
        //   throw new Error(`Sustain cutoff ${sustainCutoff} must be between 0-100`);
        // }
      }
      return { 
        isNoteOn: false, 
        velocity, 
        timingOffset: 0, 
        durationPercent: null,
        restOffset: null,
        restDuration: null,
        isSustain: true, 
        isRest: false,
        sustainCutoff
      };
    }

    // Check for positioned rest (XO...XE...)
    const positionedRestMatch = symbol.match(/^XO(\d+)XE(\d+)$/);
    if (positionedRestMatch) {
      restOffset = parseInt(positionedRestMatch[1]);
      restDuration = parseInt(positionedRestMatch[2]);
      
      if (restOffset < 0 || restOffset > 100) {
        throw new Error(`Rest offset ${restOffset} must be between 0-100`);
      }
      if (restDuration < 0 || restDuration > 100) {
        throw new Error(`Rest duration ${restDuration} must be between 0-100`);
      }
      if (restOffset + restDuration > 100) {
        throw new Error(`Rest position ${restOffset} + duration ${restDuration} exceeds 100%`);
      }

      return { 
        isNoteOn: true, // Positioned rest creates a note
        velocity: 100, // Default velocity for positioned notes
        timingOffset: restOffset, 
        durationPercent: restDuration,
        restOffset,
        restDuration,
        isSustain: false, 
        isRest: false,
        sustainCutoff: null
      };
    }

    // Check for note-on symbols (X, X60, X80XR25, etc.)
    if (symbol.startsWith('X')) {
      isNoteOn = true;
      
      // Extract velocity
      const velocityMatch = symbol.match(/^X(\d+)/);
      if (velocityMatch) {
        velocity = parseInt(velocityMatch[1]);
        if(velocity > 127){
          velocity = 127;
        }
          if (velocity < 1) {
            throw new Error(`Velocity ${velocity} must be between 1-127`);
          }
        symbol = symbol.replace(/^X\d+/, '');
      } else {
        symbol = symbol.replace(/^X/, '');
      }

      // Extract right offset (XR)
      const rightOffsetMatch = symbol.match(/XR(\d+)/);
      if (rightOffsetMatch) {
        timingOffset = parseInt(rightOffsetMatch[1]);
        if(timingOffset > 100){
          timingOffset = 100;
        }
        // if (timingOffset < 0 || timingOffset > 100) {
        //   throw new Error(`Right offset ${timingOffset} must be between 0-100`);
        // }
        symbol = symbol.replace(/XR\d+/, '');
      }

      // Extract left offset (XL) - early timing
      const leftOffsetMatch = symbol.match(/XL(\d+)/);
      if (leftOffsetMatch) {
        timingOffset = -parseInt(leftOffsetMatch[1]);
        symbol = symbol.replace(/XL\d+/, '');
      }

      // Extract duration from start (XE or just E)
      const durationMatch = symbol.match(/E(\d+)/) || symbol.match(/^(\d+)$/);
      if (durationMatch) {
        durationPercent = parseInt(durationMatch[1]);
        if (durationPercent < 0 || durationPercent > 100) {
          throw new Error(`Duration percent ${durationPercent} must be between 0-100`);
        }
        symbol = symbol.replace(/E?\d+/, '');
      }

      // // Check for invalid combinations
      // if (timingOffset !== 0 && durationPercent !== null) {
      //   throw new Error(`Cannot combine XR offset with XE duration in symbol: ${originalSymbol}`);
      // }
    }

    return { 
      isNoteOn,
      velocity: this.validateVelocity(velocity), 
      timingOffset,
      durationPercent,
      restOffset,
      restDuration,
      isSustain: false, 
      isRest: false,
      sustainCutoff: null
    };
  }

  // Parse compound symbols (e.g., XE30XE50, XO25XE25XO25XE25)
  static parseCompoundSymbol(symbol) {
    const parts = [];
    
    // Check for stacked short notes (XE...XE...)
    const shortNoteMatches = [...symbol.matchAll(/X(\d+)?E(\d+)/gi)];
    if (shortNoteMatches.length > 1) {
      let totalPercent = 0;
      let currentStart = 0;
      
      for (const match of shortNoteMatches) {
        const vel = match[1] ? parseInt(match[1]) : 100;
        const duration = parseInt(match[2]);
        totalPercent += duration;
        
        if (totalPercent > 100) {
          throw new Error(`Stacked short notes exceed 100% in symbol: ${symbol}`);
        }

        parts.push({
          isNoteOn: true,
          velocity: this.validateVelocity(vel),
          timingOffset: currentStart,
          durationPercent: duration,
          restOffset: null,
          restDuration: null,
          isSustain: false,
          isRest: false,
          sustainCutoff: null
        });
        
        currentStart += duration;
      }
      
      return parts;
    }

    // Check for positioned rest patterns (XO...XE... combinations)
    const complexRestMatch = symbol.match(/^((?:XO\d+XE\d+|XE\d+)+)$/);
    if (complexRestMatch) {
      const segments = [...symbol.matchAll(/(XO\d+XE\d+|XE\d+)/g)];
      let currentPos = 0;
      
      for (const segment of segments) {
        const segmentStr = segment[0];
        
        if (segmentStr.startsWith('XO')) {
          // Positioned rest + note
          const posMatch = segmentStr.match(/^XO(\d+)XE(\d+)$/);
          if (posMatch) {
            const restOffset = parseInt(posMatch[1]);
            const noteDuration = parseInt(posMatch[2]);
            
            parts.push({
              isNoteOn: true,
              velocity: 100,
              timingOffset: restOffset,
              durationPercent: noteDuration,
              restOffset,
              restDuration: noteDuration,
              isSustain: false,
              isRest: false,
              sustainCutoff: null
            });
            currentPos += restOffset + noteDuration;
          }
        } else if (segmentStr.startsWith('XE')) {
          // Short note from current position
          const durationMatch = segmentStr.match(/^XE(\d+)$/);
          if (durationMatch) {
            const duration = parseInt(durationMatch[1]);
            
            parts.push({
              isNoteOn: true,
              velocity: 100,
              timingOffset: currentPos,
              durationPercent: duration,
              restOffset: null,
              restDuration: null,
              isSustain: false,
              isRest: false,
              sustainCutoff: null
            });
            
            currentPos += duration;
          }
        }
      }
      
      if (currentPos > 100) {
        throw new Error(`Compound positioned notes exceed 100% in symbol: ${symbol}`);
      }
      
      return parts;
    }

    // Single symbol fallback
    return [this.parseNoteSymbol(symbol)];
  }

  static parseTextToMidi(text) {
    const lines = text.trim().split('\n');
    let tempo = 120;
    let timeSig = { numerator: 4, denominator: 4 };
    let key = 'C'; // Default key
    const bars = [];
    let currentBar = null;
    const errors = [];
    let transposition = 0; // Assume default

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      if (line.startsWith('Tempo:')) {
        const match = line.match(/Tempo:\s*(\d+)/);
        if (match) tempo = parseInt(match[1]);
      } else if (line.startsWith('TimeSig:')) {
        const match = line.match(/TimeSig:\s*(\d+)\/(\d+)/);
        if (match) {
          timeSig.numerator = parseInt(match[1]);
          timeSig.denominator = parseInt(match[2]);
        }
      } else if (line.startsWith('Key:')) {
        const match = line.match(/Key:\s*([A-G][#b]?[m]?)/i); // Allow C, C#, C#m, etc.
        if (match) {
          key = match[1].toUpperCase(); // Parse but default to C if invalid
          if (!/^[A-G][#B]?M?$/.test(key)) {
            key = 'C'; // Invalid key defaults to C, no error
          }
        }
      } else if (line.startsWith('Bar:')) {
        const match = line.match(/Bar:\s*(\d+)/);
        if (match) {
          currentBar = { number: parseInt(match[1]), pitches: new Map() };
          bars.push(currentBar);
        }
      } else if (currentBar && line.match(/^[A-G][#b]?\d:/i)) {
        const [pitch, patternStr] = line.split(':');
        const symbols = patternStr.trim().split(/\s+/).filter(s => s);
        currentBar.pitches.set(pitch.trim(), symbols);
      }
    });

    // Metadata for output
    const metadata = { tempo, timeSig, key }; // Key is included but not used in MIDI generation

    return { bars, metadata, errors, transposition };
  }

  static convertToMidiEvents(parsed) {
    const { bars, metadata, transposition } = parsed;
    const timeSig = metadata.timeSig;
    const ticksPerQuarter = 480; // Standard MIDI resolution
    const subdivisionsPerBar = this.calculateSubdivisions(timeSig);
    const barTicks = ticksPerQuarter * timeSig.numerator * (4 / timeSig.denominator);
    const ticksPerSubdivision = barTicks / subdivisionsPerBar;

    const noteEvents = [];
    const activeNotes = new Map(); // pitch -> {startTick, pitch, velocity, pitchName}

    bars.forEach(bar => {
      const barNum = bar.number;
      const baseBarTick = (barNum - 1) * barTicks;

      bar.pitches.forEach((patterns, pitch) => {
        let currentActiveNote = null;
        const noteId = `${barNum}-${pitch}`; // Unique per pitch per bar for monophonic

        patterns.forEach((symbol, subIndex) => {
          const parsedSymbols = this.parseCompoundSymbol(symbol); // Handle compound
          parsedSymbols.forEach(parsedSymbol => {
            try {
              const baseTick = baseBarTick + subIndex * ticksPerSubdivision;
              const offsetTicks = (parsedSymbol.timingOffset / 100) * ticksPerSubdivision;
              const actualTick = baseTick + offsetTicks;
              const midiPitch = this.validateMidiPitch(pitch, transposition);

              if (parsedSymbol.isNoteOn) {
                // End previous if active
                if (currentActiveNote) {
                  const duration = actualTick - currentActiveNote.startTick;
                  if (duration > 0) {
                    noteEvents.push({
                      type: 'note',
                      pitch: currentActiveNote.pitch,
                      velocity: currentActiveNote.velocity,
                      startTick: currentActiveNote.startTick,
                      durationTicks: duration,
                    });
                  }
                  activeNotes.delete(noteId);
                  currentActiveNote = null;
                }

                // Start new note
                currentActiveNote = {
                  startTick: actualTick,
                  pitch: midiPitch,
                  velocity: parsedSymbol.velocity,
                  pitchName: pitch
                };
                activeNotes.set(noteId, currentActiveNote);

                // Check for immediate end with duration percent
                if (parsedSymbol.durationPercent !== null) {
                  const durationTicks = (parsedSymbol.durationPercent / 100) * ticksPerSubdivision;
                  const endTick = actualTick + durationTicks;
                  
                  noteEvents.push({
                    type: 'note',
                    pitch: midiPitch,
                    velocity: parsedSymbol.velocity,
                    startTick: actualTick,
                    durationTicks: durationTicks,
                  });
                  
                  activeNotes.delete(noteId);
                  currentActiveNote = null;
                }

              } else if (parsedSymbol.isSustain) {
                // SUSTAIN - keep note active or end with cutoff
                if (currentActiveNote) {
                  if (parsedSymbol.sustainCutoff !== null) {
                    const cutoffTicks = (parsedSymbol.sustainCutoff / 100) * ticksPerSubdivision;
                    const endTick = baseTick + cutoffTicks;
                    const duration = endTick - currentActiveNote.startTick;
                    
                    if (duration > 0) {
                      noteEvents.push({
                        type: 'note',
                        pitch: currentActiveNote.pitch,
                        velocity: currentActiveNote.velocity,
                        startTick: currentActiveNote.startTick,
                        durationTicks: duration,
                      });
                    }
                    activeNotes.delete(noteId);
                    currentActiveNote = null;
                  }
                  // else: sustain full subdivision, do nothing
                }

              } else if (parsedSymbol.isRest) {
                // SILENCE - end note if active
                if (currentActiveNote) {
                  const duration = baseTick - currentActiveNote.startTick;
                  if (duration > 0) {
                    noteEvents.push({
                      type: 'note',
                      pitch: currentActiveNote.pitch,
                      velocity: currentActiveNote.velocity,
                      startTick: currentActiveNote.startTick,
                      durationTicks: duration,
                    });
                  }
                  activeNotes.delete(noteId);
                  currentActiveNote = null;
                }
              }
            } catch (error) {
              console.error(`Error processing symbol "${symbol}" in bar ${barNum}, ${pitch}:`, error.message);
            }
          });
        });

        // End note at end of bar if still active (for this pitch)
        if (currentActiveNote) {
          const duration = baseBarTick + barTicks - currentActiveNote.startTick;
          if (duration > 0) {
            noteEvents.push({
              type: 'note',
              pitch: currentActiveNote.pitch,
              velocity: currentActiveNote.velocity,
              startTick: currentActiveNote.startTick,
              durationTicks: duration,
            });
          }
          activeNotes.delete(noteId);
        }
      });
    });

    // End all remaining active notes at the final bar end
    const finalBarTick = bars.length * barTicks;
    for (const [noteId, noteStart] of activeNotes.entries()) {
      const duration = finalBarTick - noteStart.startTick;
      if (duration > 0) {
        noteEvents.push({
          type: 'note',
          pitch: noteStart.pitch,
          velocity: noteStart.velocity,
          startTick: noteStart.startTick,
          durationTicks: duration,
        });
      }
    }

    // Convert to MIDI events (note-on/note-off pairs)
    const midiEvents = [];
    noteEvents.forEach(event => {
      midiEvents.push({
        tick: event.startTick,
        type: 'on',
        pitch: event.pitch,
        velocity: event.velocity
      });
      midiEvents.push({
        tick: event.startTick + event.durationTicks,
        type: 'off',
        pitch: event.pitch,
        velocity: 0
      });
    });

    // Sort events properly
    midiEvents.sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;

      // Ensure note-off events come before note-on events at the same tick
      if (a.type === 'off' && b.type === 'on') return -1;
      if (a.type === 'on' && b.type === 'off') return 1;

      // For same event types, sort by pitch
      if (a.pitch !== b.pitch) return a.pitch - b.pitch;

      return 0;
    });

    return midiEvents;
  }
  
  // Corrected MIDI variable-length encoding
  static writeVariableLength(value) {
    let buffer = value & 0x7F;
    const bytes = [];
    
    while ((value >>= 7) > 0) {
      buffer <<= 8;
      buffer |= (value & 0x7F) | 0x80;
    }
    
    while (true) {
      bytes.push(buffer & 0xFF);
      if (buffer & 0x80) {
        buffer >>= 8;
      } else {
        break;
      }
    }
    
    return bytes;
  }

  // Fixed MIDI byte generation with correct tempo encoding
  static generateMidiBytes(events, metadata) {
    const data = [];
    
    // Helper functions
    const writeBytes = (bytes) => bytes.forEach(b => data.push(b & 0xFF));
    const writeInt = (value, numBytes) => {
      for (let i = numBytes - 1; i >= 0; i--) {
        data.push((value >> (8 * i)) & 0xFF);
      }
    };

    // MIDI Header
    writeBytes([0x4D, 0x54, 0x68, 0x64]); // "MThd"
    writeInt(6, 4); // Header length
    writeInt(0, 2); // Format 0 (single track)
    writeInt(1, 2); // Number of tracks
    writeInt(480, 2); // Ticks per quarter note

    // Track data
    const trackData = [];
    
    // Add tempo meta event with proper delta time
    const tempoDeltaTime = this.writeVariableLength(0);
    trackData.push(...tempoDeltaTime);
    trackData.push(0xFF, 0x51, 0x03); // Meta event: Set Tempo
    
    // Fixed tempo calculation: microseconds per quarter note = 60,000,000 / BPM
    const microsecondsPerQuarter = Math.round(60000000 / metadata.tempo);
    trackData.push((microsecondsPerQuarter >> 16) & 0xFF);
    trackData.push((microsecondsPerQuarter >> 8) & 0xFF);
    trackData.push(microsecondsPerQuarter & 0xFF);
    
    // Set time signature with proper delta time
    const timeSigDeltaTime = this.writeVariableLength(0);
    trackData.push(...timeSigDeltaTime);
    trackData.push(0xFF, 0x58, 0x04); // Meta event: Time Signature
    trackData.push(metadata.timeSig.numerator || 4);
    trackData.push(Math.log2(metadata.timeSig.denominator || 4));
    trackData.push(24); // MIDI clocks per metronome tick
    trackData.push(8); // 32nd notes per quarter note

    // Add program change for instrument (Piano = 0)
    const programDeltaTime = this.writeVariableLength(0);
    trackData.push(...programDeltaTime);
    trackData.push(0xC0, 0x00);

    // Add MIDI events with proper delta time calculation
    let lastTick = 0;
    events.forEach(event => {
      const deltaTime = Math.max(0, Math.round(event.tick - lastTick));
      const deltaBytes = this.writeVariableLength(deltaTime);
      trackData.push(...deltaBytes);
      
      if (event.type === 'on') {
        trackData.push(0x90, event.pitch & 0x7F, event.velocity & 0x7F);
      } else {
        trackData.push(0x80, event.pitch & 0x7F, 0x40); // Standard note-off with velocity 64
      }
      lastTick += deltaTime;
    });

    // End of track
    const endBytes = this.writeVariableLength(0);
    trackData.push(...endBytes);
    trackData.push(0xFF, 0x2F, 0x00);

    // Write track header and data
    writeBytes([0x4D, 0x54, 0x72, 0x6B]); // "MTrk"
    writeInt(trackData.length, 4);
    writeBytes(trackData);

    return new Uint8Array(data);
  }

  static convertPitchToMidi(pitch, transposition = 0) {
    const match = pitch.match(/^([A-G][#Bb]?)(-?\d+)$/i);
    if (!match) throw new Error(`Invalid pitch format: ${pitch}`);
    const [, noteName, octave] = match;
    const noteNameUpper = noteName.toUpperCase();
    const octaveValue = parseInt(octave);
    if (!(noteNameUpper in noteMap)) {
      throw new Error(`Unknown note name: ${noteNameUpper}`);
    }
    const noteValue = noteMap[noteNameUpper];
    return (octaveValue + 1) * 12 + noteValue + transposition;
  }

  static processTextNotation(text) {
    try {
      const parsed = this.parseTextToMidi(text);
      
      if (parsed.errors.length > 0) {
        return { success: false, errors: parsed.errors };
      }
      
      const events = this.convertToMidiEvents(parsed);
      const midiBytes = this.generateMidiBytes(events, parsed.metadata);
      
      return { success: true, data: Buffer.from(midiBytes) };
    } catch (error) {
      return { success: false, errors: [error.message] };
    }
  }
}

module.exports = TextToMidiConverter;