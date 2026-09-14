import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-5">

      <div className="w-full max-w-4xl">

        {/* HEADER */}

        <div className="text-center mb-12">

          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-4xl shadow-lg">
            🎓
          </div>

          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Examination Hall Allotment
          </h1>

          <p className="mt-4 text-lg text-slate-400">
            Welcome to the Examination Portal
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Please select how you want to continue
          </p>

        </div>


        {/* OPTIONS */}

        <div className="grid gap-6 md:grid-cols-2">

          {/* STUDENT */}

          <button
            type="button"
            onClick={() => navigate("/student")}
            className="group rounded-3xl border border-slate-700 bg-slate-900 p-8 text-left shadow-xl transition hover:-translate-y-1 hover:border-blue-500 hover:bg-slate-800"
          >

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl">
              🎓
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white">
              Student
            </h2>

            <p className="mt-3 leading-6 text-slate-400">
              Check your upcoming examination,
              examination hall and view the complete
              hall student list.
            </p>

            <div className="mt-6 font-semibold text-blue-400 group-hover:text-blue-300">
              Continue as Student →
            </div>

          </button>


          {/* STAFF */}

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="group rounded-3xl border border-slate-700 bg-slate-900 p-8 text-left shadow-xl transition hover:-translate-y-1 hover:border-emerald-500 hover:bg-slate-800"
          >

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-3xl">
              👨‍💼
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white">
              Staff
            </h2>

            <p className="mt-3 leading-6 text-slate-400">
              Login to manage examinations,
              students, halls and generate hall
              allotments.
            </p>

            <div className="mt-6 font-semibold text-emerald-400 group-hover:text-emerald-300">
              Continue as Staff →
            </div>

          </button>

        </div>


        {/* FOOTER */}

        <p className="mt-10 text-center text-xs text-slate-600">
          Examination Hall Allotment System
        </p>

      </div>

    </div>
  );
}
