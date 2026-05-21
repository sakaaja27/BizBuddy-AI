import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Bot, Search, MoreVertical, Plus, ArrowUp, Flame, Package, BarChart2, Star, Lightbulb, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';

const AiAssistant = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Halo! 👋 Saya BizBuddy, asisten AI pribadi untuk usaha Anda. Ada yang bisa saya bantu analisa hari ini? Saya bisa mengecek tren penjualan, merekomendasikan stok, atau merangkum laporan terbaru.`,
      timestamp: new Date(),
      richData: null,
      suggestions: [
        "🔥 Produk terlaris minggu ini?",
        "📦 Kapan harus restock?",
        "📊 Ringkasan pendapatan hari ini"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const defaultSuggestions = [
    { text: "🔥 Produk terlaris hari ini?", icon: <Flame size={14} /> },
    { text: "📦 Cek stok kritis", icon: <Package size={14} /> },
    { text: "📊 Pendapatan hari ini", icon: <BarChart2 size={14} /> },
    { text: "⭐ Apa keluhan terbaru?", icon: <Star size={14} /> },
    { text: "💡 Saran promosi", icon: <Lightbulb size={14} /> }
  ];

  const handleSendMessage = async (textToSend = inputValue) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Send conversation history excluding richData and DOM specifics
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data } = await axios.post('/ai/chat', {
        message: textToSend,
        conversationHistory: history
      });

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        richData: data.richData,
        suggestions: data.suggestions
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      toast.error('Maaf, koneksi ke asisten AI terputus.');
      
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Maaf, saya sedang mengalami gangguan jaringan. Mohon coba tanyakan lagi dalam beberapa saat ya 🙏',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (text) => {
    // Remove emojis at start if present for clean input, or just send full text
    const cleanText = text.replace(/^[^\w\s]+/, '').trim();
    handleSendMessage(cleanText);
  };

  // Render Rich Data Card based on type
  const renderRichData = (data) => {
    if (!data) return null;

    switch (data.type) {
      case 'product_highlight':
        return (
          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 my-3 max-w-sm">
            <div className="flex items-center mb-1">
              <TrendingUp size={14} className="text-orange-500 mr-1.5" />
              <span className="text-orange-600 text-xs font-bold uppercase tracking-wider">Produk Terlaris #{data.rank || 1}</span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">{data.name}</h4>
            <p className="text-orange-600 font-semibold text-sm">
              Terjual: {data.sold} porsi <span className="text-orange-400 text-xs font-normal">({data.growth || 'Sedang tren'})</span>
            </p>
          </div>
        );
      
      case 'revenue_summary':
        return (
          <div className="bg-[#eff6ff] rounded-xl p-4 border border-blue-100 my-3 max-w-sm">
            <div className="flex items-center mb-1">
              <BarChart2 size={14} className="text-blue-500 mr-1.5" />
              <span className="text-blue-600 text-xs font-bold uppercase tracking-wider">Ringkasan Pendapatan</span>
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-1">Rp {data.revenue?.toLocaleString('id-ID')}</h4>
            <div className="flex items-center">
              <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-blue-50 text-xs font-bold text-blue-600">
                {data.comparison || 'Hari ini'}
              </div>
            </div>
          </div>
        );

      case 'stock_alert':
        return (
          <div className="bg-[#fef2f2] rounded-xl p-4 border border-red-100 my-3 max-w-sm">
            <div className="flex items-center mb-2">
              <AlertTriangle size={14} className="text-red-500 mr-1.5" />
              <span className="text-red-600 text-xs font-bold uppercase tracking-wider">Peringatan Stok</span>
            </div>
            <ul className="space-y-1 mb-2">
              {data.criticalItems?.map((item, idx) => (
                <li key={idx} className="flex items-center text-sm font-bold text-gray-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span> {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-red-700 italic">{data.recommendation}</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Get active suggestions (from last AI message, or default)
  const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant');
  const activeSuggestions = lastAiMessage?.suggestions && lastAiMessage.suggestions.length > 0 
    ? lastAiMessage.suggestions.map(s => ({ text: s, icon: <Sparkles size={14} /> }))
    : defaultSuggestions;

  return (
    <DashboardLayout>
      {/* Hide default padding and full height the content area */}
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen w-full relative">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shrink-0 sticky top-0 z-10 md:pt-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-sm">
                <Bot size={24} />
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">BizBuddy AI Assistant</h2>
              <p className="text-green-500 text-xs font-semibold">Siap membantu bisnis Anda hari ini</p>
            </div>
          </div>
          <div className="flex gap-2 text-gray-400">
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors"><Search size={20} /></button>
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-[#F8F9FA] p-4 md:p-6 pb-32">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Date Pill */}
            <div className="flex justify-center my-4">
              <span className="bg-gray-200/60 text-gray-500 text-xs font-bold px-3 py-1 rounded-full">Hari Ini</span>
            </div>

            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-slide-up`}>
                  <span className="text-[10px] text-gray-400 font-medium mb-1.5 px-1">
                    {isUser ? 'Anda' : 'BizBuddy AI'} • {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {!isUser && (
                      <div className="w-8 h-8 shrink-0 bg-gray-900 rounded-full flex items-center justify-center text-white mb-1 shadow-sm">
                        <Bot size={16} />
                      </div>
                    )}
                    {isUser && (
                      <div className="w-8 h-8 shrink-0 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold mb-1 text-xs">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}

                    <div className={`p-4 shadow-sm ${
                      isUser 
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                      
                      {/* Rich Data rendering */}
                      {!isUser && msg.richData && renderRichData(msg.richData)}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex flex-col items-start animate-fade-in">
                <span className="text-[10px] text-gray-400 font-medium mb-1.5 px-1">BizBuddy AI sedang mengetik...</span>
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 shrink-0 bg-gray-900 rounded-full flex items-center justify-center text-white mb-1 shadow-sm">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white p-4 shadow-sm rounded-2xl rounded-tl-sm border border-gray-100 flex gap-1.5 h-[52px] items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area (Fixed Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 md:px-8 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto">
            
            {/* Suggestion Chips */}
            <div className="flex overflow-x-auto gap-2 pb-4 hide-scrollbar">
              {activeSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(sug.text)}
                  className="shrink-0 flex items-center bg-white border border-gray-200 text-gray-600 hover:border-orange-500 hover:text-orange-600 px-4 py-2 rounded-full text-xs font-semibold transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {sug.icon && <span className="mr-1.5">{sug.icon}</span>}
                  {sug.text}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex items-end gap-3">
              <button className="p-3 text-gray-400 hover:bg-gray-100 rounded-full transition-colors shrink-0 mb-1">
                <Plus size={24} />
              </button>
              
              <div className="flex-1 bg-gray-100 rounded-3xl relative flex items-center">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tanya BizBuddy tentang bisnis Anda..."
                  className="w-full bg-transparent border-none focus:ring-0 resize-none py-3.5 px-6 max-h-32 min-h-[52px] text-gray-800 text-sm placeholder-gray-400 outline-none"
                  rows="1"
                  style={{ overflowY: 'auto' }}
                />
              </div>

              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all mb-0.5
                  ${inputValue.trim() && !isTyping 
                    ? 'bg-[#FF6B35] text-white hover:scale-105 shadow-md shadow-orange-500/30' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                <ArrowUp size={20} strokeWidth={3} />
              </button>
            </div>
            
            <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">BizBuddy AI dapat membuat kesalahan. Harap periksa informasi penting.</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AiAssistant;
