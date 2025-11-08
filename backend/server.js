// // // backend/server.js - STATELESS VERSION (Optimized for long compositions)

// // require('dotenv').config();
// // const express = require('express');
// // const cors = require('cors');
// // const path = require('path');
// // const fs = require('fs');
// // const { GoogleGenerativeAI } = require('@google/generative-ai');

// // // Import routes and utilities
// // const midiRoutes = require('./src/routes/midiRoutes');
// // const MidiToTextConverter = require('./src/utils/midiToText');
// // const TextToMidiConverter = require('./src/utils/textToMidi');
// // const MidiValidator = require('./src/utils/midiValidator');
// // const { buildEnhancedPrompt, buildMidiEditPrompt } = require('./src/utils/enhanced-prompt-builder');

// // const app = express();

// // // Increased limits for long compositions
// // app.use(cors());
// // app.use(express.json({ limit: '100mb' }));
// // app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// // const publicDir = path.join(__dirname, 'public');
// // const generatedDir = path.join(publicDir, 'generated');

// // [publicDir, generatedDir].forEach(dir => {
// //   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// // });

// // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// // const validator = new MidiValidator();

// // console.log('MIDI Backend - Stateless Mode (Long Composition Support) starting...');

// // function extractBarCountFromPrompt(text) {
// //   if (!text) return null;

// //   const compositionPatterns = [
// //     /(\d+)-bar\s+(?:composition|piece|track|music|piano)/i,
// //     /(\d+)\s*bars?\s+(?:composition|piece|track|music|piano)/i,
// //     /(?:generate|create|compose)\s+(?:a\s+)?(\d+)-bar/i,
// //   ];

// //   for (const pattern of compositionPatterns) {
// //     const match = text.match(pattern);
// //     if (match && match[1]) {
// //       const count = parseInt(match[1]);
// //       if (count > 0 && count <= 500) return count; // Increased max to 500
// //     }
// //   }

// //   const rangePattern = /bars?\s+(\d+)\s*[-–—]\s*(\d+)/i;
// //   const rangeMatch = text.match(rangePattern);
// //   if (rangeMatch && rangeMatch[2]) {
// //     const count = parseInt(rangeMatch[2]);
// //     if (count > 0 && count <= 500) return count; // Increased max to 500
// //   }

// //   return null;
// // }

// // function validateAndCleanMidiResponse(rawText) {
// //   if (!rawText || rawText.length < 50) {
// //     return { valid: false, error: 'Response too short or empty' };
// //   }

// //   const hasTempo = rawText.includes('Tempo:');
// //   const hasTimeSig = rawText.includes('TimeSig:');
// //   const hasBars = rawText.includes('Bar:');
// //   const hasNoteLines = rawText.match(/[A-G][#b]?[0-9]:/);

// //   if (!hasTempo || !hasTimeSig || !hasBars || !hasNoteLines) {
// //     return { valid: false, error: 'Missing required MIDI structure' };
// //   }

// //   let cleaned = rawText
// //     .replace(/```/g, '')
// //     .replace(/\*\*/g, '')
// //     .replace(/# /g, '')
// //     .trim();

// //   const barCount = (rawText.match(/Bar:/g) || []).length;
// //   const voiceCount = (rawText.match(/[A-G][#b]?[0-9]:/g) || []).length;

// //   return { 
// //     valid: true, 
// //     cleanedText: cleaned,
// //     barCount: barCount,
// //     voiceCount: voiceCount
// //   };
// // }

// // // Fixed: Only retry with the SAME model, don't switch models here
// // async function generateWithRetry(model, modelName, prompt, maxRetries = 2) {
// //   let retries = 0;
  
// //   while (retries < maxRetries) {
// //     try {
// //       console.log(`🔄 ${modelName} attempt ${retries + 1}/${maxRetries}...`);
// //       const result = await model.generateContent(prompt);
// //       const response = await result.response;
// //       const text = response.text();
      
// //       const validation = validateAndCleanMidiResponse(text);
      
// //       if (validation.valid) {
// //         console.log(`✓ Valid MIDI content generated (${validation.barCount} bars, ${validation.voiceCount} voices)`);
// //         return validation.cleanedText;
// //       }
      
// //       console.log(`✗ Validation issue: ${validation.error}`);
// //       retries++;
      
// //       if (retries < maxRetries) {
// //         await new Promise(resolve => setTimeout(resolve, 1500 * retries));
// //       }
      
// //     } catch (error) {
// //       console.error(`Generation error (attempt ${retries + 1}):`, error.message);
// //       retries++;
      
// //       if (retries < maxRetries) {
// //         await new Promise(resolve => setTimeout(resolve, 1500 * retries));
// //       }
// //     }
// //   }
  
// //   throw new Error(`Failed after ${maxRetries} attempts with ${modelName}`);
// // }

// // // Fixed: 2 attempts with gemini-2.5-flash, then 1 final attempt with gemini-2.0-flash
// // async function generateWithFallback(prompt, length, temperature, maxOutputTokens) {
// //   // Attempt 1 & 2: gemini-2.5-flash
// //   try {
// //     console.log(`🎹 Trying gemini-2.5-flash (2 attempts)...`);
    
// //     const model25 = genAI.getGenerativeModel({ 
// //       model: 'gemini-2.5-flash',
// //       generationConfig: {
// //         temperature: temperature,
// //         maxOutputTokens: maxOutputTokens,
// //         topP: 0.95,
// //         topK: 40
// //       }
// //     });
    
// //     const result = await generateWithRetry(model25, 'gemini-2.5-flash', prompt, 2);
// //     console.log(`✓ Success with gemini-2.5-flash`);
// //     return result;
    
// //   } catch (error) {
// //     console.error(`✗ gemini-2.5-flash failed after 2 attempts: ${error.message}`);
// //     console.log(`🔄 Final fallback to gemini-2.0-flash (1 attempt)...`);
// //     await new Promise(resolve => setTimeout(resolve, 2000));
// //   }

