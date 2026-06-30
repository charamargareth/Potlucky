import { Suspense } from "react";
import JoinGroupForm from "@/components/groups/JoinGroupForm";

export default function JoinGroupPage() {
  return (
    <Suspense fallback={null}>
      <JoinGroupForm />
    </Suspense>
  );
}
