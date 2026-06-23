"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  NotebookPen,
  Plus,
  Trash2,
  ImagePlus,
  X,
  CalendarDays,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { uploadMedia } from "@/lib/sync";
import {
  PageHeader,
  FadeIn,
  useMounted,
  EmptyState,
} from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/drawer";
import { formatDateLong } from "@/lib/utils";

const MOODS = ["✨ Excited", "😍 Amazed", "😌 Relaxed", "🤩 Thrilled", "🥹 Grateful"];

export default function JournalPage() {
  const mounted = useMounted();
  const { journal, addJournal, deleteJournal } = useTripStore();
  const [open, setOpen] = React.useState(false);

  if (!mounted) return null;

  const sorted = [...journal].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <PageHeader
        title="Travel Journal"
        subtitle="Capture every golden memory"
        icon={NotebookPen}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus /> New Entry
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No memories yet"
          description="Write your first journal entry and add photos."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus /> New Entry
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {sorted.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg font-semibold">
                        {entry.title}
                      </h3>
                      <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5 text-gold-400" />
                        {formatDateLong(entry.date)}
                        {entry.mood && <span> · {entry.mood}</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteJournal(entry.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
                    {entry.content}
                  </p>
                  {entry.photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {entry.photos.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={src}
                          alt={`Memory ${i + 1}`}
                          className="aspect-square w-full rounded-xl border border-white/10 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <JournalModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(data) => {
          addJournal(data);
          setOpen(false);
        }}
      />
    </>
  );
}

function JournalModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    mood: string;
    date: string;
    photos: string[];
  }) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [mood, setMood] = React.useState(MOODS[0]);
  const [photos, setPhotos] = React.useState<string[]>([]);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setContent("");
      setMood(MOODS[0]);
      setPhotos([]);
    }
  }, [open]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(async (file) => {
      const url = await uploadMedia(file, "journal");
      if (url) {
        setPhotos((p) => [...p, url]);
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        setPhotos((p) => [...p, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      mood,
      photos,
      date: new Date().toISOString(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="New Journal Entry">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sunset at Koh Larn"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label>Memory</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What happened today…"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Mood</Label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`rounded-xl border px-3 py-1.5 text-sm transition-colors ${
                  mood === m
                    ? "border-gold/50 bg-gold/10 text-gold-200"
                    : "border-white/10 text-muted-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Photos</Label>
          <div className="flex flex-wrap gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative size-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="size-16 rounded-xl border border-white/10 object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPhotos((p) => p.filter((_, idx) => idx !== i))
                  }
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-black/80 p-0.5 text-white"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex size-16 items-center justify-center rounded-xl border border-dashed border-white/15 text-muted-foreground hover:border-gold/40 hover:text-foreground"
            >
              <ImagePlus className="size-5" />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Save Entry
          </Button>
        </div>
      </form>
    </Modal>
  );
}