// //   // Attempt 3: gemini-2.0-flash (final fallback)
// //   try {
// //     const model20 = genAI.getGenerativeModel({ 
// //       model: 'gemini-2.0-flash',
// //       generationConfig: {
// //         temperature: temperature,
// //         maxOutputTokens: maxOutputTokens,
// //         topP: 0.95,
// //         topK: 40
// //       }
// //     });
    
// //     const result = await generateWithRetry(model20, 'gemini-2.0-flash', prompt, 1);
// //     console.log(`✓ Success with gemini-2.0-flash (fallback)`);
// //     return result;
    
// //   } catch (error) {
// //     console.error(`✗ gemini-2.0-flash failed: ${error.message}`);
// //     throw new Error('All 3 attempts failed (2x gemini-2.5-flash + 1x gemini-2.0-flash)');
// //   }
// // }

// // app.get('/api/health', (req, res) => {
// //   res.json({
// //     status: 'healthy',
// //     mode: 'stateless',
// //     storage: 'none',
// //     maxBars: 500,
// //     maxPayload: '100mb',
// //     services: {
// //       nodeBackend: 'healthy',
// //       geminiApi: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
// //     }
// //   });
// // });

// // // Upload MIDI for editing (temporary, converted but not stored)
// // app.post('/api/upload-midi', async (req, res) => {
// //   try {
// //     const { midiData } = req.body;
// //     if (!midiData) {
// //       return res.status(400).json({ error: 'MIDI data required' });
// //     }

// //     console.log('📤 Processing MIDI upload for editing...');
// //     const midiBuffer = Buffer.from(midiData, 'base64');
// //     const result = MidiToTextConverter.processMidiFile(midiBuffer);
    
// //     if (!result.success) {
// //       throw new Error(result.error || 'MIDI processing failed');
// //     }

// //     const textMidi = result.data;
// //     const bars = (textMidi.match(/Bar:/g) || []).length;
// //     const voiceCount = (textMidi.match(/[A-G][#b]?[0-9]:/g) || []).length;

// //     console.log(`✓ MIDI converted: ${bars} bars, ${voiceCount} voices`);

// //     // Return converted text immediately, don't store
// //     res.json({
// //       success: true,
// //       textMidi: textMidi,
// //       stats: { 
// //         bars: bars,
// //         voices: voiceCount,
// //         length: textMidi.length
// //       }
// //     });
// //   } catch (error) {
// //     console.error('MIDI upload failed:', error);
// //     res.status(500).json({ 
// //       error: 'MIDI upload failed',
// //       details: error.message 
// //     });
// //   }
// // });

// // // Main chat endpoint - completely stateless, optimized for long compositions
// // app.post('/api/chat', async (req, res) => {
// //   try {
// //     const {
// //       message,
// //       creativityLevel = 'medium',
// //       performanceMode = 'balanced',
// //       requestedBars = null,
// //       editMode = false,
// //       originalContent = null
// //     } = req.body;

// //     if (!message || !message.trim()) {
// //       return res.status(400).json({ error: 'Message is required' });
// //     }

// //     console.log(`\n${editMode ? '🎨 Edit' : '🎵 Generate'}: ${message.substring(0, 100)}...`);

// //     // Determine bar count
// //     let length = null;

// //     if (editMode && originalContent) {
// //       const originalBars = (originalContent.match(/Bar:/g) || []).length;
// //       if (originalBars > 0) {
// //         length = originalBars;
// //       }
// //     }

// //     if (!length && requestedBars && requestedBars > 0) {
// //       length = requestedBars;
// //     }

// //     if (!length) {
// //       length = extractBarCountFromPrompt(message);
// //     }

// //     if (!length) {
// //       const lengthMap = { fast: 16, balanced: 32, quality: 48 };
// //       length = lengthMap[performanceMode] || 32;
// //     }
    
// //     length = Math.min(length, 500); // Increased from 200 to 500
// //     console.log(`🎵 Bar count: ${length} bars`);

// //     // Build prompt with appropriate context for long compositions
// //     let prompt;
// //     if (editMode && originalContent) {
// //       // For edits, extract more context for long pieces
// //       const contextBars = length > 100 ? 100 : (length > 50 ? 75 : 50);
// //       console.log(`📝 Edit mode: using ${contextBars} bars of context`);
// //       prompt = buildMidiEditPrompt(message, originalContent, length, '');
// //     } else {
// //       prompt = buildEnhancedPrompt(message, length, null, false, null, '');
// //     }

// //     const tempMap = { low: 0.8, medium: 0.9, high: 1.0 };
// //     const temperature = tempMap[creativityLevel] || 0.9;

// //     // Dynamic token calculation for long compositions
// //     const baseTokens = 10000;
// //     let tokensPerBar;
    
// //     if (length <= 50) {
// //       tokensPerBar = 200;
// //     } else if (length <= 100) {
// //       tokensPerBar = 250;
// //     } else if (length <= 200) {
// //       tokensPerBar = 300;
// //     } else {
// //       tokensPerBar = 350; // For very long compositions
// //     }
    
// //     const estimatedTokens = Math.max(baseTokens, length * tokensPerBar);
// //     const maxOutputTokens = Math.min(estimatedTokens, 65536); // Gemini 2.5 supports up to 65k tokens

// //     console.log(`🎹 Starting generation (${length} bars, ~${maxOutputTokens} tokens)`);
// //     console.log(`📊 Retry strategy: 2x gemini-2.5-flash → 1x gemini-2.0-flash`);

// //     let rawMidiText;
// //     try {
// //       rawMidiText = await generateWithFallback(prompt, length, temperature, maxOutputTokens);
// //     } catch (error) {
// //       console.error('All attempts failed:', error);
// //       return res.status(500).json({
// //         error: 'AI generation failed',
// //         details: 'All 3 attempts failed (2x gemini-2.5-flash + 1x gemini-2.0-flash)'
// //       });
// //     }

