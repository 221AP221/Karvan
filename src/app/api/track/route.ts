import { z } from "zod";
import { detectDevice, detectSource, isBot } from "@/lib/analytics";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";

const Input = z.object({
  u: z.string().max(40), // səhifə (username)
  t: z.enum(["VIEW", "ORDER_OPEN", "PHONE_CLICK", "LINK_CLICK"]),
  v: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/), // anonim ziyarətçi id-si
  r: z.string().max(500).optional(), // document.referrer
  s: z.string().max(40).optional(), // ?s=ig / ?utm_source=
  x: z.string().max(200).optional(), // hədəf: xidmət, platforma, link
});

// sendBeacon text/plain göndərir, ona görə body-ni özümüz oxuyuruq. Cavab həmişə 204-dür.
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return done;

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return done;
  }
  const parsed = Input.safeParse(body);
  if (!parsed.success) return done;
  const { u, t, v, r, s, x } = parsed.data;

  const profile = await db.profile.findUnique({ where: { username: u.toLowerCase() }, select: { id: true } });
  if (!profile) return done;
  // Satıcının öz baxışları statistikanı pozmasın
  const viewer = await getCurrentProfile();
  if (viewer?.id === profile.id) return done;

  // Klik hadisələri ziyarətin mənbəyini daşıyır (Instagram-dan gəlib zəng edən → Instagram)
  const visit =
    t === "VIEW"
      ? null
      : await db.profileEvent.findFirst({
          where: { profileId: profile.id, visitorId: v, type: "VIEW" },
          orderBy: { createdAt: "desc" },
          select: { source: true },
        });

  await db.profileEvent.create({
    data: {
      profileId: profile.id,
      type: t,
      visitorId: v,
      source: visit?.source ?? detectSource({ tag: s, referrer: r, userAgent, ownHost: new URL(request.url).hostname }),
      device: detectDevice(userAgent),
      target: x || null,
    },
  });
  return done;
}
