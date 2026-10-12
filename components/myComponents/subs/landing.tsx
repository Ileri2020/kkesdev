"use client"

import Link from "next/link"
import Image from "next/image"
import React from 'react'
import Textview from "./textsview"
import Imgview from './imgview'

const Landing = () => {
  const textList = ["Empowering Africa Through STEM", "Creating Africas Scientific Future", "Sparking Innovation in Young Minds", "Fueling Discovery and Driving Progress", "Igniting Imaginations and Shaping the Future", "Where Science Meets Oportunity"]
  const textStyle = 'text-xl md:text-2xl font-bold font-roboto /text-outline text-foreground/80 dark:text-white w-[100vw] md:w-[500px] text-center /font-dance flex items-center justify-center text-wrap my-auto /left-[70%] /top-[30%] /absolute'
  const imguris = ["/bannerboy.png", "/bannergirl.png"]
  const quickLinks = [
    { href: "/bookshop", label: "Bookshop" },
    { href: "/student", label: "Students Portal" },
    { href: "/parent", label: "Parent Portal" },
    { href: "/teacher", label: "Teachers Portal" },
    { href: "/staff", label: "Staff Portal" },
  ]

  return (
    <div className='w-full min-h-[72vh] overflow-hidden flex justify-center z-10'>
        <div className='flex flex-col md:flex-row'>
            <div className='flex-1 flex flex-col justify-between items-center mt-[5%] md:mt-[8%]'>
              <div className='flex flex-col items-center'>
                <div className='leaf-bg bg-accent-secondary -translate-x-2 translate-y-1 m-5'>
                  <div className='leaf-bg bg-accent-tertiary translate-x-2 translate-y-1'>
                    <div className='leaf-bg bg-accent dark:bg-accent/95 px-10 md:px-14 py-2 translate-x-2 translate-y-1 text-accent-secondary font-roboto_mono text-center font-extrabold'>
                      <div className='text-3xl lg:text-4xl'>Kith and Kin </div>
                      <div className='text-white text-2xl'>International College</div>
                      <div className='mt-1 text-sm font-semibold italic text-white'>Be Resourceful</div>
                    </div>
                  </div>
                </div>
                <Textview textList={textList} textStyle={textStyle} />
              </div>

              <Imgview imgList={imguris} imgStyle='flex md:hidden w-full h-[220px] justify-center items-center overflow-hidden rounded-[25%]' />

              <div className='mt-4 flex w-screen /bg-red-600 flex-col items-stretch gap-2 mx-auto'>
                <Link href="/enroll" className='inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 font-semibold text-background shadow-lg shadow-accent/20 transition hover:scale-[1.02]'>Enroll now</Link>
                <Link href="/login" className='inline-flex w-full items-center justify-center rounded-full border-2 border-accent bg-background px-5 py-2.5 font-semibold text-accent transition hover:border-accent hover:bg-accent/5'>Login</Link>
              </div>

              <div className='mt-4 w-full max-w-[560px] overflow-hidden rounded-full border border-border/80 bg-card px-2 py-2 shadow-sm'>
                <div className='portal-marquee-track flex w-max min-w-max items-center gap-3 will-change-transform'>
                  {[...quickLinks, ...quickLinks].map((link, index) => (
                    <Link
                      key={`${link.label}-${index}`}
                      href={link.href}
                      className='inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground transition hover:border-accent/50 hover:text-accent sm:text-xs'
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className='contain-content hidden md:flex'>
                <Image src={imguris[0]} alt="Kith and Kin student image" width={520} height={520} className='h-[520px] w-auto -z-10 object-contain' />
            </div>
        </div>

        <style jsx global>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .portal-marquee-track {
            animation: marquee 26s linear infinite;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            transform: translateZ(0);
          }

          .portal-marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>
    </div>
  )
}

export default Landing
