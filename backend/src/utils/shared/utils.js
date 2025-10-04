//backend/src/utils/shared/utils.js
const noteMap = {
  'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3,
  'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8,
  'A': 9, 'A#': 10, 'BB': 10, 'B': 11
};

const midiToNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function convertMidiToPitch(midiNumber) {
  const adjustedMidi = midiNumber;
  const octave = Math.floor(adjustedMidi / 12) - 1;
  const noteIndex = adjustedMidi % 12;
  return midiToNote[noteIndex] + octave;
}

function convertPitchToMidi(pitch) {
  const match = pitch.match(/^([A-G][#Bb]?)(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid pitch format: ${pitch}`);
  }
  const [, noteName, octave] = match;
  const noteNameUpper = noteName.toUpperCase();
  const octaveValue = parseInt(octave);
  if (!(noteNameUpper in noteMap)) {
    throw new Error(`Unknown note name: ${noteNameUpper}`);
  }
  if (octaveValue < 0 || octaveValue > 9) {
    throw new Error(`Octave ${octaveValue} out of range (0-9)`);
  }
  const noteValue = noteMap[noteNameUpper];
  const midi = (octaveValue + 1) * 12 + noteValue;
  if (midi < 0 || midi > 127) {
    throw new Error(`Pitch ${pitch} out of MIDI range (0-127)`);
  }
  return midi;
}

function validateVelocity(velocity) {
  return Math.max(1, Math.min(127, Math.round(velocity)));
}

module.exports = { noteMap, midiToNote, convertMidiToPitch, convertPitchToMidi, validateVelocity };