// backend/src/utils/enhanced-prompt-builder.js

/**
 * Enhanced prompt builder with musical intelligence
 * Focuses on professional compositions without restrictive pattern detection
 */

const CORE_RULES = `CRITICAL MIDI FORMAT RULES - YOU MUST FOLLOW EXACTLY:

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

TOKEN SPACING (4/4 TIME):
C4: X . . .   X60 . . .   . . X80 .   . . . X
     |beat1|   |beat2|     |beat3|     |beat4|
- 4 groups of 4 tokens, 3 spaces between groups

SYMBOLS:
- X = note (velocity 100)
- X[1-127] = velocity-specific note
- . = rest, ~ = sustain (separate token)
- XR[n] = right offset, XL[n] = left offset
- XE[n] = early cutoff, XO[n]XE[m] = positioned note

OUTPUT RULES:
- NO voice labels, NO markdown, NO explanations
- ONLY valid MIDI notation`;

function extractRelevantBars(midiText, maxBars = 50) {
  if (!midiText) return '';
  
  const lines = midiText.split('\n');
  const result = [];
  let barCount = 0;
  let inMetadata = true;

  for (const line of lines) {
    if (line.startsWith('Tempo:') || line.startsWith('TimeSig:') || line.startsWith('Key:') || line.startsWith('Legato:')) {
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

function buildEnhancedPrompt(userPrompt, length, examples = null, editMode = false, originalContent = null, referenceGuidance = '') {
  // Get musical complexity guidance
  const complexityGuidance = analyzeMusicalComplexity(userPrompt);
  
  // EDIT MODE
  if (editMode && originalContent) {
    const totalBars = (originalContent.match(/Bar:/g) || []).length;
    const contextBars = Math.min(totalBars, 50);
    const context = extractRelevantBars(originalContent, contextBars);
    
    return `${CORE_RULES}

PROFESSIONAL EDITING TASK: "${userPrompt}"

${complexityGuidance}

ORIGINAL CONTENT (${contextBars} of ${totalBars} bars):
${context}

${referenceGuidance ? `REFERENCE STYLE: ${referenceGuidance}` : ''}

CRITICAL MUSICAL REQUIREMENTS:
- ENHANCE musical quality significantly
- ADD sophisticated harmonic and melodic elements
- CREATE emotional depth and development
- USE professional composition techniques

EDITED MIDI OUTPUT (${totalBars} bars):`;
  }

  // GENERATION MODE - Enhanced for professional results
  let prompt = `${CORE_RULES}

PROFESSIONAL COMPOSITION REQUEST: "${userPrompt}"

BARS REQUIRED: ${length} bars

${complexityGuidance}

${referenceGuidance ? `REFERENCE STYLE: ${referenceGuidance}` : ''}`;

  // Add length-specific guidance
  if (length > 80) {
    prompt += `
EXTENDED COMPOSITION GUIDANCE (${length} bars):
- Create multi-movement structure with clear sections
- Develop themes across 30+ bar spans
- Use key changes and modulations for variety
- Build to emotional peaks and resolve gracefully
- Maintain musical coherence across the entire piece`;
  } else if (length > 40) {
    prompt += `
MEDIUM COMPOSITION GUIDANCE (${length} bars):
- Create verse-chorus-bridge structure
- Develop 2-3 main musical themes
- Use dynamic contrast between sections
- Build intensity to a clear climax`;
  }

  // Professional guidance without restrictive pattern detection
  prompt += `
PROFESSIONAL COMPOSITION TECHNIQUES TO USE:
- Voice leading and counterpoint
- Harmonic tension and resolution
- Thematic development and variation
- Dynamic shaping and expression
- Rhythmic complexity and syncopation

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
  const contextBars = Math.min(totalBars, 50);
  const context = extractRelevantBars(originalContent, contextBars);
  const musicalEnhancement = getMusicalEnhancement(userPrompt);
  const complexityGuidance = analyzeMusicalComplexity(userPrompt);

  return `${CORE_RULES}

PROFESSIONAL MUSICAL EDITING: "${userPrompt}"

${complexityGuidance}

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

EDITED MIDI OUTPUT (${totalBars} bars of professional music):`;
}

module.exports = {
  buildEnhancedPrompt,
  buildMidiEditPrompt,
  extractRelevantBars,
  analyzeReferencePatterns,
  getMusicalEnhancement,
  analyzeMusicalComplexity
};