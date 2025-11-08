// // backend/src/utils/midiValidator.js - Auto-correct Gemini output

// class MidiValidator {
//   constructor() {
//     this.timeSignatureSubdivisions = {
//       '4/4': 16,
//       '3/4': 12,
//       '2/4': 8,
//       '6/8': 12,
//       '12/8': 12
//     };
//   }

//   /**
//    * Main validation and auto-correction
//    */
//   validateAndFix(midiText) {
//     try {
//       console.log('Validating MIDI output...');
      
//       // Step 1: Extract clean MIDI only
//       let cleaned = this.extractMidiOnly(midiText);
      
//       // Step 2: Validate and extract metadata
//       const metadata = this.extractMetadata(cleaned);
//       if (!metadata.tempo || !metadata.timeSig) {
//         console.warn('Missing metadata, adding defaults');
//         cleaned = this.addMissingMetadata(cleaned, metadata);
//         metadata.tempo = metadata.tempo || 90;
//         metadata.timeSig = metadata.timeSig || '4/4';
//       }
      
//       // Step 3: Fix all bars
//       const fixed = this.fixAllBars(cleaned, metadata);
      
//       // Step 4: Final validation
//       const validation = this.finalValidate(fixed, metadata);
      
//       console.log('Validation complete:', validation);
      
//       return {
//         success: validation.valid,
//         midi: fixed,
//         warnings: validation.warnings,
//         fixed: validation.fixesApplied
//       };
      
//     } catch (error) {
//       console.error('Validation failed:', error);
//       return {
//         success: false,
//         midi: midiText,
//         warnings: [error.message],
//         fixed: []
//       };
//     }
//   }

//   /**
//    * Remove all non-MIDI content (explanations, comments, etc.)
//    */
//   extractMidiOnly(text) {
//     const lines = [];
//     const linesArray = text.split('\n');
    
//     for (let line of linesArray) {
//       line = line.trim();
      
//       // Skip empty lines
//       if (!line) continue;
      
//       // Skip explanations and comments
//       if (this.isExplanation(line)) continue;
      
//       // Keep valid MIDI lines
//       if (this.isValidMidiLine(line)) {
//         lines.push(line);
//       }
//     }
    
//     return lines.join('\n');
//   }

//   isExplanation(line) {
//     const explanationKeywords = [
//       'explanation', 'note:', 'here', 'this creates', 'this represents',
//       'example', 'description', 'analysis', '===', '---', '```'
//     ];
    
//     const lowerLine = line.toLowerCase();
//     return explanationKeywords.some(kw => lowerLine.includes(kw));
//   }

//   isValidMidiLine(line) {
//     // Valid MIDI lines start with these patterns
//     return (
//       line.startsWith('Tempo:') ||
//       line.startsWith('TimeSig:') ||
//       line.startsWith('Key:') ||
//       line.startsWith('Legato:') ||
//       line.startsWith('Bar:') ||
//       /^[A-G][#b]?-?\d+:/.test(line) // Note line: C4:, F#3:, etc.
//     );
//   }

//   /**
//    * Extract and validate metadata
//    */
//   extractMetadata(text) {
//     const metadata = {
//       tempo: null,
//       timeSig: null,
//       key: 'C'
//     };
    
//     const lines = text.split('\n');
    
//     for (const line of lines) {
//       if (line.startsWith('Tempo:')) {
//         const match = line.match(/Tempo:\s*(\d+)/);
//         if (match) metadata.tempo = parseInt(match[1]);
//       } else if (line.startsWith('TimeSig:')) {
//         const match = line.match(/TimeSig:\s*(\d+\/\d+)/);
//         if (match) metadata.timeSig = match[1];
//       } else if (line.startsWith('Key:')) {
//         const match = line.match(/Key:\s*([A-G][#b]?m?)/);
//         if (match) metadata.key = match[1];
//       }
//     }
    
//     return metadata;
//   }

//   addMissingMetadata(text, metadata) {
//     const lines = text.split('\n');
//     const metadataLines = [];
    
//     if (!metadata.tempo) {
//       metadataLines.push('Tempo: 90');
//     }
//     if (!metadata.timeSig) {
//       metadataLines.push('TimeSig: 4/4');
//     }
//     if (!metadata.key) {
//       metadataLines.push('Key: C');
//     }
    
