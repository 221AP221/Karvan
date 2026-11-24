import { NextResponse } from "next/server";
import { DEFAULT_DURATION_MIN, freeSlots, parseDay } from "@/lib/booking";
import { db } from "@/lib/db";
import { LIMITS, limitByIp, tooMany } from "@/lib/rate-limit";

/** Müştəri tərəfi: seçilmiş gündə boş saatlar (FR-REZ-03). Dolu vaxtlar heç vaxt qaytarılmır. */
export async function GET(request: Request) {
  const limit = await limitByIp("slots", LIMITS.slots.max, LIMITS.slots.windowMs);
  if (!limit.ok) return tooMany(limit, "Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.");

  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId") ?? "";
  const day = parseDay(url.searchParams.get("day") ?? "");
  if (!serviceId || !day) return NextResponse.json({ error: "Tarix düzgün deyil" }, { status: 400 });

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: {
      isActive: true,
      blocked: true,
      durationMin: true,
      location: true,
      profileId: true,
      profile: {
        select: {
          bookingEnabled: true,
          bufferMin: true,
          travelBufferMin: true,
          workDays: true,
          workStart: true,
          workEnd: true,
          user: { select: { blockedAt: true } },
        },
      },
    },
  });
  if (!service || !service.isActive || service.blocked || service.profile.user.blockedAt) {
    return NextResponse.json({ error: "Xidmət tapılmadı" }, { status: 404 });
  }
  if (!service.profile.bookingEnabled) return NextResponse.json({ slots: [], booking: false });

  const slots = await freeSlots(
    service.profileId,
    service.profile,
    day,
    service.durationMin ?? DEFAULT_DURATION_MIN,
    service.location,
  );
  return NextResponse.json({ slots, booking: true, needsAddress: service.location === "CUSTOMER" });
}
