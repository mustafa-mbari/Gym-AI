import type { Metadata } from "next";

import { PageContainer, PageHeader } from "@/components/page-container";
import { EquipmentBrowser } from "@/components/equipment/equipment-browser";
import { EQUIPMENT } from "@/data";

export const metadata: Metadata = { title: "Equipment" };

export default function EquipmentPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Equipment Library"
        description={`Browse ${EQUIPMENT.length} machines, learn proper form, and scan QR codes at the gym.`}
      />
      <EquipmentBrowser />
    </PageContainer>
  );
}
