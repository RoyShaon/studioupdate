
import type { Dispatch, SetStateAction } from "react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import type { LabelState, IntervalMode, MealTime } from "@/app/page";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, PlusCircle, XCircle, ChevronDown, Mic } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn, convertToBanglaNumerals } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";


interface LabelFormProps {
  state: LabelState;
  setState: Dispatch<SetStateAction<LabelState>>;
}

const predefinedCounseling: string[] = [
  "• ঔষধ সেবনকালীন যাবতীয় ঔষধি নিষিদ্ধ।",
  "• ঔষধ সেবনের আধা ঘন্টা আগে-পরে জল ব্যতিত কোন খাবার খাবেন না।",
  "• জরুরী প্রয়োজনে বিকাল <strong>৫টা</strong> থেকে <strong>৭টার</strong> মধ্যে ফোন করুন।",
  `• <strong>৭ দিন</strong> পরে আসবেন।`,
  "• টক জাতীয় খাবার খাবেন না।",
  "• কাঁচা পিয়াজ-রসুন খাবেন না।",
  "• অ্যালার্জিযুক্ত সকল খাবার খাবেন।",
  "• রাত্রি জাগরণ করবেন না।",
  "• নিয়মিত প্রেসার/ডায়াবেটিসের ঔষধ খাবেন।",
  "• ঠান্ডা জাতীয় খাবার খাবেন না।",
  "• বমি, পাতলা পায়খানা, সর্দি হলে অবশ্যই জানাবেন।",
  "• অতিরিক্ত দেয়া ঔষধ ফোন না করে খাবেন না।"
];

// Check for SpeechRecognition API
const SpeechRecognition =
  (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));

