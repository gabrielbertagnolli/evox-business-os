import X7Chat from "@/app/dashboard/x7/X7Chat";

export default function X7ChatDetailPage({ params }: { params: { id: string } }) {
  return <X7Chat chatId={params.id} />;
}
