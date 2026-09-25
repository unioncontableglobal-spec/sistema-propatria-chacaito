'use client';

import React, { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'initial',
        role: 'assistant',
        content: '¡Hola! Soy el nuevo Asistente Inteligente de Propatria. Conozco las reglas de las publicaciones, el efecto 1 USD, cómo cuadrar las cuentas y más. ¿En qué te ayudo hoy?'
      }
    ]
  });

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center animate-bounce hover:animate-none"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[400px] h-[550px] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
              <div className="bg-white text-indigo-600 p-1.5 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Super Agente Propatria</h3>
                <p className="text-[10px] text-indigo-200">En línea y listo para auditar</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-indigo-200 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
            {messages.map(m => (
              <div 
                key={m.id} 
                className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${m.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div 
                  className={`p-3 rounded-2xl text-sm shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 max-w-[85%] self-start">
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-400 text-sm italic rounded-tl-none flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Pregúntame cómo cuadrar caja..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10 shrink-0"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
