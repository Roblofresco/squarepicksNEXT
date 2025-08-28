import React from 'react'
import InfoPageShell from '@/components/ui/info-page-shell'
import { SectionCard } from '@/components/info/section-card'

const sections = [
  {
    title: 'Getting Started',
    items: [
      {
        title: 'How to Play',
        description: 'Learn the basics of playing SquarePicks',
        href: '/information-and-support/how-to-play',
        iconName: 'BookOpen' as const
      },
      {
        title: 'Account Guide',
        description: 'Managing your SquarePicks account',
        href: '/information-and-support/account-guide',
        iconName: 'HelpCircle' as const
      },
      {
        title: 'FAQ',
        description: 'Frequently asked questions',
        href: '/information-and-support/faq',
        iconName: 'Info' as const
      }
    ]
  },
  {
    title: 'Policies & Guidelines',
    items: [
      {
        title: 'Terms & Conditions',
        description: 'Our terms of service',
        href: '/information-and-support/terms',
        iconName: 'FileText' as const
      },
      {
        title: 'Privacy Policy',
        description: 'How we handle your data',
        href: '/information-and-support/privacy',
        iconName: 'ShieldCheck' as const
      },
      {
        title: 'Responsible Gaming',
        description: 'Gaming safely and responsibly',
        href: '/information-and-support/responsible-gaming',
        iconName: 'Scale' as const
      }
    ]
  }
]

export default function InformationAndSupportPage() {
  return (
    <InfoPageShell canvasId="info-support-constellation-canvas">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 tracking-tight">Information & Support</h1>
        <div className="grid gap-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-2xl font-semibold text-white mb-4">{section.title}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <SectionCard
                    key={item.href}
                    title={item.title}
                    description={item.description}
                    href={item.href}
                    iconName={item.iconName}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </InfoPageShell>
  )
}