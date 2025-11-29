import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  label: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export const RangeSlider = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  label,
  formatValue = (v) => v.toString(),
  className,
}: RangeSliderProps) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;

  const handleMouseDown = (type: 'min' | 'max') => {
    setIsDragging(type);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const newValue = Math.round((percentage / 100) * (max - min) + min);
      const steppedValue = Math.round(newValue / step) * step;

      if (isDragging === 'min') {
        const newMin = Math.max(min, Math.min(steppedValue, value[1] - step));
        onChange([newMin, value[1]]);
      } else {
        const newMax = Math.min(max, Math.max(steppedValue, value[0] + step));
        onChange([value[0], newMax]);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, value, min, max, step, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-secondary">{label}</label>
        <span className="text-sm font-medium text-primary">
          {formatValue(value[0])} - {formatValue(value[1])}
        </span>
      </div>
      <div ref={sliderRef} className="relative h-2 bg-muted rounded-full">
        <div
          className="absolute h-2 bg-primary rounded-full"
          style={{
            left: `${getPercentage(value[0])}%`,
            width: `${getPercentage(value[1]) - getPercentage(value[0])}%`,
          }}
        />
        <button
          type="button"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary border-2 border-white rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform cursor-grab active:cursor-grabbing"
          style={{ left: `${getPercentage(value[0])}%` }}
          onMouseDown={() => handleMouseDown('min')}
        />
        <button
          type="button"
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary border-2 border-white rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform cursor-grab active:cursor-grabbing"
          style={{ left: `${getPercentage(value[1])}%` }}
          onMouseDown={() => handleMouseDown('max')}
        />
      </div>
    </div>
  );
};

export default RangeSlider;

