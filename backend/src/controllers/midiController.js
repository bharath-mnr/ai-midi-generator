//backend/src/controllers/midiController.js
const MidiToTextConverter = require('../utils/midiToText');
const TextToMidiConverter = require('../utils/textToMidi');

const midiController = {
  async midiToText(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No MIDI file uploaded' });
      }
      
      const buffer = req.file.buffer;
      const result = MidiToTextConverter.processMidiFile(buffer);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      
      res.json({ text: result.data });
    } catch (error) {
      next(error);
    }
  },

  async textToMidi(req, res, next) {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text notation is required' });
      }
      
      const result = TextToMidiConverter.processTextNotation(text);
      
      if (!result.success) {
        return res.status(400).json({ error: result.errors.join(', ') });
      }
      
      // Set appropriate headers for file download
      res.setHeader('Content-Type', 'audio/midi');
      res.setHeader('Content-Disposition', 'attachment; filename=converted.mid');
      
      // Send the MIDI file buffer
      res.send(result.data);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = midiController;


// // midi-converters.js - Wrapper for your existing converters
// const MidiToTextConverter = require('./src/utils/midiToText');
// const TextToMidiConverter = require('./src/utils/textToMidi');

// /**
//  * Convert text-based MIDI to binary MIDI file
//  * @param {string} textMidiString - Text notation from RAG
//  * @returns {Buffer} - MIDI file buffer
//  */
// const textToMidi = async (textMidiString) => {
//   try {
//     // Use your existing TextToMidiConverter
//     const result = TextToMidiConverter.processTextNotation(textMidiString);
    
//     if (!result.success) {
//       throw new Error(`MIDI conversion failed: ${result.errors?.join(', ') || 'Unknown error'}`);
//     }
    
//     return result.data; // This is already a Buffer from your code
//   } catch (error) {
//     console.error('Text to MIDI conversion error:', error);
//     throw new Error(`Failed to convert text to MIDI: ${error.message}`);
//   }
// };

// /**
//  * Convert MIDI file buffer to text notation
//  * @param {Buffer} midiBuffer - Binary MIDI data
//  * @returns {string} - Text-based MIDI notation
//  */
// const midiToText = async (midiBuffer) => {
//   try {
//     // Use your existing MidiToTextConverter
//     const result = MidiToTextConverter.processMidiFile(midiBuffer);
    
//     if (!result.success) {
//       throw new Error(`MIDI parsing failed: ${result.error || 'Unknown error'}`);
//     }
    
//     return result.data; // This is the text notation string
//   } catch (error) {
//     console.error('MIDI to text conversion error:', error);
//     throw new Error(`Failed to convert MIDI to text: ${error.message}`);
//   }
// };

// module.exports = { textToMidi, midiToText };