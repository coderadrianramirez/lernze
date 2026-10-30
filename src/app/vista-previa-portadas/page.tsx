import { redirect } from "next/navigation";

/** Las portadas ya se muestran en el catálogo. Conserva los enlaces compartidos. */
export default function Page() {
  redirect("/");
}
