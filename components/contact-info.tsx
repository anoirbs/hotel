// Save as: components/contact-info.tsx
interface ContactInfoProps {
    title: string
    icon: string
    details: string[]
  }
  
  export function ContactInfo({ title, icon, details }: ContactInfoProps) {
    const iconMap: Record<string, string> = {
      mail: '✉',
      phone: '☎',
      mapPin: '📍',
    }
    
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-secondary/20 p-3 rounded-lg">
            <span className="text-2xl">{iconMap[icon] || icon}</span>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
        <div className="space-y-1">
          {details.map((detail, index) => (
            <p key={index} className="text-foreground/70">
              {detail}
            </p>
          ))}
        </div>
      </div>
    )
  }