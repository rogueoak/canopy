/**
 * The curated Canopy icon set - individual, tree-shakeable named exports.
 *
 * Each icon is a thin re-export of a `react-icons` glyph under a Canopy-semantic name, so the
 * public surface is the design system's own vocabulary and the `react-icons` family prefixes
 * (`Lu*`, `Fa*`) never leak. Importing one icon never pulls the rest into a consumer's bundle.
 *
 * Standard UI glyphs come from Lucide (`react-icons/lu`) - one consistent stroke family. The
 * social/brand marks come from Font Awesome 6 brands (`react-icons/fa6`): Simple Icons (the usual
 * brand source) no longer ships LinkedIn, so sourcing all of them from one family keeps them
 * visually consistent.
 *
 * Adding an icon is one line here (plus the verified `react-icons` name); the registry, catalog,
 * and exported-names test all derive from this file, so they can never silently drift.
 *
 * Note the deliberate name choice: Lucide's `LuX` is the close/dismiss glyph and is exported as
 * `Close`, leaving `X` free for the X (formerly Twitter) brand mark below.
 */

// --- Standard UI glyphs - Lucide (react-icons/lu) -------------------------------------------
export {
  LuHouse as Home,
  LuSearch as Search,
  LuSettings as Settings,
  LuUser as User,
  LuMenu as Menu,
  LuX as Close,
  LuCheck as Check,
  LuChevronDown as ChevronDown,
  LuChevronRight as ChevronRight,
  LuChevronLeft as ChevronLeft,
  LuChevronUp as ChevronUp,
  LuArrowRight as ArrowRight,
  LuArrowLeft as ArrowLeft,
  LuPlus as Plus,
  LuMinus as Minus,
  LuTrash2 as Trash,
  LuPencil as Edit,
  LuCopy as Copy,
  LuDownload as Download,
  LuUpload as Upload,
  LuExternalLink as ExternalLink,
  LuInfo as Info,
  LuTriangleAlert as AlertTriangle,
  LuCircleAlert as AlertCircle,
  LuCircleCheck as CheckCircle,
  LuBell as Bell,
  LuCalendar as Calendar,
  LuMail as Mail,
  LuEye as Eye,
  LuEyeOff as EyeOff,
  LuSun as Sun,
  LuMoon as Moon,
  LuLoaderCircle as Loader,
  LuEllipsis as MoreHorizontal,
  LuEllipsisVertical as MoreVertical,
  LuFilter as Filter,
  LuStar as Star,
  LuHeart as Heart,
  LuLock as Lock,
  LuLockOpen as Unlock,
  LuLogOut as LogOut,
  // Documents & content
  LuFile as File,
  LuFileText as FileText,
  LuNewspaper as Newspaper,
  LuBriefcase as Briefcase,
  LuTag as Tag,
  // Time & place
  LuClock as Clock,
  LuMapPin as MapPin,
  LuGlobe as Globe,
  // Web & dev
  LuCode as Code,
  LuLink as Link,
  LuRss as Rss,
  LuMessageSquare as MessageSquare,
} from 'react-icons/lu';

// --- Social / brand marks - Font Awesome 6 brands (react-icons/fa6) -------------------------
export {
  FaGithub as Github,
  FaLinkedin as Linkedin,
  FaXTwitter as X,
  FaFacebook as Facebook,
  FaInstagram as Instagram,
  FaThreads as Threads,
  FaMedium as Medium,
} from 'react-icons/fa6';