// //     const validated = validator.validateAndFix(rawMidiText);
// //     const midiText = validated.midi;
// //     const barCount = (midiText.match(/Bar:/g) || []).length;
// //     const voiceCount = (midiText.match(/[A-G][#b]?[0-9]:/g) || []).length;

// //     if (barCount === 0) {
// //       return res.status(500).json({
// //         error: 'No valid MIDI content generated'
// //       });
// //     }

// //     console.log(`✓ Generated: ${barCount} bars, ${voiceCount} voices, ${midiText.length} chars`);

// //     // Convert to MIDI file (temporary)
// //     let midiUrl = null;
// //     let conversionError = null;

// //     try {
// //       const midiResult = TextToMidiConverter.processTextNotation(midiText);
// //       if (!midiResult.success) {
// //         throw new Error(midiResult.errors?.join(', ') || 'Conversion failed');
// //       }

// //       const filename = `generated_${Date.now()}.mid`;
// //       const filepath = path.join(generatedDir, filename);
// //       fs.writeFileSync(filepath, midiResult.data);
// //       midiUrl = `/generated/${filename}`;
      
// //       console.log(`✓ MIDI file saved: ${filename} (${midiResult.data.length} bytes)`);
// //     } catch (err) {
// //       console.error('Conversion error:', err.message);
// //       conversionError = err.message;
// //     }

// //     res.json({
// //       success: true,
// //       message: midiText,
// //       midiUrl: midiUrl,
// //       barCount: barCount,
// //       voiceCount: voiceCount,
// //       requestedBars: length,
// //       valid: !conversionError && validated.success,
// //       conversionError: conversionError,
// //       validationWarnings: validated.warnings,
// //       autoFixed: validated.fixed.length > 0,
// //       timestamp: new Date().toISOString()
// //     });

// //   } catch (error) {
// //     console.error('Generation failed:', error);
// //     res.status(500).json({
// //       error: 'Generation failed',
// //       details: error.message
// //     });
// //   }
// // });

// // // Integrate MIDI routes
// // app.use('/api', midiRoutes);

// // app.use('/generated', express.static(generatedDir, {
// //   maxAge: '1h',
// //   setHeaders: (res, filePath) => {
// //     if (filePath.endsWith('.mid')) {
// //       res.setHeader('Content-Type', 'audio/midi');
// //     }
// //   }
// // }));

// // // Cleanup old generated files every hour
// // setInterval(() => {
// //   try {
// //     const files = fs.readdirSync(generatedDir);
// //     const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
// //     let cleaned = 0;

// //     files.forEach(file => {
// //       const filePath = path.join(generatedDir, file);
// //       const stats = fs.statSync(filePath);
// //       if (stats.mtime.getTime() < fourHoursAgo) {
// //         fs.unlinkSync(filePath);
// //         cleaned++;
// //       }
// //     });

// //     if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} old files`);
// //   } catch (error) {
// //     console.error('Cleanup error:', error);
// //   }
// // }, 60 * 60 * 1000);

// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`\n🎹 MIDI Backend (Stateless Mode) - Port ${PORT}`);
// //   console.log(`✓ No data storage - fresh on every request`);
// //   console.log(`✓ Client-side chat history only`);
// //   console.log(`✓ Retry strategy: 2x gemini-2.5-flash → 1x gemini-2.0-flash`);
// //   console.log(`✓ Max bars: 500 | Max payload: 100mb`);
// //   console.log(`✓ Max output tokens: 65,536 (long composition support)`);
// //   console.log(`\n🎵 Ready for musical compositions!`);
// // });















// // backend/server.js - STATELESS VERSION with IMPROVED ERROR HANDLING

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const fs = require('fs');
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// // Import routes and utilities
// const midiRoutes = require('./src/routes/midiRoutes');
// const MidiToTextConverter = require('./src/utils/midiToText');
// const TextToMidiConverter = require('./src/utils/textToMidi');
// const MidiValidator = require('./src/utils/midiValidator');
// const { buildEnhancedPrompt, buildMidiEditPrompt } = require('./src/utils/enhanced-prompt-builder');

// const app = express();

// // Increased limits for long compositions
// app.use(cors());
// app.use(express.json({ limit: '100mb' }));
// app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// const publicDir = path.join(__dirname, 'public');
// const generatedDir = path.join(publicDir, 'generated');

// [publicDir, generatedDir].forEach(dir => {
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// });

// // ✅ CRITICAL: Check Gemini API key at startup
// if (!process.env.GEMINI_API_KEY) {
//   console.error('❌ FATAL ERROR: GEMINI_API_KEY not found in environment variables!');
//   console.error('Please create a .env file with: GEMINI_API_KEY=your_key_here');
//   process.exit(1);
// }

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const validator = new MidiValidator();

// console.log('🎹 MIDI Backend - Stateless Mode (Long Composition Support) starting...');

// function extractBarCountFromPrompt(text) {
//   if (!text) return null;

//   const compositionPatterns = [
//     /(\d+)-bar\s+(?:composition|piece|track|music|piano)/i,
//     /(\d+)\s*bars?\s+(?:composition|piece|track|music|piano)/i,
//     /(?:generate|create|compose)\s+(?:a\s+)?(\d+)-bar/i,
//   ];

//   for (const pattern of compositionPatterns) {
//     const match = text.match(pattern);
//     if (match && match[1]) {
//       const count = parseInt(match[1]);
//       if (count > 0 && count <= 500) return count;
//     }
//   }

//   const rangePattern = /bars?\s+(\d+)\s*[-–—]\s*(\d+)/i;
//   const rangeMatch = text.match(rangePattern);
//   if (rangeMatch && rangeMatch[2]) {
//     const count = parseInt(rangeMatch[2]);
//     if (count > 0 && count <= 500) return count;
//   }

//   return null;
// }

// function validateAndCleanMidiResponse(rawText) {
//   if (!rawText || rawText.length < 50) {
//     return { valid: false, error: 'Response too short or empty' };
//   }

