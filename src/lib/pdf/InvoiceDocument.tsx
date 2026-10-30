import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { formatMoney } from "@/lib/money";

export type InvoicePdfData = {
  number: string;
  issuedAt: Date;
  dueAt: Date | null;
  seller: {
    displayName: string;
    username: string;
    cardNumber: string | null;
    iban: string | null;
    bankName: string | null;
    accountName: string | null;
  };
  customer: { name: string; phone: string | null };
  items: { title: string; quantity: number; unitQepik: number }[];
  totalQepik: number;
  currency: string;
  note: string | null;
  url: string;
  primaryColor: string;
  showBranding: boolean;
};

const date = (d: Date) => d.toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });

// Standart PDF şriftlərində ə, ğ, ı, ş hərfləri yoxdur.
const fonts = path.join(process.cwd(), "assets/fonts");
Font.register({
  family: "DejaVu Sans",
  fonts: [
    { src: path.join(fonts, "DejaVuSans.ttf") },
    { src: path.join(fonts, "DejaVuSans-Bold.ttf"), fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

function InvoiceDocument({ data, qr }: { data: InvoicePdfData; qr: string }) {
  const s = StyleSheet.create({
    page: { padding: 40, fontSize: 10, color: "#1f2937", fontFamily: "DejaVu Sans" },
    header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
    title: { fontSize: 22, color: data.primaryColor, fontWeight: 700 },
    muted: { color: "#6b7280" },
    row: { flexDirection: "row", borderBottom: "1px solid #e5e7eb", paddingVertical: 6 },
    th: { flexDirection: "row", backgroundColor: data.primaryColor, color: "#fff", padding: 6 },
    c1: { flex: 4 },
    c2: { flex: 1, textAlign: "right" },
    c3: { flex: 2, textAlign: "right" },
    total: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12, fontSize: 13, fontWeight: 700 },
    box: { marginTop: 24, padding: 12, border: `1px solid ${data.primaryColor}`, borderRadius: 4 },
    footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#9ca3af" },
  });

  return (
    <Document title={`Faktura ${data.number}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>FAKTURA</Text>
            <Text style={s.muted}>№ {data.number}</Text>
            <Text style={s.muted}>Tarix: {date(data.issuedAt)}</Text>
            {data.dueAt && <Text style={s.muted}>Son ödəniş: {date(data.dueAt)}</Text>}
          </View>
          <Image src={qr} style={{ width: 80, height: 80 }} />
        </View>

        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.muted}>Satıcı</Text>
            <Text>{data.seller.displayName}</Text>
            <Text style={s.muted}>@{data.seller.username}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.muted}>Müştəri</Text>
            <Text>{data.customer.name}</Text>
            {data.customer.phone && <Text style={s.muted}>{data.customer.phone}</Text>}
          </View>
        </View>

        <View style={s.th}>
          <Text style={s.c1}>Xidmət</Text>
          <Text style={s.c2}>Say</Text>
          <Text style={s.c3}>Qiymət</Text>
          <Text style={s.c3}>Cəm</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={s.row}>
            <Text style={s.c1}>{item.title}</Text>
            <Text style={s.c2}>{item.quantity}</Text>
            <Text style={s.c3}>{formatMoney(item.unitQepik, data.currency)}</Text>
            <Text style={s.c3}>{formatMoney(item.quantity * item.unitQepik, data.currency)}</Text>
          </View>
        ))}
        <View style={s.total}>
          <Text>Ümumi: {formatMoney(data.totalQepik, data.currency)}</Text>
        </View>

        <View style={s.box}>
          <Text style={{ fontWeight: 700, marginBottom: 4 }}>Ödəniş rekvizitləri</Text>
          {data.seller.accountName && <Text>Alıcı: {data.seller.accountName}</Text>}
          {data.seller.bankName && <Text>Bank: {data.seller.bankName}</Text>}
          {data.seller.cardNumber && <Text>Kart: {data.seller.cardNumber}</Text>}
          {data.seller.iban && <Text>IBAN: {data.seller.iban}</Text>}
          <Text style={[s.muted, { marginTop: 6 }]}>Onlayn ödəniş və status: {data.url}</Text>
        </View>

        {data.note && <Text style={{ marginTop: 16 }}>{data.note}</Text>}

        <View style={s.footer}>
          <Text>Bu sənəd ödəniş sorğusudur, rəsmi vergi sənədi deyil.</Text>
          {data.showBranding && <Text>Karvan ilə yaradılıb · karvan.az</Text>}
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const qr = await QRCode.toDataURL(data.url, { margin: 0, width: 240 });
  return renderToBuffer(<InvoiceDocument data={data} qr={qr} />);
}
