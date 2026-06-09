"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, CameraOff, Loader2, ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EQUIPMENT } from "@/data";

type Html5QrcodeInstance = {
  start: (
    camera: { facingMode: string },
    config: { fps: number; qrbox: number },
    onSuccess: (text: string) => void,
    onError: (err: string) => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

const READER_ID = "jym-qr-reader";

/** Extract a machine slug from a scanned URL or raw code. */
function parseCode(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/\/m\/([a-z0-9-]+)/i);
  if (match) return match[1];
  try {
    const u = new URL(trimmed);
    const seg = u.pathname.split("/").filter(Boolean).pop();
    if (seg) return seg;
  } catch {
    // not a URL
  }
  return trimmed.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function QrScanner() {
  const router = useRouter();
  const [scanning, setScanning] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [manual, setManual] = React.useState("");
  const instanceRef = React.useRef<Html5QrcodeInstance | null>(null);

  const stop = React.useCallback(async () => {
    const inst = instanceRef.current;
    if (inst) {
      try {
        await inst.stop();
        inst.clear();
      } catch {
        // ignore
      }
      instanceRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!scanning) return;
    let active = true;

    (async () => {
      setStarting(true);
      setError(null);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!active) return;
        const inst = new Html5Qrcode(READER_ID) as unknown as Html5QrcodeInstance;
        instanceRef.current = inst;
        await inst.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (text) => {
            const slug = parseCode(text);
            void stop();
            router.push(`/m/${slug}`);
          },
          () => {}
        );
      } catch {
        if (active)
          setError(
            "Couldn't access the camera. Grant permission, or enter the code / pick a machine below."
          );
        setScanning(false);
      } finally {
        if (active) setStarting(false);
      }
    })();

    return () => {
      active = false;
      void stop();
    };
  }, [scanning, router, stop]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div
            id={READER_ID}
            className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border bg-muted [&_video]:size-full [&_video]:object-cover"
          >
            {!scanning && (
              <div className="flex size-full flex-col items-center justify-center gap-4 p-6 text-center">
                <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ScanLine className="size-8" />
                </span>
                <p className="text-sm text-muted-foreground">
                  Point your camera at a machine&apos;s QR code to open it
                  instantly.
                </p>
              </div>
            )}
          </div>

          <div className="mx-auto mt-4 flex max-w-sm justify-center">
            {scanning ? (
              <Button variant="outline" onClick={() => setScanning(false)}>
                <CameraOff className="size-4" /> Stop camera
              </Button>
            ) : (
              <Button size="lg" onClick={() => setScanning(true)} disabled={starting}>
                {starting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
                Start camera
              </Button>
            )}
          </div>

          {error && (
            <p className="mx-auto mt-3 max-w-sm text-center text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Manual entry */}
      <div className="flex gap-2">
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Enter a machine code…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && manual.trim())
              router.push(`/m/${parseCode(manual)}`);
          }}
        />
        <Button
          variant="secondary"
          disabled={!manual.trim()}
          onClick={() => router.push(`/m/${parseCode(manual)}`)}
        >
          Open
        </Button>
      </div>

      {/* Browse fallback */}
      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Or pick a machine
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EQUIPMENT.slice(0, 9).map((e) => (
            <Button
              key={e.slug}
              variant="outline"
              asChild
              className="h-auto justify-start py-2.5 text-left"
            >
              <Link href={`/m/${e.slug}`}>
                <span className="truncate text-sm">{e.name}</span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
