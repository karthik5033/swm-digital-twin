"use client";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import React from "react";

interface ImageModalProps {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageModal({ open, src, alt, onClose }: ImageModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 z-10 bg-black/60 text-white rounded-full p-2 hover:bg-black/80 focus:outline-none"
              onClick={onClose}
              aria-label="Close"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <Image
              src={src}
              alt={alt}
              width={1400}
              height={900}
              className="rounded-xl w-full h-auto object-contain shadow-2xl"
              style={{ maxHeight: "80vh" }}
              priority
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
