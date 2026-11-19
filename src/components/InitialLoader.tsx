import { Logo } from "./Logo";

// Saytın ilk açılışında (tam səhifə yüklənməsi: ilk ziyarət, yenilənmə, birbaşa link) qısa müddət
// görünən keçid ekranı. Client-side naviqasiyalarda bu fayl yenidən render olunmur (root layout
// bir dəfə çəkilir), ona görə hər səhifə keçidində təkrar görünmür — yalnız əsl yükləmədə.
//
// Şəffaf/bulanıqlaşdırılmış fon seçildi (tünd dolğun ekran yox): arxada səhifənin öz rəngi azca
// görünür, "boş qara ekran" effekti olmur. Ən azı 300ms görünür (çox tez sönüb flash effekti
// yaratmasın deyə), amma 2.5 saniyədən çox heç vaxt qalmır (nə olursa olsun silinir).
const REMOVE_SCRIPT = `(function(){
  var MIN=300,MAX=2500,start=Date.now();
  function hide(){
    var el=document.getElementById("karvan-boot");
    if(!el||el.dataset.hidden)return;
    el.dataset.hidden="1";
    el.classList.add("karvan-boot-out");
    setTimeout(function(){el.remove();},400);
  }
  function ready(){setTimeout(hide,Math.max(0,MIN-(Date.now()-start)));}
  if(document.readyState==="complete")ready();
  else window.addEventListener("load",ready);
  setTimeout(hide,MAX);
})();`;

export function InitialLoader() {
  return (
    <>
      <style>{`
        #karvan-boot{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;
          background:rgba(255,255,255,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
          transition:opacity .4s ease;}
        html.dark #karvan-boot{background:rgba(12,13,16,.72);}
        #karvan-boot.karvan-boot-out{opacity:0;pointer-events:none;}
        #karvan-boot .karvan-boot-dots{display:flex;gap:7px;margin-top:18px;}
        #karvan-boot .karvan-boot-dot{width:7px;height:7px;border-radius:50%;background:#EC1C8C;
          animation:karvan-boot-bounce 1.1s infinite ease-in-out;}
        #karvan-boot .karvan-boot-dot:nth-child(2){animation-delay:.15s;}
        #karvan-boot .karvan-boot-dot:nth-child(3){animation-delay:.3s;}
        @keyframes karvan-boot-bounce{0%,80%,100%{transform:scale(.6);opacity:.35;}40%{transform:scale(1);opacity:1;}}
        @media (prefers-reduced-motion:reduce){#karvan-boot .karvan-boot-dot{animation:none;opacity:.8;}}
      `}</style>
      <noscript>
        <style>{"#karvan-boot{display:none}"}</style>
      </noscript>
      <div id="karvan-boot" aria-hidden="true">
        <div className="flex flex-col items-center">
          <Logo tone="light" size="lg" />
          <div className="karvan-boot-dots">
            <span className="karvan-boot-dot" />
            <span className="karvan-boot-dot" />
            <span className="karvan-boot-dot" />
          </div>
        </div>
      </div>
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: REMOVE_SCRIPT }}
      />
    </>
  );
}
