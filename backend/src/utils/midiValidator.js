// backend/src/utils/midiValidator.js - Auto-correct Gemini output

class MidiValidator {
  constructor() {
    this.timeSignatureSubdivisions = {
      '4/4': 16,
      '3/4': 12,
      '2/4': 8,
      '6/8': 12,
      '12/8': 12
    };
  }

  /**
   * Main validation and auto-correction
   */
  validateAndFix(midiText) {
    try {
      console.log('Validating MIDI output...');
      
      // Step 1: Extract clean MIDI only
      let cleaned = this.extractMidiOnly(midiText);
      
      // Step 2: Validate and extract metadata
      const metadata = this.extractMetadata(cleaned);
      if (!metadata.tempo || !metadata.timeSig) {
        console.warn('Missing metadata, adding defaults');
        cleaned = this.addMissingMetadata(cleaned, metadata);
        metadata.tempo = metadata.tempo || 90;
        metadata.timeSig = metadata.timeSig || '4/4';
      }
      
      // Step 3: Fix all bars
      const fixed = this.fixAllBars(cleaned, metadata);
      
      // Step 4: Final validation
      const validation = this.finalValidate(fixed, metadata);
      
      console.log('Validation complete:', validation);
      
      return {
        success: validation.valid,
        midi: fixed,
        warnings: validation.warnings,
        fixed: validation.fixesApplied
      };
      
    } catch (error) {
      console.error('Validation failed:', error);
      return {
        success: false,
        midi: midiText,
        warnings: [error.message],
        fixed: []
      };
    }
  }

  /**
   * Remove all non-MIDI content (explanations, comments, etc.)
   */
  extractMidiOnly(text) {
    const lines = [];
    const linesArray = text.split('\n');
    
    for (let line of linesArray) {
      line = line.trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Skip explanations and comments
      if (this.isExplanation(line)) continue;
      
      // Keep valid MIDI lines
      if (this.isValidMidiLine(line)) {
        lines.push(line);
      }
    }
    
    return lines.join('\n');
  }

  isExplanation(line) {
    const explanationKeywords = [
      'explanation', 'note:', 'here', 'this creates', 'this represents',
      'example', 'description', 'analysis', '===', '---', '```'
    ];
    
    const lowerLine = line.toLowerCase();
    return explanationKeywords.some(kw => lowerLine.includes(kw));
  }

