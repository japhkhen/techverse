import { SignupForm } from "@/components/auth-form";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-extrabold">Create account</h1>
      <p className="mt-1 mb-6 text-sm text-neutral-500">Shop watches, audio, drones, and smart home gear from Accra.</p>
      <SignupForm />
    </div>
  );
}
