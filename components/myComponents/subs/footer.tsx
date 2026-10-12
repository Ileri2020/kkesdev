import Link from "next/link"
import { ArrowRight, BookOpen, MapPin, Phone, School, ShieldCheck } from "lucide-react"

const footerGroups = [
  {
    title: "School",
    links: [
      { label: "About us", href: "/about" },
      { label: "Vision", href: "/about" },
      { label: "Facilities", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Admissions",
    links: [
      { label: "Enroll now", href: "/enroll" },
      { label: "Bookshop", href: "/bookshop" },
      { label: "Student portal", href: "/student" },
      { label: "Parent portal", href: "/parent" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Login", href: "/login" },
      { label: "Account", href: "/account" },
      { label: "Results", href: "/result" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    title: "Visit",
    links: [
      { label: "Owode-Ibeshe", href: "/contact" },
      { label: "School fees", href: "/enroll" },
      { label: "Hostel fees", href: "/enroll" },
      { label: "Call us", href: "/contact" },
    ],
  },
]

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border/70 bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-xl shadow-accent/5 sm:p-7">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">Kith & Kin</p>
                  <p className="text-xs text-muted-foreground">International College</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Nurturing confident learners through quality teaching, strong values, and a stimulating school environment built for the future.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> Owode-Ibeshe, Ikorodu</span>
                <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> Contact the school</span>
              </div>
            </div>

            <div className="grid w-full max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
              {footerGroups.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{group.title}</h3>
                  <ul className="space-y-2">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
                          <ArrowRight className="h-3.5 w-3.5 text-accent" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kith & Kin International College. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-accent">
            <ShieldCheck className="h-3.5 w-3.5" />
            Be Resourceful
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
