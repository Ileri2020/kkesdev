import Link from "next/link";
import { ArrowRight, BedDouble, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const feePlans = [
  { className: "JSS1", schoolFee: "₦345,000", hostelFee: "₦210,000", total: "₦555,000" },
  { className: "JSS2", schoolFee: "₦360,000", hostelFee: "₦220,000", total: "₦580,000" },
  { className: "JSS3", schoolFee: "₦375,000", hostelFee: "₦230,000", total: "₦605,000" },
  { className: "SS1", schoolFee: "₦420,000", hostelFee: "₦250,000", total: "₦670,000" },
  { className: "SS2", schoolFee: "₦440,000", hostelFee: "₦260,000", total: "₦700,000" },
  { className: "SS3", schoolFee: "₦465,000", hostelFee: "₦275,000", total: "₦740,000" },
];

export default function EnrollPage() {
  return (
    <main className="min-h-[calc(100vh-58px)] bg-gradient-to-b from-accent/[0.06] via-background to-background">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] border border-accent/15 bg-card/80 p-6 shadow-xl shadow-accent/5 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-accent">
            <GraduationCap className="h-4 w-4" />
            Admission
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Enroll at Kith & Kin International College</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Choose the class level that matches your child and review the school fee and hostel fee options. Proceed to start the admission process.
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {feePlans.map((plan) => (
            <Card key={plan.className} className="group overflow-hidden border-border/70 bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5">
              <CardHeader className="border-b border-border/70 bg-gradient-to-br from-accent/8 via-background to-background pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Academic year</CardDescription>
                    <CardTitle className="text-3xl font-bold">{plan.className}</CardTitle>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-5">
                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>School fee</span>
                    <span className="font-semibold text-foreground">{plan.schoolFee}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Hostel fee</span>
                    <span className="font-semibold text-foreground">{plan.hostelFee}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Estimated total</span>
                    <span className="text-lg font-bold text-accent">{plan.total}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button asChild className="w-full rounded-xl shadow-sm shadow-accent/15">
                  <Link href="/contact">
                    Proceed <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
              <BedDouble className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Need a hostel or fee breakdown?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Speak with the school for payment plans, admission requirements, and the most current hostel availability for your child.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