export default function LabelForm({ state, setState }: LabelFormProps) {
  const [selectedCounseling, setSelectedCounseling] = useState<string>("");
  const [customCounseling, setCustomCounseling] = useState("");
  const [isCounselingOpen, setIsCounselingOpen] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const patientNameInputRef = useRef<HTMLInputElement>(null);
  const finalTranscriptRef = useRef<string>("");


  useEffect(() => {
    if (!SpeechRecognition) {
      setSpeechRecognitionSupported(false);
      return;
    }

    setSpeechRecognitionSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'bn-BD';
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
        let interim_transcript = '';
        let final_transcript_piece = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript_piece += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        
        if (final_transcript_piece) {
            finalTranscriptRef.current += final_transcript_piece + ' ';
        }

        const nameInput = patientNameInputRef.current;
        if(nameInput) {
            const start = nameInput.selectionStart ?? finalTranscriptRef.current.length;
            const end = nameInput.selectionEnd ?? finalTranscriptRef.current.length;
            
            const currentVal = finalTranscriptRef.current;
            
            // If there's a selection, replace it. Otherwise, insert at cursor.
            const textBefore = currentVal.substring(0, start);
            const textAfter = currentVal.substring(end);

            const newText = textBefore.trimEnd() + (interim_transcript ? " " + interim_transcript : "") + textAfter;
            
            setState(prevState => ({ ...prevState, patientName: newText.trimStart() }));

        } else {
             setState(prevState => ({ ...prevState, patientName: finalTranscriptRef.current + interim_transcript}));
        }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
         toast({
          variant: "destructive",
          title: "ভয়েস টাইপিং ত্রুটি",
          description: "মাইক্রোফোন ব্যবহারের অনুমতি প্রয়োজন।",
        });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
       if (finalTranscriptRef.current.trim()) {
           const finalName = finalTranscriptRef.current.trim();
           setState(prevState => ({...prevState, patientName: finalName}));
      }
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.abort();
    };
  }, [setState, toast]);

  const handleListen = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      finalTranscriptRef.current = state.patientName || '';
      if(finalTranscriptRef.current && !finalTranscriptRef.current.endsWith(' ')) {
          finalTranscriptRef.current += ' ';
      }
      recognition.start();
    }
    setIsListening(prevState => !prevState);
  }, [isListening, state.patientName]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setState((prevState) => ({ ...prevState, [name]: value }));
    if (name === 'patientName') {
        finalTranscriptRef.current = value;
    }
  }, [setState]);

  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '') {
      setState(prevState => ({ ...prevState, [name]: undefined }));
      return;
    }
    const numValue = parseInt(value, 10);
    setState(prevState => ({ ...prevState, [name]: isNaN(numValue) ? undefined : numValue }));
  }, [setState]);
  
  const handleLabelCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value, 10);
    
    if (value === '') {
        setState(prevState => ({ ...prevState, labelCount: 1 }));
    } else if (!isNaN(numValue) && numValue > 0) {
        setState(prevState => ({ ...prevState, labelCount: numValue }));
    } else if (!isNaN(numValue) && numValue < 1) {
        setState(prevState => ({ ...prevState, labelCount: 1 }));
    }
  };
  
  const addNewCounselingItem = useCallback((newItem: string) => {
    if (newItem && !state.counseling.find(item => item.replace(/<strong>(.*?)<\/strong>/g, '$1') === newItem.replace(/<strong>(.*?)<\/strong>/g, '$1'))) {
        setState(prevState => {
            const currentCounseling = [...prevState.counseling];
            const followUpIndex = currentCounseling.findIndex(c => c.includes("পরে আসবেন"));
            
            const followUpItem = followUpIndex > -1 ? currentCounseling.splice(followUpIndex, 1)[0] : null;

            const newCounselingList = [newItem, ...currentCounseling];

            if (followUpItem) {
                newCounselingList.push(followUpItem);
            }
            
            return { ...prevState, counseling: newCounselingList };
        });
    }
}, [state.counseling, setState]);


  const addCounseling = useCallback(() => {
    addNewCounselingItem(selectedCounseling);
  }, [selectedCounseling, addNewCounselingItem]);

  const addCustomCounseling = useCallback(() => {
    if (customCounseling.trim() !== "") {
      const newCounselingItem = customCounseling.trim().startsWith('•') ? customCounseling.trim() : `• ${customCounseling.trim()}`;
      addNewCounselingItem(newCounselingItem);
      setCustomCounseling("");
    }
  }, [customCounseling, addNewCounselingItem]);


  const removeCounseling = useCallback((index: number) => {
      setState(prevState => ({
          ...prevState,
          counseling: prevState.counseling.filter((_, i) => i !== index)
      }));
  }, [setState]);
  
  const handleIntervalModeChange = useCallback((value: IntervalMode) => {
    setState(prev => {
        if (value === 'meal-time') {
            return {...prev, intervalMode: value, mealTime: 'morning', interval: undefined};
        }
        return {...prev, intervalMode: value, mealTime: 'none'};
    });
  }, [setState]);

  useEffect(() => {
    setState(prevState => {
        const followUpDays = prevState.followUpDays;
        const newCounseling = [...(prevState.counseling || [])];
        const followUpIndex = newCounseling.findIndex(c => c.includes("পরে আসবেন"));

        if (followUpDays !== undefined && followUpDays > 0) {
            const followUpText = `• <strong>${convertToBanglaNumerals(followUpDays)} দিন</strong> পরে আসবেন।`;
            if (followUpIndex !== -1) {
                if (newCounseling[followUpIndex] !== followUpText) {
                    newCounseling[followUpIndex] = followUpText;
                    return { ...prevState, counseling: newCounseling };
                }
            } else {
                newCounseling.push(followUpText);
                return { ...prevState, counseling: newCounseling };
            }
        } else {
            if (followUpIndex !== -1) {
                newCounseling.splice(followUpIndex, 1);
                return { ...prevState, counseling: newCounseling };
            }
        }
        return prevState;
    });
  }, [state.followUpDays, setState]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
            <Label htmlFor="serial">ক্রমিক নং</Label>
            <Input id="serial" name="serial" value={state.serial} onChange={handleInputChange} />
        </div>
        <div>
            <Label>তারিখ</Label>
            <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={"outline"}
                className={cn(
                    "w-full justify-start text-left font-normal",
                    !state.date && "text-muted-foreground"
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {state.date ? format(state.date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                mode="single"
                selected={state.date}
                onSelect={(date) => date && setState(prev => ({ ...prev, date }))}
                initialFocus
                />
            </PopoverContent>
            </Popover>
        </div>
      </div>

      <div>
          <Label htmlFor="patientName">রোগীর নাম</Label>
          <div className="relative flex items-center">
            <Input 
              id="patientName"
              name="patientName"
              value={state.patientName}
              onChange={handleInputChange}
              className="pr-10"
              ref={patientNameInputRef}
            />
            {speechRecognitionSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-1 h-8 w-8 rounded-full",
                  isListening && "animate-pulse bg-red-100"
                )}
                onClick={handleListen}
              >
                <Mic className={cn("h-5 w-5", isListening ? "text-red-500" : "text-gray-500")} />
              </Button>
            )}
          </div>
      </div>

       <div className="mb-6">
          <RadioGroup
            value={state.shakeMode}
            onValueChange={(value: "with" | "without") => setState(prev => ({...prev, shakeMode: value}))}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center">
              <RadioGroupItem value="with" id="with-shake" className="peer sr-only" />
              <Label 
                htmlFor="with-shake"
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 border-2 border-transparent hover:border-indigo-600 font-semibold transition duration-150 cursor-pointer peer-data-[state=checked]:bg-indigo-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:border-indigo-600"
              >
                ঝাঁকি সহ
              </Label>
            </div>
            <div className="flex items-center">
              <RadioGroupItem value="without" id="without-shake" className="peer sr-only" />
              <Label 
                htmlFor="without-shake"
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 border-2 border-transparent hover:border-indigo-600 font-semibold transition duration-150 cursor-pointer peer-data-[state=checked]:bg-indigo-600 peer-data-[state=checked]:text-white peer-data-[state=checked]:border-indigo-600"
              >
                ঝাঁকি ছাড়া
              </Label>
            </div>
          </RadioGroup>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            {state.shakeMode === 'with' && (
                <div>
                    <Label htmlFor="shakeCount" className="md:hidden">ঝাঁকি (বার)</Label>
                    <Label htmlFor="shakeCount" className="hidden md:inline">কত বার ঝাঁকি দিবেন?</Label>
                    <Input id="shakeCount" name="shakeCount" type="number" value={state.shakeCount ?? ''} onChange={handleNumberChange} min="1" />
                </div>
            )}
            <div>
                <Label htmlFor="drops" className="md:hidden">ফোঁটা (পরিমাণ)</Label>
                <Label htmlFor="drops" className="hidden md:inline">কত ফোঁটা করে খাবেন?</Label>
                <Input id="drops" name="drops" type="number" value={state.drops ?? ''} onChange={handleNumberChange} min="1" />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cupAmount" className="md:hidden">জল</Label>
            <Label htmlFor="cupAmount" className="hidden md:inline">জলের পরিমাণ</Label>
            <Select
                name="cupAmount"
                value={state.cupAmount}
                onValueChange={(value: "one_cup" | "half_cup") => setState(prev => ({...prev, cupAmount: value}))}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="one_cup">এক কাপ</SelectItem>
                    <SelectItem value="half_cup">আধা কাপ</SelectItem>
                </SelectContent>
            </Select>
          </div>
           <div>
              <Label htmlFor="intervalMode" className="md:hidden">সময় (অন্তর)</Label>
              <Label htmlFor="intervalMode" className="hidden md:inline">খাওয়ার সময়</Label>
              <Select
                  name="intervalMode"
                  value={state.intervalMode}
                  onValueChange={handleIntervalModeChange}
              >
                  <SelectTrigger>
                      <SelectValue placeholder="Select..."/>
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="hourly">ঘন্টা অন্তর</SelectItem>
                      <SelectItem value="daily">দিন অন্তর</SelectItem>
                      <SelectItem value="meal-time">নির্দিষ্ট সময়</SelectItem>
                  </SelectContent>
              </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {(state.intervalMode === 'hourly' || state.intervalMode === 'daily') ? (
            <div>
                <Label htmlFor="interval" className="md:hidden">অন্তর (সময়)</Label>
                <Label htmlFor="interval" className="hidden md:inline">কত {state.intervalMode === 'hourly' ? 'ঘন্টা' : 'দিন'} পর পর?</Label>
                <Input id="interval" name="interval" type="number" value={state.interval ?? ''} onChange={handleNumberChange} min="1" />
            </div>
          ) : (state.intervalMode === 'meal-time' ? <div></div> : <div></div>)}
          
          {state.intervalMode === 'meal-time' && (
             <div>
                <Label htmlFor="mealTime" className="md:hidden">নির্দিষ্ট সময়</Label>
                <Label htmlFor="mealTime" className="hidden md:inline">নির্দিষ্ট সময় (ঐচ্ছিক)</Label>
                <Select
                    name="mealTime"
                    value={state.mealTime}
                    onValueChange={(value: MealTime) => setState(prev => ({...prev, mealTime: value}))}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="নির্বাচন করুন..."/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">কোনোটিই নয়</SelectItem>
                        <SelectItem value="morning">সকালে</SelectItem>
                        <SelectItem value="noon">দুপুরে</SelectItem>
                        <SelectItem value="afternoon">বিকালে</SelectItem>
                        <SelectItem value="night">রাতে</SelectItem>
                        <SelectItem value="morning-night">সকালে ও রাতে</SelectItem>
                        <SelectItem value="morning-afternoon">সকালে ও বিকালে</SelectItem>
                    </SelectContent>
                  </Select>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
              <Label htmlFor="mixtureAmount" className="md:hidden">কিভাবে?</Label>
              <Label htmlFor="mixtureAmount" className="hidden md:inline">কিভাবে খাবেন?</Label>
              <Select
                  name="mixtureAmount"
                  value={state.mixtureAmount}
                  onValueChange={(value) => setState(prev => ({...prev, mixtureAmount: value}))}
                  >
                  <SelectTrigger>
                      <SelectValue placeholder="Select..."/>
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="১ চামচ ঔষধ">১ চামচ ঔষধ</SelectItem>
                      <SelectItem value="২ চামচ ঔষধ">২ চামচ ঔষধ</SelectItem>
                      <SelectItem value="৩ চামচ ঔষধ">৩ চামচ ঔষধ</SelectItem>
                      <SelectItem value="সবটুকু ঔষধ">সবটুকু ঔষধ</SelectItem>
                  </SelectContent>
                </Select>
          </div>
          <div>
              <Label htmlFor="durationDays" className="md:hidden">কত দিন?</Label>
              <Label htmlFor="durationDays" className="hidden md:inline">কত দিন খাবেন?</Label>
              <Input id="durationDays" name="durationDays" type="number" value={state.durationDays ?? ''} onChange={handleNumberChange} min="1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="labelCount" className="md:hidden">লেবেল (সংখ্যা)</Label>
                <Label htmlFor="labelCount" className="hidden md:inline">কতগুলো লেবেল?</Label>
                <Input 
                    id="labelCount"
                    name="labelCount"
                    type="number"
                    value={state.labelCount ?? ''}
                    onChange={handleLabelCountChange}
                    min="1"
                />
            </div>
             <div>
                <Label htmlFor="followUpDays" className="md:hidden">পুনরায় আসবেন (দিন)</Label>
                <Label htmlFor="followUpDays" className="hidden md:inline">কত দিন পরে আসবেন?</Label>
                <Input id="followUpDays" name="followUpDays" type="number" value={state.followUpDays ?? ''} onChange={handleNumberChange} min="1" />
            </div>
        </div>
      </div>
      
      <Collapsible
        open={isCounselingOpen}
        onOpenChange={setIsCounselingOpen}
        className="space-y-4 pt-4 border-t"
      >
        <CollapsibleTrigger className="flex w-full justify-between items-center text-lg font-semibold">
          <h3>পরামর্শ</h3>
          <ChevronDown className={cn("h-5 w-5 transition-transform", isCounselingOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="space-y-2">
                <Label>বর্তমান পরামর্শসমূহ:</Label>
                <div className="space-y-1">
                    {state.counseling.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                            <span className="text-sm" dangerouslySetInnerHTML={{ __html: item.replace(/<strong>/g, '<strong class="text-red-700">') }}></span>
                            <Button variant="ghost" size="icon" onClick={() => removeCounseling(index)}>
                                <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="counseling-select">নতুন পরামর্শ যোগ করুন (তালিকা থেকে)</Label>
                <div className="flex gap-2">
                    <Select value={selectedCounseling} onValueChange={setSelectedCounseling}>
                        <SelectTrigger id="counseling-select">
                            <SelectValue placeholder="পরামর্শ নির্বাচন করুন..." />
                        </SelectTrigger>
                        <SelectContent>
                            {predefinedCounseling
                                .filter(item => !state.counseling.some(existing => existing.includes(item.replace(/<[^>]*>/g, ''))))
                                .map((item, index) => (
                                <SelectItem key={index} value={item}>
                                  <div dangerouslySetInnerHTML={{ __html: item.replace(/<strong>/g, '<strong class="text-red-700">') }}></div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={addCounseling}><PlusCircle className="h-4 w-4 mr-2" /> যোগ করুন</Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="custom-counseling">নতুন পরামর্শ যোগ করুন (কাস্টম)</Label>
                 <div className="flex gap-2">
                    <Textarea
                        id="custom-counseling"
                        placeholder="এখানে আপনার পরামর্শ লিখুন..."
                        value={customCounseling}
                        onChange={(e) => setCustomCounseling(e.target.value)}
                        className="min-h-[60px]"
                    />
                    <Button onClick={addCustomCounseling}><PlusCircle className="h-4 w-4 mr-2" /> যোগ করুন</Button>
                </div>
            </div>
        </CollapsibleContent>
       </Collapsible>
    </div>
  );
}
