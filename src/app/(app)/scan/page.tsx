import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/page-container";
import { QrScanner } from "@/components/scan/qr-scanner";

export const metadata: Metadata = { title: "Scan a machine" };

export default function ScanPage() {
  return (
    <PageContainer className="max-w-2xl">
      <PageHeader
        title="Scan a machine"
        description="Open any gym machine's guide and start the right exercise."
      />
      <QrScanner />
    </PageContainer>
  );
}
