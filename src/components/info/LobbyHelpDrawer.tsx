'use client'

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

type LobbyHelpDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReplayTour?: () => void
}

export default function LobbyHelpDrawer({ open, onOpenChange, onReplayTour }: LobbyHelpDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-4 sm:p-6 bg-gradient-to-b from-background-primary/80 via-background-primary/70 to-accent-2/10 border border-white/10 text-white backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle>Lobby Help</SheetTitle>
          <SheetDescription className="text-white/70">
            Learn how Sweepstakes and Sports boards work and how to enter.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6 text-sm text-gray-300 text-center max-w-md mx-auto">
          <section>
            <h3 className="text-white font-semibold mb-2">What is Sweepstakes?</h3>
            <p>Free weekly entry. Numbers are assigned at game time. One free entry per week per user.</p>
          </section>
          <section>
            <h3 className="text-white font-semibold mb-2">How entries work</h3>
            <p>Select a number, then confirm. Paid boards show entry fees; Sweepstakes is free.</p>
          </section>
          <section>
            <h3 className="text-white font-semibold mb-2">Why dialogs appear</h3>
            <ul className="list-disc list-inside space-y-1 inline-block text-left">
              <li>Login required to enter</li>
              <li>Wallet setup for eligibility</li>
              <li>Deposit when balance is low</li>
            </ul>
          </section>
          <div className="pt-2 flex gap-3">
            <Button type="button" onClick={() => onOpenChange(false)} className="flex-1">Close</Button>
            <Button type="button" variant="outline" onClick={onReplayTour} className="flex-1">Replay tour</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}


