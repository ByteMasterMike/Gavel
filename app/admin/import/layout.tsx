import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import case",
  robots: { index: false, follow: false },
};

export default function AdminImportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
