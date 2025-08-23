'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from 'framer-motion';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary p-0">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full min-h-screen flex flex-col">
        <div className="px-4 sm:px-6 pt-4">
          <h1 className="text-3xl font-bold">My Boards</h1>
        </div>

        <div className="px-4 sm:px-6 mt-4">
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              <Button variant="outline" size="sm">Sport ▾</Button>
              <Button variant="outline" size="sm">Status ▾</Button>
              <Button variant="outline" size="sm">Sort: Date ▾</Button>
              <div className="ml-auto w-48">
                <Input placeholder="Search" className="h-8" />
              </div>
            </div>

            <TabsContent value="active" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1,2].map((i) => (
                  <Card key={i} className="p-0 overflow-hidden border-white/10 bg-white/5">
                    <div className="p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div>Team A (logo) @ Team B (logo)</div>
                        <div>Status: OPEN</div>
                      </div>
                      <div className="text-xs text-white/70 mt-1">Sun, Aug 24 • 1:00 PM</div>
                      <div className="mt-3 border-t border-white/10 pt-2 text-sm">
                        <div className="font-medium">Your Picks</div>
                        <div className="text-white/80">- If OPEN: Indexes → 14, 27, 63</div>
                        <div className="text-white/80">- If FULL: XY → 37, 02, 94 (tap to toggle XY ↔ index)</div>
                      </div>
                      <div className="mt-3 border-t border-white/10 pt-2">
                        <div className="font-medium text-sm">Winners (live)</div>
                        <div className="mt-1 text-sm">Q1: [ 37 ]  Q2: [ -- ]  Q3: [ -- ]  Final: [ -- ]</div>
                        <div className="text-xs text-white/60">^ shows “You Won” badge if applicable</div>
                      </div>
                      <div className="mt-3 border-t border-white/10 pt-2 flex items-center justify-between">
                        <div className="text-sm">Entry: $1.00  Picks: 3  Pot: $80.00</div>
                        <Button size="sm" variant="secondary">View</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm">« Prev</Button>
                <Button variant="outline" size="sm" className="bg-white/10">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">Next »</Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <Card className="p-0 overflow-hidden border-white/10 bg-white/5">
                  <div className="p-3">
                    <div className="flex items-center justify-between text-sm">
                      <div>Team C (logo) @ Team D (logo)</div>
                      <div>Status: FULL</div>
                    </div>
                    <div className="text-xs text-white/70 mt-1">Sun, Aug 24 • 4:25 PM</div>
                    <div className="mt-3 border-t border-white/10 pt-2 text-sm">
                      <div className="font-medium">Your Picks (XY):</div>
                      <div className="text-white/80">37, 02, 10, 73</div>
                    </div>
                    <div className="mt-3 border-t border-white/10 pt-2">
                      <div className="font-medium text-sm">Winners (live)</div>
                      <div className="mt-1 text-sm">Q1: [ 37 ]★  Q2: [ 02 ]  Q3: [ -- ]  Final: [ -- ]</div>
                      <div className="text-xs text-white/60">★ “You Won”</div>
                    </div>
                    <div className="mt-3 border-t border-white/10 pt-2 flex items-center justify-between">
                      <div className="text-sm">Entry: $5.00  Picks: 4  Pot: $400.00</div>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm">« Prev</Button>
                <Button variant="outline" size="sm" className="bg-white/10">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">Next »</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}