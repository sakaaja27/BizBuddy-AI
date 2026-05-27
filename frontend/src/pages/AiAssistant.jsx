import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  Bot,
  Search,
  MoreVertical,
  Plus,
  ArrowUp,
  Flame,
  Package,
  BarChart2,
  Star,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";

const AiAssistant = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: `Halo! 👋 Saya BizBuddy, asisten AI pribadi untuk usaha Anda. Ada yang bisa saya bantu analisa hari ini? Saya bisa mengecek tren penjualan, merekomendasikan stok, atau merangkum laporan terbaru.`,
      timestamp: new Date(),
      richData: null,
      suggestions: [
        "🔥 Produk terlaris minggu ini?",
        "📦 Kapan harus restock?",
        "📊 Ringkasan pendapatan hari ini",
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const defaultSuggestions = [
    { text: "🔥 Produk terlaris hari ini?", icon: <Flame size={14} /> },
    { text: "📦 Cek stok kritis", icon: <Package size={14} /> },
    { text: "📊 Pendapatan hari ini", icon: <BarChart2 size={14} /> },
    { text: "⭐ Apa keluhan terbaru?", icon: <Star size={14} /> },
    { text: "💡 Saran promosi", icon: <Lightbulb size={14} /> },
  ];

  const handleSendMessage = async (textToSend = inputValue) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Send conversation history excluding richData and DOM specifics
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await axios.post("/ai/chat", {
        message: textToSend,
        conversationHistory: history,
      });

      const aiMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        richData: data.richData,
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      toast.error("Maaf, koneksi ke asisten AI terputus.");

      const errorMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Maaf, saya sedang mengalami gangguan jaringan. Mohon coba tanyakan lagi dalam beberapa saat ya 🙏",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (text) => {
    // Remove emojis at start if present for clean input, or just send full text
    const cleanText = text.replace(/^[^\w\s]+/, "").trim();
    handleSendMessage(cleanText);
  };

  // Render Rich Data Card based on type
  const renderRichData = (data) => {
    if (!data) return null;

    switch (data.type) {
      case "product_highlight":
        return (
          <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 my-3 max-w-sm">
            <div className="flex items-center mb-1">
              <TrendingUp size={14} className="text-orange-500 mr-1.5" />
              <span className="text-orange-600 text-xs font-bold uppercase tracking-wider">
                Produk Terlaris #{data.rank || 1}
              </span>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">
              {data.name}
            </h4>
            <p className="text-orange-600 font-semibold text-sm">
              Terjual: {data.sold} porsi{" "}
              <span className="text-orange-400 text-xs font-normal">
                ({data.growth || "Sedang tren"})
              </span>
            </p>
          </div>
        );

      case "revenue_summary":
        return (
          <div className="bg-[#eff6ff] rounded-xl p-4 border border-blue-100 my-3 max-w-sm">
            <div className="flex items-center mb-1">
              <BarChart2 size={14} className="text-blue-500 mr-1.5" />
              <span className="text-blue-600 text-xs font-bold uppercase tracking-wider">
                Ringkasan Pendapatan
              </span>
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-1">
              Rp {data.revenue?.toLocaleString("id-ID")}
            </h4>
            <div className="flex items-center">
              <div className="bg-white px-2 py-1 rounded-md shadow-sm border border-blue-50 text-xs font-bold text-blue-600">
                {data.comparison || "Hari ini"}
              </div>
            </div>
          </div>
        );

      case "stock_alert":
        return (
          <div className="bg-[#fef2f2] rounded-xl p-4 border border-red-100 my-3 max-w-sm">
            <div className="flex items-center mb-2">
              <AlertTriangle size={14} className="text-red-500 mr-1.5" />
              <span className="text-red-600 text-xs font-bold uppercase tracking-wider">
                Peringatan Stok
              </span>
            </div>
            <ul className="space-y-1 mb-2">
              {data.criticalItems?.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center text-sm font-bold text-gray-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></span>{" "}
                  {item}
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
  const lastAiMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const activeSuggestions =
    lastAiMessage?.suggestions && lastAiMessage.suggestions.length > 0
      ? lastAiMessage.suggestions.map((s) => ({
          text: s,
          icon: <Sparkles size={14} />,
        }))
      : defaultSuggestions;

  return (
    <DashboardLayout>
      {/* Full Workspace AI Experience */}
      <div className="flex flex-col h-[calc(100vh-110px)] md:h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8 -mb-24 md:-mb-8 bg-white overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-100 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg tracking-tight">
                BizBuddy AI
              </h2>
              <p className="text-gray-500 text-sm font-medium">
                Sistem Analisis Cerdas
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-10 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div className="flex justify-center my-6">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-widest">
                Percakapan Aktif
              </span>
            </div>

            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id} className="flex flex-col w-full">
                  <div className={`flex gap-4 w-full ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {!isUser && (
                      <div className="w-8 h-8 mt-1 shrink-0 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-700 shadow-sm">
                        <Bot size={16} />
                      </div>
                    )}
                    {isUser && (
                      <div className="w-8 h-8 mt-1 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}

                    <div className={`flex flex-col max-w-[90%] md:max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
                      {/* Name & Time */}
                      <span className="text-[11px] text-gray-400 font-medium mb-1.5 px-1">
                        {isUser ? "Anda" : "BizBuddy AI"} •{" "}
                        {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <div className={`px-5 py-4 text-[15px] leading-relaxed ${
                        isUser
                          ? "bg-primary text-white rounded-2xl rounded-tr-[4px] shadow-sm"
                          : "bg-white text-gray-800 rounded-2xl rounded-tl-[4px] border border-gray-100 shadow-sm"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        
                        {!isUser && msg.richData && renderRichData(msg.richData)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex flex-col w-full">
                <div className="flex gap-4 w-full flex-row">
                  <div className="w-8 h-8 mt-1 shrink-0 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-700 shadow-sm">
                    <Bot size={16} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[11px] text-gray-400 font-medium mb-1.5 px-1">
                      BizBuddy AI sedang merespons...
                    </span>
                    <div className="px-5 py-4 bg-white text-gray-800 rounded-2xl rounded-tl-[4px] border border-gray-100 shadow-sm flex gap-1.5 items-center h-[52px]">
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white shrink-0 px-4 md:px-10 pb-6 pt-2 border-t border-transparent relative z-20">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            
            {/* Suggestion Chips */}
            <div className="flex overflow-x-auto gap-2 pb-1 hide-scrollbar">
              {activeSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(sug.text)}
                  className="shrink-0 flex items-center bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  <span className="mr-2 text-gray-400">{sug.icon}</span>
                  {sug.text}
                </button>
              ))}
            </div>

            {/* Input Container */}
            <div className="bg-white border border-gray-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary rounded-2xl shadow-sm relative flex flex-col transition-all">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pesan BizBuddy AI..."
                className="w-full bg-transparent border-none focus:ring-0 resize-none py-4 px-5 max-h-[200px] min-h-[56px] text-gray-800 text-[15px] placeholder-gray-400 outline-none"
                rows="1"
                style={{ overflowY: "auto" }}
              />
              <div className="flex justify-end p-2">
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                    ${
                      inputValue.trim() && !isTyping
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  aria-label="Kirim"
                >
                  <ArrowUp size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            
            <div className="text-center mt-1">
              <span className="text-xs text-gray-400 font-medium">
                AI dapat membuat kesalahan. Harap selalu periksa output yang diberikan.
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AiAssistant;