//   const hasTempo = rawText.includes('Tempo:');
//   const hasTimeSig = rawText.includes('TimeSig:');
//   const hasBars = rawText.includes('Bar:');
//   const hasNoteLines = rawText.match(/[A-G][#b]?[0-9]:/);

//   if (!hasTempo || !hasTimeSig || !hasBars || !hasNoteLines) {
//     return { valid: false, error: 'Missing required MIDI structure' };
//   }

//   let cleaned = rawText
//     .replace(/```/g, '')
//     .replace(/\*\*/g, '')
//     .replace(/# /g, '')
//     .trim();

//   const barCount = (rawText.match(/Bar:/g) || []).length;
//   const voiceCount = (rawText.match(/[A-G][#b]?[0-9]:/g) || []).length;

//   return { 
//     valid: true, 
//     cleanedText: cleaned,
//     barCount: barCount,
//     voiceCount: voiceCount
//   };
// }

// async function generateWithRetry(model, modelName, prompt, maxRetries = 2) {
//   let retries = 0;
  
//   while (retries < maxRetries) {
//     try {
//       console.log(`🔄 ${modelName} attempt ${retries + 1}/${maxRetries}...`);
//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const text = response.text();
      
//       const validation = validateAndCleanMidiResponse(text);
      
//       if (validation.valid) {
//         console.log(`✅ Valid MIDI content generated (${validation.barCount} bars, ${validation.voiceCount} voices)`);
//         return validation.cleanedText;
//       }
      
//       console.log(`❌ Validation issue: ${validation.error}`);
//       retries++;
      
//       if (retries < maxRetries) {
//         await new Promise(resolve => setTimeout(resolve, 1500 * retries));
//       }
      
//     } catch (error) {
//       console.error(`Generation error (attempt ${retries + 1}):`, error.message);
//       retries++;
      
//       if (retries < maxRetries) {
//         await new Promise(resolve => setTimeout(resolve, 1500 * retries));
//       }
//     }
//   }
  
//   throw new Error(`Failed after ${maxRetries} attempts with ${modelName}`);
// }

// async function generateWithFallback(prompt, length, temperature, maxOutputTokens) {
//   // Attempt 1 & 2: gemini-2.5-flash
//   try {
//     console.log(`🎹 Trying gemini-2.5-flash (2 attempts)...`);
    
//     const model25 = genAI.getGenerativeModel({ 
//       model: 'gemini-2.5-flash',
//       generationConfig: {
//         temperature: temperature,
//         maxOutputTokens: maxOutputTokens,
//         topP: 0.95,
//         topK: 40
//       }
//     });
    
//     const result = await generateWithRetry(model25, 'gemini-2.5-flash', prompt, 2);
//     console.log(`✅ Success with gemini-2.5-flash`);
//     return result;
    
//   } catch (error) {
//     console.error(`❌ gemini-2.5-flash failed after 2 attempts: ${error.message}`);
//     console.log(`🔄 Final fallback to gemini-2.0-flash (1 attempt)...`);
//     await new Promise(resolve => setTimeout(resolve, 2000));
//   }

//   // Attempt 3: gemini-2.0-flash (final fallback)
//   try {
//     const model20 = genAI.getGenerativeModel({ 
//       model: 'gemini-2.0-flash',
//       generationConfig: {
//         temperature: temperature,
//         maxOutputTokens: maxOutputTokens,
//         topP: 0.95,
//         topK: 40
//       }
//     });
    
//     const result = await generateWithRetry(model20, 'gemini-2.0-flash', prompt, 1);
//     console.log(`✅ Success with gemini-2.0-flash (fallback)`);
//     return result;
    
//   } catch (error) {
//     console.error(`❌ gemini-2.0-flash failed: ${error.message}`);
//     throw new Error('All 3 attempts failed (2x gemini-2.5-flash + 1x gemini-2.0-flash)');
//   }
// }

// app.get('/api/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     mode: 'stateless',
//     storage: 'none',
//     maxBars: 500,
//     maxPayload: '100mb',
//     services: {
//       nodeBackend: 'healthy',
//       geminiApi: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
//     }
//   });
// });

// // ✅ IMPROVED: Upload MIDI with better error handling
// app.post('/api/upload-midi', async (req, res) => {
//   try {
//     console.log('📤 Processing MIDI upload request...');
    
//     const { midiData } = req.body;
//     if (!midiData) {
//       console.error('❌ No MIDI data in request');
//       return res.status(400).json({ error: 'MIDI data required' });
//     }

//     console.log(`📊 MIDI data size: ${midiData.length} bytes (base64)`);
//     const midiBuffer = Buffer.from(midiData, 'base64');
//     console.log(`📊 MIDI buffer size: ${midiBuffer.length} bytes`);
    
//     const result = MidiToTextConverter.processMidiFile(midiBuffer);
    
//     if (!result.success) {
//       console.error('❌ MIDI conversion failed:', result.error);
//       throw new Error(result.error || 'MIDI processing failed');
//     }

//     const textMidi = result.data;
//     const bars = (textMidi.match(/Bar:/g) || []).length;
//     const voiceCount = (textMidi.match(/[A-G][#b]?[0-9]:/g) || []).length;

//     console.log(`✅ MIDI converted: ${bars} bars, ${voiceCount} voices`);

//     res.json({
//       success: true,
//       textMidi: textMidi,
//       stats: { 
//         bars: bars,
//         voices: voiceCount,
//         length: textMidi.length
//       }
//     });
//   } catch (error) {
//     console.error('❌ MIDI upload failed:', error);
//     res.status(500).json({ 
//       error: 'MIDI upload failed',
//       details: error.message 
//     });
//   }
// });

// // ✅ IMPROVED: Main chat endpoint with better error handling
// app.post('/api/chat', async (req, res) => {
//   try {
//     console.log('\n🎵 ===== NEW GENERATION REQUEST =====');
//     console.log('📋 Request body keys:', Object.keys(req.body));
    
