import React from 'react'
interface InfoCardProps {
  className?: string
}

const InfoCard: React.FC<InfoCardProps> = ({ className }) => {
  return (
    <div className={className || ""}>
      <div className="bg-muted/50 rounded-lg border border-border p-3 shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <div className="size-2 rounded-full bg-cyan-500"></div>
          <h3 className="text-xs font-medium">Public Preview</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          AI document writing with lix change control – Please report any issues or suggestions:
        </p>
        <div className="text-xs text-muted-foreground/70 mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <a href="https://github.com/opral/flashtype.ai" className="text-primary hover:underline text-xs" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <span>·</span>
            <a href="https://discord.gg/xjQA897RyK" className="text-primary hover:underline text-xs" target="_blank" rel="noopener noreferrer">
              Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InfoCard