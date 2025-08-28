"use client"

import * as React from "react"
import { FolderOpen, History, Zap } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useLeftDock } from '@/components/left-dock'

// This is sample data.
const data = {
  user: {
    name: "flashtype",
    email: "local@flashtype.app",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Flashtype",
      logo: Zap,
      plan: "Local",
    },
  ],
  navMain: [
    {
      key: 'files',
      title: "Files",
      icon: FolderOpen,
      isActive: true,
    },
    {
      key: 'history',
      title: "History",
      icon: History,
    },
  ],
  projects: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { active, setActive } = useLeftDock()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain}
          active={active}
          onSelect={(key) => setActive(prev => (prev === key ? null : (key as any)))}
        />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
