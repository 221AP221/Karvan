import type { Metadata } from "next";
import { CatalogPage, catalogMetadata } from "@/components/catalog/CatalogPage";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = catalogMetadata("tr");

export default function Catalog({ searchParams }: { searchParams: SearchParams }) {
  return <CatalogPage locale="tr" searchParams={searchParams} />;
}
