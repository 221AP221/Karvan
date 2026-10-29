// Tam satıcı + müştəri axını. Boş bazada işlədin: npm run build && npm start, sonra node e2e/smoke.cjs
// (leyla@example.az istifadəçisi yaradır; təkrar üçün əvvəlcə onu silin).
const { chromium } = require("playwright");
const S = process.argv[2] ?? "e2e/output";
require("fs").mkdirSync(`${S}/shots`, { recursive: true });
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
(async () => {
  const browser = await chromium.launch();
  const seller = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  const errors = [];
  seller.on("pageerror", (e) => errors.push(e.message));
  const shot = (p, name) => p.screenshot({ path: `${S}/shots/${name}.png`, fullPage: true });
  const step = (m) => console.log("•", m);

  // 1. Qeydiyyat
  await seller.goto(BASE + "/signup");
  await seller.fill('[name=displayName]', "Leyla Həsənova");
  await seller.fill('[name=username]', "leyla.makeup");
  await seller.fill('[name=email]', "leyla@example.az");
  await seller.fill('[name=password]', "sifre12345");
  await seller.click("button:has-text('Hesab yarat')");
  await seller.waitForURL("**/dashboard/profile");
  step("qeydiyyat → " + seller.url());

  // 2. Profil
  await seller.fill('textarea[name=bio]', "Peşəkar makiyaj ustası · Bakı · Toy və gündəlik makiyaj");
  await seller.fill('[name=city]', "Bakı");
  await seller.fill('input[type=color]', "#db2777");
  await seller.fill('[name=accountName]', "Leyla Həsənova");
  await seller.fill('[name=bankName]', "Kapital Bank");
  await seller.fill('[name=cardNumber]', "4169 7388 1234 5678");
  await seller.fill('[name=iban]', "AZ12 XXXX"); // səhv IBAN
  await seller.click("button:has-text('Yadda saxla')");
  await seller.waitForSelector("text=IBAN AZ ilə başlamalı");
  step("səhv IBAN xətası göründü; bio saxlanıb? " + (await seller.inputValue("textarea[name=bio]")).slice(0, 20));
  await seller.fill('[name=iban]', "");
  await seller.click("button:has-text('Yadda saxla')");
  await seller.waitForSelector("text=Yadda saxlanıldı");
  step("profil saxlanıldı");
  await seller.selectOption('select[name=platform]', "INSTAGRAM");
  await seller.fill('input[name=label]', "Instagram");
  await seller.fill('input[name=url]', "https://instagram.com/leyla.makeup");
  await seller.click("button:has-text('Link əlavə et')");
  await seller.waitForSelector("text=https://instagram.com/leyla.makeup");
  await seller.selectOption('select[name=platform]', "WHATSAPP");
  await seller.fill('input[name=label]', "WhatsApp ilə yazın");
  await seller.fill('input[name=url]', "https://wa.me/994551112233");
  await seller.click("button:has-text('Link əlavə et')");
  await seller.waitForSelector("text=https://wa.me/994551112233");
  step("2 link əlavə olundu");
  await shot(seller, "01-profile");

  // 3. Xidmətlər
  for (const svc of [
    { title: "Gündəlik makiyaj", desc: "Təbii görünüş, 1 saat, keyfiyyətli kosmetika ilə.", type: "FIXED", amount: "40", duration: "60 dəq" },
    { title: "Gəlin makiyajı", desc: "Toy günü üçün sınaq makiyajı daxil, ünvana gəlmə mümkündür.", type: "NEGOTIABLE", amount: "", duration: "3 saat" },
  ]) {
    await seller.goto(BASE + "/dashboard/services/new");
    await seller.fill('[name=title]', svc.title);
    await seller.fill('textarea[name=description]', svc.desc);
    await seller.check(`input[value=${svc.type}]`);
    if (svc.amount) await seller.fill('[name=amount]', svc.amount);
    await seller.fill('[name=duration]', svc.duration);
    await seller.click("button:has-text('Yadda saxla')");
    await seller.waitForURL("**/dashboard/services");
  }
  step("2 xidmət yaradıldı");
  await shot(seller, "02-services");

  // 4. Müştəri: ictimai səhifə (mobil)
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const customer = await ctx.newPage();
  customer.on("pageerror", (e) => errors.push(e.message));
  await customer.goto(BASE + "/leyla.makeup");
  await shot(customer, "03-public-page");
  await customer.click("button:has-text('Sifariş et')");
  await customer.fill('[name=customerName]', "Nərmin Quliyeva");
  await customer.fill('[name=customerPhone]', "050 123 45 67");
  await customer.click("button:has-text('Fakturanı al')");
  await customer.waitForURL("**/i/**");
  step("sabit qiymət → faktura: " + customer.url());
  await shot(customer, "04-customer-invoice");
  const pdf = await customer.request.get(BASE + (await customer.getAttribute("a:has-text('PDF yüklə')", "href")));
  step("PDF: " + pdf.status() + " " + pdf.headers()["content-type"] + " " + (await pdf.body()).length + " bayt");
  require("fs").writeFileSync(`${S}/shots/invoice.pdf`, await pdf.body());
  await customer.click("button:has-text('Ödədim')");
  await customer.waitForSelector("text=Satıcının təsdiqi gözlənilir");
  step("müştəri 'Ödədim' basdı");

  // Razılaşma ilə xidmət
  await customer.goto(BASE + "/leyla.makeup");
  await customer.click("button:has-text('Qiymət soruş')");
  await customer.fill('[name=customerName]', "Aysel Məmmədli");
  await customer.fill('[name=customerPhone]', "+994 55 765 43 21");
  await customer.fill('textarea[name=note]', "15 iyun toy, Xətai rayonu, ünvana gələ bilərsiniz?");
  await customer.click("button:has-text('Sorğu göndər')");
  await customer.waitForSelector("text=Sorğunuz göndərildi");
  step("razılaşma sorğusu göndərildi");

  // 5. Satıcı: ödənişi təsdiqlə
  await seller.goto(BASE + "/dashboard");
  await shot(seller, "05-dashboard-before");
  await seller.click("a:has-text('Nərmin Quliyeva')");
  await seller.waitForSelector("text=Müştəri ödədiyini bildirib");
  await shot(seller, "06-invoice-claimed");
  await seller.click("button:has-text('Pul gəlib, təsdiqlə')");
  await seller.waitForSelector("text=Ödənilib:");
  step("satıcı ödənişi təsdiqlədi");

  // 6. Sorğunu təsdiqlə
  await seller.goto(BASE + "/dashboard/orders");
  await shot(seller, "07-orders");
  await seller.fill('[name=amount]', "180");
  await seller.selectOption('select[name=dueDays]', "7");
  await seller.click("button:has-text('Təsdiqlə və faktura göndər')");
  await seller.waitForURL("**/dashboard/invoices/c*");
  step("sorğu təsdiqləndi → " + seller.url());
  await shot(seller, "08-invoice-detail");
  const wa = await seller.getAttribute("a:has-text('WhatsApp ilə göndər')", "href");
  step("WhatsApp linki: " + decodeURIComponent(wa).slice(0, 120));

  // 7. Əl ilə faktura (AI-sız) + validasiya
  await seller.goto(BASE + "/dashboard/invoices/new");
  await seller.fill('[name=customerName]', "Günay Əliyeva");
  await seller.click("button:has-text('Faktura yarat')");
  await seller.waitForSelector("text=Hər sətirdə xidmətin adı olmalıdır");
  step("boş sətir xətası; ad qaldı? " + (await seller.inputValue('[name=customerName]')));
  await seller.fill('[aria-label=Xidmət]', "Kirpik laminasiyası");
  await seller.fill('[aria-label=Say]', "2");
  await seller.fill('[aria-label=Qiymət]', "25,50");
  await seller.click("text=+ Sətir əlavə et");
  await seller.locator('[aria-label=Xidmət]').nth(1).fill("Qaş dizaynı");
  await seller.locator('[aria-label=Qiymət]').nth(1).fill("15");
  await shot(seller, "09-new-invoice");
  await seller.click("button:has-text('Faktura yarat')");
  await seller.waitForURL("**/dashboard/invoices/c*");
  step("əl ilə faktura: " + (await seller.textContent("h1")));

  // 8. AI (açarsız) zərif xəta
  await seller.goto(BASE + "/dashboard/invoices/new");
  await seller.fill("textarea", "Səbinə, 2 makiyaj 40 manatdan");
  await seller.click("button:has-text('Fakturaya çevir')");
  await seller.waitForSelector("text=AI qoşulmayıb");
  step("AI açarı olmadan xəta mesajı göstərildi");

  // 9. Limit: 5-ci fakturadan sonra
  for (let i = 0; i < 3; i++) {
    await seller.goto(BASE + "/dashboard/invoices/new");
    await seller.fill('[name=customerName]', "Test " + i);
    await seller.fill('[aria-label=Xidmət]', "Test");
    await seller.fill('[aria-label=Qiymət]', "10");
    await seller.click("button:has-text('Faktura yarat')");
    const r = await Promise.race([
      seller.waitForURL("**/dashboard/invoices/c*").then(() => "ok"),
      seller.waitForSelector("text=Pulsuz planda").then(() => "limit"),
    ]);
    step(`faktura ${i + 4}: ${r}`);
  }
  await seller.goto(BASE + "/dashboard");
  await shot(seller, "10-dashboard-after");

  // 10. Çıxış / giriş
  await seller.click("button:has-text('Çıxış')");
  await seller.waitForURL("**/login");
  await seller.goto(BASE + "/dashboard");
  step("çıxışdan sonra /dashboard → " + seller.url());
  await seller.fill('[name=email]', "leyla@example.az");
  await seller.fill('[name=password]', "yanlis");
  await seller.click("button:has-text('Daxil ol')");
  await seller.waitForSelector("text=E-poçt və ya şifrə yanlışdır");
  await seller.fill('[name=password]', "sifre12345");
  await seller.click("button:has-text('Daxil ol')");
  await seller.waitForURL("**/dashboard");
  step("yenidən giriş OK");

  console.log("JS xətaları:", errors.length ? errors : "yoxdur");
  await browser.close();
})().catch((e) => { console.error("UĞURSUZ:", e.message); process.exit(1); });
