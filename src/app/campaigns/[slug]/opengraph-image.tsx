import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { slug }
  });

  if (!campaign) {
    notFound();
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#f7f4ed",
          color: "#171412",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: 72,
          width: "100%"
        }}
      >
        <div style={{ color: "#d63f2f", fontSize: 32, fontWeight: 900 }}>Pull</div>
        <div>
          <div style={{ color: "#087f8c", fontSize: 34, fontWeight: 800, marginBottom: 26 }}>{campaign.city}</div>
          <div style={{ fontSize: 92, fontWeight: 950, lineHeight: 0.95 }}>{campaign.title}</div>
        </div>
        <div style={{ color: "#6d655d", fontSize: 32 }}>Demand signal open / {campaign.dateWindow}</div>
      </div>
    ),
    size
  );
}
