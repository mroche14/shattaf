import React, { useEffect, useState } from 'react';
import { Check, Calendar } from 'lucide-react';
import { useBookingStore } from '../../../store/booking';
import { useProducts } from '../../../api/hooks/useProducts';
import { formatPrice } from '@shattaf/shared-types';
import type { TimeSlot } from '@shattaf/shared-types';

interface ScheduleStepProps {
  onValidChange: (valid: boolean) => void;
}

const timeSlots: { value: TimeSlot; label: string }[] = [
  { value: 'morning', label: 'Matin (8h-12h)' },
  { value: 'afternoon', label: 'Après-midi (14h-18h)' },
  { value: 'evening', label: 'Soir (18h-20h)' },
];

const ScheduleStep: React.FC<ScheduleStepProps> = ({ onValidChange }) => {
  const store = useBookingStore();
  const { data: products } = useProducts();
  const [selectedDate, setSelectedDate] = useState<string>(
    store.preferredDate || ''
  );

  // Check validity
  useEffect(() => {
    const isValid = !!store.productId;
    onValidChange(isValid);
  }, [store.productId, onValidChange]);

  // Get min date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    store.setSchedule({ preferredDate: date });
  };

  return (
    <div className="space-y-6">
      {/* Product selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Choisissez votre shattaf
        </label>
        <div className="space-y-3">
          {products?.map((product) => (
            <button
              key={product.id}
              onClick={() => store.setSchedule({ productId: product.id })}
              className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                store.productId === product.id
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{product.name}</span>
                    {store.productId === product.id && (
                      <Check className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  {product.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
                <span className="font-bold cyan-gradient-text ml-4">
                  {formatPrice(product.priceB2c)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date preference */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Date préférée (optionnel)
        </label>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="date"
            value={selectedDate}
            min={getMinDate()}
            onChange={handleDateChange}
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
      </div>

      {/* Time slot preference */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Créneau préféré (optionnel)
        </label>
        <div className="grid grid-cols-1 gap-3">
          {timeSlots.map((slot) => (
            <button
              key={slot.value}
              onClick={() =>
                store.setSchedule({
                  preferredTimeSlot:
                    store.preferredTimeSlot === slot.value ? null : slot.value,
                })
              }
              className={`p-3 rounded-xl border-2 transition-colors ${
                store.preferredTimeSlot === slot.value
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{slot.label}</span>
                {store.preferredTimeSlot === slot.value && (
                  <Check className="w-5 h-5 text-cyan-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-gray-500 text-sm">
        Le plombier vous proposera un créneau précis dans son devis
      </p>
    </div>
  );
};

export default ScheduleStep;
