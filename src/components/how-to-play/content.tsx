'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, AlertCircle } from 'lucide-react'
import { m as motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

interface HowToPlayContentProps {
  content: string;
}

export function HowToPlayContent({ content }: HowToPlayContentProps) {
  return (
    <motion.div 
      className="max-w-4xl mx-auto font-sans"
      variants={container}
      initial="hidden"
      animate="show"
    >

      <ReactMarkdown
        components={{
          h1: ({ ...props }) => (
            <h1 
              className="text-4xl font-bold text-white mb-8 mt-4 tracking-tight"
              style={{
                textShadow: '0 0 10px rgba(88, 85, 228, 0.3), 0 0 20px rgba(88, 85, 228, 0.2), 0 0 30px rgba(88, 85, 228, 0.1)'
              }}
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-3xl font-semibold text-white mb-6 mt-12 tracking-tight" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-2xl font-semibold text-white mb-4 mt-8 tracking-tight" {...props} />
          ),
          p: ({ ...props }) => (
            <p className="text-base text-gray-300 leading-7 mb-6" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2 marker:text-accent-1" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="my-6 ml-6 list-decimal [&>li]:mt-2 marker:text-accent-1" {...props} />
          ),
          li: ({ ...props }) => (
            <li className="text-base text-gray-300" {...props} />
          ),
          strong: ({ ...props }) => (
            <strong className="font-semibold text-white" {...props} />
          ),
          em: ({ ...props }) => (
            <em className="italic text-accent-1/90" {...props} />
          ),
          a: ({ ...props }) => (
            <a
              className="font-medium text-accent-1 underline underline-offset-4 hover:text-accent-1/80 transition-colors"
              {...props}
            />
          ),
          hr: ({ ...props }) => (
            <hr className="my-8 border-t border-white/10" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      <Card className="mt-12 bg-accent-1/5 border-accent-1/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-accent-1" />
            Need Help?
          </CardTitle>
          <CardDescription className="text-gray-300">
            Still have questions? Our support team is here to help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">
            Contact our support team through the{' '}
            <a 
              href="/contact-support" 
              className="font-medium text-accent-1 underline underline-offset-4 hover:text-accent-1/80 transition-colors"
            >
              Contact Support
            </a>
            {' '}for assistance.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
