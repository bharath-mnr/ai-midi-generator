const { convertAudioToMidi } = require('./src/utils/converter');
const fs = require('fs');
const path = require('path');

// Usage: node index.js path/to/input.wav path/to/output.mid
const [,, inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error('Usage: node index.js input.wav output.mid');
  process.exit(1);
}

const audioBuffer = fs.readFileSync(path.resolve(inputPath));
convertAudioToMidi(audioBuffer)
  .then(midiBuffer => {
    fs.writeFileSync(path.resolve(outputPath), midiBuffer);
    console.log(`MIDI saved to ${outputPath}`);
  })
  .catch(error => console.error('Error:', error.message));