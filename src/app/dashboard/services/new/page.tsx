import { ServiceForm } from "../ServiceForm";

export default function NewService() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Yeni xidmət</h1>
      <ServiceForm service={{ title: "", description: "", priceType: "FIXED", amount: "", duration: "" }} />
    </div>
  );
}
