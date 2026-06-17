"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface SaveListingButtonProps {
  listingId: string;
  initialIsSaved: boolean;
}

export default function SaveListingButton({ listingId, initialIsSaved }: SaveListingButtonProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleToggleSave = async () => {
    // Optimistic UI update
    const previousState = isSaved;
    setIsSaved(!previousState);

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Revert and redirect to login if not authenticated
        setIsSaved(previousState);
        router.push("/login?message=Please log in to save this listing");
        return;
      }

      if (!previousState) {
        // Was not saved, meaning we are saving it
        const { error } = await supabase
          .from("saved_listings")
          .insert({ user_id: user.id, listing_id: listingId });
        
        if (error) {
          console.error("Error saving listing:", error);
          setIsSaved(previousState); // Revert on failure
        }
      } else {
        // Was saved, meaning we are removing it
        const { error } = await supabase
          .from("saved_listings")
          .delete()
          .match({ user_id: user.id, listing_id: listingId });
        
        if (error) {
          console.error("Error removing saved listing:", error);
          setIsSaved(previousState); // Revert on failure
        }
      }
    });
  };

  return (
    <button
      onClick={handleToggleSave}
      disabled={isPending}
      className={`group flex items-center justify-center p-2 rounded-full bg-white border shadow-sm transition-all duration-200 ${
        isSaved 
          ? "border-red-100 hover:border-red-200" 
          : "border-slate-200 hover:border-red-200"
      }`}
      aria-label={isSaved ? "Remove from saved" : "Save listing"}
    >
      <Heart
        className={`w-6 h-6 transition-all duration-200 ${
          isSaved
            ? "fill-red-500 text-red-500 scale-100 hover:scale-105 transition-transform"
            : "text-slate-400 group-hover:text-red-500 group-hover:scale-110"
        }`}
      />
    </button>
  );
}