//     // Insert at beginning
//     return metadataLines.join('\n') + '\n' + lines.join('\n');
//   }

//   /**
//    * Fix all bars to meet format requirements
//    */
//   fixAllBars(text, metadata) {
//     const lines = text.split('\n');
//     const fixedLines = [];
//     const expectedSubdivisions = this.timeSignatureSubdivisions[metadata.timeSig] || 16;
    
//     let currentBar = null;
//     let barNoteLines = [];
    
//     for (let i = 0; i < lines.length; i++) {
//       const line = lines[i].trim();
      
//       // Keep metadata lines
//       if (line.startsWith('Tempo:') || line.startsWith('TimeSig:') || 
//           line.startsWith('Key:') || line.startsWith('Legato:')) {
//         fixedLines.push(line);
//         continue;
//       }
      
//       // Bar declaration
//       if (line.startsWith('Bar:')) {
//         // Process previous bar
//         if (currentBar !== null && barNoteLines.length > 0) {
//           fixedLines.push(`Bar: ${currentBar}`);
//           barNoteLines.forEach(noteLine => {
//             fixedLines.push(this.fixNoteLine(noteLine, expectedSubdivisions, metadata.timeSig));
//           });
//         }
        
//         // Start new bar
//         const match = line.match(/Bar:\s*(\d+)/);
//         currentBar = match ? parseInt(match[1]) : (currentBar || 0) + 1;
//         barNoteLines = [];
//         continue;
//       }
      
//       // Note line
//       if (/:/.test(line)) {
//         barNoteLines.push(line);
//       }
//     }
    
//     // Process last bar
//     if (currentBar !== null && barNoteLines.length > 0) {
//       fixedLines.push(`Bar: ${currentBar}`);
//       barNoteLines.forEach(noteLine => {
//         fixedLines.push(this.fixNoteLine(noteLine, expectedSubdivisions, metadata.timeSig));
//       });
//     }
    
//     return fixedLines.join('\n');
//   }

//   /**
//    * Fix a single note line
//    */
//   fixNoteLine(line, expectedSubdivisions, timeSig) {
//     const [noteName, ...dataParts] = line.split(':');
//     const data = dataParts.join(':').trim();
    
//     // Split tokens
//     let tokens = data.split(/\s+/).filter(t => t.length > 0);
    
//     // Fix token count
//     if (tokens.length < expectedSubdivisions) {
//       // Pad with rests
//       while (tokens.length < expectedSubdivisions) {
//         tokens.push('.');
//       }
//     } else if (tokens.length > expectedSubdivisions) {
//       // Truncate
//       tokens = tokens.slice(0, expectedSubdivisions);
//     }
    
//     // Fix spacing based on time signature
//     const formatted = this.formatTokens(tokens, timeSig);
    
//     return `${noteName.trim()}:   ${formatted}`;
//   }

//   /**
//    * Format tokens with proper spacing
//    */
//   formatTokens(tokens, timeSig) {
//     if (timeSig === '4/4') {
//       // 4 groups of 4 tokens, separated by 3 spaces
//       const groups = [];
//       for (let i = 0; i < 4; i++) {
//         const group = tokens.slice(i * 4, (i + 1) * 4);
//         groups.push(group.join(' '));
//       }
//       return groups.join('   ');
//     } else if (timeSig === '3/4') {
//       // 3 groups of 4 tokens, separated by 3 spaces
//       const groups = [];
//       for (let i = 0; i < 3; i++) {
//         const group = tokens.slice(i * 4, (i + 1) * 4);
//         groups.push(group.join(' '));
//       }
//       return groups.join('   ');
//     } else {
//       // Single space between all tokens
//       return tokens.join(' ');
//     }
//   }

//   /**
//    * Final validation check
//    */
//   finalValidate(text, metadata) {
//     const warnings = [];
//     const fixesApplied = [];
//     const lines = text.split('\n');
    
//     const expectedSubdivisions = this.timeSignatureSubdivisions[metadata.timeSig] || 16;
    
