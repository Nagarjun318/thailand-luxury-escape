"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Ticket as TicketIcon,
  Plane,
  Bus,
  Landmark,
  User,
  CalendarDays,
  Armchair,
  ChevronRight,
  ImagePlus,
  QrCode,
  FileText,
  ExternalLink,
  Loader2,
  ScanLine,
} from "lucide-react";
import { useTripStore } from "@/lib/store";
import { uploadMedia } from "@/lib/sync";
import { extractQrFromPdf, dataUrlToFile } from "@/lib/pdf-qr";
import { PageHeader, FadeIn, useMounted, EmptyState } from "@/components/common";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { QRCode } from "@/components/qr-code";
import { PdfViewer } from "@/components/pdf-viewer";
import { formatDate, formatTime, cn } from "@/lib/utils";
import type { Ticket, TicketCategory, TicketStatus, TicketCode } from "@/lib/types";

const CATEGORY_ICON: Record<TicketCategory, React.ElementType> = {
  Flights: Plane,
  "Bus Tickets": Bus,
  Attractions: Landmark,
};

const STATUS_VARIANT: Record<
  TicketStatus,
  "success" | "warning" | "muted" | "danger"
> = {
  Confirmed: "success",
  Pending: "warning",
  Used: "muted",
  Cancelled: "danger",
};

export default function TicketsPage() {
  const mounted = useMounted();
  const { tickets, updateTicket } = useTripStore();
  const [tab, setTab] = React.useState<"All" | TicketCategory>("All");
  const [active, setActive] = React.useState<Ticket | null>(null);

  if (!mounted) return null;

  const filtered = (
    tab === "All" ? tickets : tickets.filter((t) => t.category === tab)
  )
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const selected = active
    ? tickets.find((t) => t.id === active.id) ?? null
    : null;

  return (
    <>
      <PageHeader
        title="Ticket Center"
        subtitle="All your booked tickets in one wallet"
        icon={TicketIcon}
      />

      <FadeIn className="mb-6">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as typeof tab)}
          layoutId="ticket-tab"
          tabs={[
            { value: "All", label: "All" },
            { value: "Flights", label: "Flights" },
            { value: "Bus Tickets", label: "Bus" },
            { value: "Attractions", label: "Attractions" },
          ]}
        />
      </FadeIn>

      {filtered.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="No tickets here"
          description="Tickets in this category will appear here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((ticket, i) => {
            const Icon = CATEGORY_ICON[ticket.category];
            return (
              <motion.button
                key={ticket.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -3 }}
                onClick={() => setActive(ticket)}
                className="text-left"
              >
                <Card className="relative overflow-hidden p-0">
                  {/* perforation accents */}
                  <span className="absolute left-0 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
                  <span className="absolute right-0 top-1/2 size-4 translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl glass-gold">
                      <Icon className="size-5 text-gold-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-serif text-sm font-semibold">
                          {ticket.title}
                        </p>
                        <Badge variant={STATUS_VARIANT[ticket.status]}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        #{ticket.bookingNumber} · {formatDate(ticket.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed border-white/10 px-4 py-2.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3.5 text-gold-400" />
                      {ticket.passenger}
                    </span>
                    <span className="inline-flex items-center gap-1 text-gold-300">
                      <QrCode className="size-3.5" /> View
                      <ChevronRight className="size-3.5" />
                    </span>
                  </div>
                </Card>
              </motion.button>
            );
          })}
        </div>
      )}

      <TicketDrawer
        ticket={selected}
        onClose={() => setActive(null)}
        onUpdate={(patch) => selected && updateTicket(selected.id, patch)}
      />
    </>
  );
}

