
import { format } from "date-fns";
import { convertToBanglaNumerals } from "@/lib/utils";
import type { LabelState } from "@/app/page";

interface LabelPreviewProps extends LabelState {
  activeLabelIndex: number;
}

export default function LabelPreview({
  serial,
  patientName,
  date,
  shakeMode,
  drops,
  cupAmount,
  interval,
  intervalMode,
  mealTime,
  shakeCount,
  mixtureAmount,
  durationDays,
  counseling,
  labelCount,
  activeLabelIndex,
}: LabelPreviewProps) {
  
  const formattedDate = convertToBanglaNumerals(format(date, "dd/MM/yyyy"));
  
  const counselingPoints = counseling
    .map(line => {
        let bnLine = convertToBanglaNumerals(line);
        // Ensure it starts with a bullet
        bnLine = bnLine.trim().startsWith('•') ? bnLine.trim() : `• ${bnLine.trim()}`;
        bnLine = bnLine.replace(/<strong>/g, '<strong class="text-red-700">');
        return `<li>${bnLine}</li>`;
    }).join('');

  const finalCounseling = counselingPoints;
    
  const renderInstruction = () => {
    const bnDrops = drops !== '' ? `<strong class="text-red-700">${convertToBanglaNumerals(drops)} ফোঁটা</strong>` : '___';
    
    let intervalText = '';
    if (intervalMode === 'hourly' || intervalMode === 'daily') {
        if (interval !== '') {
            const bnIntervalNumber = convertToBanglaNumerals(interval);
            const unitText = intervalMode === 'hourly' ? 'ঘন্টা' : 'দিন';
            intervalText = `<strong class="text-red-700">${bnIntervalNumber} ${unitText}</strong> অন্তর অন্তর`;
        } else {
            intervalText = '___ অন্তর অন্তর';
        }
    } else { // meal-time
        switch(mealTime) {
            case 'morning': intervalText = "সকালে"; break;
            case 'noon': intervalText = "দুপুরে"; break;
            case 'afternoon': intervalText = "বিকালে"; break;
            case 'night': intervalText = "রাতে"; break;
            case 'morning-night': intervalText = "সকালে ও রাতে"; break;
            case 'morning-afternoon': intervalText = "সকালে ও বিকালে"; break;
            default: intervalText = "___";
        }
        intervalText = `<strong class="text-red-700">${intervalText}</strong>`
    }

    const bnShakeCount = shakeMode === 'with' && shakeCount !== '' ? `<strong class="text-red-700">${convertToBanglaNumerals(shakeCount)} বার</strong>` : '___';
    
    let bnMixtureAmount = `<strong class="text-red-700">${convertToBanglaNumerals(mixtureAmount.replace(' ঔষধ', ''))}</strong>`;
     if (!mixtureAmount.includes('সবটুকু')) {
        bnMixtureAmount = `${bnMixtureAmount.replace('১', '১&zwnj;')} ঔষধ`;
    }

    const bnDurationDays = durationDays !== '' ? `<strong class="text-red-700">${convertToBanglaNumerals(durationDays)} দিন</strong>` : '___';
    
    const bnCupAmount = cupAmount === 'one_cup' ? 'এক কাপ' : 'আধা কাপ';
    const highlightedCupAmount = `<strong class="text-red-700">${bnCupAmount}</strong>`;

    let instruction;
    if (shakeMode === "with") {
        instruction = `ঔষধ সেবনের আগে শিশিটিকে হাতের তালুর উপরে দূর হতে সজোরে থেমে থেমে ${bnShakeCount} ঝাঁকি দিয়ে ${bnDrops} ঔষধ ${highlightedCupAmount} ঠান্ডা জলের সাথে চামচ দিয়ে ভালোভাবে মিশিয়ে ${bnMixtureAmount} ${intervalText} > ${bnDurationDays} সেবন করুন।`;
    } else {
      instruction = `প্রতিবার ঔষধ সেবনের পূর্বে ${bnDrops} ঔষধ ${highlightedCupAmount} ঠান্ডা জলের সাথে চামচ দিয়ে ভালভাবে মিশিয়ে ${bnMixtureAmount} ${intervalText} > ${bnDurationDays} সেবন করুন।`;
    }
    
    let processedInstruction = convertToBanglaNumerals(instruction);
    
    return (
      <div 
        className="instruction-box text-justify"
        dangerouslySetInnerHTML={{ __html: processedInstruction.replace(/\n/g, '<br>') }} 
      />
    );
  };
  
  const getSequentialText = () => {
    const currentLabelCount = Number(labelCount) || 1;
    if (currentLabelCount <= 1) return null;

    const bnIndex = convertToBanglaNumerals(activeLabelIndex);
    
    return (
      <div className="text-center mb-4">
        <div className="text-base font-bold text-red-700 inline-block border border-black rounded-md py-0 px-1">
          <span>{bnIndex} নং ঔষধ</span>
           {activeLabelIndex > 1 && (
             <span className="font-bold text-sm ml-1">
                (<strong className="font-bold">{convertToBanglaNumerals(activeLabelIndex - 1)} নং এর পরে খাবেন</strong>)
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="prescription-sheet-final font-body"
    >
        <div className="flex flex-col h-full">
            <div className="space-y-1 pt-2">
                <div>
                    <div className="flex justify-between items-center text-sm font-medium mb-1">
                        <span className="truncate pr-1"><strong>ক্রমিক নং:</strong> <strong className="text-red-700">{serial}</strong></span>
                        <span className="whitespace-nowrap">তারিখঃ <strong className="text-red-700">{formattedDate}</strong></span>
                    </div>
                    <div className="text-left text-base font-medium mb-2">
                        রোগীর নামঃ&nbsp;&nbsp;<strong className="text-indigo-700">{patientName || ''}</strong>
                    </div>
                </div>

                {getSequentialText()}

                <div className="space-y-1">
                    <div className="text-center"> 
                        <h2 className="inline-block border-b-2 border-indigo-700 text-indigo-700 py-0 text-center font-bold" style={{ fontSize: '17px' }}>ঔষধ খাবার নিয়মাবলী</h2>
                    </div>
                    {renderInstruction()}
                </div>

                <div className="space-y-2 pt-1">
                    <div className="text-center">
                      <h3 className="text-base font-bold text-red-700 mb-1 inline-block border-b-2 border-red-700">পরামর্শ</h3>
                      <ul
                        className="advice-list text-gray-800 pl-0 list-none text-left"
                        dangerouslySetInnerHTML={{ __html: finalCounseling }}
                      ></ul>
                    </div>
                </div>
            </div>
          
            <div className="flex-grow"></div>
            <div className="doctor-info text-center mt-2">
                <div className="doctor-info-with-border inline-block">
                    <p className="font-bold text-indigo-700 doctor-title">ত্রিফুল আরোগ্য নিকেতন</p>
                    <p className="doctor-subtitle">(আদর্শ হোমিওপ্যাথিক চিকিৎসালয়)</p>
                    <p className="doctor-name">
                    <strong style={{ fontWeight: '500' }}>ডাঃ নীহার রঞ্জন রায়</strong> <span className="doctor-degree" style={{ fontWeight: '500' }}>(বি.এস.সি, ডি.এইচ.এম.এস)</span>
                    </p>
                    <p className="doctor-specialty">(শুধুমাত্র জটিল ও পুরাতন রোগী চিকিৎসক)</p>
                    <p className="doctor-location">কোটালীপাড়া, গোপালগঞ্জ</p>
                    <p className="font-bold doctor-contact">
                    মোবাইল:&nbsp;
                    01716-954699, 01922-788466, 01714-719422
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}

    

    

    