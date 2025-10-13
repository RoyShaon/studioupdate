
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Printer, Loader2, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LabelForm from "@/components/pharma-guide/label-form";
import LabelPreview from "@/components/pharma-guide/label-preview";
import { convertToBanglaNumerals } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";


export type IntervalMode = "hourly" | "daily" | "meal-time";
export type MealTime = "morning" | "afternoon" | "night" | "morning-night";

export type LabelState = {
  serial: string;
  patientName: string;
  date: Date;
  shakeMode: "with" | "without";
  drops: number | '';
  cupAmount: "one_cup" | "half_cup";
  shakeCount: number | '';
  intervalMode: IntervalMode;
  interval: number | '';
  mealTime: MealTime;
  mixtureAmount: string;
  durationDays: number | '';
  counseling: string[];
  labelCount: number | '';
  followUpDays: number | '';
};

const defaultCounseling = [
  "• ঔষধ সেবনকালীন যাবতীয় ঔষধি নিষিদ্ধ।",
  "• ঔষধ সেবনের আধা ঘন্টা আগে-পরে জল ব্যতিত কোন খাবার খাবেন না।",
  "• জরুরী প্রয়োজনে <strong>বিকাল ৫টা থেকে ৭টার মধ্যে</strong> ফোন করুন।",
  "• <strong>৭ দিন</strong> পরে আসবেন।"
];

const defaultLabelState: LabelState = {
  serial: "F/",
  patientName: "",
  date: new Date(),
  shakeMode: "with",
  drops: 3,
  cupAmount: "one_cup",
  shakeCount: 10,
  intervalMode: "hourly",
  interval: 12,
  mealTime: "morning",
  mixtureAmount: "১ চামচ ঔষধ",
  durationDays: 7,
  counseling: defaultCounseling,
  labelCount: 1,
  followUpDays: 7,
};

export default function Home() {
  const [labelState, setLabelState] = useState<LabelState>(defaultLabelState);
  
  const [isClient, setIsClient] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const printContainerRef = useRef<HTMLDivElement>(null);

  // Load state from local storage on initial render
  useEffect(() => {
    setIsClient(true);
    try {
      const savedState = localStorage.getItem("pharmaLabelState");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Ensure date is a Date object
        parsedState.date = new Date(parsedState.date);
        
        // If counseling is empty or not present in saved state, set default
        if (!parsedState.counseling || parsedState.counseling.length === 0) {
          parsedState.counseling = defaultCounseling;
        }
        
        // Set default interval mode if not present
        if (!parsedState.intervalMode) {
          parsedState.intervalMode = 'hourly';
        }
         if (!parsedState.mealTime) {
          parsedState.mealTime = 'morning';
        }

        setLabelState(parsedState);
      }
    } catch (error) {
      console.error("Failed to load state from local storage:", error);
    }
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    if (isClient) {
      try {
        const stateToSave = JSON.stringify(labelState);
        localStorage.setItem("pharmaLabelState", stateToSave);
      } catch (error) {
        console.error("Failed to save state to local storage:", error);
      }
    }
  }, [labelState, isClient]);
  
  const triggerPrint = useCallback(() => {
      const container = printContainerRef.current;
      if (!container) return;

      const printableContent = document.createElement('div');
      printableContent.id = 'printable-content';

      const previews = container.querySelectorAll('.printable-label-wrapper');

      previews.forEach(previewNode => {
        const sheet = document.createElement('div');
        sheet.className = "print-page";

        const content = previewNode.cloneNode(true) as HTMLElement;
        sheet.appendChild(content);

        printableContent.appendChild(sheet);
      });

      if (printableContent.hasChildNodes()) {
        document.body.appendChild(printableContent);
        window.print();
        document.body.removeChild(printableContent);
      }
  }, []);

  const handlePrint = useCallback(() => {
    triggerPrint();
  }, [triggerPrint]);
  
  const handleClearForm = useCallback(() => {
    if (isClient) {
      localStorage.removeItem("pharmaLabelState");
    }
    setLabelState(defaultLabelState);
  }, [isClient]);

  const renderPreviews = useCallback(() => {
    const count = Number(labelState.labelCount) || 1;
    return Array.from({ length: count }, (_, i) => i + 1).map(index => (
        <div key={index} className="printable-label-wrapper mb-4">
        <LabelPreview {...labelState} activeLabelIndex={index} />
        </div>
    ));
  }, [labelState]);
  
   // Update counseling when followUpDays changes
  useEffect(() => {
    const followUpDays = labelState.followUpDays || 7;
    const followUpText = `• <strong>${convertToBanglaNumerals(followUpDays)} দিন</strong> পরে আসবেন।`;
    
    setLabelState(prevState => {
      const counseling = [...(prevState.counseling || [])];
      const followUpIndex = counseling.findIndex(c => c.includes("পরে আসবেন"));
      
      if (followUpIndex !== -1) {
        if (counseling[followUpIndex] !== followUpText) {
          counseling[followUpIndex] = followUpText;
          return {...prevState, counseling };
        }
      } else if (prevState.followUpDays) {
        counseling.push(followUpText);
        return {...prevState, counseling };
      }

      return prevState;
    });
  }, [labelState.followUpDays]);


  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }
  
  const currentLabelCount = Number(labelState.labelCount) || 1;

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight font-body text-indigo-700">
              ত্রিফুল আরোগ্য নিকেতন
            </h1>
            <p className="text-muted-foreground mt-1">
              প্রয়োজনীয় তথ্য দিয়ে ঔষধের লেবেল তৈরি এবং প্রিন্ট করুন।
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-body">রোগীর তথ্য ও নির্দেশাবলী</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearForm}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">ফর্ম পরিষ্কার করুন</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>ফর্ম পরিষ্কার করুন</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent>
              <LabelForm 
                state={labelState} 
                setState={setLabelState} 
              />
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
             <Card className="shadow-lg sticky top-8">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-semibold">ফর্মের প্রিভিউ</CardTitle>
                  <CardDescription>
                    নিচের ফরম্যাটটি প্রিন্ট লেবেলের মতো দেখাবে ({convertToBanglaNumerals('3.6')}” x {convertToBanglaNumerals('5.6')}”)। 
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div ref={printContainerRef} style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }}>
                      {renderPreviews()}
                  </div>
                </CardContent>
                 <div className="flex justify-center items-center flex-wrap gap-4 mt-6 p-6">
                    <Button onClick={handlePrint} className="text-white font-semibold py-2 px-8 rounded-lg shadow-xl transition duration-150 focus:outline-none focus:ring-4 focus:ring-primary/50">
                      <Printer className="mr-2 h-4 w-4" />
                      প্রিন্ট করুন
                    </Button>
                     <div className="max-w-xs w-full">
                        <Label htmlFor="zoom-slider">জুম লেভেল: {convertToBanglaNumerals(zoomLevel)}%</Label>
                        <Slider
                            id="zoom-slider"
                            min={50}
                            max={150}
                            step={10}
                            value={[zoomLevel]}
                            onValueChange={(value) => setZoomLevel(value[0])}
                            className="mt-2"
                        />
                    </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
    

    

    




    

    