'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">About HEA</h3>
            <p className="text-sm text-gray-300">
              Health Equity Australia is a Special Interest Group dedicated to advancing health equity research and practice across Australia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="text-sm space-y-2">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-accent transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/members" className="text-gray-300 hover:text-accent transition">
                  Members
                </Link>
              </li>
              <li>
                <Link href="/seminars" className="text-gray-300 hover:text-accent transition">
                  Seminars
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-gray-300 hover:text-accent transition">
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Get Involved</h3>
            <ul className="text-sm space-y-2">
              <li>
                <Link href="/register" className="text-gray-300 hover:text-accent transition">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/feedback" className="text-gray-300 hover:text-accent transition">
                  Feedback
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-300 hover:text-accent transition">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; {currentYear} Health Equity Australia. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-accent transition">
                Privacy
              </a>
              <a href="#" className="hover:text-accent transition">
                Terms
              </a>
              <a href="#" className="hover:text-accent transition">
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
