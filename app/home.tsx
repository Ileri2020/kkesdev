import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import Landing from "@/components/myComponents/subs/landing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import facilities from "@/data/facilities"

const visionPoints = [
  {
    title: "Vision",
    description:
      "To be the best provider of quality and comprehensive foundation education that can lead our children to leadership positions in the emerging global economy.",
  },
  {
    title: "Mission",
    description:
      "To inspire critical thinking and unleash the talent of every KKES student through balanced opportunities, stimulating academics, and a well-trained, motivated team of staff.",
  },
  {
    title: "Values",
    description:
      "To impact exceptional values in our students thereby creating satisfaction for our parents and promoting a fulfilling career culture for our staff.",
  },
]

const Home = () => {
  return (
    <motion.section
      initial = {{ opacity: 0 }}
      animate = {{
        opacity : 1,
        transition : { delay: 0.5, duration: 0.6, ease: "easeIn"}
      }}
      className="w-[100vw] min-h-full overflow-clip flex flex-col"
    >
      <div className="relative flex md:hidden w-[100vw] justify-center">
        <Image src="/logo.png" alt="" width={600} height={600} className="flex h-[40vh] absolute top-36 opacity-15 dark:opacity-5 animate-pulse" />
      </div>

      <div className="w-full flex flex-1 justify-center">
        <Landing />
      </div>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Our promise</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A nurturing, future-ready school experience</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {visionPoints.map((point) => (
            <Card key={point.title} className="h-full border-border/70 bg-card/80 shadow-[0_14px_40px_rgba(15,23,42,0.04)]">
              <CardHeader>
                <CardTitle className="text-2xl text-accent">{point.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-7 text-foreground/80">{point.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Facilities</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Spaces that support learning and growth</h2>
          </div>
          <Link href="/about" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Explore the school</Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {facilities.facilities.map((facility) => (
            <Card key={facility.name} className="overflow-hidden border-border/70 bg-card shadow-sm transition-transform hover:-translate-y-1">
              <div className="overflow-hidden border-b border-border/70">
                <img src={facility.img} alt={facility.name} className="h-44 w-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{facility.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="leading-6 text-foreground/75">{facility.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </motion.section>
  )
}

export default Home
