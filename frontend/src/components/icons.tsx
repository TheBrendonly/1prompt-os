/**
 * Pixel Icon Mapping Layer
 * Maps Lucide icon names to pixelarticons equivalents with compatible API.
 * All icons render as pixelated 24×24 grid SVGs for the retro console aesthetic.
 */
import React from 'react';

// Import all needed pixelarticons
import {
  ArrowDown as PxArrowDown,
  ArrowLeft as PxArrowLeft,
  ArrowRight as PxArrowRight,
  ArrowUp as PxArrowUp,
  AlarmClock as PxAlarmClock,
  Bell as PxBell,
  BellOff as PxBellOff,
  BookOpen as PxBookOpen,
  Briefcase as PxBriefcase,
  Building as PxBuilding,
  Calendar as PxCalendar,
  Camera as PxCamera,
  Chart as PxChart,
  ChartBarBig as PxChartBarBig,
  Check as PxCheck,
  CheckboxOn as PxCheckboxOn,
  ChevronDown as PxChevronDown,
  ChevronLeft as PxChevronLeft,
  ChevronRight as PxChevronRight,
  ChevronUp as PxChevronUp,
  Clock as PxClock,
  Copy as PxCopy,
  Cpu as PxCpu,
  Database as PxDatabase,
  Delete as PxDelete,
  Download as PxDownload,
  Earth as PxEarth,
  ExternalLink as PxExternalLink,
  Eye as PxEye,
  EyeOff as PxEyeOff,
  File as PxFile,
  FileText as PxFileText,
  Globe as PxGlobe,
  Home as PxHome,
  Image as PxImage,
  Inbox as PxInbox,
  InfoBox as PxInfoBox,
  Link as PxLink,
  Loader as PxLoader,
  Lock as PxLock,
  Mail as PxMail,
  Message as PxMessage,
  MessageText as PxMessageText,
  Minus as PxMinus,
  MoreHorizontal as PxMoreHorizontal,
  MoreVertical as PxMoreVertical,
  Note as PxNote,
  PenSquare as PxPenSquare,
  Phone as PxPhone,
  PhoneCall as PxPhoneCall,
  Play as PxPlay,
  Plus as PxPlus,
  Reload as PxReload,
  RobotFace as PxRobotFace,
  Search as PxSearch,
  Send as PxSend,
  Settings2 as PxSettings2,
  Shield as PxShield,
  Smile as PxSmile,
  Sparkles as PxSparkles,
  Sparkle as PxSparkle,
  Square as PxSquare,
  SquareAlert as PxSquareAlert,
  Store as PxStore,
  ToolCase as PxToolCase,
  ThumbsUp as PxThumbsUp,
  ThumbsDown as PxThumbsDown,
  Undo as PxUndo,
  Unlock as PxUnlock,
  Upload as PxUpload,
  User as PxUser,
  UserMinus as PxUserMinus,
  UserPlus as PxUserPlus,
  UserX as PxUserX,
  Users as PxUsers,
  Video as PxVideo,
  Zap as PxZap,
  ZapOff as PxZapOff,
  ZoomIn as PxZoomIn,
  MagicEdit as PxMagicEdit,
  Blocks as PxBlocks,
  Bookmark as PxBookmark,
  Debug as PxDebug,
  Signal as PxSignal,
  Expand as PxExpand,
  Clipboard as PxClipboard,
  Scissors as PxScissors,
  Target as PxTarget,
  Power as PxPower,
  PowerOff as PxPowerOff,
  Flag as PxFlag,
  Hash as PxHash,
  Feather as PxFeather,
  Folder as PxFolder,
  FolderPlus as PxFolderPlus,
  MapPin as PxMapPin,
  Recycle as PxRecycle,
  Terminal as PxTerminal,
  Trophy as PxTrophy,
  Fire as PxFire,
  Lightbulb as PxLightbulb,
  CreditCard as PxCreditCard,
  Coins as PxCoins,
  Crown as PxCrown,
  WarningDiamond as PxWarningDiamond,
  Redo as PxRedo,
  Megaphone as PxMegaphone,
  Presentation as PxPresentation,
  Headphone as PxHeadphone,
} from 'pixelarticons/react';

// Wrapper that converts Lucide-style props (size, color, className) to pixelarticons SVG props
type PixelIconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
};

function wrap(
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
): React.FC<PixelIconProps> {
  const Wrapped: React.FC<PixelIconProps> = ({ size = 24, color, className, strokeWidth, absoluteStrokeWidth, ...rest }) => (
    <Icon
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      fill={color || 'currentColor'}
      className={className}
      {...rest}
    />
  );
  Wrapped.displayName = Icon.displayName || 'PixelIcon';
  return Wrapped;
}

// ===== EXPORTS — Lucide-compatible names → pixelarticons =====

