// backend/midi-converters.js (NEW FILE - Root level)
const MidiToTextConverter = require('./src/utils/midiToText');
const TextToMidiConverter = require('./src/utils/textToMidi');

const textToMidi = async (textMidiString) => {
  try {
    const result = TextToMidiConverter.processTextNotation(textMidiString);
    if (!result.success) {
      throw new Error(`MIDI conversion failed: ${result.errors?.join(', ') || 'Unknown error'}`);
    }
    return result.data;
  } catch (error) {
    throw new Error(`Failed to convert text to MIDI: ${error.message}`);
  }
};

const midiToText = async (midiBuffer) => {
  try {
    const result = MidiToTextConverter.processMidiFile(midiBuffer);
    if (!result.success) {
      throw new Error(`MIDI parsing failed: ${result.error || 'Unknown error'}`);
    }
    return result.data;
  } catch (error) {
    throw new Error(`Failed to convert MIDI to text: ${error.message}`);
  }
};

module.exports = { textToMidi, midiToText };

// ============================================

