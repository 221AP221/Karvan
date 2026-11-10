import { PageSkeleton } from "@/components/Skeleton";

// Panelin bütün bölmələri bu sərhədi paylaşır: keçid dərhal görünür,
// üstəlik dinamik səhifələr yalnız loading sərhədi olduqda prefetch olunur.
export default function Loading() {
  return <PageSkeleton />;
}
