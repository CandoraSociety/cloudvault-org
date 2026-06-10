import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, StickyNote } from "lucide-react";
import QuickNoteModal from "./QuickNoteModal";
import { useAuth } from "@/lib/AuthContext";

export default function FloatingNoteButton() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
        onClick={() => setShowModal(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {showModal && (
        <QuickNoteModal
          onClose={() => setShowModal(false)}
          onCreate={(newNote) => {
            setShowModal(false);
            navigate(`/notes?id=${newNote.id}`);
          }}
        />
      )}
    </>
  );
}