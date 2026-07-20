import Link from "next/link";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-primary">
              <Logo size={30} />
              <span className="font-serif text-base font-bold text-foreground">
                Health Equity Australasia
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              A community of researchers, practitioners and students advancing
              health equity research across Australia, Aotearoa New Zealand and
              beyond.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-2.5">
              <div className="font-semibold">Explore</div>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link className="hover:text-foreground" href="/about/">About the SIG</Link></li>
                <li><Link className="hover:text-foreground" href="/seminars/">Seminar series</Link></li>
                <li><Link className="hover:text-foreground" href="/blog/">Blog</Link></li>
                <li><Link className="hover:text-foreground" href="/research/">Member research</Link></li>
              </ul>
            </div>
            <div className="space-y-2.5">
              <div className="font-semibold">Community</div>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link className="hover:text-foreground" href="/members/">Member directory</Link></li>
                <li><Link className="hover:text-foreground" href="/noticeboard/">Noticeboard</Link></li>
                <li><Link className="hover:text-foreground" href="/register/">Become a member</Link></li>
                <li><Link className="hover:text-foreground" href="/about/#contact">Contact us</Link></li>
              </ul>
            </div>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="font-semibold text-foreground">Acknowledgement</div>
            <p className="leading-relaxed">
              We acknowledge the Traditional Custodians of the lands on which we
              live and work across Australia, and Māori as tangata whenua of
              Aotearoa New Zealand. We pay our respects to Elders past and
              present, and are committed to equity in health for all peoples.
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Health Equity Australasia — Health Equity Special Interest Group</span>
          <span>Built with Next.js &amp; Supabase</span>
        </div>
      </div>
    </footer>
  );
}
