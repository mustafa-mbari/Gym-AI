import QRCode from "qrcode";

import { siteUrl } from "@/lib/supabase/config";

/**
 * Server-rendered QR code that deep-links to the machine's scan page
 * (`/m/<slug>`). Generated at request time as a data URL — no external calls.
 */
export async function MachineQR({
  slug,
  size = 168,
}: {
  slug: string;
  size?: number;
}) {
  const url = `${siteUrl}/m/${slug}`;
  const dataUrl = await QRCode.toDataURL(url, {
    margin: 1,
    width: size * 2,
    color: { dark: "#0b0f0d", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={`QR code for ${slug}`}
          width={size}
          height={size}
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Scan in the gym to open this machine
      </p>
    </div>
  );
}
