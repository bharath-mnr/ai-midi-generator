

// // backend/src/utils/midiToText.js
// // MIDI to Text conversion logic (updated for clean rules)
// const noteMap = {
//   'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3,
//   'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8,
//   'A': 9, 'A#': 10, 'BB': 10, 'B': 11
// };

// const midiToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// class MidiToTextConverter {
//   static convertMidiToPitch(midiNumber) {
//     const octave = Math.floor(midiNumber / 12) - 1;
//     const noteIndex = midiNumber % 12;
//     return midiToNote[noteIndex] + octave;
//   }

//   static parseMidiFile(arrayBuffer) {
//     const data = new Uint8Array(arrayBuffer);
//     let offset = 0;

//     // Read MIDI header
//     const headerChunk = data.slice(0, 14);
//     if (String.fromCharCode(...headerChunk.slice(0, 4)) !== 'MThd') {
//       throw new Error('Invalid MIDI file format');
//     }

//     const format = (headerChunk[8] << 8) | headerChunk[9];
//     const trackCount = (headerChunk[10] << 8) | headerChunk[11];
//     const ticksPerQuarter = (headerChunk[12] << 8) | headerChunk[13];

//     offset = 14;

//     // Parse tracks
//     const events = [];
//     let tempo = 120; // Default tempo
//     let timeSig = { numerator: 4, denominator: 4 };

//     for (let track = 0; track < trackCount; track++) {
//       // Read track header
//       const trackHeader = data.slice(offset, offset + 8);
//       if (String.fromCharCode(...trackHeader.slice(0, 4)) !== 'MTrk') {
//         throw new Error('Invalid track header');
//       }

//       const trackLength = (trackHeader[4] << 24) | (trackHeader[5] << 16) | (trackHeader[6] << 8) | trackHeader[7];
//       offset += 8;

//       const trackData = data.slice(offset, offset + trackLength);
//       let trackOffset = 0;
//       let currentTick = 0;
//       let runningStatus = 0;

//       // Parse track events
//       while (trackOffset < trackLength) {
//         // Read variable-length delta time
//         let deltaTime = 0;
//         let byte;
//         do {
//           byte = trackData[trackOffset++];
//           deltaTime = (deltaTime << 7) | (byte & 0x7F);
//         } while (byte & 0x80);

//         currentTick += deltaTime;

//         let statusByte = trackData[trackOffset];
        
//         // Handle running status
//         if (statusByte < 0x80) {
//           statusByte = runningStatus;
//         } else {
//           trackOffset++;
//           runningStatus = statusByte;
//         }

//         if (statusByte === 0xFF) {
//           // Meta event
//           const metaType = trackData[trackOffset++];
//           let metaLength = 0;
//           let lengthByte;
          
//           // Read variable length for meta event length
//           do {
//             lengthByte = trackData[trackOffset++];
//             metaLength = (metaLength << 7) | (lengthByte & 0x7F);
//           } while (lengthByte & 0x80);

//           if (metaType === 0x51 && metaLength === 3) {
//             // Set Tempo
//             const microsecondsPerQuarter = (trackData[trackOffset] << 16) | 
//                                          (trackData[trackOffset + 1] << 8) | 
//                                          trackData[trackOffset + 2];
//             tempo = Math.round(60000000 / microsecondsPerQuarter);
//           } else if (metaType === 0x58 && metaLength >= 4) {
//             // Time Signature
//             timeSig.numerator = trackData[trackOffset];
//             timeSig.denominator = Math.pow(2, trackData[trackOffset + 1]);
//           }

//           trackOffset += metaLength;
//           runningStatus = 0; // Clear running status after meta event
//         } else if ((statusByte & 0xF0) === 0x90) {
//           // Note On
//           const pitch = trackData[trackOffset++];
//           const velocity = trackData[trackOffset++];
          
//           if (velocity > 0) {
//             events.push({
//               tick: currentTick,
//               type: 'on',
//               pitch: pitch,
//               velocity: velocity
//             });
//           } else {
//             events.push({
//               tick: currentTick,
//               type: 'off',
//               pitch: pitch,
//               velocity: 0
//             });
//           }
//         } else if ((statusByte & 0xF0) === 0x80) {
//           // Note Off
//           const pitch = trackData[trackOffset++];
//           const velocity = trackData[trackOffset++];
          
