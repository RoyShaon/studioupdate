
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


export type IntervalMode = "hourly" | "daily" | "meal-time";
export type MealTime = "none" | "morning" | "noon" | "afternoon" | "night" | "morning-night" | "morning-afternoon";

export type LabelState = {
  serial: string;
  patientName: string;
  date: Date;
  shakeMode: "with" | "without";
  drops: number | undefined;
  cupAmount: "one_cup" | "half_cup";
  shakeCount: number | undefined;
  intervalMode: IntervalMode;
  interval: number | undefined;
  mealTime: MealTime;
  mixtureAmount: string;
  durationDays: number | undefined;
  counseling: string[];
  labelCount: number;
  followUpDays: number | undefined;
};

const defaultCounseling = [
  "• ঔষধ সেবনকালীন যাবতীয় ঔষধি নিষিদ্ধ।",
  "• ঔষধ সেবনের আধা ঘন্টা আগে-পরে জল ব্যতিত কোন খাবার খাবেন না।",
  "• জরুরী প্রয়োজনে বিকাল <strong>৫টা</strong> থেকে <strong>৭টার</strong> মধ্যে ফোন করুন।",
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
  mealTime: "none",
  mixtureAmount: "১ চামচ ঔষধ",
  durationDays: 7,
  counseling: defaultCounseling,
  labelCount: 1,
  followUpDays: 7,
};

export default function Home() {
  const [labelState, setLabelState] = useState<LabelState>(() => {
    if (typeof window === 'undefined') {
      return defaultLabelState;
    }
    try {
      const savedState = localStorage.getItem("pharmaLabelState");
      if (savedState && savedState.length > 0) {
        const parsedState = JSON.parse(savedState);
        parsedState.date = new Date(parsedState.date);
        
        if (!parsedState.counseling || parsedState.counseling.length === 0) {
          parsedState.counseling = [...defaultCounseling];
        }
        
        // Ensure intervalMode and mealTime have default values if missing
        if (!parsedState.intervalMode) parsedState.intervalMode = 'hourly';
        if (parsedState.mealTime === undefined) parsedState.mealTime = 'none';

        if (parsedState.labelCount === undefined || parsedState.labelCount < 1) parsedState.labelCount = 1;
        
        return { ...defaultLabelState, ...parsedState };
      }
    } catch (error) {
      console.error("Failed to load state from local storage:", error);
    }
    
    return defaultLabelState;
  });
  
  const [isClient, setIsClient] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);
  const originalTitleRef = useRef(typeof document !== 'undefined' ? document.title : '');


  useEffect(() => {
    setIsClient(true);
    if (typeof document !== 'undefined') {
      originalTitleRef.current = document.title;
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
    const previewContainer = printContainerRef.current;
    if (!previewContainer) return;

    // Remove any existing printable content to avoid duplicates
    const existingPrintableContent = document.getElementById('printable-content');
    if (existingPrintableContent) {
        document.body.removeChild(existingPrintableContent);
    }

    const printableContent = document.createElement('div');
    printableContent.id = 'printable-content';

    const labelNodes = previewContainer.querySelectorAll('.prescription-sheet-final');
    if (labelNodes.length === 0) return;

    labelNodes.forEach(labelNode => {
        const clone = labelNode.cloneNode(true);
        printableContent.appendChild(clone);
    });

    document.body.appendChild(printableContent);
    
    if (labelState.patientName) {
      document.title = labelState.patientName;
    }

    const handleAfterPrint = () => {
      document.title = originalTitleRef.current;
      if (printableContent && printableContent.parentNode === document.body) {
          document.body.removeChild(printableContent);
      }
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    
    window.addEventListener('afterprint', handleAfterPrint);

    window.print();
  }, [labelState.patientName]);


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
       <div key={index} className="printable-label-wrapper">
         <LabelPreview {...labelState} activeLabelIndex={index} />
       </div>
    ));
  }, [labelState]);

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }
  
  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hide-on-print">
          <div>
            <h1 className="text-4xl font-bold tracking-tight font-body text-primary">
              ত্রিফুল আরোগ্য নিকেতন
            </h1>
            <p className="text-muted-foreground mt-1">
              প্রয়োজনীয় তথ্য দিয়ে ঔষধের লেবেল তৈরি এবং প্রিন্ট করুন।
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <Card className="lg:col-span-2 shadow-lg hide-on-print">
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
             <Card className="shadow-lg sticky top-8 hide-on-print">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-semibold">ফর্মের প্রিভিউ</CardTitle>
                  <CardDescription>
                    নিচের ফরম্যাটটি প্রিন্ট লেবেলের মতো দেখাবে ({convertToBanglaNumerals('3.6')}” x {convertToBanglaNumerals('5.6')}”)। 
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div ref={printContainerRef} id="preview-container">
                      {renderPreviews()}
                  </div>
                </CardContent>
                 <div className="flex justify-center items-center flex-wrap gap-4 mt-6 p-6">
                    <Button onClick={handlePrint} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-2 px-8 rounded-lg shadow-xl transition duration-150 focus:outline-none focus:ring-4 focus:ring-primary/50">
                      <Printer className="mr-2 h-4 w-4" />
                      প্রিন্ট করুন
                    </Button>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
    

    
