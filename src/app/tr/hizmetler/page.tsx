import type { Metadata } from "next";
import { CatalogPage, catalogMetadata } from "@/components/catalog/CatalogPage";
import type { SearchParams } from "@/lib/search-params";

export function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  return searchParams.then((sp) => catalogMetadata("tr", sp));
}

export default function Catalog({ searchParams }: { searchParams: SearchParams }) {
  return <CatalogPage locale="tr" searchParams={searchParams} />;
}