  isValidMidiLine(line) {
    // Valid MIDI lines start with these patterns
    return (
      line.startsWith('Tempo:') ||
      line.startsWith('TimeSig:') ||
      line.startsWith('Key:') ||
      line.startsWith('Legato:') ||
      line.startsWith('Bar:') ||
      /^[A-G][#b]?-?\d+:/.test(line) // Note line: C4:, F#3:, etc.
    );
  }

  /**
   * Extract and validate metadata
   */
  extractMetadata(text) {
    const metadata = {
      tempo: null,
      timeSig: null,
      key: 'C'
    };
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('Tempo:')) {
        const match = line.match(/Tempo:\s*(\d+)/);
        if (match) metadata.tempo = parseInt(match[1]);
      } else if (line.startsWith('TimeSig:')) {
        const match = line.match(/TimeSig:\s*(\d+\/\d+)/);
        if (match) metadata.timeSig = match[1];
      } else if (line.startsWith('Key:')) {
        const match = line.match(/Key:\s*([A-G][#b]?m?)/);
        if (match) metadata.key = match[1];
      }
    }
    
    return metadata;
  }

  addMissingMetadata(text, metadata) {
    const lines = text.split('\n');
    const metadataLines = [];
    
    if (!metadata.tempo) {
      metadataLines.push('Tempo: 90');
    }
    if (!metadata.timeSig) {
      metadataLines.push('TimeSig: 4/4');
    }
    if (!metadata.key) {
      metadataLines.push('Key: C');
    }
    
    // Insert at beginning
    return metadataLines.join('\n') + '\n' + lines.join('\n');
  }

  /**
   * Fix all bars to meet format requirements
   */
  fixAllBars(text, metadata) {
    const lines = text.split('\n');
    const fixedLines = [];
    const expectedSubdivisions = this.timeSignatureSubdivisions[metadata.timeSig] || 16;
    
    let currentBar = null;
    let barNoteLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Keep metadata lines
      if (line.startsWith('Tempo:') || line.startsWith('TimeSig:') || 
          line.startsWith('Key:') || line.startsWith('Legato:')) {
        fixedLines.push(line);
        continue;
      }
      
      // Bar declaration
      if (line.startsWith('Bar:')) {
        // Process previous bar
        if (currentBar !== null && barNoteLines.length > 0) {
          fixedLines.push(`Bar: ${currentBar}`);
          barNoteLines.forEach(noteLine => {
            fixedLines.push(this.fixNoteLine(noteLine, expectedSubdivisions, metadata.timeSig));
          });
        }
        
        // Start new bar
        const match = line.match(/Bar:\s*(\d+)/);
        currentBar = match ? parseInt(match[1]) : (currentBar || 0) + 1;
        barNoteLines = [];
        continue;
      }
      
      // Note line
      if (/:/.test(line)) {
        barNoteLines.push(line);
      }
    }
    
    // Process last bar
    if (currentBar !== null && barNoteLines.length > 0) {
      fixedLines.push(`Bar: ${currentBar}`);
      barNoteLines.forEach(noteLine => {
        fixedLines.push(this.fixNoteLine(noteLine, expectedSubdivisions, metadata.timeSig));
      });
    }
    
    return fixedLines.join('\n');
  }

  /**
   * Fix a single note line
   */
  fixNoteLine(line, expectedSubdivisions, timeSig) {
    const [noteName, ...dataParts] = line.split(':');
    const data = dataParts.join(':').trim();
    
    // Split tokens
    let tokens = data.split(/\s+/).filter(t => t.length > 0);
    
    // Fix token count
    if (tokens.length < expectedSubdivisions) {
      // Pad with rests
      while (tokens.length < expectedSubdivisions) {
        tokens.push('.');
      }
    } else if (tokens.length > expectedSubdivisions) {
      // Truncate
      tokens = tokens.slice(0, expectedSubdivisions);
    }
    
    // Fix spacing based on time signature
    const formatted = this.formatTokens(tokens, timeSig);
    
    return `${noteName.trim()}:   ${formatted}`;
  }

  /**
   * Format tokens with proper spacing
   */
  formatTokens(tokens, timeSig) {
    if (timeSig === '4/4') {
      // 4 groups of 4 tokens, separated by 3 spaces
      const groups = [];
      for (let i = 0; i < 4; i++) {
        const group = tokens.slice(i * 4, (i + 1) * 4);
        groups.push(group.join(' '));
      }
      return groups.join('   ');
    } else if (timeSig === '3/4') {
      // 3 groups of 4 tokens, separated by 3 spaces
      const groups = [];
      for (let i = 0; i < 3; i++) {
        const group = tokens.slice(i * 4, (i + 1) * 4);
        groups.push(group.join(' '));
      }
      return groups.join('   ');
    } else {
      // Single space between all tokens
      return tokens.join(' ');
    }
  }

  /**
   * Final validation check
   */
  finalValidate(text, metadata) {
    const warnings = [];
    const fixesApplied = [];
    const lines = text.split('\n');
    
    const expectedSubdivisions = this.timeSignatureSubdivisions[metadata.timeSig] || 16;
    
    // Check metadata
    if (!metadata.tempo) warnings.push('Missing tempo');
    if (!metadata.timeSig) warnings.push('Missing time signature');
    
    // Check bars
    let barCount = 0;
    let noteLineCount = 0;
    
    for (const line of lines) {
      if (line.startsWith('Bar:')) {
        barCount++;
      } else if (/:/.test(line) && !line.startsWith('Tempo:') && 
                 !line.startsWith('TimeSig:') && !line.startsWith('Key:')) {
        noteLineCount++;
        
        // Validate subdivision count
        const data = line.split(':')[1];
        if (data) {
          const tokens = data.trim().split(/\s+/).filter(t => t.length > 0);
          if (tokens.length !== expectedSubdivisions) {
            warnings.push(`Line has ${tokens.length} tokens, expected ${expectedSubdivisions}`);
          }
        }
      }
    }
    
    if (barCount === 0) warnings.push('No bars found');
    if (noteLineCount === 0) warnings.push('No note lines found');
    
    if (warnings.length > 0) {
      fixesApplied.push('Auto-corrected format issues');
    }
    
    return {
      valid: warnings.length === 0,
      warnings: warnings,
      fixesApplied: fixesApplied,
      barCount: barCount,
      noteLineCount: noteLineCount
    };
  }

  /**
   * Quick fix for common Gemini mistakes
   */
  quickFix(text) {
    let fixed = text;
    
    // Fix glued sustains: X80~ → X80 ~
    fixed = fixed.replace(/([X\d]+)~/g, '$1 ~');
    
    // Fix missing spaces in tokens
    fixed = fixed.replace(/([X\d]+)([X\d]+)/g, '$1 $2');
    
    // Remove multiple consecutive spaces (except beat separators)
    fixed = fixed.replace(/\s{5,}/g, '   '); // Max 3 spaces
    
    // Fix note names: ensure colon has space after
    fixed = fixed.replace(/([A-G][#b]?\d+):([^\s])/g, '$1:   $2');
    
    return fixed;
  }
}

module.exports = MidiValidator;
