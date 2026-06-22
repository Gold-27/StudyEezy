"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { postRoomMessageAction } from "@/actions/studyRooms";
import { requestAiReviewAction } from "@/actions/requestAiReview";
import { StudyRoom, StudyRoomMessage, AIReview } from "@/types";
import AIReviewBox from "@/components/rooms/AIReviewBox";
import { ArrowLeft, Send, MessageCircle, GraduationCap, AlertCircle, RefreshCw, PlusCircle, CheckCircle, Mic, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { putOfflineItem, getOfflineItem } from "@/lib/indexedDb";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [messages, setMessages] = useState<StudyRoomMessage[]>([]);
  const [activeReviews, setActiveReviews] = useState<Record<string, AIReview>>({});
  
  // Form input state
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<StudyRoomMessage | null>(null);

  // Voice Hook
  const { isListening, startListening, stopListening, isSupported: isVoiceSupported } = useVoiceInput(
    (transcript) => setContent((prev) => prev + (prev ? " " : "") + transcript)
  );

  const toggleVoice = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // UI state
  const [selectedReview, setSelectedReview] = useState<AIReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (room?.inviteCode) {
      navigator.clipboard.writeText(room.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1. Fetch Room Info
  useEffect(() => {
    if (!roomId) return;
    const fetchRoom = async () => {
      try {
        const docRef = doc(db, "studyRooms", roomId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRoom(docSnap.data() as StudyRoom);
        } else {
          // Check local IndexedDB cache first before giving up
          const cached = await getOfflineItem("studyRooms", roomId);
          if (cached) {
            setRoom({ id: cached.id, name: cached.name, inviteCode: cached.inviteCode } as StudyRoom);
            if (cached.messages) setMessages(cached.messages);
          } else {
            setError("Study room not found.");
          }
        }
      } catch (err) {
        console.error("Failed to load room, attempting cached fallback:", err);
        try {
          const cached = await getOfflineItem("studyRooms", roomId);
          if (cached) {
            setRoom({ id: cached.id, name: cached.name, inviteCode: cached.inviteCode } as StudyRoom);
            if (cached.messages) setMessages(cached.messages);
          } else {
            setError("Error loading study room. You may be offline.");
          }
        } catch (dbErr) {
          setError("Error loading study room.");
        }
      }
    };
    fetchRoom();
  }, [roomId]);

  // 2. Listen to real-time room Q&A messages
  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "studyRoomMessages"),
      where("roomId", "==", roomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: StudyRoomMessage[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as StudyRoomMessage);
      });

      // Sort ascending by createdAt in memory
      items.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      setMessages(items);
      setLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, (err) => {
      console.error("Messages listener failed:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 2b. Sync room details and messages to IndexedDB offline cache
  useEffect(() => {
    if (room && roomId) {
      const syncRoomOffline = async () => {
        try {
          await putOfflineItem("studyRooms", {
            id: roomId,
            name: room.name,
            inviteCode: room.inviteCode,
            messages: messages,
          });
        } catch (e) {
          console.warn("Failed to sync study room to IndexedDB offline cache:", e);
        }
      };
      syncRoomOffline();
    }
  }, [room, messages, roomId]);

  // 3. Listen to AI Reviews posted in this room
  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, "aiReviews"),
      where("roomId", "==", roomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsMap: Record<string, AIReview> = {};
      snapshot.forEach((doc) => {
        const review = doc.data() as AIReview;
        reviewsMap[review.answerId] = review;
      });
      setActiveReviews(reviewsMap);
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    setError(null);
    const textContent = content;
    const targetType = replyTo ? "answer" : "question";
    const parentId = replyTo?.id;

    setContent("");
    setReplyTo(null);

    startTransition(async () => {
      const result = await postRoomMessageAction(roomId, targetType, textContent, parentId || null);
      if (!result.success) {
        setError(result.error || "Failed to post message.");
        setContent(textContent); // Restore input on error
      }
    });
  };

  const handleRequestReview = (msg: StudyRoomMessage) => {
    if (!msg.parentMessageId) return; // Reviews only allowed on Answers
    setError(null);

    startTransition(async () => {
      const result = await requestAiReviewAction(roomId, msg.parentMessageId!, msg.id);
      if (result.success && result.review) {
        const reviewData = result.review as any;
        setSelectedReview({
          ...reviewData,
          createdAt: Timestamp.fromMillis(reviewData.createdAt)
        } as AIReview);
      } else {
        setError(result.error || "AI Review request failed.");
      }
    });
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-body-medium text-on-surface-variant/70">
        Entering study room...
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="py-12 text-center flex flex-col gap-3 items-center text-on-surface">
        <AlertCircle className="w-8 h-8 text-error" />
        <p className="text-body-medium text-error font-semibold">{error}</p>
        <Link href="/dashboard/rooms" className="text-primary hover:underline font-medium flex items-center gap-1 text-body-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Rooms
        </Link>
      </div>
    );
  }

  // Group messages: map answers to their parent questions
  const questionsList = messages.filter((m) => m.type === "question");
  const getAnswersForQuestion = (qId: string) => messages.filter((m) => m.type === "answer" && m.parentMessageId === qId);

  return (
    <div className="flex flex-col h-[calc(100dvh-100px)] text-on-surface pb-2 relative">
      {/* Header action bar */}
      <div className="flex items-start justify-between mb-3 shrink-0">
        <Link href="/dashboard/rooms" className="mt-0.5 shrink-0 transition-colors text-on-surface-variant hover:text-primary">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="text-center flex flex-col items-center">
          <h3 className="text-title-medium font-bold text-primary truncate max-w-[200px]">{room?.name}</h3>
          <button 
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 mt-0.5 text-[10px] text-on-surface-variant/80 bg-surface-variant/30 px-2 py-0.5 rounded hover:bg-surface-variant/60 transition-colors"
          >
            <span>Code: <span className="font-mono font-semibold">{room?.inviteCode}</span></span>
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <div className="w-9" />
      </div>

      {/* Floating AI Review overlay */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-sm max-h-[85vh] overflow-y-auto">
            <AIReviewBox review={selectedReview} onClose={() => setSelectedReview(null)} />
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 mb-2 text-body-small bg-error-container text-on-error-container border border-error/20 rounded-md flex items-start gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-time thread */}
      <div className="flex-1 bg-surface border border-outline/10 rounded-lg p-4 shadow-1 overflow-y-auto flex flex-col gap-5">
        {questionsList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant/60">
            <MessageCircle className="w-8 h-8 mb-2 text-primary" />
            <p className="text-body-medium font-semibold">Study Room Active</p>
            <p className="text-body-small mt-1 max-w-[240px]">
              Ask a question to request answers from your study group members.
            </p>
          </div>
        ) : (
          questionsList.map((q) => {
            const answers = getAnswersForQuestion(q.id);
            return (
              <div key={q.id} className="flex flex-col gap-3 p-4 bg-primary-container/10 border border-primary/10 rounded-lg">
                {/* Question bubble */}
                <div>
                  <span className="inline-block px-2 py-0.5 bg-primary text-primary-on text-[9px] font-bold rounded-full uppercase tracking-wider mb-2">
                    Question
                  </span>
                  <p className="text-body-medium font-bold leading-relaxed">{q.content}</p>
                  
                  {/* Reply trigger button */}
                  {!replyTo && (
                    <button
                      onClick={() => setReplyTo(q)}
                      className="text-body-small text-primary hover:underline font-semibold flex items-center gap-1.5 mt-2"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Reply with Answer
                    </button>
                  )}
                </div>

                {/* Answers block */}
                {answers.length > 0 && (
                  <div className="flex flex-col gap-3 pl-3 border-l-2 border-outline/20 mt-2">
                    {answers.map((ans) => {
                      const review = activeReviews[ans.id];
                      return (
                        <div key={ans.id} className="bg-surface p-3 rounded-md border border-outline/10 shadow-1 flex flex-col gap-2">
                          <div>
                            <span className="block text-[10px] font-bold text-on-surface-variant/70 uppercase">
                              Peer Answer
                            </span>
                            <p className="text-body-medium text-on-surface-variant/95 leading-relaxed mt-1">
                              {ans.content}
                            </p>
                          </div>

                          {/* AI Review trigger or results view */}
                          <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-outline/5">
                            {review ? (
                              <button
                                onClick={() => setSelectedReview(review)}
                                className="text-body-small text-success hover:underline font-semibold flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> View AI Review (Score: {review.score})
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRequestReview(ans)}
                                disabled={isPending}
                                className="text-body-small text-secondary hover:underline font-semibold flex items-center gap-1 disabled:opacity-40"
                              >
                                {isPending ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <GraduationCap className="w-4 h-4" />
                                )}
                                Request AI Review
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="p-2 mb-2 bg-secondary-container/20 text-on-secondary-container border border-secondary/15 rounded-md flex items-center justify-between text-body-small shrink-0 mt-3">
          <span className="truncate max-w-[280px]">
            Replying to: <strong>{replyTo.content}</strong>
          </span>
          <button onClick={() => setReplyTo(null)} className="text-primary font-bold hover:underline">
            Cancel
          </button>
        </div>
      )}

      {/* Input container */}
      <form onSubmit={handleSendMessage} className="flex gap-2 mt-3 shrink-0">
        <div className="flex-1 relative">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyTo ? "Write your peer answer..." : "Ask your group a question..."}
            disabled={isPending}
            className="w-full pl-3 pr-12 py-3 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary"
          />
          {isVoiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              disabled={isPending}
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
          disabled={isPending || !content.trim()}
          className="w-12 h-12 flex items-center justify-center bg-primary text-primary-on rounded-md shadow-2 hover:opacity-95 disabled:opacity-50 transition-opacity shrink-0"
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