function TicketDrawer({
  ticket,
  onClose,
  onUpdate,
}: {
  ticket: Ticket | null;
  onClose: () => void;
  onUpdate: (patch: Partial<Ticket>) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const pdfRef = React.useRef<HTMLInputElement>(null);
  const [pdfBusy, setPdfBusy] = React.useState(false);
  const [pdfMsg, setPdfMsg] = React.useState<string | null>(null);
  const [pdfViewOpen, setPdfViewOpen] = React.useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadMedia(file, "tickets");
    if (url) {
      onUpdate({ imageDataUrl: url });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onUpdate({ imageDataUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handlePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !ticket) return;
    setPdfBusy(true);
    setPdfMsg("Reading PDF & scanning for codes…");

    // Store the PDF first so it's saved even if scanning later fails.
    let pdfUrl: string | null = null;
    try {
      pdfUrl = await uploadMedia(file, "tickets-pdf");
      if (pdfUrl) onUpdate({ pdfUrl });
    } catch {
      /* storage not configured / offline — keep going, we can still scan */
    }

    try {
      const found = await extractQrFromPdf(file);
      if (found.length) {
        const uploaded: TicketCode[] = [];
        for (let i = 0; i < found.length; i++) {
          const c = found[i];
          let url: string | null = null;
          try {
            url = await uploadMedia(
              dataUrlToFile(c.qrImageDataUrl, `qr-${ticket.id}-${i + 1}.png`),
              "tickets-qr"
            );
          } catch {
            /* fall back to the inline data URL below */
          }
          uploaded.push({
            imageUrl: url || c.qrImageDataUrl,
            text: c.text ?? undefined,
            format: c.format,
            page: c.page,
          });
        }
        onUpdate({
          codes: uploaded,
          // Keep the single fields populated for previews / backward-compat.
          qrImageUrl: uploaded[0].imageUrl,
          qrText: uploaded[0].text,
        });
        setPdfMsg(
          uploaded.length === 1
            ? `${found[0].format} code extracted from your ticket.`
            : `${uploaded.length} codes extracted from your ticket.`
        );
      } else {
        setPdfMsg(
          pdfUrl
            ? "PDF saved, but no scannable QR/barcode was found in it."
            : "No code found and Supabase isn't configured to store the PDF."
        );
      }
    } catch {
      setPdfMsg(
        pdfUrl
          ? "PDF saved, but scanning for codes failed."
          : "Couldn't read that PDF. Try a different file."
      );
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <Drawer
      open={!!ticket}
      onClose={onClose}
      title={ticket?.title}
      description={ticket ? `Booking #${ticket.bookingNumber}` : undefined}
    >
      {ticket && (
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            {ticket.codes && ticket.codes.length > 0 ? (
              <div className="w-full">
                <div
                  className={cn(
                    "grid gap-3",
                    ticket.codes.length === 1 ? "grid-cols-1" : "grid-cols-2"
                  )}
                >
                  {ticket.codes.map((c, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.imageUrl}
                        alt={`Ticket code ${i + 1}`}
                        className="h-32 w-full rounded-lg bg-white object-contain p-1.5"
                      />
                      <div className="flex items-center gap-1.5">
                        {c.format && <Badge variant="muted">{c.format}</Badge>}
                        <span className="text-[10px] text-muted-foreground">
                          #{i + 1}
                        </span>
                      </div>
                      {c.text && (
                        <p
                          className="max-w-full truncate text-[10px] text-muted-foreground"
                          title={c.text}
                        >
                          {c.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {ticket.codes.length}{" "}
                  {ticket.codes.length > 1 ? "codes" : "code"} scanned from your
                  ticket PDF
                </p>
              </div>
            ) : ticket.qrImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ticket.qrImageUrl}
                alt="Ticket QR"
                className="size-[220px] rounded-xl border border-white/10 bg-white object-contain p-2"
              />
            ) : (
              <QRCode data={ticket.qrData} size={220} />
            )}
            {!ticket.codes?.length && (
              <p className="text-xs text-muted-foreground">
                {ticket.qrImageUrl
                  ? "Scanned from your ticket PDF"
                  : "Show this code at boarding / entry"}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info icon={User} label="Passenger" value={ticket.passenger} />
            <Info
              icon={CalendarDays}
              label="Date"
              value={`${formatDate(ticket.date)} · ${formatTime(ticket.date)}`}
            />
            {ticket.seat && (
              <Info icon={Armchair} label="Seat" value={ticket.seat} />
            )}
            <Info
              icon={TicketIcon}
              label="Status"
              value={ticket.status}
            />
          </div>

          {ticket.notes && (
            <div className="rounded-xl bg-white/[0.03] p-3 text-sm text-muted-foreground">
              <span className="text-gold-300">Notes · </span>
              {ticket.notes}
            </div>
          )}

          {/* Ticket PDF — extract QR + store the document */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ticket PDF
            </p>
            <button
              onClick={() => !pdfBusy && pdfRef.current?.click()}
              disabled={pdfBusy}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-5 text-sm text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground disabled:opacity-60"
            >
              {pdfBusy ? (
                <Loader2 className="size-5 animate-spin text-gold-400" />
              ) : ticket.pdfUrl || ticket.qrImageUrl ? (
                <ScanLine className="size-5 text-gold-400" />
              ) : (
                <FileText className="size-5 text-gold-400" />
              )}
              {pdfBusy
                ? "Scanning…"
                : ticket.pdfUrl || ticket.qrImageUrl
                  ? "Replace ticket PDF"
                  : "Upload ticket PDF & scan QR"}
            </button>
            <input
              ref={pdfRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdf}
            />
            {pdfMsg && (
              <p className="mt-2 text-xs text-muted-foreground">{pdfMsg}</p>
            )}
            {ticket.pdfUrl && (
              <button
                onClick={() => setPdfViewOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-gold-300 hover:text-gold-200"
              >
                <ExternalLink className="size-3.5" /> View full PDF
              </button>
            )}
            <PdfViewer
              url={ticket.pdfUrl ?? null}
              open={pdfViewOpen}
              onClose={() => setPdfViewOpen(false)}
            />
          </div>

          {/* Local ticket image */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ticket Image
            </p>
            {ticket.imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ticket.imageDataUrl}
                alt="Ticket"
                className="w-full rounded-xl border border-white/10"
              />
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 py-6 text-sm text-muted-foreground transition-colors hover:border-gold/40 hover:text-foreground"
              >
                <ImagePlus className="size-5 text-gold-400" />
                Upload ticket image
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            {ticket.imageDataUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={() => fileRef.current?.click()}
              >
                Replace image
              </Button>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5 text-gold-400" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
