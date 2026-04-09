const MainWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-4 pb-8 mb-4">
      {children}
    </main>
  );
};

export default MainWrapper;
