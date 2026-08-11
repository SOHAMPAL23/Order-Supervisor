import TopBar from "@/components/layout/TopBar";
import SupervisorForm from "@/components/supervisors/SupervisorForm";

export const metadata = {
  title: "New Supervisor — Order Supervisor Console",
};

export default function NewSupervisorPage() {
  return (
    <>
      <TopBar />
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-zinc-200">
            Create Supervisor
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Define the AI agent configuration for order supervision.
          </p>
        </div>
        <SupervisorForm />
      </div>
    </>
  );
}
