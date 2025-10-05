// backend/src/utils/enhanced-prompt-builder.js

/**
 * Enhanced prompt builder with musical intelligence
 * Optimized for long compositions (up to 500 bars)
 */

function getCoreRules(length) {
  return `CRITICAL MIDI FORMAT RULES - YOU MUST FOLLOW EXACTLY:

METADATA (REQUIRED):
Tempo: [VALUE]
TimeSig: [NUM/DEN]
Key: [KEY]

BAR STRUCTURE:
Bar: [NUMBER]
[NOTE_NAME]: [TOKENS_WITH_PROPER_SPACING]

NOTE NAME FORMAT:
- MUST be: [A-G][#b]?[0-9] (C4, G3, A#4, Bb3)
- NEVER use voice labels (V1, V2, Voice1, etc.)

SUBDIVISION COUNTS (CRITICAL):
- 4/4 time = 16 subdivisions per line
- 3/4 time = 12 subdivisions per line
- 2/4 time = 8 subdivisions per line
- 6/8 time = 12 subdivisions per line
- 12/8 time = 12 subdivisions per line

SPACING PATTERNS:
4/4 TIME (16 subdivisions):
C4: X . . .   X60 . . .   . . X80 .   . . . X
     |beat1|   |beat2|     |beat3|     |beat4|
- 4 groups of 4 tokens, 3 spaces between groups

3/4 TIME (12 subdivisions):
C4: X . . .   X60 . . .   . . X80 .
     |beat1|   |beat2|     |beat3|
- 3 groups of 4 tokens, 3 spaces between groups

OTHER TIME SIGNATURES (2/4, 6/8, 12/8):
- Single space between all tokens
- No beat grouping required

SYMBOLS:
- X = note (velocity 100)
- X[1-127] = velocity-specific note (range: 1-127 only)
- . = rest, ~ = sustain (MUST be separate token with space)
- XR[n] = right offset (0-100), XL[n] = left offset (0-100)
- XE[n] = early cutoff (0-100), XO[n]XE[m] = positioned note

STACKING RULES:
- Maximum 1 full note (X, X[vel], X[vel]XR[n]) per subdivision
- Multiple short notes (XE) allowed if sum ≤ 100%
- Sustain MUST have space: "X80 ~" NOT "X80~"
- No time overlaps allowed

OUTPUT RULES:
- NO voice labels, NO markdown, NO explanations
- ONLY valid MIDI notation
- Generate ALL ${length} bars requested
- Count carefully: Bar: 1 through Bar: ${length}`;
}

function extractRelevantBars(midiText, maxBars = 100) {
  if (!midiText) return '';
  
  const lines = midiText.split('\n');
  const result = [];
  let barCount = 0;
  let inMetadata = true;

  for (const line of lines) {
    // Always include metadata
    if (line.startsWith('Tempo:') || line.startsWith('TimeSig:') || 
        line.startsWith('Key:') || line.startsWith('Legato:')) {
      result.push(line);
      continue;
    }

    if (line.trim().startsWith('Bar:')) {
      if (inMetadata) inMetadata = false;
      barCount++;
      if (maxBars > 0 && barCount > maxBars) break;
    }

    if (!inMetadata) {
      result.push(line);
    }
  }

  return result.join('\n');
}

function analyzeMusicalComplexity(userPrompt) {
  /**
   * Analyzes user prompt for musical complexity requirements
   * Prevents boring arpeggios and simple patterns
   */
  const promptLower = userPrompt.toLowerCase();
  
  let complexityGuidance = '';
  
  // Detect professional composition requests
  if (promptLower.includes('ludovico') || promptLower.includes('einaudi') || 
      promptLower.includes('primavera') || promptLower.includes('cinematic') ||
      promptLower.includes('emotional') || promptLower.includes('professional')) {
    complexityGuidance = `
PROFESSIONAL COMPOSITION REQUIREMENTS:
- Create sophisticated harmonic progressions (I-iv-ii-V-I, etc.)
- Use expressive dynamics and phrasing
- Develop melodic themes across multiple bars
- Incorporate chord extensions (7ths, 9ths, suspensions)
- Create emotional tension and release
- Use varied rhythm and syncopation`;
  }
  
  // Detect structure requests
  if (promptLower.includes('bars') && (promptLower.includes('-') || promptLower.includes('–'))) {
    complexityGuidance += `
STRUCTURAL DEVELOPMENT:
- Create clear musical sections with distinct characters
- Build intensity gradually across the composition
- Use contrasting textures between sections
- Develop motifs and transform them throughout`;
  }
  
  // Detect piano-specific requests
  if (promptLower.includes('piano')) {
    complexityGuidance += `
PIANO TEXTURE GUIDANCE:
- Use both hands with complementary roles
- Create rich harmonic foundation in left hand
- Develop lyrical melody in right hand
- Use the full piano register effectively
- Incorporate pedal-like sustains for resonance`;
  }

  return complexityGuidance;
}

