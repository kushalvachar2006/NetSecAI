import { clsx } from 'clsx'

export default function DashboardCard({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-400',
  iconBg = 'bg-blue-500/10',
  children,
  className = '',
  badge,
  badgeColor = 'bg-blue-500/20 text-blue-400',
  noPadding = false,
}) {
  return (
    <div className={clsx(
      'glass rounded-xl relative overflow-hidden scan-line group transition-all duration-300',
      'hover:border-blue-500/30 hover:bg-gray-900/70',
      className
    )}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {/* Header */}
      {(title || Icon) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
                <Icon className={clsx('w-4 h-4', iconColor)} />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {badge && (
            <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', badgeColor)}>
              {badge}
            </span>
          )}
        </div>
      )}

      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  )
}
