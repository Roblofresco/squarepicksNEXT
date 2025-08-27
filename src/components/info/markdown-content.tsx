'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { motion } from 'framer-motion'

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

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
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
              target="_blank"
              rel="noopener noreferrer"
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
    </motion.div>
  )
}



