// İki sıra, əks istiqamətdə axan sahələr zolağı (CSS animasiyası, GPU ilə, bulanıqlıqsız).
export function Marquee({ rows }: { rows: string[][] }) {
  return (
    <div className="flex flex-col gap-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      {rows.map((items, r) => (
        <div key={r} className="group flex overflow-hidden">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1}
              className={`flex shrink-0 gap-3 pr-3 group-hover:[animation-play-state:paused] ${r % 2 ? "animate-marquee-reverse" : "animate-marquee"}`}
            >
              {items.map((item) => (
                <li key={item} className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 shadow-sm sm:text-base">
                  {item}
                </li>
              ))}
            </ul>
          ))}
        </div>
      ))}
    </div>
  );
}
