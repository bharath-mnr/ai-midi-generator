// frontend/src/components/ChatBot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Download, Edit3, Copy, Eye, X, CheckCircle, AlertCircle, Loader2, FileMusic, Trash2, Plus, Library, Info, Menu } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USER_ID = 'default';

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
  "Refining musical phrases...",
  "Learning from your references...",
  "Applying reference style patterns..."
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
  
  const [referenceLibrary, setReferenceLibrary] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [showReferenceInfo, setShowReferenceInfo] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const referenceInputRef = useRef(null);
  const textareaRef = useRef(null);
  const thinkingIntervalRef = useRef(null);

  // Color palette
  const colors = {
    primary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    accent: {
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkSystemHealth();
    loadReferenceLibrary();
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

  const loadReferenceLibrary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/${USER_ID}`);
      const data = await response.json();
      if (data.success) {
        setReferenceLibrary(data.files);
      }
    } catch (error) {
      console.error('Failed to load reference library:', error);
    }
  };

  const handleReferenceUpload = async (file) => {
    if (!file || !(file.type === 'audio/midi' || file.name.endsWith('.mid'))) {
      addErrorMessage('Please upload a valid MIDI file (.mid)');
      return;
    }

    setUploadingReference(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result.split(',')[1];
          
          const response = await fetch(`${API_BASE_URL}/upload-reference`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              midiData: base64Data,
              userId: USER_ID
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const data = await response.json();

          const uploadMessage = {
            id: Date.now(),
            type: 'system',
            content: `Added to reference library: ${file.name} (${data.barCount} bars)`,
            timestamp: new Date().toISOString()
          };

          setMessages(prev => [...prev, uploadMessage]);
          loadReferenceLibrary();
          
        } catch (error) {
          console.error('Reference upload failed:', error);
          addErrorMessage(`Reference upload failed: ${error.message}`);
        } finally {
          setUploadingReference(false);
        }
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Reference upload failed:', error);
      setUploadingReference(false);
      addErrorMessage('Reference upload failed. Please try again.');
    }
  };

  const clearReferenceLibrary = async () => {
    if (!window.confirm('Clear all reference files? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/files/${USER_ID}/clear`, {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        setReferenceLibrary([]);
        const clearMessage = {
          id: Date.now(),
          type: 'system',
          content: data.message,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, clearMessage]);
      }
    } catch (error) {
      console.error('Failed to clear library:', error);
      addErrorMessage('Failed to clear reference library');
    }
  };

  const extractBarCount = (text) => {
    const patterns = [
      /bars?\s+(\d+)[-–](\d+)/i,
      /(\d+)\s+bars?/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[2]) {
          const end = parseInt(match[2]);
          if (end > 0 && end <= 200) return end;
        }
        const count = parseInt(match[1]);
        if (count > 0 && count <= 200) return count;
      }
    }
    return null;
  };

  const handleNewChat = async () => {
    if (window.confirm('Start a new conversation? This will clear all messages and delete generated files.')) {
      try {
        await fetch(`${API_BASE_URL}/clear-files`, { method: 'POST' });
      } catch (error) {
        console.error('Failed to clear files:', error);
      }
      
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

  const handleReferenceFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleReferenceUpload(file);
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
      requestedBars: requestedBars,
      usingReferences: referenceLibrary.length > 0
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
        requestedBars: requestedBars,
        userId: USER_ID
      };

      if (uploadedMidi) {
        requestBody.editMode = true;
        requestBody.originalContent = uploadedMidi.textMidi;
        requestBody.uploadedFileName = uploadedMidi.fileName;
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
        requestedBars: requestedBars,
        usedFiles: data.usedFiles || 0
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
      healthy: { icon: CheckCircle, color: colors.success, label: 'Ready' },
      error: { icon: AlertCircle, color: colors.error, label: 'Offline' },
      unknown: { icon: Loader2, color: colors.primary[500], label: 'Checking' }
    }[status] || { icon: AlertCircle, color: colors.error, label: 'Unknown' };

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
            <div className="flex items-center justify-end space-x-2 mb-2 flex-wrap">
              {message.requestedBars && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {message.requestedBars} bars
                </span>
              )}
              {message.usingReferences && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex items-center mt-1 xs:mt-0">
                  <Library className="w-3 h-3 mr-1" />
                  Using references
                </span>
              )}
            </div>
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
                  {message.usedFiles > 0 && (
                    <span className="text-blue-600 flex items-center bg-blue-50 px-2 py-1 rounded-full">
                      <Library className="w-3 h-3 mr-1" />
                      {message.usedFiles} refs
                    </span>
                  )}
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

  const ReferenceLibraryPanel = () => {
    if (!showLibrary) return null;

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[95vh] sm:max-h-[80vh] flex flex-col shadow-2xl m-2">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3 min-w-0">
              <Library className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Reference Library</h2>
                <p className="text-xs sm:text-sm text-gray-600 truncate">MIDI files used for style learning</p>
              </div>
            </div>
            <button onClick={() => setShowLibrary(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {referenceLibrary.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Library className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-600 mb-2 font-medium">No reference files</p>
                <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                  Upload MIDI files to teach the AI your preferred musical style and patterns
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {referenceLibrary.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <FileMusic className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{file.displayName}</div>
                        <div className="text-xs text-gray-500">
                          {file.barCount} bars • Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={clearReferenceLibrary}
              disabled={referenceLibrary.length === 0}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-2 sm:order-1"
            >
              Clear All
            </button>
            <button
              onClick={() => referenceInputRef.current?.click()}
              disabled={referenceLibrary.length >= 5}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2"
            >
              Add Reference
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ReferenceInfoPanel = () => {
    if (!showReferenceInfo) return null;

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl m-2">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
            <div className="flex items-center space-x-3">
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">About Reference Learning</h2>
            </div>
            <button onClick={() => setShowReferenceInfo(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-sm sm:text-md font-semibold text-gray-900 mb-2 sm:mb-3">How Reference Learning Works</h3>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                Reference files are MIDI compositions that the AI analyzes to understand your preferred musical style. 
                The system learns patterns, harmonies, rhythms, and structural elements from your references to create 
                compositions that match your aesthetic preferences.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">Best Practices</h4>
              <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                <li>• Upload 2-3 high-quality MIDI files in your preferred style</li>
                <li>• Choose files with clear musical structure and instrumentation</li>
                <li>• References work best when they share similar characteristics</li>
                <li>• The AI learns tempo, dynamics, harmony, and rhythmic patterns</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Technical Details</h4>
              <p className="text-xs text-gray-600">
                The system analyzes reference files for: tempo patterns, dynamic ranges, voice leading, 
                harmonic progressions, rhythmic density, and structural organization. This analysis happens 
                in real-time and influences all subsequent generation requests.
              </p>
            </div>
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

            <div className="pt-4 border-t border-gray-200 space-y-2">
              <button
                onClick={() => {
                  setShowLibrary(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Library className="w-4 h-4" />
                <span>Reference Library</span>
                {referenceLibrary.length > 0 && (
                  <span className="bg-gray-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-auto">
                    {referenceLibrary.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setShowReferenceInfo(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Info className="w-4 h-4 text-gray-600" />
                <span>About References</span>
              </button>

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
          {/* Desktop Controls - Hidden on mobile */}
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

          {/* Reference Library Button */}
          <button
            onClick={() => setShowLibrary(true)}
            className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors relative"
          >
            <Library className="w-4 h-4" />
            <span className="hidden xs:inline">References</span>
            {referenceLibrary.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gray-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {referenceLibrary.length}
              </span>
            )}
          </button>

          {/* Info Button */}
          <button
            onClick={() => setShowReferenceInfo(true)}
            className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="About reference learning"
          >
            <Info className="w-4 h-4 text-gray-600" />
          </button>

          {/* Status */}
          <SystemStatusBadge status={systemStatus} />

          {/* New Chat */}
          <button
            onClick={handleNewChat}
            className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
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
                  Upload reference files to guide the style and structure.
                </p>
                {referenceLibrary.length > 0 && (
                  <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                    <Library className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Using {referenceLibrary.length} reference file(s) for style guidance</span>
                  </div>
                )}
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
      <footer className="border-t border-gray-200 bg-white">
        {uploadedMidi && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4">
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
                <Trash2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {uploadingReference && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4">
            <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3 mb-2 sm:mb-3 text-sm text-blue-800">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span>Adding to reference library...</span>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="flex items-end space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".mid,.midi"
              onChange={handleFileChange}
              className="hidden"
            />

            <input
              ref={referenceInputRef}
              type="file"
              accept=".mid,.midi"
              onChange={handleReferenceFileChange}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white border border-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
              disabled={isLoading}
              title="Upload MIDI for editing"
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            
            {/* Text Input */}
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
                placeholder="Describe your musical idea... (e.g., 'Compose a 16-bar piano piece in C major with emotional melody')"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg sm:rounded-xl focus:border-gray-500 focus:ring-2 focus:ring-gray-200 focus:outline-none text-sm resize-none transition-all placeholder-gray-400"
                disabled={isLoading}
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button 
                onClick={sendEditRequest}
                disabled={isLoading || !inputMessage.trim() || (!lastGeneration && !uploadedMidi)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                title="Edit last generation"
              >
                <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <button 
                onClick={() => sendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
                title="Generate composition"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mt-2 sm:mt-3 text-center">
            Don't have a DAW? Use online MIDI players like{' '}
            <a href="https://pianotify.com" target="_blank" rel="noopener noreferrer" className="px-1 sm:px-2 py-1 bg-gray-100 rounded text-gray-700 font-mono text-xs border border-gray-300">
              Pianotify
            </a>{' '}
            or{' '}
            <a href="https://onlinesequencer.net" target="_blank" rel="noopener noreferrer" className="px-1 sm:px-2 py-1 bg-gray-100 rounded text-gray-700 font-mono text-xs border border-gray-300">
              Online Sequencer
            </a>{' '}
            to play MIDI files.
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedMidiForView && (
        <MidiDetailModal 
          message={selectedMidiForView} 
          onClose={() => setSelectedMidiForView(null)} 
        />
      )}

      <ReferenceLibraryPanel />
      <ReferenceInfoPanel />
    </div>
  );
};

export default ChatBot;