//           events.push({
//             tick: currentTick,
//             type: 'off',
//             pitch: pitch,
//             velocity: 0
//           });
//         } else {
//           // Skip other events
//           if (statusByte >= 0xF0) {
//             break;
//           } else {
//             const eventType = statusByte & 0xF0;
//             if (eventType === 0xC0 || eventType === 0xD0) {
//               trackOffset += 1;
//             } else {
//               trackOffset += 2;
//             }
//           }
//         }
//       }
//       offset += trackLength;
//     }

//     return {
//       events: events.sort((a, b) => a.tick - b.tick),
//       tempo,
//       timeSig,
//       ticksPerQuarter
//     };
//   }

//   static convertMidiToText(midiData) {
//     const { events, tempo, timeSig, ticksPerQuarter } = midiData;
//     const notes = [];
//     const noteOnEvents = new Map();

//     events.forEach(event => {
//       if (event.type === 'on') {
//         if (noteOnEvents.has(event.pitch)) {
//           // End previous note on same pitch (monophonic handling)
//           const prev = noteOnEvents.get(event.pitch);
//           const duration = event.tick - prev.tick;
//           if (duration > 0) {
//             notes.push({
//               pitch: event.pitch,
//               startTick: prev.tick,
//               endTick: event.tick,
//               velocity: prev.velocity,
//               duration: duration
//             });
//           }
//         }
//         noteOnEvents.set(event.pitch, event);
//       } else if (event.type === 'off' && noteOnEvents.has(event.pitch)) {
//         const noteOn = noteOnEvents.get(event.pitch);
//         const duration = event.tick - noteOn.tick;
//         if (duration > 0) {
//           notes.push({
//             pitch: event.pitch,
//             startTick: noteOn.tick,
//             endTick: event.tick,
//             velocity: noteOn.velocity,
//             duration
//           });
//         }
//         noteOnEvents.delete(event.pitch);
//       }
//     });

//     // Handle any remaining active notes
//     if (noteOnEvents.size > 0) {
//       const maxTick = events.length > 0 ? Math.max(...events.map(e => e.tick)) : 0;
//       noteOnEvents.forEach((on, pitch) => {
//         const duration = maxTick - on.tick;
//         if (duration > 0) {
//           notes.push({
//             pitch,
//             startTick: on.tick,
//             endTick: maxTick,
//             velocity: on.velocity,
//             duration
//           });
//         }
//       });
//     }

//     // Calculate bars and subdivisions (fixed to 16th notes)
//     const subdivisionsPerBeat = 4; // 16th notes
//     const subdivisionsPerBar = timeSig.numerator * subdivisionsPerBeat;
//     const ticksPerBar = ticksPerQuarter * timeSig.numerator * (4 / timeSig.denominator);
//     const ticksPerSubdivision = ticksPerBar / subdivisionsPerBar;

//     // Determine max bar
//     const maxTick = Math.max(...notes.map(n => n.endTick), 0);
//     const maxBar = Math.ceil((maxTick + 1) / ticksPerBar) || 1;

//     // Pitch tracks: pitch -> bar -> array of symbols
//     const pitchTracks = new Map();

//     notes.forEach(note => {
//       const pitchName = this.convertMidiToPitch(note.pitch);
//       if (!pitchTracks.has(pitchName)) {
//         pitchTracks.set(pitchName, new Map());
//       }

//       // Calculate start and end subdivisions with higher precision
//       const startSubTotal = Math.floor(note.startTick / ticksPerSubdivision);
//       const startOffsetTicks = note.startTick - startSubTotal * ticksPerSubdivision;
//       const offsetPercent = Math.round((startOffsetTicks / ticksPerSubdivision) * 100);

//       const endSubTotal = Math.floor((note.endTick - 0.0001) / ticksPerSubdivision);
//       const endOffsetTicks = note.endTick - endSubTotal * ticksPerSubdivision;
//       const endPercent = Math.round((endOffsetTicks / ticksPerSubdivision) * 100);

