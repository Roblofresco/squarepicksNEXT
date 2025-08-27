'use client'

import React from 'react';
import { Mail } from 'lucide-react';
import InfoPageShell from '@/components/info/InfoPageShell';

export default function ContactSupportPage() {
  return (
    <InfoPageShell canvasId="contact-support-constellation-canvas" showBackButton={false}>
      <div className="max-w-4xl mx-auto font-sans text-center">
        <h1 className="text-4xl font-semibold text-white mb-8 mt-4 text-shadow-glow">Contact Support</h1>
        <p className="text-lg text-gray-300 leading-relaxed mb-6">
          If you have any questions or need assistance, please don't hesitate to reach out to our support team.
        </p>
        <a
          href="mailto:contact@squarpicks.com"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-accent-1 hover:bg-accent-1/90 transition-colors duration-200"
        >
          <Mail className="mr-3 h-5 w-5" />
          Email Support: contact@squarpicks.com
        </a>
        <p className="text-md text-gray-400 leading-relaxed mt-8 mb-6">We typically respond within 24-48 business hours.</p>
      </div>
    </InfoPageShell>
  );
} 