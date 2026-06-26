// Sends visitors to the login screen before the dashboard checks auth.

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/login");
}
