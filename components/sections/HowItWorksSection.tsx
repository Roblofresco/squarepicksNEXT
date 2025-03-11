'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const steps = [
  {
    number: '01',
    title: 'Create an Account',
    description: 'Sign up for free in less than a minute. No credit card required.',
    image: '/images/placeholder.png',
  },
  {
    number: '02',
    title: 'Choose Your Sports',
    description: 'Select from NFL, NBA, MLB, NHL, and more. Pick your favorite leagues to follow.',
    image: '/images/placeholder.png',
  },
  {
    number: '03',
    title: 'Make Your Picks',
    description: 'Predict outcomes for upcoming games. Choose winners, point spreads, over/unders, and more.',
    image: '/images/placeholder.png',
  },
  {
    number: '04',
    title: 'Win Prizes',
    description: 'Earn points for correct picks and climb the leaderboard. Redeem points for real prizes.',
    image: '/images/placeholder.png',
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-secondary-800">
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
              How SquarePicks Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Get started in minutes and join the community of sports enthusiasts making picks and winning prizes.
            </p>
          </motion.div>
        </div>
        
        {/* Steps */}
        <div className="space-y-20 md:space-y-24">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } items-center gap-8 md:gap-12`}
            >
              {/* Image */}
              <div className="w-full md:w-1/2">
                <div className="relative aspect-video bg-gray-200 dark:bg-secondary-700 rounded-xl overflow-hidden shadow-md">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Step {step.number} Image
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="w-full md:w-1/2">
                <div className="inline-block text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full mb-4">
                  Step {step.number}
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {step.title}
                </h3>
                
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  {step.description}
                </p>
                
                {/* Additional details specific to each step */}
                {step.number === '01' && (
                  <div className="bg-white dark:bg-secondary-700 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">Quick Signup:</span> Use your email or connect with Google, Facebook, or Apple.
                    </p>
                  </div>
                )}
                
                {step.number === '02' && (
                  <div className="flex flex-wrap gap-2">
                    {['NFL', 'NBA', 'MLB', 'NHL', 'Soccer'].map((sport) => (
                      <div key={sport} className="bg-white dark:bg-secondary-700 px-3 py-1 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                        {sport}
                      </div>
                    ))}
                  </div>
                )}
                
                {step.number === '03' && (
                  <div className="grid grid-cols-2 gap-3">
                    {['Game Winners', 'Point Spreads', 'Over/Unders', 'Player Props'].map((type) => (
                      <div key={type} className="bg-white dark:bg-secondary-700 p-2 rounded-lg text-sm text-center font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                        {type}
                      </div>
                    ))}
                  </div>
                )}
                
                {step.number === '04' && (
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      1st
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Top Prize</div>
                      <div className="font-bold text-gray-900 dark:text-white">$1,000 Amazon Gift Card</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}