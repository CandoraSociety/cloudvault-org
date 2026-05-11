import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { StickyNote } from "lucide-react";
import QuickNoteModal from "./QuickNoteModal";

export default function FloatingNoteButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        title="Quick note"
      >
        <StickyNote className="h-5 w-5" />
      </Button>
      <QuickNoteModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}