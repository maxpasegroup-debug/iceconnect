export default function Navbar() {
  return (
    <nav className="w-full bg-[#0B1F3A] shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        <h1 className="text-2xl font-bold text-[#0EA5E9]">
          ICEConnect
        </h1>

        <div className="space-x-6 hidden md:flex items-center">
          <a href="/" className="text-gray-300 hover:text-white">
            Home
          </a>

          <a href="/register" className="text-gray-300 hover:text-white">
            Register
          </a>

          <a
            href="/login"
            className="bg-[#0EA5E9] text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition"
          >
            Login
          </a>
        </div>

      </div>
    </nav>
  );
}