'use client'

import { motion } from 'framer-motion'
import { FaTrophy, FaUsers, FaChartLine, FaMobileAlt } from 'react-icons/fa'

const features = [
  {
    icon: FaTrophy,
    title: 'Win Prizes',
    description: 'Make accurate picks and win real prizes without risking any money. We offer daily, weekly, and seasonal contests.',
  },
  {
    icon: FaUsers,
    title: 'Compete with Friends',
    description: 'Create private leagues, invite friends, and see who has the best sports knowledge. Track your standings on our leaderboards.',
  },
  {
    icon: FaChartLine,
    title: 'Track Performance',
    description: 'View detailed stats on your picking performance across different sports, teams, and bet types.',
  },
  {
    icon: FaMobileAlt,
    title: 'Mobile Friendly',
    description: 'Access SquarePicks from any device. Our responsive design works perfectly on desktop, tablet, and mobile.',
  },
]

export function FeaturesSection() {
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
              Everything You Need for Sports Predictions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              SquarePicks combines the excitement of sports betting with the safety of free-to-play contests.
            </p>
          </motion.div>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-secondary-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
        
        {/* Stats section */}
        <div className="mt-20 bg-gradient-to-r from-primary-900 to-primary-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-primary-700/50">
            {[
              { value: '100,000+', label: 'Active Users' },
              { value: '500,000+', label: 'Picks Made' },
              { value: '$250,000+', label: 'Prizes Awarded' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-primary-200">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}