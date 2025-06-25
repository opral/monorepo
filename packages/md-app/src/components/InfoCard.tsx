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
          <h3 className="font-medium">Give feedback</h3>
        </div>
        <a href="https://github.com/opral/flashtype.ai/issues" className="flex mb-3">
          <img alt="GitHub Issues or Pull Requests" src="https://img.shields.io/github/issues/opral/flashtype.ai?style=for-the-badge&logo=github&label=ideas&color=00b8db" className="h-4 rounded-l-xs" />
          <img alt="GitHub Issues or Pull Requests" src="https://img.shields.io/github/issues-closed/opral/flashtype.ai?style=for-the-badge&label=%20&color=62748e" className="h-4 rounded-r-xs" />
        </a>
        <div className="text-xs text-muted-foreground/70 mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <a href="https://github.com/opral/flashtype.ai/issues" className="text-primary hover:underline text-xs" target="_blank" rel="noopener noreferrer">
              Open GitHub
            </a>
            <span>·</span>
            <a href="https://discord.gg/xjQA897RyK" className="text-primary hover:underline text-xs" target="_blank" rel="noopener noreferrer">
              Chat on Discord
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InfoCard