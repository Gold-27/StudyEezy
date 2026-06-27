"use client";

import React, { useState, useEffect, useTransition } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { createStudyRoomAction, joinStudyRoomAction } from "@/actions/studyRooms";
import { Users, Plus, ArrowRight, Clipboard, AlertCircle, Mic, Trash2 } from "lucide-react";
import { StudyRoom } from "@/types";
import Link from "next/link";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { putOfflineItem } from "@/lib/indexedDb";
import { deleteStudyRoomAction } from "@/actions/deleteActions";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const [roomName, setRoomName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const { isListening, startListening, stopListening, isSupported: isVoiceSupported } = useVoiceInput(
    (transcript) => setSearchQuery((prev) => prev + (prev ? " " : "") + transcript)
  );

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        setCurrentUserId(null);
        return;
      }
      
      setCurrentUserId(user.uid);

      // Query room memberships for current user
      const q = query(
        collection(db, "studyRoomMembers"),
        where("userId", "==", user.uid)
      );

      const unsubscribeSnapshot = onSnapshot(q, async (membershipSnap) => {
        const roomIds: string[] = [];
        membershipSnap.forEach((doc) => {
          roomIds.push(doc.data().roomId);
        });

        if (roomIds.length === 0) {
          setRooms([]);
          setLoading(false);
          return;
        }

        // Fetch rooms matching membership IDs
        // Firestore limits in query requires chunking or query-listeners
        const roomsQuery = query(
          collection(db, "studyRooms"),
          where("id", "in", roomIds)
        );

        const unsubscribeRooms = onSnapshot(roomsQuery, async (roomsSnap) => {
          const items: StudyRoom[] = [];
          roomsSnap.forEach((doc) => {
            items.push(doc.data() as StudyRoom);
          });
          setRooms(items);
          setLoading(false);

          // Seed offline IndexedDB store for study rooms
          for (const room of items) {
            try {
              await putOfflineItem("studyRooms", {
                id: room.id,
                name: room.name,
                inviteCode: room.inviteCode,
              });
            } catch (e) {
              console.warn("Failed to cache room info offline:", e);
            }
          }
        });

        return () => unsubscribeRooms();
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setError(null);
    setSuccessCode(null);

    startTransition(async () => {
      const result = await createStudyRoomAction(roomName.trim());
      if (result.success && result.inviteCode) {
        setRoomName("");
        setSuccessCode(result.inviteCode);
      } else {
        setError(result.error || "Failed to create study room.");
      }
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setError(null);
    setSuccessCode(null);

    startTransition(async () => {
      const result = await joinStudyRoomAction(inviteCode.trim());
      if (result.success && result.roomId) {
        setInviteCode("");
        // Redirect will happen automatically via membership collection snap or direct push
      } else {
        setError(result.error || "Failed to join study room.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 pb-8 text-on-surface">
      <section>
        <h2 className="text-headline-small font-semibold text-primary">Study Rooms</h2>
        <p className="text-body-medium text-on-surface-variant/80 mt-1">
          Collaborate in real-time, post questions, answer peers, and request AI reviews.
        </p>
      </section>

      {error && (
        <div className="p-3 text-body-small bg-error-container text-on-error-container border border-error/20 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successCode && (
        <div className="p-4 bg-success-container text-on-success-container border border-success/20 rounded-md flex flex-col gap-2">
          <p className="text-body-medium font-semibold">Study Room Created Successfully!</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-body-small">Invite Code:</span>
            <code className="px-2 py-1 bg-surface rounded-md border border-outline/20 font-bold text-primary text-title-small">
              {successCode}
            </code>
          </div>
        </div>
      )}

      {/* Creation & Joining Grid */}
      <section className="grid md:grid-cols-2 gap-4">
        {/* Create Room */}
        <form onSubmit={handleCreate} className="bg-surface p-4 border border-outline/10 shadow-1 rounded-lg flex flex-col gap-3">
          <h3 className="text-title-small font-semibold flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-primary" /> Create Room
          </h3>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="E.g., Organic Chemistry Prep"
            disabled={isPending}
            className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={isPending || !roomName.trim()}
            className="w-full py-2.5 bg-primary text-primary-on font-semibold rounded-md shadow-2 hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Creating..." : "Create Room"}
          </button>
        </form>

        {/* Join Room */}
        <form onSubmit={handleJoin} className="bg-surface p-4 border border-outline/10 shadow-1 rounded-lg flex flex-col gap-3">
          <h3 className="text-title-small font-semibold flex items-center gap-1.5">
            <ArrowRight className="w-4 h-4 text-secondary" /> Join Room
          </h3>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Invite Code (e.g. A9X8B2)"
            disabled={isPending}
            className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={isPending || !inviteCode.trim()}
            className="w-full py-2.5 bg-secondary text-secondary-on font-semibold rounded-md shadow-2 hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Joining..." : "Join Room"}
          </button>
        </form>
      </section>

      {/* Rooms List */}
      <section className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-title-medium font-semibold text-on-surface">Active Study Rooms</h3>
          
          {/* Search Input with Voice mic */}
          <div className="relative w-full sm:max-w-xs shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
              className="w-full pl-3 pr-10 py-2 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
            />
            {isVoiceSupported && (
              <button
                type="button"
                onClick={() => isListening ? stopListening() : startListening()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                  isListening
                    ? "bg-error text-error-on animate-pulse"
                    : "text-outline hover:bg-surface-variant hover:text-primary"
                }`}
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface p-4 rounded-lg border border-outline/10 shadow-1 flex items-center justify-between h-[84px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 shrink-0"></div>
                  <div className="flex flex-col gap-2">
                    <div className="h-5 w-40 bg-surface-variant rounded"></div>
                    <div className="h-3 w-24 bg-surface-variant rounded"></div>
                  </div>
                </div>
                <div className="h-9 w-24 bg-surface-variant rounded-md shrink-0"></div>
              </div>
            ))}
          </div>
        ) : (rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 ? (
          <div className="py-12 border-2 border-dashed border-outline/20 rounded-lg text-center text-body-medium text-outline">
            {searchQuery ? "No study rooms found matching your search query." : "You are not in any study rooms yet. Create or join one above!"}
          </div>
        ) : (
          <div className="grid gap-3">
            {(rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))).map((room) => (
              <div
                key={room.id}
                className="bg-surface p-4 rounded-lg border border-outline/10 shadow-1 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-title-small font-bold truncate text-on-surface">
                      {room.name}
                    </h4>
                    <span className="text-body-small text-on-surface-variant/80 flex items-center gap-1 mt-0.5">
                      Code: <code className="font-bold text-primary">{room.inviteCode}</code>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {room.ownerId === currentUserId && (
                    <DeleteStudyRoomBtn roomId={room.id} />
                  )}
                  <Link
                    href={`/dashboard/rooms/${room.id}`}
                    className="px-4 py-2 bg-surface border border-outline/15 text-primary text-body-small font-semibold rounded-md hover:bg-surface-variant/50 shadow-1 flex items-center justify-center"
                  >
                    Enter
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DeleteStudyRoomBtn({ roomId }: { roomId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this study room? This action cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteStudyRoomAction(roomId);
      if (!res.success) {
        alert(res.error || "Failed to delete study room");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-2 aspect-square flex items-center justify-center bg-error-container text-on-error-container border border-error/20 rounded-md hover:bg-error-container/80 disabled:opacity-50 transition-colors"
      title="Delete Study Room"
    >
      <Trash2 className="w-4 h-4 text-error" />
    </button>
  );
}
