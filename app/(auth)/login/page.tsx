import { Auth } from "@/components/features/auth";

const LoginPage = () => {
  return (
    <Auth.AuthLayout>
      <Auth.LoginForm />
    </Auth.AuthLayout>
  );
};

export default LoginPage;