//       // Place symbols for each subdivision covered
//       for (let currentSubTotal = startSubTotal; currentSubTotal <= endSubTotal; currentSubTotal++) {
//         const barNum = Math.floor(currentSubTotal / subdivisionsPerBar) + 1;
//         const subInBar = currentSubTotal % subdivisionsPerBar;

//         if (!pitchTracks.get(pitchName).has(barNum)) {
//           pitchTracks.get(pitchName).set(barNum, new Array(subdivisionsPerBar).fill('.'));
//         }

//         const barPattern = pitchTracks.get(pitchName).get(barNum);
//         let symbol = '';

//         if (currentSubTotal === startSubTotal) {
//           // Start symbol - use clean rules
//           symbol = 'X';
          
//           // Add velocity only if not default (100)
//           if (note.velocity !== 100) {
//             symbol += note.velocity;
//           }
          
//           // Add offset if note doesn't start at beginning of subdivision
//           if (offsetPercent > 0) {
//             symbol += `XR${offsetPercent}`;
//           }
          
//           // Handle single subdivision notes
//           if (startSubTotal === endSubTotal) {
//             // Note contained within single subdivision
//             if (offsetPercent === 0 && endPercent < 100) {
//               // Note from start, partial duration
//               symbol += `E${endPercent}`;
//             } else if (offsetPercent > 0 && endPercent < 100) {
//               // Note with offset and doesn't reach end
//               // This is a positioned note within subdivision
//               const duration = endPercent - offsetPercent;
//               if (duration > 0) {
//                 // Use XO + XE pattern for positioned notes
//                 symbol = `XO${offsetPercent}XE${duration}`;
//                 if (note.velocity !== 100) {
//                   // For positioned notes, velocity goes with the XE part
//                   symbol = `XO${offsetPercent}XE${duration}`;
//                   // Note: Velocity handling for positioned notes may need refinement
//                 }
//               }
//             }
//             // If offsetPercent > 0 and endPercent == 100, use XR (already added)
//           }
//         } else {
//           // Sustain symbol with space separator
//           symbol = '~';
          
//           // Add cutoff percentage if note ends mid-subdivision
//           if (currentSubTotal === endSubTotal && endPercent < 100) {
//             symbol += endPercent;
//           }
//         }

//         // Only set non-empty symbols
//         if (symbol && symbol !== '.') {
//           barPattern[subInBar] = symbol;
//         }
//       }
//     });

//     // Generate text notation
//     let textOutput = `Tempo: ${tempo}\n`;
//     textOutput += `TimeSig: ${timeSig.numerator}/${timeSig.denominator}\n\n`;

//     // Sort pitches from low to high
//     const sortedPitches = Array.from(pitchTracks.keys()).sort((a, b) => {
//       const aMidi = this.convertPitchToMidi(a);
//       const bMidi = this.convertPitchToMidi(b);
//       return aMidi - bMidi;
//     });

//     for (let barNum = 1; barNum <= maxBar; barNum++) {
//       textOutput += `Bar: ${barNum}\n`;

//       sortedPitches.forEach(pitch => {
//         const barData = pitchTracks.get(pitch);
//         if (barData && barData.has(barNum)) {
//           const pattern = barData.get(barNum);
          
//           // Format pattern with proper spacing based on time signature
//           const formattedPattern = this.formatPattern(pattern, timeSig);
//           textOutput += `${pitch}: ${formattedPattern}\n`;
//         }
//       });

//       if (barNum < maxBar) {
//         textOutput += '\n';
//       }
//     }

//     return textOutput;
//   }

//   static formatPattern(pattern, timeSig) {
//     // Format pattern with proper beat groupings
//     if (timeSig.numerator === 4 && timeSig.denominator === 4) {
//       // 4/4: [1-4] [5-8] [9-12] [13-16]
//       const formatted = [];
//       for (let i = 0; i < pattern.length; i += 4) {
//         const group = pattern.slice(i, i + 4);
//         formatted.push(group.join(' '));
//       }
//       return formatted.join('   ');
//     } else if (timeSig.numerator === 3 && timeSig.denominator === 4) {
//       // 3/4: [1-4] [5-8] [9-12]
//       const formatted = [];
//       for (let i = 0; i < pattern.length; i += 4) {
//         const group = pattern.slice(i, i + 4);
//         formatted.push(group.join(' '));
//       }
//       return formatted.join('   ');
//     }
    
