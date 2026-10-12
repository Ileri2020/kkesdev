"use client"

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import type { StaticImageData } from 'next/image'

const Imgview = (props: { imgList: (string | StaticImageData)[]; imgStyle: string }) => {
    const [index, setIndex] = useState(0)
    const [items] = useState(props.imgList)

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % items.length)
        }, 5500)
        return () => clearInterval(interval)
    }, [items])

    const currentImage = typeof items[index] === 'string' ? items[index] : items[index].src

    return (
        <div className='w-full max-w-[320px] my-2 flex justify-center md:hidden'>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentImage}
                    className={props.imgStyle}
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.04, y: -8 }}
                    transition={{ duration: 1.1, ease: 'easeInOut' }}
                >
                    <Image src={currentImage} alt="Kith and Kin student showcase" width={800} height={800} className='h-full w-full object-contain drop-shadow-lg' />
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

export default Imgview