//     const {
//       message,
//       creativityLevel = 'medium',
//       performanceMode = 'balanced',
//       requestedBars = null,
//       editMode = false,
//       originalContent = null
//     } = req.body;

//     // ✅ Validation
//     if (!message || !message.trim()) {
//       console.error('❌ Empty message received');
//       return res.status(400).json({ error: 'Message is required' });
//     }

//     console.log(`📝 Message: "${message.substring(0, 100)}..."`);
//     console.log(`🎨 Edit mode: ${editMode}`);
//     console.log(`🎹 Creativity: ${creativityLevel}, Performance: ${performanceMode}`);

//     // Determine bar count
//     let length = null;

//     if (editMode && originalContent) {
//       const originalBars = (originalContent.match(/Bar:/g) || []).length;
//       if (originalBars > 0) {
//         length = originalBars;
//         console.log(`📊 Edit mode: Using original bar count (${originalBars})`);
//       }
//     }

//     if (!length && requestedBars && requestedBars > 0) {
//       length = requestedBars;
//       console.log(`📊 Using requested bars: ${requestedBars}`);
//     }

//     if (!length) {
//       length = extractBarCountFromPrompt(message);
//       if (length) {
//         console.log(`📊 Extracted from prompt: ${length} bars`);
//       }
//     }

//     if (!length) {
//       const lengthMap = { fast: 16, balanced: 32, quality: 48 };
//       length = lengthMap[performanceMode] || 32;
//       console.log(`📊 Using default for ${performanceMode} mode: ${length} bars`);
//     }
    
//     length = Math.min(length, 500);
//     console.log(`🎵 Final bar count: ${length} bars`);

//     // Build prompt
//     let prompt;
//     if (editMode && originalContent) {
//       const contextBars = length > 100 ? 100 : (length > 50 ? 75 : 50);
//       console.log(`📝 Edit mode: using ${contextBars} bars of context`);
//       prompt = buildMidiEditPrompt(message, originalContent, length, '');
//     } else {
//       prompt = buildEnhancedPrompt(message, length, null, false, null, '');
//     }

//     const tempMap = { low: 0.8, medium: 0.9, high: 1.0 };
//     const temperature = tempMap[creativityLevel] || 0.9;

//     // Dynamic token calculation
//     const baseTokens = 10000;
//     let tokensPerBar;
    
//     if (length <= 50) {
//       tokensPerBar = 200;
//     } else if (length <= 100) {
//       tokensPerBar = 250;
//     } else if (length <= 200) {
//       tokensPerBar = 300;
//     } else {
//       tokensPerBar = 350;
//     }
    
//     const estimatedTokens = Math.max(baseTokens, length * tokensPerBar);
//     const maxOutputTokens = Math.min(estimatedTokens, 65536);

//     console.log(`🎹 Starting generation (${length} bars, ~${maxOutputTokens} tokens)`);
//     console.log(`📊 Retry strategy: 2x gemini-2.5-flash → 1x gemini-2.0-flash`);

//     let rawMidiText;
//     try {
//       rawMidiText = await generateWithFallback(prompt, length, temperature, maxOutputTokens);
//     } catch (error) {
//       console.error('❌ All generation attempts failed:', error);
//       return res.status(500).json({
//         error: 'AI generation failed',
//         details: 'All 3 attempts failed (2x gemini-2.5-flash + 1x gemini-2.0-flash)',
//         message: error.message
//       });
//     }

//     const validated = validator.validateAndFix(rawMidiText);
//     const midiText = validated.midi;
//     const barCount = (midiText.match(/Bar:/g) || []).length;
//     const voiceCount = (midiText.match(/[A-G][#b]?[0-9]:/g) || []).length;

//     if (barCount === 0) {
//       console.error('❌ No valid bars generated');
//       return res.status(500).json({
//         error: 'No valid MIDI content generated'
//       });
//     }

//     console.log(`✅ Generated: ${barCount} bars, ${voiceCount} voices, ${midiText.length} chars`);

//     // Convert to MIDI file
//     let midiUrl = null;
//     let conversionError = null;

//     try {
//       const midiResult = TextToMidiConverter.processTextNotation(midiText);
//       if (!midiResult.success) {
//         throw new Error(midiResult.errors?.join(', ') || 'Conversion failed');
//       }

//       const filename = `generated_${Date.now()}.mid`;
//       const filepath = path.join(generatedDir, filename);
//       fs.writeFileSync(filepath, midiResult.data);
//       midiUrl = `/generated/${filename}`;
      
//       console.log(`✅ MIDI file saved: ${filename} (${midiResult.data.length} bytes)`);
//     } catch (err) {
//       console.error('❌ Conversion error:', err.message);
//       conversionError = err.message;
//     }

//     console.log('🎉 ===== REQUEST COMPLETED =====\n');

//     res.json({
//       success: true,
//       message: midiText,
//       midiUrl: midiUrl,
//       barCount: barCount,
//       voiceCount: voiceCount,
//       requestedBars: length,
//       valid: !conversionError && validated.success,
//       conversionError: conversionError,
//       validationWarnings: validated.warnings,
//       autoFixed: validated.fixed.length > 0,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Generation failed:', error);
//     console.error('Stack trace:', error.stack);
//     res.status(500).json({
//       error: 'Generation failed',
//       details: error.message,
//       stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// });

// // Integrate MIDI routes
// app.use('/api', midiRoutes);

// app.use('/generated', express.static(generatedDir, {
//   maxAge: '1h',
//   setHeaders: (res, filePath) => {
//     if (filePath.endsWith('.mid')) {
//       res.setHeader('Content-Type', 'audio/midi');
//     }
//   }
// }));

// // Cleanup old generated files every hour
// setInterval(() => {
//   try {
//     const files = fs.readdirSync(generatedDir);
//     const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);
//     let cleaned = 0;

//     files.forEach(file => {
//       const filePath = path.join(generatedDir, file);
//       const stats = fs.statSync(filePath);
//       if (stats.mtime.getTime() < fourHoursAgo) {
//         fs.unlinkSync(filePath);
//         cleaned++;
//       }
//     });