//     // Default formatting
//     return pattern.join(' ');
//   }

//   static convertPitchToMidi(pitch, transposition = 0) {
//     const match = pitch.match(/^([A-G][#Bb]?)(-?\d+)$/i);
//     if (!match) throw new Error(`Invalid pitch format: ${pitch}`);
//     const [, noteName, octave] = match;
//     const noteNameUpper = noteName.toUpperCase();
//     const octaveValue = parseInt(octave);
//     if (!(noteNameUpper in noteMap)) {
//       throw new Error(`Unknown note name: ${noteNameUpper}`);
//     }
//     const noteValue = noteMap[noteNameUpper];
//     return (octaveValue + 1) * 12 + noteValue + transposition;
//   }

//   static processMidiFile(buffer) {
//     try {
//       const midiData = this.parseMidiFile(buffer);
//       const textNotation = this.convertMidiToText(midiData);
//       return { success: true, data: textNotation };
//     } catch (error) {
//       return { success: false, error: error.message };
//     }
//   }
// }

// module.exports = MidiToTextConverter;










const noteMap = {
  'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3,
  'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8,
  'A': 9, 'A#': 10, 'BB': 10, 'B': 11
};

const midiToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

class MidiToTextConverter {
  static convertMidiToPitch(midiNumber) {
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteIndex = midiNumber % 12;
    return midiToNote[noteIndex] + octave;
  }

  static calculateSubdivisions(timeSig) {
    const numerator = timeSig.numerator;
    const denominator = timeSig.denominator;
    const subdivisions = numerator * (16 / denominator);
    if (!Number.isInteger(subdivisions)) {
      throw new Error(`Invalid time signature: ${numerator}/${denominator} results in non-integer subdivisions.`);
    }
    return subdivisions;
  }

  static parseMidiFile(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    let offset = 0;

    // Read MIDI header
    const headerChunk = data.slice(0, 14);
    if (String.fromCharCode(...headerChunk.slice(0, 4)) !== 'MThd') {
      throw new Error('Invalid MIDI file format');
    }

    const format = (headerChunk[8] << 8) | headerChunk[9];
    const trackCount = (headerChunk[10] << 8) | headerChunk[11];
    const ticksPerQuarter = (headerChunk[12] << 8) | headerChunk[13];

    offset = 14;

    // Parse tracks
    const events = [];
    let tempo = 120; // Default tempo
    let timeSig = { numerator: 4, denominator: 4 };

    for (let track = 0; track < trackCount; track++) {
      // Read track header
      const trackHeader = data.slice(offset, offset + 8);
      if (String.fromCharCode(...trackHeader.slice(0, 4)) !== 'MTrk') {
        throw new Error('Invalid track header');
      }

      const trackLength = (trackHeader[4] << 24) | (trackHeader[5] << 16) | (trackHeader[6] << 8) | trackHeader[7];
      offset += 8;

      const trackData = data.slice(offset, offset + trackLength);
      let trackOffset = 0;
      let currentTick = 0;
      let runningStatus = 0;

      // Parse track events
      while (trackOffset < trackLength) {
        // Read variable-length delta time
        let deltaTime = 0;
        let byte;
        do {
          byte = trackData[trackOffset++];
          deltaTime = (deltaTime << 7) | (byte & 0x7F);
        } while (byte & 0x80);

        currentTick += deltaTime;

        let statusByte = trackData[trackOffset];

        // Handle running status
        if (statusByte < 0x80) {
          statusByte = runningStatus;
        } else {
          trackOffset++;
          runningStatus = statusByte;
        }

        if (statusByte === 0xFF) {
          // Meta event
          const metaType = trackData[trackOffset++];
          let metaLength = 0;
          let lengthByte;

          // Read variable length for meta event length
          do {
            lengthByte = trackData[trackOffset++];
            metaLength = (metaLength << 7) | (lengthByte & 0x7F);
          } while (lengthByte & 0x80);

          if (metaType === 0x51 && metaLength === 3) {
            // Set Tempo
            const microsecondsPerQuarter = (trackData[trackOffset] << 16) |
                                          (trackData[trackOffset + 1] << 8) |
                                          trackData[trackOffset + 2];
            tempo = Math.round(60000000 / microsecondsPerQuarter);
          } else if (metaType === 0x58 && metaLength >= 4) {
            // Time Signature
            timeSig.numerator = trackData[trackOffset];
            timeSig.denominator = Math.pow(2, trackData[trackOffset + 1]);
          }

          trackOffset += metaLength;
          runningStatus = 0; // Clear running status after meta event
        } else if ((statusByte & 0xF0) === 0x90) {
          // Note On
          const pitch = trackData[trackOffset++];
          const velocity = trackData[trackOffset++];

          if (velocity > 0) {
            events.push({
              tick: currentTick,
              type: 'on',
              pitch: pitch,
              velocity: velocity
            });
          } else {
            events.push({
              tick: currentTick,
              type: 'off',
              pitch: pitch,
              velocity: 0
            });
          }
        } else if ((statusByte & 0xF0) === 0x80) {
          // Note Off
          const pitch = trackData[trackOffset++];
          const velocity = trackData[trackOffset++];

          events.push({
            tick: currentTick,
            type: 'off',
            pitch: pitch,
            velocity: 0
          });
        } else {
          // Skip other events
          if (statusByte >= 0xF0) {
            break;
          } else {
            const eventType = statusByte & 0xF0;
            if (eventType === 0xC0 || eventType === 0xD0) {
              trackOffset += 1;
            } else {
              trackOffset += 2;
            }
          }
        }
      }
      offset += trackLength;
    }

    return {
      events: events.sort((a, b) => a.tick - b.tick),
      tempo,
      timeSig,
      ticksPerQuarter
    };
  }

