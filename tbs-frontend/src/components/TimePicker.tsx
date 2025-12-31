import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TimePickerProps {
  value?: string; // HH:MM format
  onChange: (value: string) => void;
  minTime?: string; // HH:MM format
  maxTime?: string; // HH:MM format
  disabled?: boolean;
  placeholder?: string;
  label?: string;
}

export function TimePicker({
  value,
  onChange,
  minTime = "06:00",
  maxTime = "18:00",
  disabled = false,
  placeholder = "Select time",
  label,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Generate time slots from minTime to maxTime in 30-minute intervals
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const [minHour, minMin] = minTime.split(":").map(Number);
    const [maxHour, maxMin] = maxTime.split(":").map(Number);
    
    const startMinutes = minHour * 60 + minMin;
    const endMinutes = maxHour * 60 + maxMin;
    
    for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeString = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
      slots.push(timeString);
    }
    
    return slots;
  };

  const timeSlots = React.useMemo(() => generateTimeSlots(), [minTime, maxTime]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal cursor-pointer",
              !value && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <Clock className="mr-2 h-4 w-4" />
            {value ? formatTime(value) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="max-h-[300px] overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => {
                const isSelected = value === time;
                return (
                  <Button
                    key={time}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-10 text-sm",
                      isSelected && "bg-amber-500 hover:bg-amber-600 text-white"
                    )}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {formatTime(time)}
                  </Button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Available: {formatTime(minTime)} - {formatTime(maxTime)}
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}