//     if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} old files`);
//   } catch (error) {
//     console.error('Cleanup error:', error);
//   }
// }, 60 * 60 * 1000);

// // ✅ Global error handler
// app.use((err, req, res, next) => {
//   console.error('❌ Unhandled error:', err);
//   res.status(500).json({
//     error: 'Internal server error',
//     details: err.message,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
//   });
// });

// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`\n🎹 MIDI Backend (Stateless Mode) - Port ${PORT}`);
// //   console.log(`✅ No data storage - fresh on every request`);
// //   console.log(`✅ Client-side chat history only`);
// //   console.log(`✅ Retry strategy: 2x gemini-2.5-flash → 1x gemini-2.0-flash`);
// //   console.log(`✅ Max bars: 500 | Max payload: 100mb`);
// //   console.log(`✅ Max output tokens: 65,536 (long composition support)`);
// //   console.log(`\n🎵 Ready for musical compositions!`);
// // });





// const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

// if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
//   console.log('🔄 Keep-alive enabled - pinging every 10 minutes');
  
//   // Ping self every 10 minutes to stay awake
//   setInterval(async () => {
//     try {
//       const https = require('https');
//       const http = require('http');
//       const protocol = SELF_URL.startsWith('https') ? https : http;
      
//       protocol.get(`${SELF_URL}/api/health`, (res) => {
//         if (res.statusCode === 200) {
//           console.log('✅ Keep-alive ping successful');
//         } else {
//           console.log(`⚠️ Keep-alive ping returned ${res.statusCode}`);
//         }
//       }).on('error', (err) => {
//         console.log('⚠️ Keep-alive ping failed:', err.message);
//       });
//     } catch (error) {
//       console.log('⚠️ Keep-alive error:', error.message);
//     }
//   }, 10 * 60 * 1000); // 10 minutes
// } else {
//   console.log('ℹ️ Keep-alive disabled (local development)');
// }

// // ✅ Updated app.listen with improved logging
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`\n🎹 MIDI Backend (Stateless Mode) - Port ${PORT}`);
//   console.log(`✓ No data storage - fresh on every request`);
//   console.log(`✓ Client-side chat history only`);
//   console.log(`✓ Retry strategy: 2x gemini-2.5-flash → 1x gemini-2.0-flash`);
//   console.log(`✓ Max bars: 500 | Max payload: 100mb`);
//   console.log(`✓ Max output tokens: 65,536 (long composition support)`);
  
//   // Show environment info
//   if (process.env.RENDER_EXTERNAL_URL) {
//     console.log(`✓ External URL: ${process.env.RENDER_EXTERNAL_URL}`);
//     console.log(`✓ Keep-alive: ENABLED (pings every 10 min)`);
//   }
  
//   console.log(`\n🎵 Ready for musical compositions!`);
// });
















// backend/server.js

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
const { buildEnhancedPrompt, buildMidiEditPrompt } = require('./src/utils/enhanced-prompt-builder');

const app = express();

// ✅ INCREASED LIMITS: Support for very long user prompts and compositions
app.use(cors());
app.use(express.json({ limit: '250mb' }));
app.use(express.urlencoded({ extended: true, limit: '250mb' }));

const publicDir = path.join(__dirname, 'public');
const generatedDir = path.join(publicDir, 'generated');

[publicDir, generatedDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ✅ CRITICAL: Check Gemini API key at startup
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ FATAL ERROR: GEMINI_API_KEY not found in environment variables!');
  console.error('Please create a .env file with: GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const validator = new MidiValidator();

console.log('🎹 MIDI Backend - Stateless Mode (Long Composition Support) starting...');

// ✅ FIXED: Serve static MIDI files with proper headers for download
app.use('/generated', express.static(generatedDir, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mid') || filePath.endsWith('.midi')) {
      // Force download instead of inline display
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
    }
  }
}));

// ✅ Handle OPTIONS requests for CORS preflight
app.options('/generated/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type, Content-Length');
  res.setHeader('Access-Control-Max-Age', '3600');
  res.sendStatus(200);
});

function extractBarCountFromPrompt(text) {
  if (!text) return null;

  const compositionPatterns = [
    /(\d+)-bar\s+(?:composition|piece|track|music|piano)/i,
    /(\d+)\s*bars?\s+(?:composition|piece|track|music|piano)/i,
    /(?:generate|create|compose)\s+(?:a\s+)?(\d+)-bar/i,
  ];

  for (const pattern of compositionPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const count = parseInt(match[1]);
      if (count > 0 && count <= 500) return count;
    }
  }

  const rangePattern = /bars?\s+(\d+)\s*[-–—]\s*(\d+)/i;
  const rangeMatch = text.match(rangePattern);
  if (rangeMatch && rangeMatch[2]) {
    const count = parseInt(rangeMatch[2]);
    if (count > 0 && count <= 500) return count;
  }

  return null;
}

