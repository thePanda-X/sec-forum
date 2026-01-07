"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldClose,
  ShieldOff,
  Lock,
  Unlock,
  LockOpen,
  Key,
  Fingerprint,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Server,
  Database,
  HardDrive,
  Terminal,
  Code,
  Code2,
  Bug,
  Search as SearchIcon,
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Activity,
  Globe,
  User,
  Users,
  UserCheck,
  UserX,
  File,
  FileText,
  FileKey,
  CreditCard,
  Bell,
  BellOff,
  Camera,
  Video,
  VideoOff,
  Command,
  Cpu,
  Settings,
  Sliders,
  Brain,
  Cloud,
  CloudLightning,
  CloudOff,
  Link,
  Link2,
  Unlink,
  Mail,
  Timer,
  Zap,
  ZapOff,
  Check,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Download,
  Upload,
  Trash,
  Trash2,
  TrendingUp,
  TrendingDown,
  Hexagon,
  Octagon,
  Square,
  Circle,
  Triangle,
  Crosshair,
  Target,
  MapPin,
  Navigation,
  Navigation2,
  Compass,
  Layers,
  Grid,
  Box,
  Archive,
  Package,
  Router,
  Satellite,
  Signal,
  Network,
  Share,
  Share2,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  Github,
  Gitlab,
  Binary,
  Hash,
  AtSign,
  Award,
  Badge,
  IdCard,
  Headphones,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  Monitor,
  MonitorOff,
  Laptop,
  Smartphone,
  Tablet,
  Keyboard,
  Mouse,
  MousePointer,
} from "lucide-react"