function getLongCompositionGuidance(length) {
  /**
   * Provides specific structural guidance based on composition length
   */
  if (length <= 32) {
    return `
SHORT COMPOSITION (${length} bars):
- Create a complete musical idea with introduction, development, and conclusion
- Use 2-3 distinct musical phrases
- Maintain consistent energy and mood`;
  } 
  
  if (length <= 64) {
    return `
MEDIUM COMPOSITION (${length} bars):
- Use A-B-A or verse-chorus structure
- Develop 2-3 main themes with variations
- Create dynamic contrast between sections (soft/loud, sparse/dense)
- Build to a clear climax around bar ${Math.floor(length * 0.7)}`;
  } 
  
  if (length <= 128) {
    return `
EXTENDED COMPOSITION (${length} bars):
- Create multi-section form (A-B-C-A or similar)
- Develop 3-4 distinct themes with variations
- Use transitions and modulations between sections
- Build multiple smaller climaxes leading to main climax at bar ${Math.floor(length * 0.75)}
- Include contrasting moods: contemplative, intense, peaceful
- Develop ideas gradually across 20-30 bar sections`;
  }
  
  if (length <= 256) {
    return `
LONG COMPOSITION (${length} bars):
- Create multi-movement structure with 4-5 distinct sections
- Each section should be 30-50 bars with its own character
- Use key changes and tempo variations (mark clearly)
- Develop themes across the entire piece with callbacks and transformations
- Build emotional arc: introduction → development → crisis → resolution
- Include dramatic moments, quiet interludes, and powerful climaxes
- Main climax around bar ${Math.floor(length * 0.75)}, then graceful resolution`;
  }
  
  // Over 256 bars - epic composition
  return `
EPIC COMPOSITION (${length} bars):
- Create symphonic multi-movement structure with 5-7 major sections
- Each movement should span 50-80 bars with distinct character
- Use multiple key changes, tempo changes, and time signature variations
- Develop 5-6 major themes that evolve throughout
- Create clear musical narrative with multiple dramatic arcs
- Include various moods: heroic, melancholic, triumphant, mysterious, peaceful
- Build to multiple climaxes, with the greatest at bar ${Math.floor(length * 0.8)}
- Final section (last 30-50 bars) should provide satisfying resolution
- Use recurring motifs to create unity across the entire work`;
}

function buildEnhancedPrompt(userPrompt, length, examples = null, editMode = false, originalContent = null, referenceGuidance = '') {
  // Get musical complexity guidance
  const complexityGuidance = analyzeMusicalComplexity(userPrompt);
  const lengthGuidance = getLongCompositionGuidance(length);
  const coreRules = getCoreRules(length);
  
  // EDIT MODE
  if (editMode && originalContent) {
    const totalBars = (originalContent.match(/Bar:/g) || []).length;
    const contextBars = Math.min(totalBars, 100); // Increased from 50 to 100
    const context = extractRelevantBars(originalContent, contextBars);
    
    return `${coreRules}

PROFESSIONAL EDITING TASK: "${userPrompt}"

${complexityGuidance}

${lengthGuidance}

ORIGINAL CONTENT (first ${contextBars} of ${totalBars} bars):
${context}

${referenceGuidance ? `REFERENCE STYLE: ${referenceGuidance}` : ''}

CRITICAL MUSICAL REQUIREMENTS:
- ENHANCE musical quality significantly
- ADD sophisticated harmonic and melodic elements
- CREATE emotional depth and development
- USE professional composition techniques
- MAINTAIN continuity with original structure
- GENERATE ALL ${totalBars} bars

EDITED MIDI OUTPUT (${totalBars} bars):`;
  }

  // GENERATION MODE - Enhanced for professional results
  let prompt = `${coreRules}

PROFESSIONAL COMPOSITION REQUEST: "${userPrompt}"

BARS REQUIRED: ${length} bars (YOU MUST GENERATE ALL ${length} BARS)

${complexityGuidance}

${lengthGuidance}

${referenceGuidance ? `REFERENCE STYLE: ${referenceGuidance}` : ''}`;

  // Professional guidance without restrictive pattern detection
  prompt += `
PROFESSIONAL COMPOSITION TECHNIQUES TO USE:
- Voice leading and counterpoint
- Harmonic tension and resolution (use ii-V-I, modal interchange, borrowed chords)
- Thematic development and variation
- Dynamic shaping and expression (pp to ff)
- Rhythmic complexity and syncopation
- Melodic contour and phrasing
- Textural contrast (sparse vs. dense)

CRITICAL: Generate EXACTLY ${length} bars. Count carefully and ensure Bar: ${length} appears.

MIDI OUTPUT (${length} bars of professional-quality music):`;

  return prompt;
}

