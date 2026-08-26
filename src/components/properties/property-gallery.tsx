"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

export function PropertyGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }
      if (event.key === "ArrowRight") {
        setActive((current) => (current + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        setActive((current) => (current - 1 + images.length) % images.length);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [images.length, lightboxOpen]);

  return (
    <div className="space-y-4">
      <div className="group relative overflow-hidden rounded-[2rem] border border-line bg-panel">
        <Image
          src={images[active]}
          alt={alt}
          width={1600}
          height={1000}
          className="h-[24rem] w-full object-cover md:h-[36rem]"
        />
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/55 px-4 py-2 text-sm text-white opacity-0 transition group-hover:opacity-100"
        >
          <Expand className="h-4 w-4" />
          Gallery
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActive(index)}
            className={`overflow-hidden rounded-[1.5rem] border transition ${
              active === index ? "border-accent shadow-lg shadow-accent/15" : "border-line"
            }`}
          >
            <Image
              src={image}
              alt={`${alt} view ${index + 1}`}
              width={800}
              height={600}
              className="h-28 w-full object-cover md:h-36"
            />
          </button>
        ))}
      </div>

      {lightboxOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/15"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setActive((current) => (current - 1 + images.length) % images.length)}
            className="absolute left-4 rounded-full border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/15"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="animate-modal-in w-full max-w-6xl">
            <Image
              src={images[active]}
              alt={`${alt} enlarged view ${active + 1}`}
              width={1800}
              height={1200}
              className="max-h-[78vh] w-full rounded-[2rem] object-cover"
            />
            <div className="mt-4 flex items-center justify-center gap-2">
              {images.map((image, index) => (
                <button
                  key={`${image}-indicator`}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`h-2.5 rounded-full transition ${active === index ? "w-10 bg-accent" : "w-2.5 bg-white/35"}`}
                  aria-label={`Open image ${index + 1}`}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActive((current) => (current + 1) % images.length)}
            className="absolute right-4 rounded-full border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/15"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
