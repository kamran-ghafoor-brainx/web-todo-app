

function App() {
 
  return (
   <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <section className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-semibold text-gray-900">Log in</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome back to your todos.</p>

        <label htmlFor="email" className="mt-6 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
        />

        <button
          type="button"
          className="mt-6 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          Log in
        </button>
      </section>
    </main>
  )
}

export default App
