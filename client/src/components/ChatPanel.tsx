import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquareOff, Smile } from 'lucide-react';
import type { Room } from '../types/game';

interface ChatPanelProps {
  room: Room;
  currentPlayerId: string;
  onSendMessage: (text: string) => void;
}

const QUICK_EMOJIS = ['🎯', '⬆', '⬇', '😂', '🔥', '👍', '🤔', '💀'];

export const ChatPanel: React.FC<ChatPanelProps> = ({ room, currentPlayerId, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const player = room.players.find((p) => p.id === currentPlayerId);
  const isEliminated = player?.isEliminated ?? false;

  const isChatEnabled = room.settings.chatEnabled;
  const canSendChat = isChatEnabled && (!isEliminated || room.settings.eliminatedChatEnabled || room.status !== 'playing');

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [room.chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !canSendChat) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-full rounded-3xl overflow-hidden glass-panel border-t border-white/10">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
          <h2 className="font-black text-sm uppercase tracking-widest text-white">
            Live Chat
          </h2>
        </div>
        <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
          {room.chatMessages.filter(m => !m.isSystem).length} msgs
        </span>
      </div>

      {/* Messages List */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 chat-scrollable relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none h-4" />
        
        {room.chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-textMuted/40 text-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <MessageSquareOff size={24} className="opacity-50" />
            </div>
            <p className="font-medium uppercase tracking-widest text-[10px]">No messages yet</p>
          </div>
        ) : (
          room.chatMessages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-3">
                  <div className="py-2 px-5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] text-warning bg-black/60 backdrop-blur-sm border border-warning/20 shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                    {msg.text}
                  </div>
                </div>
              );
            }

            const isMe = msg.senderUsername === player?.username;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
                <span className={`text-[9px] font-black uppercase tracking-[0.1em] mb-1.5 px-2 ${isMe ? 'text-primary/70' : 'text-textMuted'}`}>
                  {msg.senderUsername}
                </span>
                <div
                  className={`max-w-[85%] px-5 py-3 text-[13px] leading-relaxed shadow-xl border backdrop-blur-md ${
                    isMe
                      ? 'rounded-[1.5rem] rounded-tr-sm bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 text-white'
                      : 'rounded-[1.5rem] rounded-tl-sm bg-black/60 border-white/10 text-white/90'
                  }`}
                >
                  <p className="break-words">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Emoji Bar */}
      {canSendChat && (
        <div className="px-4 py-2 flex gap-3 overflow-x-auto bg-black/20 border-t border-white/5 custom-scrollbar">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              className="text-lg hover:scale-125 transition-transform duration-200 focus:outline-none opacity-50 hover:opacity-100 flex-shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 bg-black/60 backdrop-blur-md border-t border-white/10">
        {!isChatEnabled ? (
          <div className="text-center text-[10px] text-error font-black uppercase tracking-widest py-3 bg-black/50 rounded-2xl border border-error/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            Chat Disabled
          </div>
        ) : !canSendChat ? (
          <div className="text-center text-[10px] text-warning font-black uppercase tracking-widest py-3 bg-black/50 rounded-2xl border border-warning/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
            Spectator Chat Disabled
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex gap-3 items-center relative">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                maxLength={150}
                className="w-full bg-black/50 border border-white/10 focus:border-primary/50 text-white shadow-inner pl-5 pr-12 py-3.5 rounded-2xl text-sm font-medium focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-textMuted hover:text-white transition-colors"
              >
                <Smile size={18} />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-[120%] right-0 p-3 rounded-3xl flex gap-2 z-20 bg-black/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-scale-in origin-bottom-right">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => addEmoji(emoji)}
                      className="text-2xl hover:scale-125 p-2 transition duration-200"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-12 h-12 flex-shrink-0 rounded-2xl bg-primary hover:bg-primary/80 text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform hover:scale-105 active:scale-95"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
