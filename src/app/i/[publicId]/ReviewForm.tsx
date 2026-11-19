"use client";

import { Check, Star } from "lucide-react";
import { startTransition, useActionState, useState } from "react";
import { fill } from "@/lib/seo";
import { submitReview } from "./actions";

const COMMENT_MAX = 600;

type Words = {
  rateService: string;
  rateHint: string;
  star: string;
  commentPlaceholder: string;
  send: string;
  sending: string;
  thanks: string;
  thanksHint: string;
};

export function ReviewForm({ publicId, sellerName, words }: { publicId: string; sellerName: string; words: Words }) {
  const [state, action, pending] = useActionState(submitReview, undefined);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  if (state?.ok) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="flex items-center gap-2 font-medium">
          <Check size={16} aria-hidden /> {words.thanks}
        </p>
        <p className="mt-1">{fill(words.thanksHint, { seller: sellerName })}</p>
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData();
        data.set("publicId", publicId);
        data.set("rating", String(rating));
        data.set("comment", comment);
        startTransition(() => action(data));
      }}
      className="mt-6 rounded-xl border border-gray-200 p-4"
    >
      <p className="font-medium">{words.rateService}</p>
      <p className="mt-0.5 text-sm text-gray-500">{fill(words.rateHint, { seller: sellerName })}</p>

      <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={fill(words.star, { n })}
            aria-pressed={rating === n}
            className="p-1 transition hover:scale-110"
          >
            <Star
              size={28}
              strokeWidth={1.75}
              className={n <= shown ? "fill-amber-400 text-amber-400" : "text-gray-300"}
              aria-hidden
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={COMMENT_MAX}
        placeholder={words.commentPlaceholder}
        className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15"
      />

      {state?.error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        disabled={pending || rating === 0}
        className="mt-3 w-full rounded-full bg-[var(--brand)] py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? words.sending : words.send}
      </button>
    </form>
  );
}
