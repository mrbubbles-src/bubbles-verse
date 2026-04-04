import Link from 'next/link';
export const metadata = {
  title: '404 | Page Not Found',
  description:
    'Oops, this page got lost in the JavaScript void. Maybe it&apos;s in another branch?',
};
export default function NotFound() {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="min-h-screen flex flex-col justify-center items-center text-center px-4 ">
      <h1 className="text-9xl font-bold mb-4 text-destructive">404</h1>
      <p className="text-2xl mb-6 max-w-md text-muted-foreground">
        Oops, this page got lost in the JavaScript void. Maybe it&apos;s in
        another branch?
      </p>
      <Link href="/" className="font-bold underline-offset-4 ">
        <span className="sr-only">Go back to Homepage</span>
        <code className="bg-muted hover:text-primary hover:underline transition-all duration-200 ease-in-out px-4 py-2 rounded text-lg text-muted-foreground mb-6">
          &gt; cd ~
        </code>
      </Link>
    </div>
  );
}
