import AddFlightForm from '@/components/AddFlightForm';

export default function AddFlightPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black">Track a new flight</h1>
        <p className="text-slate-500 mt-1 text-sm">
          We will check the cheapest available price twice daily and show you how it changes over time.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <AddFlightForm />
      </div>
    </div>
  );
}
