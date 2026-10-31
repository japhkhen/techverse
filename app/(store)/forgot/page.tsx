import { ForgotForm } from "@/components/auth-form";

export const metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-extrabold">Reset password</h1>
      <div className="mt-6"><ForgotForm /></div>
    </div>
  );
}
