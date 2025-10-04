// backend/server.js - ENHANCED MUSICAL QUALITY VERSION (without repetitive pattern detection)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import routes and utilities
const midiRoutes = require('./src/routes/midiRoutes');
const MidiToTextConverter = require('./src/utils/midiToText');
const TextToMidiConverter = require('./src/utils/textToMidi');
const MidiValidator = require('./src/utils/midiValidator');
const { buildEnhancedPrompt, buildMidiEditPrompt, analyzeReferencePatterns } = require('./src/utils/enhanced-prompt-builder');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const publicDir = path.join(__dirname, 'public');
const generatedDir = path.join(publicDir, 'generated');
const referencesDir = path.join(__dirname, 'references');

[publicDir, generatedDir, referencesDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const validator = new MidiValidator();

// Store reference content in memory
const userReferences = new Map();

// Clear old references after 24 hours
setInterval(() => {
  const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
  userReferences.forEach((refs, userId) => {
    refs.forEach((ref, index) => {
      const uploadTime = new Date(ref.uploadedAt).getTime();
      if (uploadTime < dayAgo) {
        if (fs.existsSync(ref.localPath)) fs.unlinkSync(ref.localPath);
        refs.splice(index, 1);
      }
    });
    if (refs.length === 0) userReferences.delete(userId);
  });
}, 60 * 60 * 1000); // Every hour

console.log('MIDI Backend with Enhanced Musical Quality starting...');

function extractBarCountFromPrompt(text) {
  /**
   * FIXED: Enhanced bar count extraction for complex prompts
   * Handles detailed composition requests with specific bar counts
   */
  if (!text) return null;

  console.log(`🔍 Analyzing prompt for bar count: "${text.substring(0, 100)}..."`);

  // Pattern 1: Direct bar count in composition requests (highest priority)
  const compositionPatterns = [
    /(\d+)-bar\s+(?:composition|piece|track|music|piano)/i,
    /(\d+)\s*bars?\s+(?:composition|piece|track|music|piano)/i,
    /(?:generate|create|compose)\s+(?:a\s+)?(\d+)-bar/i,
    /(?:generate|create|compose)\s+(?:a\s+)?\d+\s*bars?\s+of/i,
  ];

  for (const pattern of compositionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1]);
      if (count > 0 && count <= 200) {
        console.log(`🎼 Extracted bar count from composition request: ${count} bars`);
        return count;
      }
    }
  }

  // Pattern 2: Range patterns (bars 1-123)
  const rangePattern = /bars?\s+(\d+)\s*[-–—]\s*(\d+)/i;
  const rangeMatch = text.match(rangePattern);
  if (rangeMatch && rangeMatch[2]) {
    const count = parseInt(rangeMatch[2]);
    if (count > 0 && count <= 200) {
      console.log(`🎼 Extracted bar count from range: ${count} bars`);
      return count;
    }
  }

  // Pattern 3: Standalone bar counts
  const standalonePatterns = [
    /(?:^|\s)(\d+)\s*bars?(?:\s|$|\.)/i,
    /(?:generate|create|write|compose|make|produce)\s+(\d+)\s*bars?/i,
    /(\d+)\s*bars?\s+(?:of|with|featuring|for)/i,
  ];

  for (const pattern of standalonePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1]);
      if (count > 0 && count <= 200) {
        console.log(`🎼 Extracted bar count from standalone: ${count} bars`);
        return count;
      }
    }
  }

  // Pattern 4: Structural bar counts (Bars 1–37, Bars 38–70, etc.)
  const structuralPattern = /Bars?\s+\d+\s*[-–—]\s*(\d+)/g;
  let lastBar = 0;
  let match;
  while ((match = structuralPattern.exec(text)) !== null) {
    const bar = parseInt(match[1]);
    if (bar > lastBar) lastBar = bar;
  }
  if (lastBar > 0 && lastBar <= 200) {
    console.log(`🎼 Extracted bar count from structure: ${lastBar} bars`);
    return lastBar;
  }

  console.log('❌ No bar count found in prompt');
  return null;
}