function analyzeReferencePatterns(midiText) {
  if (!midiText) {
    return {
      avgVelocity: 80,
      density: '3-4',
      hasSustains: false,
      hasArticulations: false,
      summary: ''
    };
  }

  const lines = midiText.split('\n');
  
  const velocities = [];
  const notePattern = /X(\d+)/g;
  for (const line of lines) {
    let match;
    while ((match = notePattern.exec(line)) !== null) {
      velocities.push(parseInt(match[1]));
    }
  }

  const avgVelocity = velocities.length > 0 
    ? Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length)
    : 80;

  const barLines = lines.filter(l => l.includes(': ') && !l.startsWith('Tempo') && !l.startsWith('TimeSig') && !l.startsWith('Key'));
  const barCounts = lines.filter(l => l.startsWith('Bar:')).length;
  const density = barCounts > 0 ? (barLines.length / barCounts).toFixed(1) : '3-4';

  const hasSustains = midiText.includes('~');
  const hasArticulations = midiText.includes('XR') || midiText.includes('XE') || midiText.includes('XO') || midiText.includes('XL');

  const tempoMatch = midiText.match(/Tempo:\s*(\d+)/);
  const tempo = tempoMatch ? parseInt(tempoMatch[1]) : null;

  const keyMatch = midiText.match(/Key:\s*([A-G][#b]?)/);
  const key = keyMatch ? keyMatch[1] : null;

  const timeSigMatch = midiText.match(/TimeSig:\s*(\d+\/\d+)/);
  const timeSig = timeSigMatch ? timeSigMatch[1] : null;

  let summary = `${density} voices/bar, velocity ~${avgVelocity}`;
  if (hasSustains) summary += ', uses sustains';
  if (hasArticulations) summary += ', articulated notes';
  if (tempo) summary += `, tempo ${tempo}`;
  if (key) summary += `, key ${key}`;
  if (timeSig) summary += `, time ${timeSig}`;

  return {
    avgVelocity,
    density,
    hasSustains,
    hasArticulations,
    tempo,
    key,
    timeSig,
    summary
  };
}

function getMusicalEnhancement(userPrompt) {
  const promptLower = userPrompt.toLowerCase();
  
  let enhancement = '';
  
  if (promptLower.includes('harmony') || promptLower.includes('chord') || promptLower.includes('layer')) {
    enhancement = `
ADVANCED HARMONY ENHANCEMENT:
- Add sophisticated inner voices and counter-melodies
- Use chord extensions (7ths, 9ths, 11ths, 13ths)
- Incorporate suspensions and appoggiaturas
- Create smooth voice leading between chords
- Use secondary dominants and modal mixture`;
  }
  
  if (promptLower.includes('emotional') || promptLower.includes('sad') || promptLower.includes('dark') || promptLower.includes('cinematic')) {
    enhancement += `
EMOTIONAL DEPTH ENHANCEMENT:
- Use expressive dynamics (crescendo, decrescendo)
- Incorporate rubato-like timing variations
- Build tension with dissonance and resolve beautifully
- Use the full emotional range of the instrument
- Create storytelling through music`;
  }
  
  if (promptLower.includes('complex') || promptLower.includes('rich') || promptLower.includes('detailed') || promptLower.includes('professional')) {
    enhancement += `
COMPLEXITY ENHANCEMENT:
- Develop multiple interweaving melodic lines
- Use sophisticated rhythm patterns and polyrhythms
- Create thematic development across the composition
- Incorporate advanced compositional techniques
- Ensure every element serves musical purpose`;
  }
  
  return enhancement;
}

function buildMidiEditPrompt(userPrompt, originalContent, length, referenceGuidance = '') {
  const totalBars = (originalContent.match(/Bar:/g) || []).length;
  const contextBars = Math.min(totalBars, 100); // Increased from 50 to 100
  const context = extractRelevantBars(originalContent, contextBars);
  const musicalEnhancement = getMusicalEnhancement(userPrompt);
  const complexityGuidance = analyzeMusicalComplexity(userPrompt);
  const lengthGuidance = getLongCompositionGuidance(totalBars);
  const coreRules = getCoreRules(totalBars);

  return `${coreRules}

PROFESSIONAL MUSICAL EDITING: "${userPrompt}"

${complexityGuidance}

${lengthGuidance}

ORIGINAL COMPOSITION (first ${contextBars} of ${totalBars} bars):
${context}

MUSICAL ENHANCEMENT GOALS:
${musicalEnhancement}

${referenceGuidance ? `REFERENCE STYLE: ${referenceGuidance}` : ''}

PROFESSIONAL EDITING REQUIREMENTS:
- TRANSFORM the music to professional quality
- ADD sophisticated harmonic and melodic complexity
- CREATE emotional depth and musical storytelling
- DEVELOP themes and variations throughout
- ENSURE every bar contributes to musical narrative
- USE professional composition techniques
- MAINTAIN structural coherence across all ${totalBars} bars
- GENERATE ALL ${totalBars} bars (count carefully!)

CRITICAL: You MUST output all ${totalBars} bars. Start from Bar: 1 and end at Bar: ${totalBars}.

EDITED MIDI OUTPUT (${totalBars} bars of professional music):`;
}

module.exports = {
  buildEnhancedPrompt,
  buildMidiEditPrompt,
  extractRelevantBars,
  analyzeReferencePatterns,
  getMusicalEnhancement,
  analyzeMusicalComplexity,
  getLongCompositionGuidance
};