// Arrows
export const ArrowDown = wrap(PxArrowDown);
export const ArrowLeft = wrap(PxArrowLeft);
export const ArrowRight = wrap(PxArrowRight);
export const ArrowUp = wrap(PxArrowUp);
export const ArrowLeftRight = wrap(PxArrowLeft); // fallback

// Chevrons
export const ChevronDown = wrap(PxChevronDown);
export const ChevronLeft = wrap(PxChevronLeft);
export const ChevronRight = wrap(PxChevronRight);
export const ChevronUp = wrap(PxChevronUp);
export const ChevronsUpDown = wrap(PxChevronDown); // fallback

// Status / Alerts
export const AlertCircle = wrap(PxSquareAlert);
export const AlertTriangle = wrap(PxWarningDiamond);
export const CheckCircle = wrap(PxCheckboxOn);
export const CheckCircle2 = wrap(PxCheckboxOn);
export const Check = wrap(PxCheck);
export const Info = wrap(PxInfoBox);
export const HelpCircle = wrap(PxInfoBox);
export const ShieldCheck = wrap(PxShield);
export const Shield = wrap(PxShield);

// Actions
export const Plus = wrap(PxPlus);
export const Minus = wrap(PxMinus);
export const X: React.FC<PixelIconProps> = ({ size = 24, color, className, ...rest }) => (
  <svg
    width={typeof size === 'number' ? size : undefined}
    height={typeof size === 'number' ? size : undefined}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color || 'currentColor'}
    strokeWidth="2"
    strokeLinecap="square"
    shapeRendering="crispEdges"
    className={className}
    {...rest}
  >
    <path d="M6 6 L18 18" />
    <path d="M18 6 L6 18" />
  </svg>
);
export const XCircle = X;
export const Search = wrap(PxSearch);
export const Edit = wrap(PxPenSquare);
export const Edit2 = wrap(PxPenSquare);
export const Edit3 = wrap(PxPenSquare);
export const Pencil = wrap(PxPenSquare);
export const Trash = wrap(PxDelete);
export const Trash2 = wrap(PxDelete);
export const Copy = wrap(PxCopy);
export const Save = wrap(PxInbox);
export const Download = wrap(PxDownload);
export const Upload = wrap(PxUpload);
export const RefreshCw = wrap(PxReload);
export const RefreshCcw = wrap(PxReload);
export const RotateCcw = wrap(PxUndo);
export const RotateCw = wrap(PxRedo);
export const Undo = wrap(PxUndo);
export const Redo = wrap(PxRedo);
export const Undo2 = wrap(PxUndo);
export const Redo2 = wrap(PxRedo);
export const Filter: React.FC<PixelIconProps> = ({ size = 24, color, className, ...rest }) => (
  <svg
    width={typeof size === 'number' ? size : undefined}
    height={typeof size === 'number' ? size : undefined}
    viewBox="0 0 24 24"
    fill={color || 'currentColor'}
    shapeRendering="crispEdges"
    className={className}
    {...rest}
  >
    <rect x="3" y="6" width="18" height="2" />
    <rect x="7" y="11" width="10" height="2" />
    <rect x="10" y="16" width="4" height="2" />
  </svg>
);
export const SortAsc = wrap(PxArrowUp);
export const SortDesc = wrap(PxArrowDown);
export const Expand = wrap(PxExpand);
export const Maximize = wrap(PxExpand);
export const Maximize2 = wrap(PxExpand);
export const Minimize = wrap(PxExpand);
export const Minimize2 = wrap(PxExpand);
export const ZoomIn = wrap(PxZoomIn);
export const ZoomOut = wrap(PxZoomIn);

// Navigation
export const Home = wrap(PxHome);
export const Menu = wrap(PxMoreHorizontal);
export const MoreHorizontal = wrap(PxMoreHorizontal);
export const MoreVertical = wrap(PxMoreVertical);
export const ExternalLink = wrap(PxExternalLink);
export const Link = wrap(PxLink);
export const Link2 = wrap(PxLink);
export const Unlink = wrap(PxLink);

// UI Elements
export const Eye = wrap(PxEye);
export const EyeOff = wrap(PxEyeOff);
export const Lock = wrap(PxLock);
export const Unlock = wrap(PxUnlock);
export const Bell = wrap(PxBell);
export const BellOff = wrap(PxBellOff);
export const Bookmark = wrap(PxBookmark);
export const Flag = wrap(PxFlag);
export const Target = wrap(PxTarget);
export const MapPin = wrap(PxMapPin);
export const Hash = wrap(PxHash);
export const Tag = wrap(PxFlag);
export const Tags = wrap(PxFlag);
export const Clipboard = wrap(PxClipboard);
export const ClipboardCopy = wrap(PxClipboard);

