import { z } from "zod";
import { AiError, AiSetupError } from "@/lib/ai-provider";
import { getCurrentProfile } from "@/lib/auth";
import { CHAT_UNAVAILABLE, MAX_MESSAGE, MAX_TURNS, answer } from "@/lib/chatbot";
import { LIMITS, limitByIp, tooMany } from "@/lib/rate-limit";

const Input = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(MAX_MESSAGE) }))
    .min(1)
    .max(MAX_TURNS),
});

export async function POST(request: Request) {
  // Köməkçi ictimai nöqtədir: IP üzrə limit vacibdir (NFR-SEC-10)
  const limit = await limitByIp("chat", LIMITS.chat.max, LIMITS.chat.windowMs);
  if (!limit.ok) return tooMany(limit, "Çox sayda sual göndərildi. Bir dəqiqə sonra davam edin.");

  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Mesaj düzgün deyil" }, { status: 400 });

  // Satıcı daxil olubsa, cavab onun tarifini nəzərə alır
  const profile = await getCurrentProfile().catch(() => null);
  const context = profile
    ? ({ role: "seller", plan: profile.user.subscription?.plan ?? "FREE" } as const)
    : ({ role: "visitor" } as const);

  try {
    const reply = await answer(parsed.data.messages, context);
    return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AiSetupError) {
      console.error("chat setup", error.message);
      return Response.json({ reply: CHAT_UNAVAILABLE, unavailable: true });
    }
    if (error instanceof AiError) return Response.json({ error: error.message }, { status: 503 });
    console.error("chat", error);
    return Response.json({ error: "Gözlənilməz xəta. Bir az sonra yenidən yazın." }, { status: 500 });
  }
}
