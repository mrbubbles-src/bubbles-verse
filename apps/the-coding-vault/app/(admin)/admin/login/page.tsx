import LoginForm from '@/components/layout/auth/login-form';

const AdminLoginPage = () => {
  return (
    <section className="flex flex-col items-center justify-center gap-8 lg:min-h-screen">
      <h1 className="text-4xl">Login</h1>
      <LoginForm />
    </section>
  );
};

export default AdminLoginPage;
