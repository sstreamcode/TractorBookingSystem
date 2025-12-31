import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  minDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  disabled = false,
  placeholder = "Pick a date",
  label,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = value ? new Date(value) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      onChange(formattedDate);
      setOpen(false);
    }
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
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={(date) => {
              if (minDate) {
                // Disable dates before minDate (set time to start of day for comparison)
                const minDateStart = new Date(minDate);
                minDateStart.setHours(0, 0, 0, 0);
                const dateStart = new Date(date);
                dateStart.setHours(0, 0, 0, 0);
                return dateStart < minDateStart;
              }
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

