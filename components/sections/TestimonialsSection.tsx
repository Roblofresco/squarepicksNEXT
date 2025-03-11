'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { FaQuoteLeft, FaStar } from 'react-icons/fa'

const testimonials = [
  {
    id: 1,
    content: "SquarePicks has completely changed how I enjoy sports. I've always loved making predictions with friends, but this platform takes it to another level. The interface is intuitive, and I love competing for real prizes without having to risk my own money.",
    author: {
      name: 'Michael Johnson',
      title: 'Fantasy Sports Enthusiast',
      image: '/images/placeholder.png',
    },
    rating: 5,
  },
  {
    id: 2,
    content: "I've been using SquarePicks for about 6 months now, and it's become part of my daily routine. The variety of sports and bet types keeps things interesting, and I've actually won a few gift cards! The community is great too - very supportive and fun.",
    author: {
      name: 'Sarah Williams',
      title: 'Sports Fan',
      image: '/images/placeholder.png',
    },
    rating: 5,
  },
  {
    id: 3,
    content: "As someone who enjoys sports betting but wanted to be more responsible with my money, SquarePicks is the perfect solution. I get all the excitement of making picks and watching games, but without the financial risk. Plus, I've actually improved my prediction skills!",
    author: {
      name: 'David Chen',
      title: 'NBA Fanatic',
      image: '/images/placeholder.png',
    },
    rating: 4,
  },
  {
    id: 4,
    content: "The private leagues feature is fantastic! My friends and I have our own competition going, and it's made watching games together so much more fun. The app is well-designed and rarely has any issues. Highly recommend to any sports fans!",
    author: {
      name: 'Jessica Rodriguez',
      title: 'College Football Fan',
      image: '/images/placeholder.png',
    },
    rating: 5,
  },
]

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  
  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }
  
  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }
  
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-secondary-900">
      <div className="container-responsive">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Join thousands of satisfied users who are enjoying a new way to engage with sports.
            </p>
          </motion.div>
        </div>
        
        {/* Testimonials carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-gray-50 dark:bg-secondary-800 rounded-2xl p-8 md:p-10 shadow-md">
                    <div className="text-primary-500 mb-6">
                      <FaQuoteLeft className="w-8 h-8" />
                    </div>
                    
                    <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8">
                      "{testimonial.content}"
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden mr-4">
                          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                            Photo
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {testimonial.author.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {testimonial.author.title}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`w-5 h-5 ${
                              i < testimonial.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === activeIndex
                    ? 'bg-primary-600 dark:bg-primary-500'
                    : 'bg-gray-300 dark:bg-gray-700'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Arrow buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-10 h-10 rounded-full bg-white dark:bg-secondary-800 shadow-md flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
            aria-label="Previous testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <button
            onClick={nextTestimonial}
            className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 md:translate-x-6 w-10 h-10 rounded-full bg-white dark:bg-secondary-800 shadow-md flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors"
            aria-label="Next testimonial"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}