// Communication
export const Mail = wrap(PxMail);
export const MessageSquare = wrap(PxMessage);
export const MessageCircle = wrap(PxMessage);
export const Send = wrap(PxSend);
export const Phone = wrap(PxPhone);
export const PhoneCall = wrap(PxPhoneCall);
export const PhoneIncoming = wrap(PxPhoneCall);
export const PhoneOutgoing = wrap(PxPhoneCall);
export const PhoneMissed = wrap(PxPhoneCall);
export const Video = wrap(PxVideo);
export const Headphones = wrap(PxHeadphone);
export const Smile = wrap(PxSmile);
export const Megaphone = wrap(PxMegaphone);

// Data & Charts
export const BarChart = wrap(PxChartBarBig);
export const BarChart2 = wrap(PxChartBarBig);
export const BarChart3 = wrap(PxChartBarBig);
export const BarChart4 = wrap(PxChartBarBig);
export const BarChartBig = wrap(PxChartBarBig);
export const LineChart = wrap(PxChart);
export const Activity = wrap(PxSignal);
export const TrendingUp = wrap(PxArrowUp);
export const TrendingDown = wrap(PxArrowDown);
export const PieChart = wrap(PxChart);
export const Signal = wrap(PxSignal);
export const Volume = wrap(PxHeadphone);
export const Volume1 = wrap(PxHeadphone);
export const Volume2 = wrap(PxHeadphone);
export const VolumeX = wrap(PxHeadphone);

// Files & Documents
export const File = wrap(PxFile);
export const FileText = wrap(PxFileText);
export const FileSpreadsheet = wrap(PxFileText);
export const FilePlus = wrap(PxFile);
export const FileQuestion = wrap(PxFile);
export const Files = wrap(PxFile);
export const Folder = wrap(PxFolder);
export const FolderPlus = wrap(PxFolderPlus);
export const FolderOpen = wrap(PxFolder);
export const Image = wrap(PxImage);

// People
export const User = wrap(PxUser);
export const Users = wrap(PxUsers);
export const UserPlus = wrap(PxUserPlus);
export const UserMinus = wrap(PxUserMinus);
export const UserX = wrap(PxUserX);
export const UserCheck = wrap(PxUser);

// Tech / Dev
export const Database = wrap(PxDatabase);
export const Globe = wrap(PxGlobe);
export const Settings = wrap(PxSettings2);
export const Settings2 = wrap(PxSettings2);
export const Wrench = wrap(PxToolCase);
export const Terminal = wrap(PxTerminal);
export const Code = wrap(PxTerminal);
export const Code2 = wrap(PxTerminal);
export const Bug = wrap(PxDebug);
export const Cpu = wrap(PxCpu);
export const Webhook = wrap(PxLink);

// AI / Smart
export const Bot = wrap(PxRobotFace);
export const Brain = wrap(PxCpu);
export const Sparkles = wrap(PxSparkles);
export const Sparkle = wrap(PxSparkle);
export const Wand = wrap(PxMagicEdit);
export const Wand2 = wrap(PxMagicEdit);
export const Rocket = wrap(PxZap);
export const Lightbulb = wrap(PxLightbulb);

// Media controls
export const Play = wrap(PxPlay);
export const Pause = wrap(PxSquare);
export const Square = wrap(PxSquare);
export const StopCircle = wrap(PxSquare);

// Time
export const Clock = wrap(PxClock);
export const Timer = wrap(PxClock);
export const Calendar = wrap(PxCalendar);
export const CalendarDays = wrap(PxCalendar);
export const AlarmClock = wrap(PxAlarmClock);

// Commerce
export const Store = wrap(PxStore);
export const ShoppingCart = wrap(PxStore);
export const CreditCard = wrap(PxCreditCard);
export const Coins = wrap(PxCoins);
export const Banknote = wrap(PxCoins);
export const DollarSign = wrap(PxCoins);

// Layout
export const Layers = wrap(PxBlocks);
export const Layout = wrap(PxBlocks);
export const LayoutDashboard = wrap(PxBlocks);
export const LayoutGrid = wrap(PxBlocks);
export const Columns = wrap(PxBlocks);
export const Rows = wrap(PxBlocks);
export const Grid = wrap(PxBlocks);

// Misc
export const Camera = wrap(PxCamera);
export const Loader = wrap(PxLoader);
export const Loader2 = wrap(PxLoader);
export const Power = wrap(PxPower);
export const PowerOff = wrap(PxPowerOff);
export const Zap = wrap(PxZap);
export const ZapOff = wrap(PxZapOff);
export const Feather = wrap(PxFeather);
export const Crown = wrap(PxCrown);
export const Trophy = wrap(PxTrophy);
export const Fire = wrap(PxFire);
export const Flame = wrap(PxFire);
export const Recycle = wrap(PxRecycle);
export const Scissors = wrap(PxScissors);
export const Key = wrap(PxLock);
export const Presentation = wrap(PxPresentation);
export const BookOpen = wrap(PxBookOpen);
export const ThumbsUp = wrap(PxThumbsUp);
export const ThumbsDown = wrap(PxThumbsDown);