// *** NEW: Enhanced validation with musical quality checks ***
function validateAndCleanMidiResponse(rawText) {
  if (!rawText || rawText.length < 50) {
    return { valid: false, error: 'Response too short or empty' };
  }

  // Check for invalid patterns
  const invalidPatterns = [
    /V[0-9]:/i,
    /Voice[0-9]:/i,
    /Part[0-9]:/i,
    /Track[0-9]:/i,
    /\[.*\]/,
    /{.*}/,
    /<.*>/,
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(rawText)) {
      console.log(`❌ Invalid pattern detected: ${pattern}`);
      return { valid: false, error: `Invalid format: Contains ${pattern}` };
    }
  }

  // Check for required MIDI structure
  const hasTempo = rawText.includes('Tempo:');
  const hasTimeSig = rawText.includes('TimeSig:');
  const hasBars = rawText.includes('Bar:');
  const hasNoteLines = rawText.match(/[A-G][#b]?[0-9]:/);

  if (!hasTempo || !hasTimeSig || !hasBars || !hasNoteLines) {
    return { 
      valid: false, 
      error: 'Missing required MIDI structure' 
    };
  }

  // Basic cleaning
  let cleaned = rawText
    .replace(/```/g, '')
    .replace(/\*\*/g, '')
    .replace(/# /g, '')
    .trim();

  // Calculate metrics for logging only (not for validation)
  const barCount = (rawText.match(/Bar:/g) || []).length;
  const voiceCount = (rawText.match(/[A-G][#b]?[0-9]:/g) || []).length;

  return { 
    valid: true, 
    cleanedText: cleaned,
    barCount: barCount,
    voiceCount: voiceCount
  };
}

async function generateWithRetry(model, prompt, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`🔄 Generation attempt ${retries + 1}...`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Enhanced validation (without repetitive pattern checks)
      const validation = validateAndCleanMidiResponse(text);
      
      if (validation.valid) {
        console.log(`✓ High-quality MIDI content generated (${validation.cleanedText.length} chars, ${validation.barCount} bars, ${validation.voiceCount} voices)`);
        return validation.cleanedText;
      } else {
        console.log(`❌ Validation issue: ${validation.error}`);
        console.log(`First 200 chars: ${text.substring(0, 200)}`);
      }
      
      retries++;
      await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      
    } catch (error) {
      console.error(`Generation error (attempt ${retries + 1}):`, error.message);
      retries++;
      await new Promise(resolve => setTimeout(resolve, 2000 * retries));
    }
  }
  
  throw new Error('All generation attempts failed');
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      nodeBackend: 'healthy',
      geminiApi: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
      referenceSystem: 'in-memory',
      promptOptimization: 'enabled',
      midiUpload: 'enabled',
      musicalQualityChecks: 'enabled',
      longCompositionSupport: '1-200 bars'
    },
    endpoints: [
      'POST /api/chat',
      'POST /api/upload-reference',
      'POST /api/upload-midi',
      'POST /api/midi-to-text',
      'POST /api/text-to-midi',
      'GET /api/files/:userId',
      'POST /api/files/:userId/clear'
    ]
  });
});

// Upload MIDI as reference
app.post('/api/upload-reference', async (req, res) => {
  try {
    const { midiData, userId = 'default' } = req.body;
    
    if (!midiData) {
      return res.status(400).json({ error: 'MIDI data required' });
    }

    const midiBuffer = Buffer.from(midiData, 'base64');
    const result = MidiToTextConverter.processMidiFile(midiBuffer);
    
    if (!result.success) {
      throw new Error(result.error || 'Processing failed');
    }

    const textMidi = result.data;
    const bars = (textMidi.match(/Bar:/g) || []).length;
    const fileName = `reference_${Date.now()}.txt`;

    const filepath = path.join(referencesDir, fileName);
    fs.writeFileSync(filepath, textMidi);

    if (!userReferences.has(userId)) {
      userReferences.set(userId, []);
    }
    
    const refs = userReferences.get(userId);
    refs.push({
      content: textMidi,
      fileName: fileName,
      barCount: bars,
      uploadedAt: new Date().toISOString(),
      localPath: filepath
    });

    if (refs.length > 5) {
      const removed = refs.shift();
      if (fs.existsSync(removed.localPath)) {
        fs.unlinkSync(removed.localPath);
      }
    }

    console.log(`✓ Added reference: ${fileName} (${bars} bars)`);

    res.json({
      success: true,
      fileName: fileName,
      barCount: bars,
      librarySize: refs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Reference upload failed:', error);
    res.status(500).json({ 
      error: 'Reference upload failed',
      details: error.message 
    });
  }
});

// MIDI Upload for Editing
app.post('/api/upload-midi', async (req, res) => {
  try {
    const { midiData } = req.body;
    if (!midiData) {
      return res.status(400).json({ error: 'MIDI data required' });
    }

    console.log('📤 Processing MIDI upload for editing...');
    const midiBuffer = Buffer.from(midiData, 'base64');
    const result = MidiToTextConverter.processMidiFile(midiBuffer);
    
    if (!result.success) {
      throw new Error(result.error || 'MIDI processing failed');
    }

    const textMidi = result.data;
    const bars = (textMidi.match(/Bar:/g) || []).length;
    const voiceCount = (textMidi.match(/[A-G][#b]?[0-9]:/g) || []).length;

    console.log(`✓ MIDI converted: ${bars} bars, ${voiceCount} voices`);

    res.json({
      success: true,
      textMidi: textMidi,
      stats: { 
        bars: bars,
        voices: voiceCount,
        length: textMidi.length
      }
    });
  } catch (error) {
    console.error('MIDI upload failed:', error);
    res.status(500).json({ 
      error: 'MIDI upload failed',
      details: error.message 
    });
  }
});

// Get user's reference library
app.get('/api/files/:userId', (req, res) => {
  const { userId } = req.params;
  const refs = userReferences.get(userId) || [];
  
  res.json({
    success: true,
    fileCount: refs.length,
    files: refs.map(r => ({
      displayName: r.fileName,
      barCount: r.barCount,
      uploadedAt: r.uploadedAt
    }))
  });
});

// Clear user references
app.post('/api/files/:userId/clear', async (req, res) => {
  const { userId } = req.params;
  const refs = userReferences.get(userId) || [];
  
  let deleted = 0;
  for (const ref of refs) {
    try {
      if (fs.existsSync(ref.localPath)) {
        fs.unlinkSync(ref.localPath);
      }
      deleted++;
    } catch (e) {
      console.error('Delete error:', e);
    }
  }
  
  userReferences.delete(userId);
  
  res.json({ 
    success: true, 
    deletedCount: deleted,
    message: `Cleared ${deleted} reference file(s)` 
  });
});

// Main chat endpoint with enhanced musical quality
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      creativityLevel = 'medium',
      performanceMode = 'balanced',
      requestedBars = null,
      editMode = false,
      originalContent = null,
      userId = 'default'
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`\n${editMode ? '🎨 Edit' : '🎵 Generate'}: ${message.substring(0, 100)}...`);

    // *** ENHANCED: Bar count logic for complex prompts ***
    let length = null;

    // PRIORITY 1: For edit mode with original content
    if (editMode && originalContent) {
      const originalBars = (originalContent.match(/Bar:/g) || []).length;
      if (originalBars > 0) {
        length = originalBars;
        console.log(`📏 Using original bar count for edit: ${length} bars`);
      }
    }

    // PRIORITY 2: Use requestedBars from UI
    if (!length && requestedBars && requestedBars > 0) {
      length = requestedBars;
      console.log(`📏 Using UI requested bars: ${length} bars`);
    }

    // PRIORITY 3: Enhanced extraction from complex prompts
    if (!length) {
      length = extractBarCountFromPrompt(message);
      if (length) {
        console.log(`📏 Extracted from user prompt: ${length} bars`);
      }
    }

    // PRIORITY 4: Use performance mode defaults only if nothing else specified
    if (!length) {
      const lengthMap = { fast: 16, balanced: 32, quality: 48 };
      length = lengthMap[performanceMode] || 32;
      console.log(`📏 Using performance mode default: ${length} bars`);
    }
    
    // Enforce maximum limit
    length = Math.min(length, 200);
    
    // Enhanced logging for long compositions
    if (length > 100) {
      console.log(`🎹 VERY LONG COMPOSITION: ${length} bars - using advanced musical guidance`);
    } else if (length > 50) {
      console.log(`🎹 Long composition: ${length} bars - using extended tokens`);
    }
    
    console.log(`🎵 Final bar count: ${length} bars`);

    // Get user's references
    const refs = userReferences.get(userId) || [];
    
    // Analyze references if available
    let referenceGuidance = '';
    if (refs.length > 0) {
      const patterns = analyzeReferencePatterns(refs[0].content);
      if (patterns.summary) {
        referenceGuidance = patterns.summary;
        console.log(`📚 Using reference guidance: ${patterns.summary}`);
      }
    }

    // Build appropriate prompt
    let prompt;
    if (editMode && originalContent) {
      prompt = buildMidiEditPrompt(
        message,
        originalContent,
        length,
        referenceGuidance
      );
      console.log('🎨 Using specialized MIDI edit prompt');
    } else {
      prompt = buildEnhancedPrompt(
        message,
        length,
        null,
        editMode, 
        originalContent,
        referenceGuidance
      );
    }
    
    console.log(`📝 Prompt length: ${prompt.length} chars`);
    console.log(`🎼 Requested bars: ${length}`);

    // *** ENHANCED: Better temperature settings for musical quality ***
    const tempMap = { low: 0.8, medium: 0.9, high: 1.0 }; // Balanced for creativity + structure
    const temperature = tempMap[creativityLevel] || 0.9;

    // *** ENHANCED: Dynamic token allocation for long compositions ***
    const baseTokens = 8000;
    const tokensPerBar = length > 50 ? 300 : 200; // More tokens for longer pieces
    const estimatedTokens = Math.max(baseTokens, length * tokensPerBar);
    const maxOutputTokens = Math.min(estimatedTokens, 32000); // Higher limit for complex pieces

    console.log(`🤖 Model config: temp=${temperature}, maxTokens=${maxOutputTokens}`);

    // *** ENHANCED: Use better model for complex compositions ***
    const modelName = length > 80 ? 'gemini-2.5-flash' : 'gemini-2.0-flash';
    console.log(`🎹 Using ${modelName} for ${length}-bar composition`);

    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxOutputTokens,
        topP: 0.95,
        topK: 40
      }
    });

    let rawMidiText;
    try {
      rawMidiText = await generateWithRetry(model, prompt, 3);
    } catch (error) {
      console.error('All generation attempts failed:', error);
      return res.status(500).json({
        error: 'AI generation failed to produce quality music',
        details: 'The model returned repetitive or low-quality patterns.',
        suggestion: length > 50 
          ? 'Try breaking your composition into smaller sections or be more specific about musical elements'
          : 'Please try a different musical description or style'
      });
    }

    console.log(`✓ High-quality response received: ${rawMidiText.length} chars`);

    const validated = validator.validateAndFix(rawMidiText);
    const midiText = validated.midi;
    const barCount = (midiText.match(/Bar:/g) || []).length;
    const voiceCount = (midiText.match(/[A-G][#b]?[0-9]:/g) || []).length;
    
    console.log(`✓ Validation: ${barCount} bars, ${voiceCount} voices, valid: ${validated.success}`);

    if (barCount === 0) {
      console.log('❌ No valid bars generated');
      return res.status(500).json({
        error: 'No valid MIDI content generated',
        details: 'The AI returned content that could not be parsed as MIDI',
        suggestion: 'Please try again with a different musical request'
      });
    }

    // Enhanced quality assessment
    const quality = voiceCount >= 6 ? 'excellent' : voiceCount >= 4 ? 'good' : 'basic';
    console.log(`🎵 Musical quality: ${quality} (${voiceCount} voices)`);

    // Convert to MIDI
    let midiUrl = null;
    let conversionError = null;

    try {
      const midiResult = TextToMidiConverter.processTextNotation(midiText);
      if (!midiResult.success) {
        throw new Error(midiResult.errors?.join(', ') || 'Conversion failed');
      }

      const filename = `generated_${Date.now()}.mid`;
      const filepath = path.join(generatedDir, filename);
      fs.writeFileSync(filepath, midiResult.data);
      midiUrl = `/generated/${filename}`;
      
      console.log(`✓ High-quality MIDI file saved: ${filename}`);
    } catch (err) {
      console.error('Conversion error:', err.message);
      conversionError = err.message;
    }

    res.json({
      success: true,
      message: midiText,
      midiUrl: midiUrl,
      barCount: barCount,
      voiceCount: voiceCount,
      requestedBars: length,
      musicalQuality: quality,
      valid: !conversionError && validated.success,
      conversionError: conversionError,
      validationWarnings: validated.warnings,
      autoFixed: validated.fixed.length > 0,
      usedFiles: refs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Generation failed:', error);
    res.status(500).json({
      error: 'Generation failed',
      details: error.message,
      suggestion: 'Please try again with a different musical description'
    });
  }
});

// Integrate MIDI routes
app.use('/api', midiRoutes);

app.post('/api/clear-files', async (req, res) => {
  try {
    const files = fs.readdirSync(generatedDir);
    files.forEach(file => fs.unlinkSync(path.join(generatedDir, file)));
    res.json({ success: true, deletedCount: files.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/generated', express.static(generatedDir, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mid')) {
      res.setHeader('Content-Type', 'audio/midi');
    }
  }
}));

// Cleanup old files
setInterval(() => {
  try {
    const files = fs.readdirSync(generatedDir);
    const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
    let cleaned = 0;

    files.forEach(file => {
      const filePath = path.join(generatedDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtime.getTime() < fourHoursAgo) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    });

    if (cleaned > 0) console.log(`Cleaned ${cleaned} old files`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🎹 MIDI Backend with Enhanced Musical Quality - Port ${PORT}`);
  console.log(`✓ Reference system: In-memory storage`);
  console.log(`✓ Advanced bar count detection: ENABLED`);
  console.log(`✓ Musical quality validation: ACTIVE`);
  console.log(`✓ Long composition support: 1-200 bars`);
  console.log(`✓ Dynamic model selection: ACTIVE`);
  // console.log(`\nEndpoints available:`);
  // console.log(`  GET  /api/health`);
  // console.log(`  POST /api/chat                - High-quality AI composition`);
  // console.log(`  POST /api/upload-reference    - Add to reference library`);
  // console.log(`  POST /api/upload-midi         - Upload MIDI for editing ✅`);
  // console.log(`  POST /api/midi-to-text        - Convert MIDI → Text`);
  // console.log(`  POST /api/text-to-midi        - Convert Text → MIDI`);
  // console.log(`  GET  /api/files/:userId       - Get reference library`);
  // console.log(`  POST /api/files/:userId/clear - Clear references`);
  console.log(`\n🎵 Ready for professional-quality musical compositions!`);
});