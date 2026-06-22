"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { createChatSessionAction, sendChatMessageAction } from "@/actions/chat";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { ChatSession, ChatMessage } from "@/types";
import { Send, Mic, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [input, setInput] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  // Voice Hook
  const { isListening, startListening, stopListening, isSupported: isVoiceSupported } = useVoiceInput(
    (transcript) => setInput((prev) => prev + (prev ? " " : "") + transcript)
  );

  // 1. Listen to online connection status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // 2. Fetch or create chat sessions
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "chatSessions"),
        where("userId", "==", user.uid)
      );

      const unsubscribeSnapshot = onSnapshot(q, async (snapshot) => {
        const items: ChatSession[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as ChatSession);
        });

        // Sort descending by createdAt in memory and slice
        items.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        const sortedItems = items.slice(0, 5);
        setSessions(sortedItems);

        if (sortedItems.length > 0 && !activeSession) {
          setActiveSession(sortedItems[0]);
        } else if (sortedItems.length === 0 && !activeSession) {
          // Auto create a default session if none exists
          const res = await createChatSessionAction("Study Session");
          if (res.success && res.sessionId) {
            setActiveSession({
              id: res.sessionId,
              userId: user.uid,
              title: "Study Session",
              createdAt: {} as any,
            });
          }
        }
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, [activeSession]);

  // 3. Listen to messages inside the active session
  useEffect(() => {
    if (!activeSession) return;

    const q = query(
      collection(db, "chatMessages"),
      where("sessionId", "==", activeSession.id),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [activeSession]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || isPending) return;
    if (!isOnline) {
      setError("AI Chat requires an active internet connection. Offline chat is disabled.");
      return;
    }

    const currentMessage = input;
    setInput("");
    setError(null);

    startTransition(async () => {
      const result = await sendChatMessageAction(activeSession.id, currentMessage);
      if (!result.success) {
        setError(result.error || "Failed to communicate with AI.");
        setInput(currentMessage); // Restore input on error
      }
    });
  };

  const toggleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] text-on-surface">
      {/* Network Alert */}
      {!isOnline && (
        <div className="p-3 mb-3 text-body-small bg-error-container text-on-error-container border border-error/20 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>You appear to be offline. AI Chat is currently unavailable.</span>
        </div>
      )}

      {error && (
        <div className="p-3 mb-3 text-body-small bg-error-container text-on-error-container border border-error/20 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Message Area */}
      <div className="flex-1 bg-surface border border-outline/10 rounded-lg p-4 shadow-1 overflow-y-auto flex flex-col gap-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant/60 p-4">
            <MessageSquare className="w-8 h-8 mb-2 text-primary" />
            <p className="text-body-medium font-semibold">Start Learning!</p>
            <p className="text-body-small mt-1 max-w-[240px]">
              Ask me to clarify concepts, simplify complex topics, or provide educational examples.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 text-body-medium leading-relaxed ${
                    isUser
                      ? "bg-primary text-primary-on rounded-br-none"
                      : "bg-surface-variant text-on-surface-variant rounded-bl-none border border-outline/5"
                  }`}
                >
                  <span className="block text-[10px] font-bold opacity-60 uppercase mb-1">
                    {isUser ? "You" : "AI Tutor"}
                  </span>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2 mt-4 shrink-0">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isOnline ? "Ask about photosynthesis, mitosis..." : "Connect online to start chatting..."}
            disabled={!isOnline || isPending}
            className="w-full pl-3 pr-12 py-3 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary disabled:opacity-50"
          />
          {isVoiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              disabled={!isOnline || isPending}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                isListening
                  ? "bg-error text-error-on animate-pulse"
                  : "text-outline hover:bg-surface-variant hover:text-primary"
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!isOnline || isPending || !input.trim()}
          className="aspect-square flex items-center justify-center bg-primary text-primary-on rounded-md shadow-2 hover:opacity-95 disabled:opacity-50 transition-opacity shrink-0"
        >
          {isPending ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