//     // Check metadata
//     if (!metadata.tempo) warnings.push('Missing tempo');
//     if (!metadata.timeSig) warnings.push('Missing time signature');
    
//     // Check bars
//     let barCount = 0;
//     let noteLineCount = 0;
    
//     for (const line of lines) {
//       if (line.startsWith('Bar:')) {
//         barCount++;
//       } else if (/:/.test(line) && !line.startsWith('Tempo:') && 
//                  !line.startsWith('TimeSig:') && !line.startsWith('Key:')) {
//         noteLineCount++;
        
//         // Validate subdivision count
//         const data = line.split(':')[1];
//         if (data) {
//           const tokens = data.trim().split(/\s+/).filter(t => t.length > 0);
//           if (tokens.length !== expectedSubdivisions) {
//             warnings.push(`Line has ${tokens.length} tokens, expected ${expectedSubdivisions}`);
//           }
//         }
//       }
//     }
    
//     if (barCount === 0) warnings.push('No bars found');
//     if (noteLineCount === 0) warnings.push('No note lines found');
    
//     if (warnings.length > 0) {
//       fixesApplied.push('Auto-corrected format issues');
//     }
    
//     return {
//       valid: warnings.length === 0,
//       warnings: warnings,
//       fixesApplied: fixesApplied,
//       barCount: barCount,
//       noteLineCount: noteLineCount
//     };
//   }

//   /**
//    * Quick fix for common Gemini mistakes
//    */
//   quickFix(text) {
//     let fixed = text;
    
//     // Fix glued sustains: X80~ → X80 ~
//     fixed = fixed.replace(/([X\d]+)~/g, '$1 ~');
    
//     // Fix missing spaces in tokens
//     fixed = fixed.replace(/([X\d]+)([X\d]+)/g, '$1 $2');
    
//     // Remove multiple consecutive spaces (except beat separators)
//     fixed = fixed.replace(/\s{5,}/g, '   '); // Max 3 spaces
    
//     // Fix note names: ensure colon has space after
//     fixed = fixed.replace(/([A-G][#b]?\d+):([^\s])/g, '$1:   $2');
    
//     return fixed;
//   }
// }

// module.exports = MidiValidator;















// backend/src/utils/midiValidator.js

class MidiValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixed = [];
  }

  /**
   * Expand compression notation for validation
   */
  expandCompression(symbols) {
    const expanded = [];
    
    for (const symbol of symbols) {
      const compressionMatch = symbol.match(/^(.+?)\((\d+)\)$/);
      
      if (compressionMatch) {
        const baseSymbol = compressionMatch[1];
        const count = parseInt(compressionMatch[2]);
        
        for (let i = 0; i < count; i++) {
          expanded.push(baseSymbol);
        }
      } else {
        expanded.push(symbol);
      }
    }
    
    return expanded;
  }

  /**
   * Calculate expected subdivisions for time signature
   */
  calculateSubdivisions(timeSig) {
    const match = timeSig.match(/(\d+)\/(\d+)/);
    if (!match) return 16; // Default to 4/4
    
    const numerator = parseInt(match[1]);
    const denominator = parseInt(match[2]);
    return numerator * (16 / denominator);
  }

  /**
   * Validate and fix MIDI text notation
   */
  validateAndFix(midiText) {
    this.errors = [];
    this.warnings = [];
    this.fixed = [];

    if (!midiText || midiText.length < 50) {
      return {
        success: false,
        midi: midiText,
        errors: ['MIDI text too short or empty'],
        warnings: [],
        fixed: []
      };
    }

    let lines = midiText.split('\n');
    let fixedLines = [];
    
    // Extract metadata
    let tempo = null;
    let timeSig = null;
    let key = null;
    let expectedSubdivisions = 16;

    // First pass: collect metadata
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('Tempo:')) {
        const match = trimmed.match(/Tempo:\s*(\d+)/);
        if (match) tempo = parseInt(match[1]);
      } else if (trimmed.startsWith('TimeSig:')) {
        const match = trimmed.match(/TimeSig:\s*(\d+\/\d+)/);
        if (match) {
          timeSig = match[1];
          expectedSubdivisions = this.calculateSubdivisions(timeSig);
        }
      } else if (trimmed.startsWith('Key:')) {
        const match = trimmed.match(/Key:\s*([A-G][#b]?)/i);
        if (match) key = match[1];
      }
    }

    // Add missing metadata
    if (!tempo) {
      fixedLines.push('Tempo: 120');
      this.fixed.push('Added missing Tempo: 120');
    }
    if (!timeSig) {
      fixedLines.push('TimeSig: 4/4');
      this.fixed.push('Added missing TimeSig: 4/4');
      expectedSubdivisions = 16;
    }
    if (!key) {
      fixedLines.push('Key: C');
      this.fixed.push('Added missing Key: C');
    }

    // Second pass: validate and fix content
    let currentBar = null;
    let inMetadata = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        if (!inMetadata) fixedLines.push('');
        continue;
      }

      // Handle metadata
      if (trimmed.startsWith('Tempo:') || trimmed.startsWith('TimeSig:') || trimmed.startsWith('Key:')) {
        if (inMetadata) {
          fixedLines.push(trimmed);
        }
        continue;
      }

      // Handle bar markers
      if (trimmed.startsWith('Bar:')) {
        if (inMetadata) {
          inMetadata = false;
          if (fixedLines.length > 0 && fixedLines[fixedLines.length - 1] !== '') {
            fixedLines.push('');
          }
        }
        
        const match = trimmed.match(/Bar:\s*(\d+)/);
        if (match) {
          currentBar = parseInt(match[1]);
          fixedLines.push(trimmed);
        } else {
          this.warnings.push(`Invalid bar marker at line ${i + 1}: ${trimmed}`);
        }
        continue;
      }

      // Handle note lines
      if (currentBar && trimmed.match(/^[A-G][#b]?-?\d+:/i)) {
        const [pitch, ...rest] = trimmed.split(':');
        const pattern = rest.join(':').trim();
        
        // Validate pitch format
        if (!pitch.match(/^[A-G][#b]?-?\d+$/i)) {
          this.warnings.push(`Invalid pitch format at line ${i + 1}: ${pitch}`);
          continue;
        }

        // Parse and validate symbols
        const symbols = pattern.split(/\s+/).filter(s => s);
        
        if (symbols.length === 0) {
          this.warnings.push(`Empty pattern for ${pitch} in bar ${currentBar}`);
          continue;
        }

        // Expand compression for validation
        const expanded = this.expandCompression(symbols);
        
        // Check subdivision count
        if (expanded.length !== expectedSubdivisions) {
          this.warnings.push(
            `Bar ${currentBar} ${pitch}: Expected ${expectedSubdivisions} subdivisions (when expanded), got ${expanded.length}`
          );
          
          // Try to fix: pad with rests or truncate
          if (expanded.length < expectedSubdivisions) {
            const needed = expectedSubdivisions - expanded.length;
            symbols.push(`.(${needed})`);
            this.fixed.push(`Bar ${currentBar} ${pitch}: Added .(${needed}) to reach ${expectedSubdivisions} subdivisions`);
          } else {
            // Truncate excess
            const excess = expanded.length - expectedSubdivisions;
            this.fixed.push(`Bar ${currentBar} ${pitch}: Removed ${excess} excess subdivisions`);
            const correctedExpanded = expanded.slice(0, expectedSubdivisions);
            
            // Re-compress for output
            const recompressed = this.compressPattern(correctedExpanded);
            fixedLines.push(`${pitch}: ${recompressed.join(' ')}`);
            continue;
          }
        }

        // Validate individual symbols
        const validatedSymbols = symbols.map(sym => this.validateSymbol(sym, currentBar, pitch));
        fixedLines.push(`${pitch}: ${validatedSymbols.join(' ')}`);
        continue;
      }

      // Handle voice labels (should be removed)
      if (trimmed.match(/^(V\d+|Voice\d+):/i)) {
        this.warnings.push(`Removed invalid voice label at line ${i + 1}: ${trimmed}`);
        continue;
      }

      // Handle markdown/formatting (should be removed)
      if (trimmed.match(/^[#\-=*_]/) || trimmed.includes('```')) {
        this.warnings.push(`Removed formatting at line ${i + 1}`);
        continue;
      }

      // If we get here, it's unrecognized content
      if (!inMetadata) {
        this.warnings.push(`Unrecognized content at line ${i + 1}: ${trimmed.substring(0, 50)}`);
      }
    }

    const finalMidi = fixedLines.join('\n');
    
    return {
      success: this.errors.length === 0,
      midi: finalMidi,
      errors: this.errors,
      warnings: this.warnings,
      fixed: this.fixed
    };
  }

  /**
   * Validate individual symbol
   */
  validateSymbol(symbol, barNum, pitch) {
    // Check for compression notation
    const compressionMatch = symbol.match(/^(.+?)\((\d+)\)$/);
    if (compressionMatch) {
      const baseSymbol = compressionMatch[1];
      const count = parseInt(compressionMatch[2]);
      
      if (count < 1) {
        this.warnings.push(`Bar ${barNum} ${pitch}: Invalid compression count ${count}, fixing to 1`);
        return `${baseSymbol}(1)`;
      }
      
      // Validate the base symbol
      return `${this.validateBaseSymbol(baseSymbol, barNum, pitch)}(${count})`;
    }
    
    return this.validateBaseSymbol(symbol, barNum, pitch);
  }

  /**
   * Validate base symbol (non-compressed)
   */
  validateBaseSymbol(symbol, barNum, pitch) {
    const upper = symbol.toUpperCase();
    
    // Rest symbol
    if (symbol === '.') return '.';
    
    // Sustain symbol
    if (upper.match(/^~(\d+)?$/)) {
      const match = upper.match(/^~(\d+)?$/);
      if (match[1]) {
        const cutoff = parseInt(match[1]);
        if (cutoff < 0 || cutoff > 100) {
          this.warnings.push(`Bar ${barNum} ${pitch}: Sustain cutoff ${cutoff} out of range, clamping to 0-100`);
          return `~${Math.max(0, Math.min(100, cutoff))}`;
        }
      }
      return symbol;
    }
    
    // Note-on symbol with modifiers
    if (upper.startsWith('X')) {
      let validated = 'X';
      let remaining = upper.substring(1);
      
      // Extract velocity
      const velMatch = remaining.match(/^(\d+)/);
      if (velMatch) {
        let vel = parseInt(velMatch[1]);
        if (vel < 1 || vel > 127) {
          this.warnings.push(`Bar ${barNum} ${pitch}: Velocity ${vel} out of range, clamping to 1-127`);
          vel = Math.max(1, Math.min(127, vel));
        }
        validated += vel;
        remaining = remaining.substring(velMatch[1].length);
      }
      
      // Check for right offset (XR)
      const xrMatch = remaining.match(/XR(\d+)/);
      if (xrMatch) {
        let offset = parseInt(xrMatch[1]);
        if (offset < 0 || offset > 100) {
          this.warnings.push(`Bar ${barNum} ${pitch}: XR offset ${offset} out of range, clamping to 0-100`);
          offset = Math.max(0, Math.min(100, offset));
        }
        validated += `XR${offset}`;
        remaining = remaining.replace(/XR\d+/, '');
      }
      
      // Check for left offset (XL)
      const xlMatch = remaining.match(/XL(\d+)/);
      if (xlMatch) {
        let offset = parseInt(xlMatch[1]);
        if (offset < 0 || offset > 100) {
          this.warnings.push(`Bar ${barNum} ${pitch}: XL offset ${offset} out of range, clamping to 0-100`);
          offset = Math.max(0, Math.min(100, offset));
        }
        validated += `XL${offset}`;
        remaining = remaining.replace(/XL\d+/, '');
      }
      
      // Check for positioned rest (XO...XE...)
      const xoMatch = remaining.match(/^XO(\d+)XE(\d+)/);
      if (xoMatch) {
        let restOffset = parseInt(xoMatch[1]);
        let duration = parseInt(xoMatch[2]);
        
        if (restOffset < 0 || restOffset > 100) {
          this.warnings.push(`Bar ${barNum} ${pitch}: XO offset ${restOffset} out of range, clamping to 0-100`);
          restOffset = Math.max(0, Math.min(100, restOffset));
        }
        if (duration < 0 || duration > 100) {
          this.warnings.push(`Bar ${barNum} ${pitch}: XE duration ${duration} out of range, clamping to 0-100`);
          duration = Math.max(0, Math.min(100, duration));
        }
        if (restOffset + duration > 100) {
          this.warnings.push(`Bar ${barNum} ${pitch}: XO${restOffset}XE${duration} exceeds 100%, adjusting`);
          duration = 100 - restOffset;
        }
        
        return `XO${restOffset}XE${duration}`;
      }
      
      // Check for duration (XE or just E)
      const eMatch = remaining.match(/E(\d+)/) || remaining.match(/^(\d+)$/);
      if (eMatch) {
        let duration = parseInt(eMatch[1]);
        if (duration < 0 || duration > 100) {
          this.warnings.push(`Bar ${barNum} ${pitch}: Duration ${duration} out of range, clamping to 0-100`);
          duration = Math.max(0, Math.min(100, duration));
        }
        validated += `E${duration}`;
        remaining = remaining.replace(/E?\d+/, '');
      }
      
      return validated;
    }
    
    // If nothing matched, warn and return as-is
    this.warnings.push(`Bar ${barNum} ${pitch}: Unrecognized symbol ${symbol}`);
    return symbol;
  }

  /**
   * Compress pattern (same logic as midiToText)
   */
  compressPattern(pattern) {
    const compressed = [];
    let i = 0;
    
    while (i < pattern.length) {
      const current = pattern[i];
      let count = 1;
      
      while (i + count < pattern.length && pattern[i + count] === current) {
        count++;
      }
      
      if (count >= 3) {
        compressed.push(`${current}(${count})`);
      } else {
        for (let j = 0; j < count; j++) {
          compressed.push(current);
        }
      }
      
      i += count;
    }
    
    return compressed;
  }

  /**
   * Quick validation check without fixing
   */
  quickValidate(midiText) {
    const hasTempo = midiText.includes('Tempo:');
    const hasTimeSig = midiText.includes('TimeSig:');
    const hasKey = midiText.includes('Key:');
    const hasBars = midiText.includes('Bar:');
    const hasNotes = /[A-G][#b]?-?\d+:/.test(midiText);
    
    return {
      valid: hasTempo && hasTimeSig && hasKey && hasBars && hasNotes,
      hasTempo,
      hasTimeSig,
      hasKey,
      hasBars,
      hasNotes
    };
  }

  /**
   * Count bars in MIDI text
   */
  countBars(midiText) {
    const matches = midiText.match(/Bar:/g);
    return matches ? matches.length : 0;
  }

  /**
   * Count voices (unique pitch lines)
   */
  countVoices(midiText) {
    const matches = midiText.match(/[A-G][#b]?-?\d+:/g);
    return matches ? matches.length : 0;
  }

  /**
   * Extract metadata
   */
  extractMetadata(midiText) {
    const tempo = midiText.match(/Tempo:\s*(\d+)/)?.[1] || null;
    const timeSig = midiText.match(/TimeSig:\s*(\d+\/\d+)/)?.[1] || null;
    const key = midiText.match(/Key:\s*([A-G][#b]?)/i)?.[1] || null;
    
    return {
      tempo: tempo ? parseInt(tempo) : null,
      timeSig,
      key
    };
  }

  /**
   * Check if text uses compression
   */
  hasCompression(midiText) {
    return /\(\d+\)/.test(midiText);
  }

  /**
   * Calculate compression ratio
   */
  calculateCompressionRatio(midiText) {
    const lines = midiText.split('\n');
    let totalCompressed = 0;
    let totalExpanded = 0;
    
    for (const line of lines) {
      if (line.match(/^[A-G][#b]?-?\d+:/i)) {
        const [, pattern] = line.split(':');
        const symbols = pattern.trim().split(/\s+/).filter(s => s);
        
        totalCompressed += symbols.length;
        totalExpanded += this.expandCompression(symbols).length;
      }
    }
    
    if (totalExpanded === 0) return 0;
    return ((1 - totalCompressed / totalExpanded) * 100).toFixed(1);
  }
}

module.exports = MidiValidator;