import { Auth } from "@/components/features/auth";

interface LoginPageProps {
  searchParams: Promise<{ error?: string | string[] }>;
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const { error } = await searchParams;

  return (
    <Auth.AuthLayout>
      <Auth.LoginForm error={typeof error === "string" ? error : undefined} />
    </Auth.AuthLayout>
  );
};

export default LoginPage;