const iconList = [
  { name: "Shield", Icon: Shield },
  { name: "Shield Alert", Icon: ShieldAlert },
  { name: "Shield Check", Icon: ShieldCheck },
  { name: "Shield Close", Icon: ShieldClose },
  { name: "Shield Off", Icon: ShieldOff },
  { name: "Lock", Icon: Lock },
  { name: "Unlock", Icon: Unlock },
  { name: "Lock Open", Icon: LockOpen },
  { name: "Key", Icon: Key },
  { name: "Fingerprint", Icon: Fingerprint },
  { name: "Eye", Icon: Eye },
  { name: "Eye Off", Icon: EyeOff },
  { name: "Wifi", Icon: Wifi },
  { name: "Wifi Off", Icon: WifiOff },
  { name: "Server", Icon: Server },
  { name: "Database", Icon: Database },
  { name: "Hard Drive", Icon: HardDrive },
  { name: "Terminal", Icon: Terminal },
  { name: "Code", Icon: Code },
  { name: "Code 2", Icon: Code2 },
  { name: "Bug", Icon: Bug },
  { name: "Search", Icon: SearchIcon },
  { name: "Alert Triangle", Icon: AlertTriangle },
  { name: "Alert Circle", Icon: AlertCircle },
  { name: "Alert Octagon", Icon: AlertOctagon },
  { name: "Activity", Icon: Activity },
  { name: "Globe", Icon: Globe },
  { name: "User", Icon: User },
  { name: "Users", Icon: Users },
  { name: "User Check", Icon: UserCheck },
  { name: "User X", Icon: UserX },
  { name: "File", Icon: File },
  { name: "File Text", Icon: FileText },
  { name: "File Key", Icon: FileKey },
  { name: "Credit Card", Icon: CreditCard },
  { name: "Bell", Icon: Bell },
  { name: "Bell Off", Icon: BellOff },
  { name: "Camera", Icon: Camera },
  { name: "Video", Icon: Video },
  { name: "Video Off", Icon: VideoOff },
  { name: "Command", Icon: Command },
  { name: "CPU", Icon: Cpu },
  { name: "Settings", Icon: Settings },
  { name: "Sliders", Icon: Sliders },
  { name: "Brain", Icon: Brain },
  { name: "Cloud", Icon: Cloud },
  { name: "Cloud Lightning", Icon: CloudLightning },
  { name: "Cloud Off", Icon: CloudOff },
  { name: "Link", Icon: Link },
  { name: "Link 2", Icon: Link2 },
  { name: "Unlink", Icon: Unlink },
  { name: "Mail", Icon: Mail },
  { name: "Timer", Icon: Timer },
  { name: "Zap", Icon: Zap },
  { name: "Zap Off", Icon: ZapOff },
  { name: "Check", Icon: Check },
  { name: "X", Icon: X },
  { name: "Check Circle", Icon: CheckCircle },
  { name: "X Circle", Icon: XCircle },
  { name: "Refresh CW", Icon: RefreshCw },
  { name: "Copy", Icon: Copy },
  { name: "Download", Icon: Download },
  { name: "Upload", Icon: Upload },
  { name: "Trash", Icon: Trash },
  { name: "Trash 2", Icon: Trash2 },
  { name: "Trending Up", Icon: TrendingUp },
  { name: "Trending Down", Icon: TrendingDown },
  { name: "Hexagon", Icon: Hexagon },
  { name: "Octagon", Icon: Octagon },
  { name: "Square", Icon: Square },
  { name: "Circle", Icon: Circle },
  { name: "Triangle", Icon: Triangle },
  { name: "Crosshair", Icon: Crosshair },
  { name: "Target", Icon: Target },
  { name: "Map Pin", Icon: MapPin },
  { name: "Navigation", Icon: Navigation },
  { name: "Navigation 2", Icon: Navigation2 },
  { name: "Compass", Icon: Compass },
  { name: "Layers", Icon: Layers },
  { name: "Grid", Icon: Grid },
  { name: "Box", Icon: Box },
  { name: "Archive", Icon: Archive },
  { name: "Package", Icon: Package },
  { name: "Router", Icon: Router },
  { name: "Satellite", Icon: Satellite },
  { name: "Signal", Icon: Signal },
  { name: "Network", Icon: Network },
  { name: "Share", Icon: Share },
  { name: "Share 2", Icon: Share2 },
  { name: "Git Branch", Icon: GitBranch },
  { name: "Git Commit", Icon: GitCommit },
  { name: "Git Merge", Icon: GitMerge },
  { name: "Git Pull Request", Icon: GitPullRequest },
  { name: "GitHub", Icon: Github },
  { name: "GitLab", Icon: Gitlab },
  { name: "Binary", Icon: Binary },
  { name: "Hash", Icon: Hash },
  { name: "At Sign", Icon: AtSign },
  { name: "Award", Icon: Award },
  { name: "Badge", Icon: Badge },
  { name: "ID Card", Icon: IdCard },
  { name: "Headphones", Icon: Headphones },
  { name: "Mic", Icon: Mic },
  { name: "Mic Off", Icon: MicOff },
  { name: "Phone", Icon: Phone },
  { name: "Phone Call", Icon: PhoneCall },
  { name: "Monitor", Icon: Monitor },
  { name: "Monitor Off", Icon: MonitorOff },
  { name: "Laptop", Icon: Laptop },
  { name: "Smartphone", Icon: Smartphone },
  { name: "Tablet", Icon: Tablet },
  { name: "Keyboard", Icon: Keyboard },
  { name: "Mouse", Icon: Mouse },
  { name: "Mouse Pointer", Icon: MousePointer },
]

interface IconSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function IconSelector({ value, onChange }: IconSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredIcons = React.useMemo(() => {
    if (!search) return iconList
    return iconList.filter((icon) =>
      icon.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  const selectedIcon = iconList.find((icon) => icon.name === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-2",
            !value && "text-muted-foreground"
          )}
        >
          {selectedIcon ? (
            <selectedIcon.Icon className="h-4 w-4" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="truncate">
            {selectedIcon?.name || "Select an icon"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-4 gap-2 p-3">
            {filteredIcons.map((item) => {
              const isSelected = value === item.name
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onChange(item.name)
                    setOpen(false)
                    setSearch("")
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition-colors",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.Icon className="h-5 w-5" />
                  <span className="text-[10px] truncate w-full text-center">
                    {item.name}
                  </span>
                </button>
              )
            })}
          </div>
          {filteredIcons.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No icons found
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