// Text formatting
export const Bold = wrap(PxPenSquare);
export const Italic = wrap(PxPenSquare);
export const Underline = wrap(PxPenSquare);
export const Strikethrough = wrap(PxPenSquare);
export const AlignLeft = wrap(PxPenSquare);
export const AlignCenter = wrap(PxPenSquare);
export const AlignRight = wrap(PxPenSquare);
export const List = wrap(PxPenSquare);
export const ListOrdered = wrap(PxPenSquare);
export const Heading = wrap(PxPenSquare);
export const Type = wrap(PxPenSquare);
export const Quote = wrap(PxPenSquare);

// These are special lucide exports we need to handle
export const Paintbrush = wrap(PxMagicEdit);
export const Palette = wrap(PxMagicEdit);
export const Pipette = wrap(PxMagicEdit);

// Circle-based icons (no direct pixel equivalent)
export const Circle = wrap(PxSquare);
export const Dot = wrap(PxSquare);

// Grip / drag
export const GripVertical = wrap(PxMoreVertical);
export const GripHorizontal = wrap(PxMoreHorizontal);
export const Move = wrap(PxExpand);

// Share
export const Share = wrap(PxExternalLink);
export const Share2 = wrap(PxExternalLink);

// Misc remaining
export const Briefcase = wrap(PxBriefcase);
export const Building = wrap(PxBuilding);
export const Building2 = wrap(PxBuilding);
export const Note = wrap(PxNote);
export const Inbox = wrap(PxInbox);
export const Archive = wrap(PxInbox);

// For PlayCircle / StopCircle etc
export const PlayCircle = wrap(PxPlay);

// Switch/Toggle
export const ToggleLeft = wrap(PxPower);
export const ToggleRight = wrap(PxPower);

// Log / History
export const History = wrap(PxClock);
export const ScrollText = wrap(PxFileText);

// Asterisk / Star
export const Star = wrap(PxSparkle);
export const Asterisk = wrap(PxSparkle);

// Progress
export const Percent = wrap(PxChart);

// Table
export const Table = wrap(PxBlocks);
export const Table2 = wrap(PxBlocks);

// Package
export const Package = wrap(PxBlocks);

// Network
export const Wifi = wrap(PxSignal);
export const WifiOff = wrap(PxSignal);

// Weather (fallbacks)
export const Sun = wrap(PxLightbulb);
export const Moon = wrap(PxLightbulb);
export const CloudSun = wrap(PxLightbulb);

// Separator/divider
export const Separator = wrap(PxMinus);
export const SeparatorHorizontal = wrap(PxMinus);
export const SeparatorVertical = wrap(PxMinus);

// Additional missing icons
export const Monitor = wrap(PxCpu);
export const LogOut = wrap(PxPower);
export const Mic = wrap(PxHeadphone);
export const MicOff = wrap(PxHeadphone);
export const CalendarCheck = wrap(PxCalendar);
export const Award = wrap(PxTrophy);
export const CircleDot = wrap(PxTarget);
export const ImageIcon = wrap(PxImage);

// Additional missing icons
export const Heart = wrap(PxSparkle);
export const Hourglass = wrap(PxClock);
export const Sliders = wrap(PxSettings2);
export const SlidersHorizontal = wrap(PxSettings2);
export const AtSign = wrap(PxMail);
export const Navigation = wrap(PxArrowUp);
export const Compass = wrap(PxEarth);
export const Map = wrap(PxEarth);
export const Calculator = wrap(PxCpu);
export const DatabaseZap = wrap(PxDatabase);
export const CheckSquare = wrap(PxCheckboxOn);
export const GraduationCap = wrap(PxBookOpen);
export const ClipboardCheck = wrap(PxClipboard);
export const PlusCircle = wrap(PxPlus);
export const MoveVertical = wrap(PxMoreVertical);
export const MessageSquareText = wrap(PxMessageText);
export const MessageSquarePlus = wrap(PxMessage);
export const Instagram = wrap(PxCamera);
export const Heading1 = wrap(PxPenSquare);
export const Heading2 = wrap(PxPenSquare);
export const Heading3 = wrap(PxPenSquare);
export const ImagePlus = wrap(PxImage);
export const Server = wrap(PxCpu);
export const CalendarIcon = wrap(PxCalendar);
export const FileUp = wrap(PxUpload);
export const ArrowRightLeft = wrap(PxArrowRight);
export const TextCursorInput = wrap(PxPenSquare);
export const MousePointer = wrap(PxArrowUp);
export const PanelLeft = wrap(PxChevronLeft);