  static convertMidiToText(midiData) {
    const { events, tempo, timeSig, ticksPerQuarter } = midiData;
    const notes = [];
    const noteOnEvents = new Map();

    // Process MIDI events to extract notes
    events.forEach(event => {
      if (event.type === 'on') {
        if (noteOnEvents.has(event.pitch)) {
          // End previous note on same pitch (monophonic handling)
          const prev = noteOnEvents.get(event.pitch);
          const duration = event.tick - prev.tick;
          if (duration > 0) {
            notes.push({
              pitch: event.pitch,
              startTick: prev.tick,
              endTick: event.tick,
              velocity: prev.velocity,
              duration: duration
            });
          }
        }
        noteOnEvents.set(event.pitch, event);
      } else if (event.type === 'off' && noteOnEvents.has(event.pitch)) {
        const noteOn = noteOnEvents.get(event.pitch);
        const duration = event.tick - noteOn.tick;
        if (duration > 0) {
          notes.push({
            pitch: event.pitch,
            startTick: noteOn.tick,
            endTick: event.tick,
            velocity: noteOn.velocity,
            duration
          });
        }
        noteOnEvents.delete(event.pitch);
      }
    });

    // Handle any remaining active notes
    if (noteOnEvents.size > 0) {
      const maxTick = events.length > 0 ? Math.max(...events.map(e => e.tick)) : 0;
      noteOnEvents.forEach((on, pitch) => {
        const duration = maxTick - on.tick;
        if (duration > 0) {
          notes.push({
            pitch,
            startTick: on.tick,
            endTick: maxTick,
            velocity: on.velocity,
            duration
          });
        }
      });
    }

    // Calculate bars and subdivisions using the updated formula
    const subdivisionsPerBar = this.calculateSubdivisions(timeSig);
    const ticksPerBar = ticksPerQuarter * timeSig.numerator * (4 / timeSig.denominator);
    const ticksPerSubdivision = ticksPerBar / subdivisionsPerBar;

    // Determine max bar
    const maxTick = Math.max(...notes.map(n => n.endTick), 0);
    const maxBar = Math.ceil((maxTick + 1) / ticksPerBar) || 1;

    // Pitch tracks: pitch -> bar -> array of symbols
    const pitchTracks = new Map();

    notes.forEach(note => {
      const pitchName = this.convertMidiToPitch(note.pitch);
      if (!pitchTracks.has(pitchName)) {
        pitchTracks.set(pitchName, new Map());
      }

      // Calculate start and end subdivisions (restore original precision)
      const startSubTotal = Math.floor(note.startTick / ticksPerSubdivision);
      const startOffsetTicks = note.startTick - startSubTotal * ticksPerSubdivision;
      const offsetPercent = Math.round((startOffsetTicks / ticksPerSubdivision) * 100);

      const endSubTotal = Math.floor((note.endTick - 0.0001) / ticksPerSubdivision);
      const endOffsetTicks = note.endTick - endSubTotal * ticksPerSubdivision;
      const endPercent = Math.round((endOffsetTicks / ticksPerSubdivision) * 100);

      // Place symbols for each subdivision covered
      for (let currentSubTotal = startSubTotal; currentSubTotal <= endSubTotal; currentSubTotal++) {
        const barNum = Math.floor(currentSubTotal / subdivisionsPerBar) + 1;
        const subInBar = currentSubTotal % subdivisionsPerBar;

        if (!pitchTracks.get(pitchName).has(barNum)) {
          pitchTracks.get(pitchName).set(barNum, new Array(subdivisionsPerBar).fill('.'));
        }

        const barPattern = pitchTracks.get(pitchName).get(barNum);
        let symbol = '';

        if (currentSubTotal === startSubTotal) {
          // Start symbol - restore original rules
          symbol = 'X';

          // Add velocity only if not default (100)
          if (note.velocity !== 100) {
            symbol += note.velocity;
          }

          // Add offset if note doesn't start at beginning of subdivision
          if (offsetPercent > 0) {
            symbol += `XR${offsetPercent}`;
          }

          // Handle single subdivision notes
          if (startSubTotal === endSubTotal) {
            // Note contained within single subdivision
            if (offsetPercent === 0 && endPercent < 100) {
              // Note from start, partial duration
              symbol += `E${endPercent}`;
            } else if (offsetPercent > 0 && endPercent < 100) {
              // Note with offset and doesn't reach end
              const duration = endPercent - offsetPercent;
              if (duration > 0) {
                symbol = `XO${offsetPercent}XE${duration}`;
              }
            }
            // If offsetPercent > 0 and endPercent == 100, use XR (already added)
          }
        } else {
          // Sustain symbol only for full subdivisions
          symbol = '~';

          // Add cutoff percentage if note ends mid-subdivision
          if (currentSubTotal === endSubTotal && endPercent < 100) {
            symbol += endPercent;
          }
        }

        // Only set non-empty symbols
        if (symbol && symbol !== '.') {
          barPattern[subInBar] = symbol;
        }
      }
    });

    // Generate text notation
    let textOutput = `Tempo: ${tempo}\n`;
    textOutput += `TimeSig: ${timeSig.numerator}/${timeSig.denominator}\n\n`;

    // Sort pitches from low to high
    const sortedPitches = Array.from(pitchTracks.keys()).sort((a, b) => {
      const aMidi = this.convertPitchToMidi(a);
      const bMidi = this.convertPitchToMidi(b);
      return aMidi - bMidi;
    });

    for (let barNum = 1; barNum <= maxBar; barNum++) {
      textOutput += `Bar: ${barNum}\n`;

      sortedPitches.forEach(pitch => {
        const barData = pitchTracks.get(pitch);
        if (barData && barData.has(barNum)) {
          const pattern = barData.get(barNum);
          const formattedPattern = this.formatPattern(pattern, timeSig);
          textOutput += `${pitch}: ${formattedPattern}\n`;
        }
      });

      if (barNum < maxBar) {
        textOutput += '\n';
      }
    }

    return textOutput;
  }

  static formatPattern(pattern, timeSig) {
    // Format pattern with proper beat groupings
    const subdivisionsPerBeat = 16 / timeSig.denominator;
    if (!Number.isInteger(subdivisionsPerBeat)) {
      return pattern.join(' ');
    }

    const formatted = [];
    for (let i = 0; i < pattern.length; i += subdivisionsPerBeat) {
      const group = pattern.slice(i, i + subdivisionsPerBeat);
      formatted.push(group.join(' '));
    }
    return formatted.join('   ');
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

  static processMidiFile(buffer) {
    try {
      const midiData = this.parseMidiFile(buffer);
      const textNotation = this.convertMidiToText(midiData);
      return { success: true, data: textNotation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = MidiToTextConverter;