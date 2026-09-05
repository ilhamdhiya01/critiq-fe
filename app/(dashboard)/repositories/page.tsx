import { Repositories } from "@/components/features/repositories";

const RepositoriesPage = () => {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Repositories.RepositoryList />
    </div>
  );
};

export default RepositoriesPage;
