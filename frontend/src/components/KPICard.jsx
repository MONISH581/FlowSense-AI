import React from 'react';

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'mint',
  variant = 'default', // 'default', 'hero', 'alert'
}) {
  if (variant === 'hero') {
    return (
      <div className="relative overflow-hidden bg-[#01110A] rounded-2xl border border-[#3B4A34]/50 p-6 shadow-xl shadow-[#01110A]/20 transition-all duration-200 hover:border-[#A0F89C]/50 flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#A0F89C]/15 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#99AFA9]">{title}</p>
          {Icon && (
            <div className="p-2.5 rounded-xl bg-[#082819] text-[#A0F89C] border border-[#A0F89C]/30 shadow-xs">
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-3xl font-black tracking-tight text-[#A0F89C]">{value}</h3>
            {trend && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ADEBD9]/20 text-[#ADEBD9] border border-[#ADEBD9]/30">
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-[#99AFA9] mt-1 font-medium">{subtitle}</p>}
        </div>
      </div>
    );
  }

  const isAlert = variant === 'alert' || color === 'rose';

  return (
    <div
      className={`relative overflow-hidden bg-white rounded-2xl border p-5.5 shadow-[0_4px_20px_rgb(1,17,10,0.03)] transition-all duration-200 hover:shadow-md ${
        isAlert
          ? 'border-rose-200 hover:border-rose-300'
          : 'border-[#99AFA9]/30 hover:border-[#3B4A34]/50'
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl ${
          isAlert ? 'from-rose-500/10' : 'from-[#ADEBD9]/20'
        } to-transparent rounded-bl-full pointer-events-none`}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#3B4A34]">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black tracking-tight text-[#01110A]">{value}</h3>
            {trend && (
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  trend.isPositive
                    ? 'bg-[#ADEBD9]/40 text-[#01110A] border border-[#ADEBD9]'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-[#99AFA9] font-medium">{subtitle}</p>}
        </div>

        {Icon && (
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isAlert
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : 'bg-[#ADEBD9]/30 text-[#01110A] border border-[#ADEBD9]/60'
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