function validateAndCleanMidiResponse(rawText) {
  if (!rawText || rawText.length < 50) {
    return { valid: false, error: 'Response too short or empty' };
  }

  const hasTempo = rawText.includes('Tempo:');
  const hasTimeSig = rawText.includes('TimeSig:');
  const hasBars = rawText.includes('Bar:');
  const hasNoteLines = rawText.match(/[A-G][#b]?[0-9]:/);

  if (!hasTempo || !hasTimeSig || !hasBars || !hasNoteLines) {
    return { valid: false, error: 'Missing required MIDI structure' };
  }

  let cleaned = rawText
    .replace(/```/g, '')
    .replace(/\*\*/g, '')
    .replace(/# /g, '')
    .trim();

  const barCount = (rawText.match(/Bar:/g) || []).length;
  const voiceCount = (rawText.match(/[A-G][#b]?[0-9]:/g) || []).length;

  return { 
    valid: true, 
    cleanedText: cleaned,
    barCount: barCount,
    voiceCount: voiceCount
  };
}

async function generateWithRetry(model, modelName, prompt, maxRetries = 2) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`🔄 ${modelName} attempt ${retries + 1}/${maxRetries}...`);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const validation = validateAndCleanMidiResponse(text);
      
      if (validation.valid) {
        console.log(`✅ Valid MIDI content generated (${validation.barCount} bars, ${validation.voiceCount} voices)`);
        return validation.cleanedText;
      }
      
      console.log(`❌ Validation issue: ${validation.error}`);
      retries++;
      
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1500 * retries));
      }
      
    } catch (error) {
      console.error(`Generation error (attempt ${retries + 1}):`, error.message);
      retries++;
      
      if (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1500 * retries));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts with ${modelName}`);
}

async function generateWithFallback(prompt, length, temperature, maxOutputTokens) {
  // Attempt 1 & 2: gemini-2.5-flash
  try {
    console.log(`🎹 Trying gemini-2.5-flash (2 attempts)...`);
    
    const model25 = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxOutputTokens,
        topP: 0.95,
        topK: 40
      }
    });
    
    const result = await generateWithRetry(model25, 'gemini-2.5-flash', prompt, 2);
    console.log(`✅ Success with gemini-2.5-flash`);
    return result;
    
  } catch (error) {
    console.error(`❌ gemini-2.5-flash failed after 2 attempts: ${error.message}`);
    console.log(`🔄 Final fallback to gemini-2.0-flash (1 attempt)...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Attempt 3: gemini-2.0-flash (final fallback)
  try {
    const model20 = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxOutputTokens,
        topP: 0.95,
        topK: 40
      }
    });
    
    const result = await generateWithRetry(model20, 'gemini-2.0-flash', prompt, 1);
    console.log(`✅ Success with gemini-2.0-flash (fallback)`);
    return result;
    
  } catch (error) {
    console.error(`❌ gemini-2.0-flash failed: ${error.message}`);
    throw new Error('All 3 attempts failed (2x gemini-2.5-flash + 1x gemini-2.0-flash)');
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: 'stateless',
    storage: 'none',
    maxBars: 500,
    maxPayload: '250mb',
    services: {
      nodeBackend: 'healthy',
      geminiApi: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
    }
  });
});

// ✅ IMPROVED: Upload MIDI with better error handling
app.post('/api/upload-midi', async (req, res) => {
  try {
    console.log('📤 Processing MIDI upload request...');
    
    const { midiData } = req.body;
    if (!midiData) {
      console.error('❌ No MIDI data in request');
      return res.status(400).json({ error: 'MIDI data required' });
    }

    console.log(`📊 MIDI data size: ${midiData.length} bytes (base64)`);
    const midiBuffer = Buffer.from(midiData, 'base64');
    console.log(`📊 MIDI buffer size: ${midiBuffer.length} bytes`);
    
    const result = MidiToTextConverter.processMidiFile(midiBuffer);
    
    if (!result.success) {
      console.error('❌ MIDI conversion failed:', result.error);
      throw new Error(result.error || 'MIDI processing failed');
    }

    const textMidi = result.data;
    const bars = (textMidi.match(/Bar:/g) || []).length;
    const voiceCount = (textMidi.match(/[A-G][#b]?[0-9]:/g) || []).length;

    console.log(`✅ MIDI converted: ${bars} bars, ${voiceCount} voices`);

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
    console.error('❌ MIDI upload failed:', error);
    res.status(500).json({ 
      error: 'MIDI upload failed',
      details: error.message 
    });
  }
});

// ✅ IMPROVED: Main chat endpoint with better error handling and increased prompt length support
app.post('/api/chat', async (req, res) => {
  try {
    console.log('\n🎵 ===== NEW GENERATION REQUEST =====');
    console.log('📋 Request body keys:', Object.keys(req.body));
    
    const {
      message,
      creativityLevel = 'medium',
      performanceMode = 'balanced',
      requestedBars = null,
      editMode = false,
      originalContent = null
    } = req.body;

    // ✅ ENHANCED VALIDATION: Support very long prompts (up to 50,000 characters)
    if (!message || !message.trim()) {
      console.error('❌ Empty message received');
      return res.status(400).json({ error: 'Message is required' });
    }

    // ✅ NEW: Check prompt length with generous limit
    const MAX_PROMPT_LENGTH = 50000;
    if (message.length > MAX_PROMPT_LENGTH) {
      console.error(`❌ Prompt too long: ${message.length} chars (max: ${MAX_PROMPT_LENGTH})`);
      return res.status(400).json({ 
        error: 'Prompt too long',
        details: `Your prompt is ${message.length} characters. Maximum allowed is ${MAX_PROMPT_LENGTH} characters.`,
        currentLength: message.length,
        maxLength: MAX_PROMPT_LENGTH
      });
    }

    console.log(`📝 Message: "${message.substring(0, 100)}..." (${message.length} chars)`);
    console.log(`🎨 Edit mode: ${editMode}`);
    console.log(`🎹 Creativity: ${creativityLevel}, Performance: ${performanceMode}`);

    // Determine bar count
    let length = null;

    if (editMode && originalContent) {
      const originalBars = (originalContent.match(/Bar:/g) || []).length;
      if (originalBars > 0) {
        length = originalBars;
        console.log(`📊 Edit mode: Using original bar count (${originalBars})`);
      }
    }

    if (!length && requestedBars && requestedBars > 0) {
      length = requestedBars;
      console.log(`📊 Using requested bars: ${requestedBars}`);
    }

    if (!length) {
      length = extractBarCountFromPrompt(message);
      if (length) {
        console.log(`📊 Extracted from prompt: ${length} bars`);
      }
    }

    if (!length) {
      const lengthMap = { fast: 16, balanced: 32, quality: 48 };
      length = lengthMap[performanceMode] || 32;
      console.log(`📊 Using default for ${performanceMode} mode: ${length} bars`);
    }
    
    length = Math.min(length, 500);
    console.log(`🎵 Final bar count: ${length} bars`);

    // Build prompt
    let prompt;
    if (editMode && originalContent) {
      const contextBars = length > 100 ? 100 : (length > 50 ? 75 : 50);
      console.log(`📝 Edit mode: using ${contextBars} bars of context`);
      prompt = buildMidiEditPrompt(message, originalContent, length, '');
    } else {
      prompt = buildEnhancedPrompt(message, length, null, false, null, '');
    }

    const tempMap = { low: 0.8, medium: 0.9, high: 1.0 };
    const temperature = tempMap[creativityLevel] || 0.9;

    // Dynamic token calculation
    const baseTokens = 10000;
    let tokensPerBar;
    
    if (length <= 50) {
      tokensPerBar = 200;
    } else if (length <= 100) {
      tokensPerBar = 250;
    } else if (length <= 200) {
      tokensPerBar = 300;
    } else {
      tokensPerBar = 350;
    }
    
    const estimatedTokens = Math.max(baseTokens, length * tokensPerBar);
    const maxOutputTokens = Math.min(estimatedTokens, 65536);

    console.log(`🎹 Starting generation (${length} bars, ~${maxOutputTokens} tokens)`);
    console.log(`📊 Retry strategy: 2x gemini-2.5-flash → 1x gemini-2.0-flash`);

    let rawMidiText;
    try {
      rawMidiText = await generateWithFallback(prompt, length, temperature, maxOutputTokens);
    } catch (error) {
      console.error('❌ All generation attempts failed:', error);
      
      // ✅ FIX: Return more specific error codes
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          details: 'AI service rate limit reached. Please try again in a moment.',
          retryAfter: 60
        });
      }
      
      if (error.message.includes('timeout')) {
        return res.status(504).json({
          error: 'Generation timeout',
          details: 'Generation took too long. Try reducing the number of bars or simplifying your prompt.'
        });
      }
      
      if (error.message.includes('invalid') || error.message.includes('prompt')) {
        return res.status(400).json({
          error: 'Invalid request',
          details: 'Your prompt contains invalid content. Please rephrase and try again.'
        });
      }
      
      // Generic error with helpful message
      return res.status(500).json({
        error: 'Generation failed',
        details: 'Unable to generate music. This could be due to: high demand, complex prompt, or service issues. Please try again with a simpler prompt or fewer bars.',
        suggestion: 'Try: reducing bar count, simplifying description, or waiting a moment'
      });
    }

    const validated = validator.validateAndFix(rawMidiText);
    const midiText = validated.midi;
    const barCount = (midiText.match(/Bar:/g) || []).length;
    const voiceCount = (midiText.match(/[A-G][#b]?[0-9]:/g) || []).length;

    if (barCount === 0) {
      console.error('❌ No valid bars generated');
      return res.status(500).json({
        error: 'No valid MIDI content generated',
        details: 'The AI generated invalid output. Please try again with a different prompt.'
      });
    }

    console.log(`✅ Generated: ${barCount} bars, ${voiceCount} voices, ${midiText.length} chars`);

    // Convert to MIDI file
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
      
      console.log(`✅ MIDI file saved: ${filename} (${midiResult.data.length} bytes)`);
    } catch (err) {
      console.error('❌ Conversion error:', err.message);
      conversionError = err.message;
    }

    console.log('🎉 ===== REQUEST COMPLETED =====\n');

    res.json({
      success: true,
      message: midiText,
      midiUrl: midiUrl,
      barCount: barCount,
      voiceCount: voiceCount,
      requestedBars: length,
      valid: !conversionError && validated.success,
      conversionError: conversionError,
      validationWarnings: validated.warnings,
      autoFixed: validated.fixed.length > 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Generation failed:', error);
    console.error('Stack trace:', error.stack);
    
    // ✅ FIX: Detailed error response
    res.status(500).json({
      error: 'Unexpected error',
      details: error.message || 'An unexpected error occurred',
      suggestion: 'Please try again. If the problem persists, contact support.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Integrate MIDI routes
app.use('/api', midiRoutes);

// Cleanup old generated files every hour
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

    if (cleaned > 0) console.log(`🧹 Cleaned ${cleaned} old files`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60 * 60 * 1000);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
const SELF_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
  console.log('🔄 Keep-alive enabled - pinging every 10 minutes');
  
  // Ping self every 10 minutes to stay awake
  setInterval(async () => {
    try {
      const https = require('https');
      const http = require('http');
      const protocol = SELF_URL.startsWith('https') ? https : http;
      
      protocol.get(`${SELF_URL}/api/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Keep-alive ping successful');
        } else {
          console.log(`⚠️ Keep-alive ping returned ${res.statusCode}`);
        }
      }).on('error', (err) => {
        console.log('⚠️ Keep-alive ping failed:', err.message);
      });
    } catch (error) {
      console.log('⚠️ Keep-alive error:', error.message);
    }
  }, 10 * 60 * 1000); // 10 minutes
} else {
  console.log('ℹ️ Keep-alive disabled (local development)');
}

// ✅ Updated app.listen with improved logging
app.listen(PORT, () => {
  console.log(`\n🎹 MIDI Backend (Stateless Mode) - Port ${PORT}`);
  console.log(`✓ No data storage - fresh on every request`);
  console.log(`✓ Client-side chat history only`);
  console.log(`✓ Retry strategy: 2x gemini-2.5-flash → 1x gemini-2.0-flash`);
  console.log(`✓ Max bars: 500 | Max payload: 250mb`);
  console.log(`✓ Max prompt length: 50,000 characters`);
  console.log(`✓ Max output tokens: 65,536 (long composition support)`);
  console.log(`✓ Static file serving: FIXED (force download with proper headers)`);
  
  // Show environment info
  if (process.env.RENDER_EXTERNAL_URL) {
    console.log(`✓ External URL: ${process.env.RENDER_EXTERNAL_URL}`);
    console.log(`✓ Keep-alive: ENABLED (pings every 10 min)`);
  }
  
  console.log(`\n🎵 Ready for musical compositions!`);
});