import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Download, Edit3, Copy, Eye, X, CheckCircle, AlertCircle, Loader2, FileMusic, Plus, Menu } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const THINKING_MESSAGES = [
  "Analyzing musical patterns...",
  "Composing harmonic progressions...",
  "Crafting melodic structures...",
  "Balancing voice leading...",
  "Generating rhythmic patterns...",
  "Optimizing note velocities...",
  "Weaving musical textures...",
  "Sculpting dynamic contours...",
  "Building emotional arc...",
  "Refining musical phrases..."
];

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [systemStatus, setSystemStatus] = useState('unknown');
  const [creativityLevel, setCreativityLevel] = useState('medium');
  const [performanceMode, setPerformanceMode] = useState('balanced');
  const [uploadedMidi, setUploadedMidi] = useState(null);
  const [selectedMidiForView, setSelectedMidiForView] = useState(null);
  const [lastGeneration, setLastGeneration] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const thinkingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkSystemHealth();
  }, []);

  useEffect(() => {
    if (isLoading) {
      let index = 0;
      setThinkingMessage(THINKING_MESSAGES[0]);
      
      thinkingIntervalRef.current = setInterval(() => {
        index = (index + 1) % THINKING_MESSAGES.length;
        setThinkingMessage(THINKING_MESSAGES[index]);
      }, 2500);
    } else {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
    }

    return () => {
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  const checkSystemHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const health = await response.json();
      setSystemStatus(health.status);
    } catch (error) {
      console.error('Health check failed:', error);
      setSystemStatus('error');
    }
  };

const extractBarCount = (text) => {
    if (!text) return null;

    let maxBars = 0;

    // Priority 1: "Total: Bars X - Y" format (HIGHEST PRIORITY)
    const totalBarsRangePattern = /total:?\s*bars?\s+(\d+)\s*[-–—]\s*(\d+)/i;
    const totalBarsMatch = text.match(totalBarsRangePattern);
    if (totalBarsMatch && totalBarsMatch[2]) {
      const count = parseInt(totalBarsMatch[2]);
      if (count > 0 && count <= 500) {
        console.log(`✅ Frontend: "Total: Bars 1-${count}"`);
        return count;
      }
    }

    // Priority 2: Find ALL "Bars X - Y" and take LARGEST
    const allRangePattern = /bars?\s+(\d+)\s*[-–—]\s*(\d+)/gi;
    let match;
    while ((match = allRangePattern.exec(text)) !== null) {
      const endBar = parseInt(match[2]);
      if (endBar > maxBars && endBar <= 500) {
        maxBars = endBar;
      }
    }

    if (maxBars > 0) {
      console.log(`✅ Frontend: Maximum bar range found: ${maxBars}`);
      return maxBars;
    }

    // Priority 3: Simple formats
    const patterns = [
      /bars?\s*[=:]\s*(\d+)/i,
      /(\d+)\s*bars?\s*$/i,
      /total:?\s*(\d+)\s*bars?/i,
    ];
    
    for (const pattern of patterns) {
      const simpleMatch = text.match(pattern);
      if (simpleMatch && simpleMatch[1]) {
        const count = parseInt(simpleMatch[1]);
        if (count > 0 && count <= 500) {
          return count;
        }
      }
    }

    return null;
  };

  const handleNewChat = () => {
    if (window.confirm('Start a new conversation? This will clear all messages.')) {
      setMessages([]);
      setInputMessage('');
      setUploadedMidi(null);
      setLastGeneration(null);
      setSelectedMidiForView(null);
      setMobileMenuOpen(false);
    }
  };

  const handleMidiUpload = async (file) => {
    if (!file || !(file.type === 'audio/midi' || file.name.endsWith('.mid'))) {
      addErrorMessage('Please upload a valid MIDI file (.mid)');
      return;
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result.split(',')[1];
          
          const response = await fetch(`${API_BASE_URL}/upload-midi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ midiData: base64Data })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const data = await response.json();

          setUploadedMidi({
            fileName: file.name,
            textMidi: data.textMidi,
            stats: data.stats
          });

          const uploadMessage = {
            id: Date.now(),
            type: 'system',
            content: `MIDI uploaded for editing: ${file.name} (${data.stats?.bars || 0} bars)`,
            timestamp: new Date().toISOString()
          };

          setMessages(prev => [...prev, uploadMessage]);
          setLastGeneration(data.textMidi);
          
        } catch (error) {
          console.error('Upload processing failed:', error);
          addErrorMessage(`Upload failed: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Upload failed:', error);
      setIsLoading(false);
      addErrorMessage('Upload failed. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleMidiUpload(file);
    }
    e.target.value = '';
  };

  const removeUploadedMidi = () => {
    setUploadedMidi(null);
    const removeMessage = {
      id: Date.now(),
      type: 'system',
      content: 'Uploaded MIDI removed',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, removeMessage]);
  };

  const sendMessage = async (messageType = 'generate') => {
    if (!inputMessage.trim() || isLoading) return;

    const requestedBars = extractBarCount(inputMessage);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      messageType: messageType,
      hasUpload: !!uploadedMidi,
      requestedBars: requestedBars
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    if (requestedBars && requestedBars > 24) {
      const warningMessage = {
        id: Date.now() + 1,
        type: 'warning',
        content: `Note: Requesting ${requestedBars} bars. Quality is optimized for up to 24 bars.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, warningMessage]);
    }

    try {
      const requestBody = {
        message: currentInput,
        creativityLevel: creativityLevel,
        performanceMode: performanceMode,
        requestedBars: requestedBars
      };

      if (uploadedMidi) {
        requestBody.editMode = true;
        requestBody.originalContent = uploadedMidi.textMidi;
      } else if (messageType === 'edit' && lastGeneration) {
        requestBody.editMode = true;
        requestBody.originalContent = lastGeneration;
      }

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        id: data.id || Date.now(),
        type: 'bot',
        content: data.message,
        midiUrl: data.midiUrl,
        valid: data.valid,
        conversionError: data.conversionError,
        validationWarnings: data.validationWarnings || [],
        autoFixed: data.autoFixed || false,
        timestamp: data.timestamp,
        messageType: messageType,
        creativityLevel: data.creativityLevel,
        barCount: data.barCount,
        mode: data.mode,
        editMode: data.editMode,
        requestedBars: requestedBars
      };

      setMessages(prev => [...prev, botMessage]);
      
      if (data.message) {
        setLastGeneration(data.message);
      }

      if (uploadedMidi) {
        setUploadedMidi(null);
      }

    } catch (error) {
      console.error('Request failed:', error);
      addErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addErrorMessage = (content) => {
    const errorMessage = {
      id: Date.now(),
      type: 'error',
      content: content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, errorMessage]);
  };

  const sendEditRequest = () => {
    if (!lastGeneration && !uploadedMidi) {
      addErrorMessage("Generate or upload MIDI first before editing");
      return;
    }
    sendMessage('edit');
  };

  const downloadMidi = (midiUrl) => {
    const fullUrl = midiUrl.startsWith('http') 
      ? midiUrl 
      : `${API_BASE_URL.replace('/api', '')}${midiUrl}`;
    
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = `composition_${Date.now()}.mid`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const SystemStatusBadge = ({ status }) => {
    const config = {
      healthy: { icon: CheckCircle, color: '#10b981', label: 'Ready' },
      error: { icon: AlertCircle, color: '#ef4444', label: 'Offline' },
      unknown: { icon: Loader2, color: '#64748b', label: 'Checking' }
    }[status] || { icon: AlertCircle, color: '#ef4444', label: 'Unknown' };

    const Icon = config.icon;

    return (
      <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border border-gray-200">
        <Icon className={`w-3.5 h-3.5 ${status === 'unknown' ? 'animate-spin' : ''}`} style={{ color: config.color }} />
        <span className="text-xs font-medium hidden xs:inline" style={{ color: config.color }}>{config.label}</span>
      </div>
    );
  };

  const MessageBubble = ({ message }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (text) => {
      copyToClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (message.type === 'user') {
      return (
        <div className="flex justify-end mb-6">
          <div className="max-w-[90%] xs:max-w-[80%]">
            {message.requestedBars && (
              <div className="flex justify-end mb-2">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {message.requestedBars} bars
                </span>
              </div>
            )}
            <div className="bg-gray-900 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
            </div>
          </div>
        </div>
      );
    }

    if (message.type === 'error') {
      return (
        <div className="flex justify-center mb-4 px-2">
          <div className="w-full max-w-[95%] xs:max-w-[85%] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-900 mb-1">Error</div>
                <div className="text-sm text-red-800">{message.content}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (message.type === 'warning') {
      return (
        <div className="flex justify-center mb-4 px-2">
          <div className="w-full max-w-[95%] xs:max-w-[85%] bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <div className="text-sm text-amber-900">{message.content}</div>
          </div>
        </div>
      );
    }

    if (message.type === 'system') {
      return (
        <div className="flex justify-center mb-4 px-2">
          <div className="bg-gray-100 border border-gray-200 rounded-full px-4 py-2 max-w-[95%]">
            <div className="text-xs text-gray-600 font-medium text-center">{message.content}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-start mb-6 px-2">
        <div className="max-w-[90%] xs:max-w-[80%] w-full">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                <div className="text-sm font-semibold text-gray-900">
                  {message.editMode ? 'Edited Composition' : 'Generated Composition'}
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-600">
                  <span className="font-medium">{message.barCount} bars</span>
                </div>
              </div>
            </div>

            <div className="p-4">
              {message.midiUrl ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <FileMusic className="w-5 h-5 text-gray-700 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">MIDI File Ready</div>
                        <div className="text-xs text-gray-600">{message.barCount} bars</div>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadMidi(message.midiUrl)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 mb-4">
                  <div className="flex items-center space-x-2 text-amber-800 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>Processing MIDI file...</span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedMidiForView(message)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors flex-1 sm:flex-none min-w-[120px]"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Notation</span>
                </button>

                <button
                  onClick={() => handleCopy(message.content)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors flex-1 sm:flex-none min-w-[120px]"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              {message.autoFixed && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
                  Auto-corrected formatting issues
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MidiDetailModal = ({ message, onClose }) => {
    if (!message) return null;

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl m-2">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">MIDI Notation</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Professional text-based MIDI format</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <pre className="text-xs sm:text-sm font-mono bg-gray-900 text-gray-100 p-4 sm:p-6 rounded-lg whitespace-pre-wrap leading-relaxed border border-gray-700 overflow-x-auto">
              {message.content}
            </pre>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => copyToClipboard(message.content)}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors w-full sm:w-auto"
            >
              Copy All
            </button>
            {message.midiUrl && (
              <button
                onClick={() => downloadMidi(message.midiUrl)}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
              >
                Download MIDI File
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MobileMenu = () => {
    if (!mobileMenuOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 z-40 lg:hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-white shadow-xl">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Menu</h3>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 font-medium">Mode:</label>
                <select 
                  value={performanceMode}
                  onChange={(e) => setPerformanceMode(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-500 focus:ring-1 focus:ring-gray-300 bg-white flex-1"
                >
                  <option value="fast">Fast</option>
                  <option value="balanced">Balanced</option>
                  <option value="quality">Quality</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 font-medium">Style:</label>
                <select 
                  value={creativityLevel}
                  onChange={(e) => setCreativityLevel(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-500 focus:ring-1 focus:ring-gray-300 bg-white flex-1"
                >
                  <option value="low">Precise</option>
                  <option value="medium">Balanced</option>
                  <option value="high">Creative</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleNewChat}
                className="flex items-center space-x-3 w-full px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">MIDI Composer</div>
          <div className="hidden sm:block text-sm text-gray-500">AI-Powered Music Generation</div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-600 font-medium">Mode:</label>
              <select 
                value={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:border-gray-500 focus:ring-1 focus:ring-gray-300 bg-white"
              >
                <option value="fast">Fast</option>
                <option value="balanced">Balanced</option>
                <option value="quality">Quality</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-600 font-medium">Style:</label>
              <select 
                value={creativityLevel}
                onChange={(e) => setCreativityLevel(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:border-gray-500 focus:ring-1 focus:ring-gray-300 bg-white"
              >
                <option value="low">Precise</option>
                <option value="medium">Balanced</option>
                <option value="high">Creative</option>
              </select>
            </div>
          </div>

          <SystemStatusBadge status={systemStatus} />

          <button
            onClick={handleNewChat}
            className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New</span>
          </button>
        </div>
      </header>

      <MobileMenu />

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-16 sm:mt-24 lg:mt-32 px-4">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Create Professional Music</h2>
                <p className="text-gray-600 max-w-2xl text-base sm:text-lg mb-4 sm:mb-6">
                  Describe your musical ideas and let AI generate professional MIDI compositions.
                </p>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-6 px-2">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 sm:px-6 py-3 sm:py-4 shadow-sm max-w-[90%] xs:max-w-[80%]">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-gray-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Composing Music</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">{thinkingMessage}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Input Area */}
      {/* Input Area */}
      <footer className="border-t border-gray-200 bg-white">
        {uploadedMidi && (
          <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4">
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 mb-2 sm:mb-3">
              <div className="flex items-center space-x-2 sm:space-x-3 text-sm min-w-0">
                <FileMusic className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="font-medium text-gray-900 truncate">{uploadedMidi.fileName}</span>
                <span className="text-gray-500 text-xs flex-shrink-0">({uploadedMidi.stats?.bars || 0} bars)</span>
              </div>
              <button
                onClick={removeUploadedMidi}
                className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0 ml-2"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto p-3 sm:p-6">
          <div className="flex items-end space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".mid,.midi"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors flex-shrink-0"
              disabled={isLoading}
              title="Upload MIDI for editing"
            >
              <Upload className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-gray-600" />
            </button>
            
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Describe your music..."
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 bg-white border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 focus:outline-none text-[15px] sm:text-sm resize-none transition-all placeholder-gray-400"
                disabled={isLoading}
                rows={1}
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={sendEditRequest}
                disabled={isLoading || !inputMessage.trim() || (!lastGeneration && !uploadedMidi)}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                title="Edit last generation"
              >
                <Edit3 className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </button>
              
              <button 
                onClick={() => sendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gray-900 hover:bg-gray-800 active:bg-gray-700 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                title="Generate composition"
              >
                <Send className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          
          <div className="text-[11px] sm:text-xs text-gray-500 mt-2.5 sm:mt-3 text-center px-2">
            <div className="inline-block">
              Don't have a DAW? Try free online players:
            </div>
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-0 sm:ml-1">
              <a 
                href="https://signal.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-700 font-medium text-[11px] sm:text-xs border border-gray-300 transition-colors whitespace-nowrap"
              >
                Signal
              </a>
              <a 
                href="https://onlinesequencer.net" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-700 font-medium text-[11px] sm:text-xs border border-gray-300 transition-colors whitespace-nowrap"
              >
                Sequencer
              </a>
            </div>
          </div>
        </div>
      </footer>

      {selectedMidiForView && (
        <MidiDetailModal 
          message={selectedMidiForView} 
          onClose={() => setSelectedMidiForView(null)} 
        />
      )}
    </div>
  );
};

export default ChatBot;