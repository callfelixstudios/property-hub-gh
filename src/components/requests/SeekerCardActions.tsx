"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight } from "lucide-react";

interface SeekerCardActionsProps {
  requestId: string;
  whatsappLink: string;
}

export default function SeekerCardActions({ requestId, whatsappLink }: SeekerCardActionsProps) {
  const router = useRouter();

  const handleViewDetails = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push(`/login?next=/requests/${requestId}`);
    } else {
      router.push(`/requests/${requestId}`);
    }
  };

  const handlePitch = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push(`/login?next=/requests`);
    } else {
      window.open(whatsappLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleViewDetails}
        className="flex-1 py-3 px-4 bg-white hover:bg-gray-100 text-navy-base font-medium rounded-xl transition-colors border border-gray-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        View Details
        <ArrowRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={handlePitch}
        className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        Pitch Available Property
        <ArrowRight className="w-4 h-4" />
      </button>
    </>
  );
}
